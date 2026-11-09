/**
 * @file packages/kernel/src/resource-orchestrator.ts
 * @description Coordenador Central de Recursos (OMSK Resource Orchestrator).
 * Implementa Memory Manager, Cache Manager inteligente (LRU/TTL), Worker Manager adaptativo
 * e Lazy Loader progressivo de subsistemas.
 * Conforme seções 3, 4 e Fases 02, 03 e 08 do Roteiro de Otimização OMSK.
 */

import { PerformanceProfiler } from "./performance-profiler";

// --- 1. MEMORY MANAGER ---
export type TimerHandle = NodeJS.Timeout | number;

function hasUnref(t: unknown): t is { unref: () => void } {
  return typeof t === "object" && t !== null && "unref" in t && typeof (t as { unref?: unknown }).unref === "function";
}

export interface MemoryManagerConfig {
  readonly highWatermarkMb: number; // e.g., 768 MB
  readonly criticalWatermarkMb: number; // e.g., 1024 MB
  readonly checkIntervalMs: number;
}

export type MemoryPressureCallback = (level: "normal" | "high" | "critical", rssMb: number) => void;

export class MemoryManager {
  private config: MemoryManagerConfig;
  private pressureListeners: Set<MemoryPressureCallback> = new Set();
  private cleanupHandlers: Set<() => void | Promise<void>> = new Set();
  private checkTimer: TimerHandle | null = null;
  private currentPressure: "normal" | "high" | "critical" = "normal";

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      highWatermarkMb: config.highWatermarkMb ?? 768,
      criticalWatermarkMb: config.criticalWatermarkMb ?? 1024,
      checkIntervalMs: config.checkIntervalMs ?? 15_000,
    };
  }

  public startMonitoring(): void {
    if (this.checkTimer) return;
    this.checkTimer = setInterval(() => this.checkMemory(), this.config.checkIntervalMs);
    // Unref timer so it doesn't prevent Node/Bun from exiting
    if (hasUnref(this.checkTimer)) {
      this.checkTimer.unref();
    }
  }

  public stopMonitoring(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  public onPressure(callback: MemoryPressureCallback): () => void {
    this.pressureListeners.add(callback);
    return () => this.pressureListeners.delete(callback);
  }

  public registerCleanupHandler(handler: () => void | Promise<void>): () => void {
    this.cleanupHandlers.add(handler);
    return () => this.cleanupHandlers.delete(handler);
  }

  public async triggerResourceCleanup(): Promise<void> {
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (err) {
        console.error("[MemoryManager] Error during cleanup handler execution:", err);
      }
    }
  }

  public checkMemory(): "normal" | "high" | "critical" {
    if (typeof process === "undefined" || typeof process.memoryUsage !== "function") {
      return "normal";
    }

    const rssMb = process.memoryUsage().rss / 1024 / 1024;
    let newLevel: "normal" | "high" | "critical" = "normal";

    if (rssMb >= this.config.criticalWatermarkMb) {
      newLevel = "critical";
    } else if (rssMb >= this.config.highWatermarkMb) {
      newLevel = "high";
    }

    if (newLevel !== this.currentPressure || newLevel !== "normal") {
      this.currentPressure = newLevel;
      for (const listener of this.pressureListeners) {
        try {
          listener(newLevel, Math.round(rssMb));
        } catch (e) {
          console.error("[MemoryManager] Pressure listener error:", e);
        }
      }

      if (newLevel === "critical" || newLevel === "high") {
        void this.triggerResourceCleanup();
      }
    }

    return newLevel;
  }
}

// --- 2. CACHE MANAGER (LRU + TTL + Invalidation + Deduplicação) ---

export interface CacheEntry<V> {
  readonly value: V;
  readonly sizeBytes: number;
  readonly expiresAt: number;
  readonly fileDependencies: readonly string[];
  accessedAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  totalSizeBytes: number;
}

