import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { MenteEmTeiaStore } from "../packages/coding-agent/src/memories/mente-em-teia-sqlite";

describe("Subagent 4 TDD: Mente em Teia SQLite Knowledge Graph", () => {
	let tempDir: string;
	let dbPath: string;
	let store: MenteEmTeiaStore;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-subagent4-teia-"));
		dbPath = path.join(tempDir, "teia.sqlite");
		store = new MenteEmTeiaStore(dbPath);
	});

	afterEach(async () => {
		store.close();
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("records architectural decision and builds relational graph edges", () => {
		const decisionId = store.recordDecision(
			"Purge 100% of Legacy GUI Systems",
			"Removed Electron and all GUI modules in favor of pure terminal CLI/TUI.",
			["packages/coding-agent/src/cli.ts"],
			["cliEntry", "renderCockpit"],
		);

		expect(decisionId).toMatch(/^decision_/);

		const node = store.getNode(decisionId);
		expect(node).toBeDefined();
		expect(node?.kind).toBe("decision");
		expect(node?.name).toBe("Purge 100% of Legacy GUI Systems");

		const graph = store.getConnectedGraph(decisionId);
		expect(graph).toBeDefined();
		expect(graph?.outgoing.length).toBeGreaterThanOrEqual(3); // 1 file + 2 symbols
	});

	it("discovers knowledge via lexical search across nodes", () => {
		store.recordDecision(
			"Transactional Safety Protocol",
			"Enforces atomic checkpoints and rollbacks.",
			["src/edit/engine.ts"],
			["rollback"],
		);

		const results = store.searchKnowledge("Transactional Safety");
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe("Transactional Safety Protocol");

		const emptyResults = store.searchKnowledge("NonExistentTermXYZ999");
		expect(emptyResults.length).toBe(0);
	});

	it("tracks file content hash and detects staleness accurately", () => {
		const filePath = "src/core/engine.ts";
		const initialContent = "export function run() { return true; }\n";
		const fileNodeId = store.recordFileNode(filePath, initialContent);

		expect(fileNodeId).toBe(`file:${filePath}`);

		// Unchanged check
		const checkSame = store.checkStaleness(fileNodeId, initialContent);
		expect(checkSame.isStale).toBe(false);

		// Modified content check
		const modifiedContent = "export function run() { return false; }\n";
		const checkModified = store.checkStaleness(fileNodeId, modifiedContent);
		expect(checkModified.isStale).toBe(true);
		expect(checkModified.currentHash).not.toBe(checkModified.recordedHash);
	});

	it("traverses multi-hop subgraphs with cycle protection", () => {
		// Create a cycle: Node A -> Node B -> Node C -> Node A
		store.upsertNode({
			id: "node:A",
			kind: "symbol",
			name: "ModuleA",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		store.upsertNode({
			id: "node:B",
			kind: "symbol",
			name: "ModuleB",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		store.upsertNode({
			id: "node:C",
			kind: "symbol",
			name: "ModuleC",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		store.createEdge({
			id: "edge:A-B",
			sourceId: "node:A",
			targetId: "node:B",
			relation: "relies_on",
			confidence: 1.0,
			createdAt: Date.now(),
		});
		store.createEdge({
			id: "edge:B-C",
			sourceId: "node:B",
			targetId: "node:C",
			relation: "relies_on",
			confidence: 1.0,
			createdAt: Date.now(),
		});
		store.createEdge({
			id: "edge:C-A",
			sourceId: "node:C",
			targetId: "node:A",
			relation: "relies_on",
			confidence: 1.0,
			createdAt: Date.now(),
		});

		// Traverse with maxDepth 5
		const subgraph = store.getMultiHopSubgraph("node:A", 5);
		expect(subgraph.nodes.length).toBe(3); // A, B, C exactly once despite cycle
		expect(subgraph.edges.length).toBe(3);
	});

	it("invalidates nodes and file edges with audit reason and confidence degradation", () => {
		const filePath = "src/deprecated/old-feature.ts";
		store.recordDecision("Legacy Feature Design", "Old pattern", [filePath], ["oldMethod"]);

		const invalidatedCount = store.invalidateEdgesForFile(filePath, "Deprecated in v0.0.46");
		expect(invalidatedCount).toBeGreaterThan(0);

		// Verify old edge confidence was degraded to 0.0 and new invalidates edge was created
		const snapshot = store.exportGraphSnapshot();
		const degradedEdge = snapshot.edges.find(
			(e) => e.targetId === `file:${filePath}` && e.relation !== "invalidates",
		);
		expect(degradedEdge).toBeDefined();
		expect(degradedEdge?.confidence).toBe(0.0);

		const invalidatesEdge = snapshot.edges.find(
			(e) => e.targetId === `file:${filePath}` && e.relation === "invalidates",
		);
		expect(invalidatesEdge).toBeDefined();
		expect(invalidatesEdge?.confidence).toBe(1.0);
		// Direct node invalidation
		const decisionNode = snapshot.nodes.find((n) => n.name === "Legacy Feature Design");
		expect(decisionNode).toBeDefined();
		if (decisionNode) {
			const success = store.invalidateNode(decisionNode.id, "Superseded by terminal purity");
			expect(success).toBe(true);
			const updated = store.getNode(decisionNode.id);
			expect(updated?.metadata?.invalidated).toBe(true);
			expect(updated?.metadata?.invalidationReason).toBe("Superseded by terminal purity");
		}
	});
});
