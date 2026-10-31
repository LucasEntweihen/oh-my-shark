import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { MenteEmTeiaStore } from "./mente-em-teia-sqlite";

describe("MenteEmTeiaStore (SQLite Provenance & Evidence Graph)", () => {
	let tempDir: string;
	let dbPath: string;
	let store: MenteEmTeiaStore;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-teia-test-"));
		dbPath = path.join(tempDir, "teia-test.db");
		store = new MenteEmTeiaStore(dbPath);
	});

	afterEach(async () => {
		store.close();
		for (let i = 0; i < 5; i++) {
			try {
				await fs.rm(tempDir, { recursive: true, force: true });
				break;
			} catch {
				await new Promise((r) => setTimeout(r, 60));
			}
		}
	});

	it("should record architectural decisions linked to files and symbols", () => {
		const decisionId = store.recordDecision(
			"Adopt Transactional Edit Checkpoints",
			"Prevents file corruption on half-applied edits with atomic rollbacks.",
			["packages/coding-agent/src/edit/transactional-engine.ts"],
			["TransactionalEditEngine", "begin", "rollback"],
		);

		expect(decisionId).toStartWith("decision_");

		const searchRes = store.searchKnowledge("Transactional Edit");
		expect(searchRes.length).toBeGreaterThan(0);
		expect(searchRes[0].name).toBe("Adopt Transactional Edit Checkpoints");

		const connected = store.getConnectedGraph(decisionId);
		expect(connected).not.toBeNull();
		expect(connected?.outgoing.length).toBe(4); // 1 file + 3 symbols
	});

	it("should record test evidence and link to tested files", () => {
		const testId = store.recordTestEvidence(
			"transactional-engine.test.ts",
			"transactional-engine.ts",
			true,
			"3 pass, 0 fail across rollback and commit suites",
		);

		expect(testId).toStartWith("test_");
		const snapshot = store.exportGraphSnapshot();
		expect(snapshot.nodes.length).toBeGreaterThan(0);
		expect(snapshot.edges.some((e) => e.relation === "tests")).toBe(true);
	});

	// --- 5+ NEW TDD SPECIFIC TESTS ---

	it("TDD 1: should perform fast lexical search via FTS5 / searchFts", () => {
		store.recordDecision(
			"Deterministic Tool Routing Policy",
			"Routes AST queries with metavariables directly to ast_edit without LLM latency.",
			["packages/coding-agent/src/router/deterministic-tool-router.ts"],
			["DeterministicToolRouter"],
		);

		store.recordDecision(
			"Deep Sea Cockpit Live TUI",
			"Renders adaptive status line and event stream directly in ANSI terminal viewport.",
			["packages/coding-agent/src/tui/deep-sea-command.ts"],
			["DeepSeaCockpit"],
		);

		const ftsResults = store.searchFts("metavariables");
		expect(ftsResults.length).toBeGreaterThan(0);
		expect(ftsResults[0].name).toBe("Deterministic Tool Routing Policy");

		const ftsResults2 = store.searchFts("viewport");
		expect(ftsResults2.length).toBeGreaterThan(0);
		expect(ftsResults2[0].name).toBe("Deep Sea Cockpit Live TUI");
	});

	it("TDD 2: should invalidate knowledge nodes with explicit reason tracking", () => {
		const decisionId = store.recordDecision(
			"Legacy Memory Model",
			"Used in-memory maps without persistence.",
			["legacy-memory.ts"],
		);

		const beforeNode = store.getNode(decisionId);
		expect(beforeNode?.metadata?.invalidated).toBeUndefined();

		const success = store.invalidateNode(decisionId, "Superceded by Mente em Teia SQLite");
		expect(success).toBe(true);

		const invalidatedNode = store.getNode(decisionId);
		expect(invalidatedNode?.metadata?.invalidated).toBe(true);
		expect(invalidatedNode?.metadata?.invalidationReason).toBe("Superceded by Mente em Teia SQLite");
		expect(typeof invalidatedNode?.metadata?.invalidatedAt).toBe("number");
	});

	it("TDD 3: should invalidate edges connected to a modified or deleted file", () => {
		const targetFile = "src/auth/jwt.ts";
		const testId = store.recordTestEvidence("jwt.test.ts", targetFile, true);

		const connectedBefore = store.getConnectedGraph(`file:${targetFile}`);
		expect(connectedBefore?.incoming.some((e) => e.confidence > 0)).toBe(true);

		const invalidatedCount = store.invalidateEdgesForFile(targetFile, "File refactored to session cookies");
		expect(invalidatedCount).toBeGreaterThanOrEqual(1);

		const connectedAfter = store.getConnectedGraph(`file:${targetFile}`);
		const testEdge = connectedAfter?.incoming.find((e) => e.node.id === testId);
		expect(testEdge?.confidence).toBe(0);

		// An invalidation node and edge must exist
		expect(connectedAfter?.incoming.some((e) => e.relation === "invalidates")).toBe(true);
	});

	it("TDD 4: should traverse multi-hop subgraphs up to maxDepth without cyclical loops", () => {
		// Graph structure: Decision -> File -> Test -> Evidence
		const decisionId = store.recordDecision(
			"Use SQLite WAL",
			"Enables high concurrency.",
			["src/db.ts"],
		);

		const testId = store.recordTestRun("db.test.ts", "src/db.ts", true, 8, 45);

		// 1 hop from decision: decision + src/db.ts
		const hop1 = store.getMultiHopSubgraph(decisionId, 1);
		expect(hop1.nodes.map((n) => n.id)).toContain(decisionId);
		expect(hop1.nodes.map((n) => n.id)).toContain("file:src/db.ts");

		// 2 hops from decision: decision + src/db.ts + db.test.ts
		const hop2 = store.getMultiHopSubgraph(decisionId, 2);
		expect(hop2.nodes.map((n) => n.id)).toContain(testId);
		expect(hop2.nodes.length).toBeGreaterThanOrEqual(3);
		expect(hop2.edges.length).toBeGreaterThanOrEqual(2);
	});

	it("TDD 5: should detect file staleness via SHA-256 content hashes", () => {
		const filePath = "src/calculator.ts";
		const initialContent = "export function add(a: number, b: number) { return a + b; }";
		const fileNodeId = store.recordFileNode(filePath, initialContent);

		// Check when content has NOT changed
		const freshCheck = store.checkStaleness(fileNodeId, initialContent);
		expect(freshCheck.isStale).toBe(false);
		expect(freshCheck.recordedHash).toBe(freshCheck.currentHash);

		// Check when content has changed
		const modifiedContent = "export function add(a: number, b: number) { return a + b + 1; }";
		const staleCheck = store.checkStaleness(fileNodeId, modifiedContent);
		expect(staleCheck.isStale).toBe(true);
		expect(staleCheck.recordedHash).not.toBe(staleCheck.currentHash);
	});

	it("TDD 6: should record structured test runs with assertions count and duration metrics", () => {
		const testId = store.recordTestRun(
			"packages/coding-agent/src/router/deterministic-tool-router.test.ts",
			"packages/coding-agent/src/router/deterministic-tool-router.ts",
			true,
			15,
			120,
			"15 assertions passed in 120ms",
		);

		const testNode = store.getNode(testId);
		expect(testNode).not.toBeNull();
		expect(testNode?.kind).toBe("test");
		expect(testNode?.metadata?.passed).toBe(true);
		expect(testNode?.metadata?.assertionsCount).toBe(15);
		expect(testNode?.metadata?.durationMs).toBe(120);
	});
});
