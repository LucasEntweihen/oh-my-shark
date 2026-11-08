import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
	TransactionalEditEngine,
	computeExactLineDiff,
} from "../packages/coding-agent/src/edit/transactional-engine";

describe("Subagent 3 TDD: Transactional Edit Engine & Safety Contracts", () => {
	let tempDir: string;
	let engine: TransactionalEditEngine;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-subagent3-tx-"));
		engine = new TransactionalEditEngine(tempDir);
	});

	afterEach(async () => {
		engine.close();
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("manages checkpoint lifecycle from begin to commit", async () => {
		const filePath = path.join(tempDir, "contract.ts");
		await fs.writeFile(filePath, "export const VERSION = 1;\n", "utf8");

		const ckptId = engine.begin("Upgrade contract version");
		expect(ckptId).toMatch(/^ckpt_[a-f0-9]+/);

		await engine.recordBeforeModification(filePath);
		await fs.writeFile(filePath, "export const VERSION = 2;\n", "utf8");
		await engine.recordAfterModification(filePath);

		const committed = engine.commit(ckptId);
		expect(committed).toBe(true);

		const checkpoints = engine.listCheckpoints();
		expect(checkpoints.length).toBe(1);
		expect(checkpoints[0].status).toBe("committed");
		expect(checkpoints[0].label).toBe("Upgrade contract version");
	});

	it("restores original file bit-for-bit upon rollback", async () => {
		const filePath = path.join(tempDir, "important.json");
		const originalData = JSON.stringify({ key: "alpha", count: 42 }, null, 2);
		await fs.writeFile(filePath, originalData, "utf8");

		engine.begin("Faulty JSON mutation");
		await engine.recordBeforeModification(filePath);

		// Malformed mutation
		await fs.writeFile(filePath, "{ corrupt: json", "utf8");

		const rollbackRes = await engine.rollback();
		expect(rollbackRes.rolledBackFiles.length).toBe(1);
		expect(rollbackRes.conflicts.length).toBe(0);

		const restoredData = await fs.readFile(filePath, "utf8");
		expect(restoredData).toBe(originalData);
	});

	it("enforces path containment to prevent directory traversal", () => {
		const outsidePath = path.resolve(tempDir, "../forbidden-escape.txt");
		expect(() => engine.assertWithinWorkspace(outsidePath)).toThrow(/Workspace confinement violation/);

		const insidePath = path.join(tempDir, "src", "safe.ts");
		const resolved = engine.assertWithinWorkspace(insidePath);
		expect(resolved).toBe(path.normalize(insidePath));
	});

	it("computes exact line diffs without allocation leaks", () => {
		const before = "const a = 1;\nconst b = 2;\n";
		const after = "const a = 1;\nconst b = 3;\nconst c = 4;\n";

		const diff = computeExactLineDiff(before, after);
		expect(diff.added).toBeGreaterThanOrEqual(1);
		expect(diff.removed).toBeGreaterThanOrEqual(1);
		expect(typeof diff.added).toBe("number");
		expect(typeof diff.removed).toBe("number");
	});

	it("correctly identifies collision when file is modified externally", async () => {
		const filePath = path.join(tempDir, "conflict.ts");
		await fs.writeFile(filePath, "initial line\n", "utf8");

		const ckptId = engine.begin("Attempt concurrent edit");
		await engine.recordBeforeModification(filePath);

		// Agent edits file
		await fs.writeFile(filePath, "agent planned edit\n", "utf8");
		await engine.recordAfterModification(filePath);

		// External process modifies file unexpectedly to a 3rd content
		await fs.writeFile(filePath, "external rogue actor edit\n", "utf8");

		// Rollback without force must detect conflict
		const rollbackRes = await engine.rollback(ckptId, { force: false });
		expect(rollbackRes.conflicts.length).toBe(1);
		expect(rollbackRes.conflicts[0]).toBe(path.resolve(filePath));

		// Rollback with force overrides conflict
		const forceRollback = await engine.rollback(ckptId, { force: true });
		expect(forceRollback.rolledBackFiles.length).toBe(1);

		const finalContent = await fs.readFile(filePath, "utf8");
		expect(finalContent).toBe("initial line\n");
	});

	it("supports multiple files transactionally within single checkpoint", async () => {
		const fileA = path.join(tempDir, "fileA.ts");
		const fileB = path.join(tempDir, "fileB.ts");
		await fs.writeFile(fileA, "content A1\n", "utf8");
		await fs.writeFile(fileB, "content B1\n", "utf8");

		const ckptId = engine.begin("Multi-file batch");
		await engine.recordBeforeModification(fileA);
		await engine.recordBeforeModification(fileB);

		await fs.writeFile(fileA, "content A2\n", "utf8");
		await fs.writeFile(fileB, "content B2\n", "utf8");

		await engine.recordAfterModification(fileA);
		await engine.recordAfterModification(fileB);

		engine.commit(ckptId);
		const checkpoints = engine.listCheckpoints();
		expect(checkpoints[0].files.length).toBe(2);

		await engine.rollback(ckptId, { force: true });
		expect(await fs.readFile(fileA, "utf8")).toBe("content A1\n");
		expect(await fs.readFile(fileB, "utf8")).toBe("content B1\n");
	});
});