export class SmartCache<K, V> {
  private entries: Map<K, CacheEntry<V>> = new Map();
  private fileIndex: Map<string, Set<K>> = new Map();
  private maxEntries: number;
  private defaultTtlMs: number;
  private maxSizeBytes: number;
  private currentSizeBytes: number = 0;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalEntries: 0,
    totalSizeBytes: 0,
  };

  constructor(options: { maxEntries?: number; defaultTtlMs?: number; maxSizeBytes?: number } = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? 5 * 60 * 1000; // 5 min default
    this.maxSizeBytes = options.maxSizeBytes ?? 128 * 1024 * 1024; // 128 MB default
  }

  public get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Refresh access time for LRU ordering
    entry.accessedAt = Date.now();
    this.entries.delete(key);
    this.entries.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  public set(
    key: K,
    value: V,
    options: { ttlMs?: number; sizeBytes?: number; fileDependencies?: string[] } = {}
  ): void {
    const ttl = options.ttlMs ?? this.defaultTtlMs;
    const size = options.sizeBytes ?? this.estimateSize(value);
    const files = options.fileDependencies ?? [];

    if (this.entries.has(key)) {
      this.delete(key);
    }

    // Ensure capacity
    this.ensureCapacity(size);

    const entry: CacheEntry<V> = {
      value,
      sizeBytes: size,
      expiresAt: Date.now() + ttl,
      fileDependencies: files,
      accessedAt: Date.now(),
    };

    this.entries.set(key, entry);
    this.currentSizeBytes += size;

    // Index file dependencies for fast invalidation
    for (const f of files) {
      let set = this.fileIndex.get(f);
      if (!set) {
        set = new Set();
        this.fileIndex.set(f, set);
      }
      set.add(key);
    }

    this.updateStats();
  }

  public delete(key: K): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;

    this.entries.delete(key);
    this.currentSizeBytes = Math.max(0, this.currentSizeBytes - entry.sizeBytes);

    for (const f of entry.fileDependencies) {
      const set = this.fileIndex.get(f);
      if (set) {
        set.delete(key);
        if (set.size === 0) this.fileIndex.delete(f);
      }
    }

    this.updateStats();
    return true;
  }

  public invalidateFile(filePath: string): number {
    const set = this.fileIndex.get(filePath);
    if (!set || set.size === 0) return 0;

    let count = 0;
    const keys = Array.from(set);
    for (const key of keys) {
      if (this.delete(key)) count++;
    }
    return count;
  }

  public clear(): void {
    this.entries.clear();
    this.fileIndex.clear();
    this.currentSizeBytes = 0;
    this.updateStats();
  }

  public evictStale(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.entries.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  public getStats(): Readonly<CacheStats> {
    return { ...this.stats };
  }

  private ensureCapacity(incomingSize: number): void {
    // Evict expired first
    this.evictStale();

    // If still over entry count or byte size, evict LRU (first key in map iteration)
    while (
      (this.entries.size >= this.maxEntries || this.currentSizeBytes + incomingSize > this.maxSizeBytes) &&
      this.entries.size > 0
    ) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.entries.size;
    this.stats.totalSizeBytes = this.currentSizeBytes;
  }

  private estimateSize(value: unknown): number {
    if (typeof value === "string") return value.length * 2;
    if (typeof value === "number" || typeof value === "boolean") return 8;
    if (value instanceof Uint8Array || Buffer.isBuffer(value)) return value.byteLength;
    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value).length * 2;
      } catch {
        return 256;
      }
    }
    return 64;
  }
}

// --- 3. WORKER MANAGER (Pool adaptativo, concorrência, colheita de ociosos) ---

export interface TaskJob<T> {
  readonly id: string;
  readonly priority: "critical" | "high" | "normal" | "low";
  readonly execute: () => Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (error: unknown) => void;
  readonly timeoutMs?: number;
  readonly queuedAt: number;
}

