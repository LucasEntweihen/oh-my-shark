import { describe, expect, it } from "bun:test";
import {
  PerformanceProfiler,
  ResourceOrchestrator,
  MemoryManager,
  SmartCache,
  WorkerManager,
  LazyLoader,
} from "../src";

describe("PerformanceProfiler (Fase 01)", () => {
  it("mede tempo de startup e estágios corretamente", () => {
    const profiler = PerformanceProfiler.getInstance();
    profiler.markStartupStage("config-load");
    profiler.markStartupStage("runtime-init");
    const totalMs = profiler.completeStartup();

    expect(totalMs).toBeGreaterThanOrEqual(0);
    const snapshot = profiler.getDashboardSnapshot();
    expect(snapshot.startupDurationMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.startupStages.length).toBeGreaterThanOrEqual(1);
  });

  it("mede métricas de ferramentas e renderização da TUI", async () => {
    const profiler = PerformanceProfiler.getInstance();
    
    const result = await profiler.measureTool("read_file", async () => {
      return "content";
    });
    expect(result).toBe("content");

    const rendered = profiler.measureTuiRender("StatusBar", () => {
      return "rendered-status";
    });
    expect(rendered).toBe("rendered-status");

    const snapshot = profiler.getDashboardSnapshot();
    expect(snapshot.totalToolCalls).toBeGreaterThanOrEqual(1);
    expect(snapshot.tuiFrameCount).toBeGreaterThanOrEqual(1);
  });

  it("gera tabela formatada para o painel interno de monitoramento", () => {
    const profiler = PerformanceProfiler.getInstance();
    const table = profiler.renderDashboardTable();

    expect(table).toContain("OMSK PERFORMANCE MONITOR");
    expect(table).toContain("RAM Atual:");
    expect(table).toContain("CPU Atual:");
    expect(table).toContain("Workers Ativos:");
  });
});

describe("SmartCache (Fase 03)", () => {
  it("armazena, recupera e respeita TTL expirado", () => {
    const cache = new SmartCache<string, string>({ maxEntries: 5 });
    cache.set("key1", "val1", { ttlMs: -10 }); // Already expired at creation
    expect(cache.get("key1")).toBeUndefined();

    cache.set("key2", "val2", { ttlMs: 10_000 }); // Fresh
    expect(cache.get("key2")).toBe("val2");
  });

  it("executa evicção LRU quando a capacidade máxima é excedida", () => {
    const cache = new SmartCache<string, number>({ maxEntries: 3 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    // Access "a" so it is most recently used; "b" becomes the least recently used
    expect(cache.get("a")).toBe(1);

    cache.set("d", 4);
    expect(cache.get("b")).toBeUndefined(); // "b" evicted
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("invalida entradas associadas a arquivos modificados", () => {
    const cache = new SmartCache<string, string>();
    cache.set("doc1", "content1", { fileDependencies: ["/src/main.ts", "/src/utils.ts"] });
    cache.set("doc2", "content2", { fileDependencies: ["/src/other.ts"] });

    expect(cache.get("doc1")).toBe("content1");
    expect(cache.get("doc2")).toBe("content2");

    const invalidated = cache.invalidateFile("/src/main.ts");
    expect(invalidated).toBe(1);
    expect(cache.get("doc1")).toBeUndefined();
    expect(cache.get("doc2")).toBe("content2");
  });
});

describe("WorkerManager (Fase 08)", () => {
  it("agenda tarefas e prioriza tarefas 'critical' e 'high'", async () => {
    const manager = new WorkerManager({ maxConcurrency: 1 });
    const executionOrder: string[] = [];

    let releaseBlocker!: () => void;
    const blockerSignal = new Promise<void>((resolve) => {
      releaseBlocker = resolve;
    });

    // Schedule a blocker to hold the 1 worker slot
    const blockerPromise = manager.schedule(async () => {
      await blockerSignal;
      executionOrder.push("blocker");
    }, { priority: "normal" });

    // Queue lower priority first, then higher priority
    const lowPromise = manager.schedule(async () => {
      executionOrder.push("low");
    }, { priority: "low" });

    const highPromise = manager.schedule(async () => {
      executionOrder.push("high");
    }, { priority: "critical" });

    // Now release blocker; high should run before low
    releaseBlocker();
    await Promise.all([blockerPromise, lowPromise, highPromise]);
    expect(executionOrder).toEqual(["blocker", "high", "low"]);
  });
});

describe("LazyLoader (Fase 02)", () => {
  it("carrega subsistemas sob demanda apenas na primeira requisição", async () => {
    let factoryCalled = 0;
    LazyLoader.register("test-subsystem", async () => {
      factoryCalled++;
      return { initialized: true, id: 42 };
    });

    expect(LazyLoader.isLoaded("test-subsystem")).toBe(false);
    expect(factoryCalled).toBe(0);

    const instance1 = await LazyLoader.get<{ initialized: boolean; id: number }>("test-subsystem");
    expect(instance1.initialized).toBe(true);
    expect(factoryCalled).toBe(1);
    expect(LazyLoader.isLoaded("test-subsystem")).toBe(true);

    const instance2 = await LazyLoader.get<{ initialized: boolean; id: number }>("test-subsystem");
    expect(instance2).toBe(instance1);
    expect(factoryCalled).toBe(1); // Cached, not called again
  });
});

describe("ResourceOrchestrator (Seção 3)", () => {
  it("coordena memória, caches e workers com limpeza em pressão", async () => {
    const orchestrator = ResourceOrchestrator.getInstance();
    expect(orchestrator.memory).toBeDefined();
    expect(orchestrator.workers).toBeDefined();
    expect(orchestrator.toolCache).toBeDefined();

    orchestrator.toolCache.set("temp-tool-result", { ok: true });
    expect(orchestrator.toolCache.get("temp-tool-result")).toBeDefined();

    // Trigger cleanup
    await orchestrator.memory.triggerResourceCleanup();
    expect(orchestrator.profiler.getDashboardSnapshot().ramCurrentMb).toBeGreaterThan(0);
  });
});
