import { describe, expect, it } from "bun:test";
import {
  SharkContextEngine,
  type ContextSourceItem,
  ProjectGraph,
  ImpactAnalyzer,
} from "../packages/project-intelligence/src/index";

describe("Subagent 1 TDD: Context Engine & Shark Impact Analysis", () => {
  it("1. Infers task intent accurately from natural language instructions", () => {
    const engine = new SharkContextEngine();

    expect(engine.inferIntent("Corrigir crash e bug de memória")).toBe("bug_fix");
    expect(engine.inferIntent("Auditar vulnerabilidades de segurança e tokens")).toBe("security");
    expect(engine.inferIntent("Refatorar arquitetura e limpar código")).toBe("refactor");
    expect(engine.inferIntent("Otimizar performance e latência do app")).toBe("optimization");
    expect(engine.inferIntent("Implementar novo endpoint de métricas")).toBe("feature");
  });

  it("2. Scores items prioritizing intent-specific modules and keywords", () => {
    const engine = new SharkContextEngine();

    const testItem: ContextSourceItem = {
      id: "t1",
      path: "test/auth.test.ts",
      type: "test",
      content: "describe('auth test')",
      symbols: ["testAuth"],
    };

    const srcItem: ContextSourceItem = {
      id: "s1",
      path: "src/auth.ts",
      type: "file",
      content: "export function auth() {}",
      symbols: ["auth"],
    };

    // Bug fix prioritizes test files
    const scoredTest = engine.scoreItem(testItem, "auth bug", "bug_fix");
    const scoredSrc = engine.scoreItem(srcItem, "auth bug", "bug_fix");

    expect(scoredTest.score).toBeGreaterThan(0);
    expect(scoredTest.reasons.some(r => r.includes("Test file prioritized"))).toBe(true);
    expect(scoredSrc.score).toBeGreaterThan(0);
  });

  it("3. Assembles context adhering to max token limits and detects stale items", () => {
    const engine = new SharkContextEngine();
    engine.updateHash("src/stale.ts", "hash_v1");

    const items: ContextSourceItem[] = [
      {
        id: "1",
        path: "src/main.ts",
        type: "file",
        content: "const a = 1; ".repeat(100), // ~1300 chars => ~325 tokens
        hash: "hash_current",
      },
      {
        id: "2",
        path: "src/stale.ts",
        type: "file",
        content: "const b = 2; ".repeat(100),
        hash: "hash_v2", // changed from hash_v1 -> stale
      },
    ];

    const result = engine.assembleContext(items, "main", { maxTokens: 500 });
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.staleCount).toBe(1);
    expect(result.totalTokensEstimate).toBeLessThanOrEqual(500);
  });

  it("4. Evaluates breaking risk when exported symbols or files are modified", () => {
    const graph = new ProjectGraph();
    graph.addNode({
      id: "file:auth.ts",
      kind: "file",
      path: "src/auth.ts",
      exports: ["validateToken"],
      language: "typescript",
    });
    graph.addNode({
      id: "sym:validateToken",
      kind: "symbol",
      name: "validateToken",
      filePath: "src/auth.ts",
      exported: true,
    });
    graph.addNode({
      id: "file:server.ts",
      kind: "file",
      path: "src/server.ts",
      exports: ["startServer"],
      language: "typescript",
    });

    graph.addEdge({
      from: "file:server.ts",
      to: "sym:validateToken",
      kind: "calls",
    });

    const analyzer = new ImpactAnalyzer(graph);
    const impact = analyzer.analyze("sym:validateToken", { isDeleted: true });

    expect(impact.contractRisk).toBe("breaking");
    expect(impact.dependentCallers).toContain("file:server.ts");
    expect(impact.affectedFiles).toContain("src/server.ts");
  });

  it("5. Discovers direct and transitive associated test files for affected modules", () => {
    const graph = new ProjectGraph();
    graph.addNode({
      id: "file:user.ts",
      kind: "file",
      path: "src/user.ts",
      exports: ["User"],
      language: "typescript",
    });
    graph.addNode({
      id: "file:service.ts",
      kind: "file",
      path: "src/service.ts",
      exports: ["UserService"],
      language: "typescript",
    });
    graph.addNode({
      id: "test:service.test.ts",
      kind: "test",
      filePath: "test/service.test.ts",
      testCount: 5,
    });

    graph.addEdge({ from: "file:service.ts", to: "file:user.ts", kind: "imports" });
    graph.addEdge({ from: "test:service.test.ts", to: "file:service.ts", kind: "tests" });

    const analyzer = new ImpactAnalyzer(graph);
    const impact = analyzer.analyze("file:user.ts");

    expect(impact.associatedTests).toContain("test:service.test.ts");
  });
});