export class WorkerManager {
  private maxConcurrency: number;
  private activeCount: number = 0;
  private queue: Array<TaskJob<unknown>> = [];
  private idleTimers: Map<string, TimerHandle> = new Map();

  constructor(options: { maxConcurrency?: number } = {}) {
    // Default concurrency bounds: between 2 and 16, derived from CPU cores
    const cpus = typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4;
    this.maxConcurrency = options.maxConcurrency ?? Math.max(2, Math.min(16, cpus * 2));
  }

  public setMaxConcurrency(limit: number): void {
    this.maxConcurrency = Math.max(1, limit);
    this.drainQueue();
  }

  public getMaxConcurrency(): number {
    return this.maxConcurrency;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public async schedule<T>(
    execute: () => Promise<T>,
    options: { priority?: "critical" | "high" | "normal" | "low"; timeoutMs?: number; id?: string } = {}
  ): Promise<T> {
    const priority = options.priority ?? "normal";
    const id = options.id ?? `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return new Promise<T>((resolve, reject) => {
      const job: TaskJob<T> = {
        id,
        priority,
        execute,
        resolve: resolve as (val: unknown) => void,
        reject,
        timeoutMs: options.timeoutMs,
        queuedAt: Date.now(),
      };

      this.insertPriority(job as TaskJob<unknown>);
      this.drainQueue();
    });
  }

  private insertPriority(job: TaskJob<unknown>): void {
    const priorityWeight: Record<TaskJob<unknown>["priority"], number> = {
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    const targetWeight = priorityWeight[job.priority];
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (targetWeight > priorityWeight[this.queue[i].priority]) {
        this.queue.splice(i, 0, job);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(job);
    }
  }

  private drainQueue(): void {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeCount++;
      PerformanceProfiler.getInstance().registerWorker(job.id);

      void this.executeJob(job);
    }
  }

  private async executeJob(job: TaskJob<unknown>): Promise<void> {
    let timeoutTimer: TimerHandle | null = null;
    let completed = false;

    if (job.timeoutMs && job.timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        if (!completed) {
          completed = true;
          this.finishJob(job.id);
          job.reject(new Error(`[WorkerManager] Job '${job.id}' excedeu o timeout de ${job.timeoutMs}ms`));
        }
      }, job.timeoutMs);
    }

    try {
      const result = await job.execute();
      if (!completed) {
        completed = true;
        clearTimeout(timeoutTimer ?? undefined);
        this.finishJob(job.id);
        job.resolve(result);
      }
    } catch (err) {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutTimer ?? undefined);
        this.finishJob(job.id);
        job.reject(err);
      }
    }
  }

  private finishJob(jobId: string): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    PerformanceProfiler.getInstance().unregisterWorker(jobId);
    this.drainQueue();
  }
}

// --- 4. LAZY LOADER & PROGRESSIVE SUBSYSTEM INITIALIZATION ---

export type SubsystemFactory<T> = () => Promise<T> | T;

export class LazyLoader {
  private static registeredFactories: Map<string, SubsystemFactory<unknown>> = new Map();
  private static loadedInstances: Map<string, unknown> = new Map();
  private static loadingPromises: Map<string, Promise<unknown>> = new Map();

  public static register<T>(subsystemName: string, factory: SubsystemFactory<T>): void {
    LazyLoader.registeredFactories.set(subsystemName, factory as SubsystemFactory<unknown>);
  }

  public static isLoaded(subsystemName: string): boolean {
    return LazyLoader.loadedInstances.has(subsystemName);
  }

  public static async get<T>(subsystemName: string): Promise<T> {
    if (LazyLoader.loadedInstances.has(subsystemName)) {
      return LazyLoader.loadedInstances.get(subsystemName) as T;
    }

    if (LazyLoader.loadingPromises.has(subsystemName)) {
      return (await LazyLoader.loadingPromises.get(subsystemName)) as T;
    }

    const factory = LazyLoader.registeredFactories.get(subsystemName);
    if (!factory) {
      throw new Error(`[LazyLoader] Nenhum factory registrado para o subsistema: '${subsystemName}'`);
    }

    const profiler = PerformanceProfiler.getInstance();
    const start = performance.now();

    const loadPromise = (async () => {
      try {
        const instance = await factory();
        LazyLoader.loadedInstances.set(subsystemName, instance);
        profiler.recordModuleLoad(subsystemName, Math.round((performance.now() - start) * 100) / 100);
        return instance;
      } finally {
        LazyLoader.loadingPromises.delete(subsystemName);
      }
    })();

    LazyLoader.loadingPromises.set(subsystemName, loadPromise);
    return (await loadPromise) as T;
  }

  public static unload(subsystemName: string): boolean {
    return LazyLoader.loadedInstances.delete(subsystemName);
  }

  public static listRegistered(): string[] {
    return Array.from(LazyLoader.registeredFactories.keys());
  }

  public static listLoaded(): string[] {
    return Array.from(LazyLoader.loadedInstances.keys());
  }
}

// --- 5. OMSK RESOURCE ORCHESTRATOR (Coordenador Central) ---

export class ResourceOrchestrator {
  private static instance: ResourceOrchestrator | null = null;

  public readonly memory: MemoryManager;
  public readonly workers: WorkerManager;
  public readonly profiler: PerformanceProfiler;

  // Domain-specific smart caches
  public readonly toolCache: SmartCache<string, unknown>;
  public readonly modelMetadataCache: SmartCache<string, unknown>;
  public readonly promptFragmentCache: SmartCache<string, string>;
  public readonly markdownRenderCache: SmartCache<string, string>;

  private constructor() {
    this.profiler = PerformanceProfiler.getInstance();
    this.memory = new MemoryManager();
    this.workers = new WorkerManager();

    // Initialize specialized caches
    this.toolCache = new SmartCache({ maxEntries: 2000, defaultTtlMs: 10 * 60 * 1000, maxSizeBytes: 32 * 1024 * 1024 });
    this.modelMetadataCache = new SmartCache({ maxEntries: 5000, defaultTtlMs: 60 * 60 * 1000, maxSizeBytes: 64 * 1024 * 1024 });
    this.promptFragmentCache = new SmartCache({ maxEntries: 1000, defaultTtlMs: 30 * 60 * 1000, maxSizeBytes: 16 * 1024 * 1024 });
    this.markdownRenderCache = new SmartCache({ maxEntries: 500, defaultTtlMs: 15 * 60 * 1000, maxSizeBytes: 16 * 1024 * 1024 });

    // Link profiler cache statistics
    this.profiler.setCacheStatsProvider(() => {
      const tc = this.toolCache.getStats();
      const mc = this.modelMetadataCache.getStats();
      const pc = this.promptFragmentCache.getStats();
      const rc = this.markdownRenderCache.getStats();
      return {
        entries: tc.totalEntries + mc.totalEntries + pc.totalEntries + rc.totalEntries,
        bytes: tc.totalSizeBytes + mc.totalSizeBytes + pc.totalSizeBytes + rc.totalSizeBytes,
      };
    });

    // Auto-eviction on memory pressure
    this.memory.onPressure((level) => {
      if (level === "critical") {
        this.toolCache.clear();
        this.markdownRenderCache.clear();
        this.promptFragmentCache.evictStale();
        this.modelMetadataCache.evictStale();
      } else if (level === "high") {
        this.toolCache.evictStale();
        this.markdownRenderCache.evictStale();
        this.promptFragmentCache.evictStale();
      }
    });

    this.memory.startMonitoring();
  }

  public static getInstance(): ResourceOrchestrator {
    if (!ResourceOrchestrator.instance) {
      ResourceOrchestrator.instance = new ResourceOrchestrator();
    }
    return ResourceOrchestrator.instance;
  }
}
