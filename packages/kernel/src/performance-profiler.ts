/**
 * @file packages/kernel/src/performance-profiler.ts
 * @description Sistema centralizado de profiling e painel interno de performance do OhMyShark (OMSK).
 * Projetado para conformidade com a Fase 01 do Roteiro de Otimização OMSK.
 * Zero overhead quando desativado.
 */

export interface MemorySnapshot {
  readonly rssBytes: number;
  readonly heapUsedBytes: number;
  readonly heapTotalBytes: number;
  readonly externalBytes: number;
  readonly peakRssBytes: number;
  readonly timestamp: number;
}

export interface CpuUsageSnapshot {
  readonly userMicros: number;
  readonly systemMicros: number;
  readonly percent: number;
  readonly timestamp: number;
}

export interface StartupStageRecord {
  readonly stage: string;
  readonly durationMs: number;
  readonly timestamp: number;
}

export interface ToolMetricRecord {
  readonly toolName: string;
  readonly callCount: number;
  readonly totalDurationMs: number;
  readonly avgDurationMs: number;
  readonly maxDurationMs: number;
  readonly errorCount: number;
}

export interface TuiRenderMetricRecord {
  readonly component: string;
  readonly renderCount: number;
  readonly totalDurationMs: number;
  readonly avgDurationMs: number;
  readonly peakDurationMs: number;
}

export interface PerformanceDashboardSnapshot {
  readonly timestamp: string;
  readonly uptimeSeconds: number;
  readonly ramCurrentMb: number;
  readonly ramPeakMb: number;
  readonly heapUsedMb: number;
  readonly heapTotalMb: number;
  readonly cpuCurrentPercent: number;
  readonly cpuPeakPercent: number;
  readonly startupDurationMs: number;
  readonly startupStages: readonly StartupStageRecord[];
  readonly activeWorkersCount: number;
  readonly childProcessesCount: number;
  readonly cacheEntriesCount: number;
  readonly cacheMemoryBytes: number;
  readonly indexedFilesCount: number;
  readonly avgToolExecutionMs: number;
  readonly totalToolCalls: number;
  readonly tuiRenderAvgMs: number;
  readonly tuiFrameCount: number;
  readonly suspectedLeaksCount: number;
}

export class PerformanceProfiler {
  private static instance: PerformanceProfiler | null = null;
  private enabled: boolean = true;
  private peakRssBytes: number = 0;
  private peakCpuPercent: number = 0;
  private startupStart: number = performance.now();
  private startupCompletedAt: number | null = null;
  private startupStages: StartupStageRecord[] = [];
  private currentStageStart: { stage: string; start: number } | null = null;

  private moduleLoadTimes: Map<string, number> = new Map();
  private toolMetrics: Map<string, { calls: number; totalMs: number; maxMs: number; errors: number }> = new Map();
  private tuiMetrics: Map<string, { renders: number; totalMs: number; maxMs: number }> = new Map();
  
  private activeWorkers: Set<string> = new Set();
  private activeChildPids: Set<number> = new Set();
  private cacheStatsProvider: (() => { entries: number; bytes: number }) | null = null;
  private indexedFilesProvider: (() => number) | null = null;

  // CPU measurement anchor
  private lastCpuUsage: NodeJS.CpuUsage | null = null;
  private lastCpuTime: number = 0;

  // Memory leak detection: records heap after task completions
  private heapSamples: number[] = [];
  private suspectedLeaks: string[] = [];

  private constructor() {
    this.updateMemoryPeak();
    if (typeof process !== "undefined" && typeof process.cpuUsage === "function") {
      this.lastCpuUsage = process.cpuUsage();
      this.lastCpuTime = performance.now();
    }
  }

