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
		// Wait a tick for Windows file handle release
		await new Promise((r) => setTimeout(r, 60));
		try {
			await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
		} catch {
			// Best-effort cleanup on locked temp directories
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
});
