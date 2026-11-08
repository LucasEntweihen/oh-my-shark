import { describe, expect, it } from "bun:test";
import {
  SharkHybridRetrieval,
  ProjectGraph,
} from "../packages/project-intelligence/src/index";

describe("Subagent 4 TDD: Hybrid Retrieval & Project Graph", () => {
  it("1. Indexes and retrieves documents combining lexical and structural matches", () => {
    const retrieval = new SharkHybridRetrieval();

    retrieval.index({
      id: "doc-1",
      path: "src/auth/jwt.ts",
      title: "JWT Authentication Service",
      content: "Handles token signing and verification with HMAC SHA-256",
      symbols: ["signToken", "verifyToken"],
    });

    retrieval.index({
      id: "doc-2",
      path: "src/db/sqlite.ts",
      title: "SQLite Database Driver",
      content: "Manages WAL mode connections and transaction pools",
      symbols: ["openDatabase", "runQuery"],
    });

    const results = retrieval.search("verifyToken authentication");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.id).toBe("doc-1");
    expect(results[0].structuralScore).toBeGreaterThan(0);
    expect(results[0].lexicalScore).toBeGreaterThan(0);
  });

  it("2. Boosts documents containing active symbols and dependencies", () => {
    const retrieval = new SharkHybridRetrieval();

    retrieval.index({
      id: "doc-caller",
      path: "src/api/auth-router.ts",
      title: "Auth Router",
      content: "Routes auth requests to jwt service",
      symbols: ["handleLogin"],
      dependencies: ["src/auth/jwt.ts"],
    });

    retrieval.index({
      id: "doc-unrelated",
      path: "src/ui/button.ts",
      title: "Button Component",
      content: "Renders clickable button",
      symbols: ["renderButton"],
    });

    const results = retrieval.search("router", {
      activeFiles: ["src/auth/jwt.ts"],
      activeSymbols: ["handleLogin"],
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.id).toBe("doc-caller");
    expect(results[0].structuralScore).toBeGreaterThanOrEqual(50);
  });

  it("3. Incorporates contextual recency weighting for recently accessed documents", () => {
    const retrieval = new SharkHybridRetrieval();
    const now = Date.now();

    retrieval.index({
      id: "doc-fresh",
      path: "src/fresh.ts",
      title: "Fresh Module",
      content: "Same shared keyword",
      lastAccessed: now - 1000 * 60 * 10, // 10 minutes ago
    });

    retrieval.index({
      id: "doc-old",
      path: "src/old.ts",
      title: "Old Module",
      content: "Same shared keyword",
      lastAccessed: now - 1000 * 60 * 60 * 48, // 48 hours ago
    });

    const results = retrieval.search("keyword");
    expect(results.length).toBe(2);
    expect(results[0].document.id).toBe("doc-fresh");
    expect(results[0].contextualScore).toBeGreaterThan(results[1].contextualScore);
  });

  it("4. Deduplicates and reranks documents based on configurable 4-way weights", () => {
    const customRetrieval = new SharkHybridRetrieval({
      lexical: 0.1,
      structural: 0.7,
      contextual: 0.1,
      semantic: 0.1,
    });

    customRetrieval.index({
      id: "doc-lexical-heavy",
      path: "src/search.ts",
      title: "Search Search Search",
      content: "Search search search",
      symbols: [],
    });

    customRetrieval.index({
      id: "doc-structural-heavy",
      path: "src/engine.ts",
      title: "Search Engine",
      content: "Engine implementation",
      symbols: ["searchQuery", "searchIndex"],
    });

    const results = customRetrieval.search("search");
    // Structural priority overrides pure keyword stuffing
    expect(results[0].document.id).toBe("doc-structural-heavy");
  });

  it("5. Integrates with ProjectGraph to find callers and transitive dependents", () => {
    const graph = new ProjectGraph();
    graph.addNode({
      id: "mod:A",
      kind: "file",
      path: "src/a.ts",
      exports: ["fnA"],
      language: "typescript",
    });
    graph.addNode({
      id: "mod:B",
      kind: "file",
      path: "src/b.ts",
      exports: ["fnB"],
      language: "typescript",
    });
    graph.addNode({
      id: "mod:C",
      kind: "file",
      path: "src/c.ts",
      exports: ["fnC"],
      language: "typescript",
    });

    graph.addEdge({ from: "mod:B", to: "mod:A", kind: "imports" });
    graph.addEdge({ from: "mod:C", to: "mod:B", kind: "imports" });

    const transitive = graph.getTransitiveDependents("mod:A");
    expect(transitive).toContain("mod:B");
    expect(transitive).toContain("mod:C");
  });
});