  public static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler();
    }
    return PerformanceProfiler.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // --- Startup & Module Profiling ---

  public markStartupStage(stage: string): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (this.currentStageStart) {
      this.startupStages.push({
        stage: this.currentStageStart.stage,
        durationMs: Math.round((now - this.currentStageStart.start) * 100) / 100,
        timestamp: Date.now(),
      });
    }
    this.currentStageStart = { stage, start: now };
  }

  public completeStartup(): number {
    const now = performance.now();
    if (this.currentStageStart) {
      this.startupStages.push({
        stage: this.currentStageStart.stage,
        durationMs: Math.round((now - this.currentStageStart.start) * 100) / 100,
        timestamp: Date.now(),
      });
      this.currentStageStart = null;
    }
    this.startupCompletedAt = now;
    return Math.round((now - this.startupStart) * 100) / 100;
  }

  public getStartupDurationMs(): number {
    if (this.startupCompletedAt !== null) {
      return Math.round((this.startupCompletedAt - this.startupStart) * 100) / 100;
    }
    return Math.round((performance.now() - this.startupStart) * 100) / 100;
  }

  public recordModuleLoad(moduleName: string, durationMs: number): void {
    if (!this.enabled) return;
    this.moduleLoadTimes.set(moduleName, durationMs);
  }

  // --- Resource Measurements ---

  public getMemorySnapshot(): MemorySnapshot {
    this.updateMemoryPeak();
    const mem = typeof process !== "undefined" && typeof process.memoryUsage === "function"
      ? process.memoryUsage()
      : { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };

    return {
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      externalBytes: mem.external,
      peakRssBytes: this.peakRssBytes,
      timestamp: Date.now(),
    };
  }

  public getCpuUsageSnapshot(): CpuUsageSnapshot {
    if (typeof process === "undefined" || typeof process.cpuUsage !== "function" || !this.lastCpuUsage) {
      return { userMicros: 0, systemMicros: 0, percent: 0, timestamp: Date.now() };
    }

    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const now = performance.now();
    const elapsedMs = Math.max(1, now - this.lastCpuTime);
    const totalMicros = currentUsage.user + currentUsage.system;
    // elapsedMs in microseconds = elapsedMs * 1000
    const cpuPercent = Math.min(100, Math.round(((totalMicros / (elapsedMs * 1000)) * 100) * 10) / 10);

    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = now;

    if (cpuPercent > this.peakCpuPercent) {
      this.peakCpuPercent = cpuPercent;
    }

    return {
      userMicros: currentUsage.user,
      systemMicros: currentUsage.system,
      percent: cpuPercent,
      timestamp: Date.now(),
    };
  }

  // --- Tool & TUI Execution Profiling ---

  public async measureTool<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return await fn();
    const start = performance.now();
    let hasError = false;
    try {
      return await fn();
    } catch (err) {
      hasError = true;
      throw err;
    } finally {
      const duration = performance.now() - start;
      const current = this.toolMetrics.get(toolName) ?? { calls: 0, totalMs: 0, maxMs: 0, errors: 0 };
      current.calls++;
      current.totalMs += duration;
      if (duration > current.maxMs) current.maxMs = duration;
      if (hasError) current.errors++;
      this.toolMetrics.set(toolName, current);
    }
  }

  public measureTuiRender<T>(componentName: string, fn: () => T): T {
    if (!this.enabled) return fn();
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      const current = this.tuiMetrics.get(componentName) ?? { renders: 0, totalMs: 0, maxMs: 0 };
      current.renders++;
      current.totalMs += duration;
      if (duration > current.maxMs) current.maxMs = duration;
      this.tuiMetrics.set(componentName, current);
    }
  }

  // --- Worker & Subprocess Tracking ---

  public registerWorker(workerId: string): void {
    this.activeWorkers.add(workerId);
  }

  public unregisterWorker(workerId: string): void {
    this.activeWorkers.delete(workerId);
  }

  public registerChildProcess(pid: number): void {
    this.activeChildPids.add(pid);
  }

  public unregisterChildProcess(pid: number): void {
    this.activeChildPids.delete(pid);
  }

  public setCacheStatsProvider(provider: () => { entries: number; bytes: number }): void {
    this.cacheStatsProvider = provider;
  }

  public setIndexedFilesProvider(provider: () => number): void {
    this.indexedFilesProvider = provider;
  }

  // --- Leak Detection ---

  public recordTaskCompletionHeapSample(taskIdentifier: string): void {
    if (!this.enabled) return;
    const mem = process.memoryUsage?.();
    if (!mem) return;
    this.heapSamples.push(mem.heapUsed);
    if (this.heapSamples.length > 20) {
      this.heapSamples.shift();
    }
    // If heap increased monotonically across 5 consecutive task completions, flag as potential leak
    if (this.heapSamples.length >= 5) {
      let monotonic = true;
      for (let i = 1; i < this.heapSamples.length; i++) {
        if (this.heapSamples[i] <= this.heapSamples[i - 1]) {
          monotonic = false;
          break;
        }
      }
      if (monotonic) {
        this.suspectedLeaks.push(
          `Heap cresceu monotonicamente em ${this.heapSamples.length} tarefas sucessivas: último alvo '${taskIdentifier}' (${Math.round(mem.heapUsed / 1024 / 1024)} MB)`
        );
      }
    }
  }

  // --- Dashboard Snapshot ---

  public getDashboardSnapshot(): PerformanceDashboardSnapshot {
    const mem = this.getMemorySnapshot();
    const cpu = this.getCpuUsageSnapshot();
    const cacheStats = this.cacheStatsProvider ? this.cacheStatsProvider() : { entries: 0, bytes: 0 };
    const indexedFiles = this.indexedFilesProvider ? this.indexedFilesProvider() : 0;

    let totalToolCalls = 0;
    let totalToolMs = 0;
    for (const m of this.toolMetrics.values()) {
      totalToolCalls += m.calls;
      totalToolMs += m.totalMs;
    }
    const avgToolMs = totalToolCalls > 0 ? Math.round((totalToolMs / totalToolCalls) * 100) / 100 : 0;

    let totalTuiFrames = 0;
    let totalTuiMs = 0;
    for (const m of this.tuiMetrics.values()) {
      totalTuiFrames += m.renders;
      totalTuiMs += m.totalMs;
    }
    const avgTuiMs = totalTuiFrames > 0 ? Math.round((totalTuiMs / totalTuiFrames) * 100) / 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime?.() ?? 0),
      ramCurrentMb: Math.round((mem.rssBytes / 1024 / 1024) * 10) / 10,
      ramPeakMb: Math.round((mem.peakRssBytes / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((mem.heapUsedBytes / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotalBytes / 1024 / 1024) * 10) / 10,
      cpuCurrentPercent: cpu.percent,
      cpuPeakPercent: this.peakCpuPercent,
      startupDurationMs: this.getStartupDurationMs(),
      startupStages: [...this.startupStages],
      activeWorkersCount: this.activeWorkers.size,
      childProcessesCount: this.activeChildPids.size,
      cacheEntriesCount: cacheStats.entries,
      cacheMemoryBytes: cacheStats.bytes,
      indexedFilesCount: indexedFiles,
      avgToolExecutionMs: avgToolMs,
      totalToolCalls,
      tuiRenderAvgMs: avgTuiMs,
      tuiFrameCount: totalTuiFrames,
      suspectedLeaksCount: this.suspectedLeaks.length,
    };
  }

  public renderDashboardTable(): string {
    const s = this.getDashboardSnapshot();
    const divider = "─".repeat(68);
    const lines = [
      `┌${divider}┐`,
      `│ 🦈 OMSK PERFORMANCE MONITOR & RESOURCE DASHBOARD                   │`,
      `├${divider}┤`,
      `│ RAM Atual: ${`${s.ramCurrentMb} MB`.padEnd(10)} │ RAM Pico: ${`${s.ramPeakMb} MB`.padEnd(10)} │ Heap Used: ${`${s.heapUsedMb} MB`.padEnd(9)} │`,
      `│ CPU Atual: ${`${s.cpuCurrentPercent}%`.padEnd(10)} │ CPU Pico: ${`${s.cpuPeakPercent}%`.padEnd(10)} │ Uptime: ${`${s.uptimeSeconds}s`.padEnd(12)} │`,
      `├${divider}┤`,
      `│ Startup Total: ${`${s.startupDurationMs} ms`.padEnd(8)} │ Workers Ativos: ${`${s.activeWorkersCount}`.padEnd(4)} │ Processos Filhos: ${`${s.childProcessesCount}`.padEnd(4)} │`,
      `│ Cache Entradas: ${`${s.cacheEntriesCount}`.padEnd(7)} │ Cache RAM: ${`${Math.round(s.cacheMemoryBytes / 1024)} KB`.padEnd(8)} │ Arquivos Indexados: ${`${s.indexedFilesCount}`.padEnd(3)} │`,
      `│ Ferramentas Méd: ${`${s.avgToolExecutionMs} ms`.padEnd(6)} │ Chamadas: ${`${s.totalToolCalls}`.padEnd(9)} │ TUI Frame Médio: ${`${s.tuiRenderAvgMs} ms`.padEnd(5)} │`,
      `├${divider}┤`,
      `│ Alertas de Leak: ${`${s.suspectedLeaksCount}`.padEnd(6)} │ Profiler Ativo: ${`${this.enabled ? "SIM" : "NÃO"}`.padEnd(6)} │ Status: PRONTO E SEGURO       │`,
      `└${divider}┘`,
    ];
    return lines.join("\n");
  }

  private updateMemoryPeak(): void {
    if (typeof process !== "undefined" && typeof process.memoryUsage === "function") {
      const mem = process.memoryUsage();
      if (mem.rss > this.peakRssBytes) {
        this.peakRssBytes = mem.rss;
      }
    }
  }
}
