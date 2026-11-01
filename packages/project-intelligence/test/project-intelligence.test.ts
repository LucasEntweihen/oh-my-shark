import { describe, it, expect } from "bun:test";
import {
  ProjectGraph,
  IncrementalIndexer,
  ImpactAnalyzer,
  type ProjectNode,
} from "../src/index";

describe("Shark Project Intelligence (Module 2 - Codebase Understanding)", () => {
  it("Test 1: should build dependency graph and resolve direct and reverse dependencies", () => {
    const graph = new ProjectGraph();

    graph.addNode({
      id: "src/auth.ts",
      kind: "file",
      path: "src/auth.ts",
      exports: ["login", "verifyToken"],
      language: "typescript",
    });

    graph.addNode({
      id: "src/server.ts",
      kind: "file",
      path: "src/server.ts",
      exports: ["startServer"],
      language: "typescript",
    });

    graph.addEdge({
      from: "src/server.ts",
      to: "src/auth.ts",
      kind: "imports",
    });

    expect(graph.getDependencies("src/server.ts", "imports")).toEqual(["src/auth.ts"]);
    expect(graph.getDependents("src/auth.ts", "imports")).toEqual(["src/server.ts"]);
  });

  it("Test 2: should perform incremental indexing with SHA-256 caching and cache hits", () => {
    const graph = new ProjectGraph();
    const indexer = new IncrementalIndexer(graph);

    const fileContent = "export function calculateMetric(): number { return 42; }";

    // First indexing -> cache miss
    const firstResult = indexer.indexFile("src/metric.ts", fileContent, (_code) => [
      {
        id: "src/metric.ts:calculateMetric",
        kind: "symbol",
        name: "calculateMetric",
        filePath: "src/metric.ts",
        exported: true,
      },
    ]);

    expect(firstResult.cacheHit).toBe(false);
    expect(firstResult.nodesIndexed).toBe(1);
    expect(indexer.getCachedFilesCount()).toBe(1);

    // Second indexing with same content -> cache hit
    const secondResult = indexer.indexFile("src/metric.ts", fileContent, () => []);
    expect(secondResult.cacheHit).toBe(true);
    expect(secondResult.nodesIndexed).toBe(1);

    // Modified content -> cache miss and update
    const modifiedContent = "export function calculateMetric(): number { return 100; }";
    expect(indexer.shouldReindex("src/metric.ts", modifiedContent)).toBe(true);

    const thirdResult = indexer.indexFile("src/metric.ts", modifiedContent, (_code) => [
      {
        id: "src/metric.ts:calculateMetric",
        kind: "symbol",
        name: "calculateMetric",
        filePath: "src/metric.ts",
        exported: true,
      },
    ]);
    expect(thirdResult.cacheHit).toBe(false);
  });

  it("Test 3: should perform Shark Impact Analysis identifying direct and transitive dependents", () => {
    const graph = new ProjectGraph();
    const analyzer = new ImpactAnalyzer(graph);

    // Nodes: A -> B -> C
    graph.addNode({ id: "src/c.ts", kind: "file", path: "src/c.ts", exports: ["cFn"], language: "typescript" });
    graph.addNode({ id: "src/b.ts", kind: "file", path: "src/b.ts", exports: ["bFn"], language: "typescript" });
    graph.addNode({ id: "src/a.ts", kind: "file", path: "src/a.ts", exports: ["aFn"], language: "typescript" });

    graph.addEdge({ from: "src/b.ts", to: "src/c.ts", kind: "imports" });
    graph.addEdge({ from: "src/a.ts", to: "src/b.ts", kind: "imports" });

    const impact = analyzer.analyze("src/c.ts");

    expect(impact.targetId).toBe("src/c.ts");
    expect(impact.affectedFiles.sort()).toEqual(["src/a.ts", "src/b.ts", "src/c.ts"].sort());
  });

  it("Test 4: should map affected source files to their associated test suites", () => {
    const graph = new ProjectGraph();
    const analyzer = new ImpactAnalyzer(graph);

    graph.addNode({ id: "src/utils.ts", kind: "file", path: "src/utils.ts", exports: ["parse"], language: "typescript" });
    graph.addNode({ id: "test/utils.test.ts", kind: "test", filePath: "test/utils.test.ts", testCount: 5 });

    graph.addEdge({ from: "test/utils.test.ts", to: "src/utils.ts", kind: "tests" });

    const impact = analyzer.analyze("src/utils.ts");
    expect(impact.associatedTests).toEqual(["test/utils.test.ts"]);
  });

  it("Test 5: should detect breaking contract changes when public symbols are deleted or modified", () => {
    const graph = new ProjectGraph();
    const analyzer = new ImpactAnalyzer(graph);

    const publicSymbol: ProjectNode = {
      id: "src/api.ts:fetchUser",
      kind: "symbol",
      name: "fetchUser",
      filePath: "src/api.ts",
      exported: true,
      signature: "(id: string) => Promise<User>",
    };
    graph.addNode(publicSymbol);

    // Deleted public symbol -> breaking risk
    const deletedImpact = analyzer.analyze("src/api.ts:fetchUser", { isDeleted: true });
    expect(deletedImpact.contractRisk).toBe("breaking");
    expect(deletedImpact.explanation).toContain("Exported public symbol");

    // Signature changed -> breaking risk
    const sigChangedImpact = analyzer.analyze("src/api.ts:fetchUser", { signatureChanged: true });
    expect(sigChangedImpact.contractRisk).toBe("breaking");
    expect(sigChangedImpact.explanation).toContain("Signature of exported symbol");

    // Internal symbol deleted -> high risk, not breaking
    const internalSymbol: ProjectNode = {
      id: "src/api.ts:parseInternalData",
      kind: "symbol",
      name: "parseInternalData",
      filePath: "src/api.ts",
      exported: false,
    };
    graph.addNode(internalSymbol);

    const internalImpact = analyzer.analyze("src/api.ts:parseInternalData", { isDeleted: true });
    expect(internalImpact.contractRisk).toBe("high");
  });
});
