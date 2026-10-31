import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TransactionalEditEngine, computeExactLineDiff } from "./transactional-engine";

describe("TransactionalEditEngine", () => {
	let tempDir: string;
	let engine: TransactionalEditEngine;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-tx-test-"));
		engine = new TransactionalEditEngine(tempDir);
	});

	afterEach(async () => {
		engine.close();
		for (let i = 0; i < 5; i++) {
			try {
				await fs.rm(tempDir, { recursive: true, force: true });
				break;
			} catch {
				await new Promise((r) => setTimeout(r, 60));
			}
		}
	});

	it("should begin a checkpoint and record pre-modification state", async () => {
		const filePath = path.join(tempDir, "sample.txt");
		await fs.writeFile(filePath, "original content\nline 2", "utf8");

		const ckptId = engine.begin("Test modification");
		expect(ckptId).toStartWith("ckpt_");

		await engine.recordBeforeModification(filePath);

		// Modify file
		await fs.writeFile(filePath, "modified content\nline 2\nline 3", "utf8");

		const summary = await engine.getChangesSummary();
		expect(summary.modifiedCount).toBe(1);
		expect(summary.totalAdded).toBeGreaterThanOrEqual(1);

		// Commit
		const committed = engine.commit(ckptId);
		expect(committed).toBe(true);

		const checkpoints = engine.listCheckpoints();
		expect(checkpoints.length).toBe(1);
		expect(checkpoints[0].status).toBe("committed");
	});

	it("should roll back modifications safely", async () => {
		const filePath = path.join(tempDir, "rollback-target.txt");
		await fs.writeFile(filePath, "initial state", "utf8");

		engine.begin("Change before rollback");
		await engine.recordBeforeModification(filePath);

		await fs.writeFile(filePath, "corrupted or unwanted changes", "utf8");
		expect(await fs.readFile(filePath, "utf8")).toBe("corrupted or unwanted changes");

		const rollbackRes = await engine.rollback();
		expect(rollbackRes.rolledBackFiles).toContain(path.resolve(filePath));

		const restored = await fs.readFile(filePath, "utf8");
		expect(restored).toBe("initial state");
	});

	it("should remove newly created files during rollback", async () => {
		const newFilePath = path.join(tempDir, "created-file.txt");

		engine.begin("Create file");
		await engine.recordBeforeModification(newFilePath);

		await fs.writeFile(newFilePath, "brand new file", "utf8");
		expect(await fs.exists(newFilePath)).toBe(true);

		await engine.rollback();
		expect(await fs.exists(newFilePath)).toBe(false);
	});

	// --- 5+ NEW TDD SPECIFIC TESTS ---

	it("TDD 1: should enforce workspace confinement and block path traversal attempts", async () => {
		const insidePath = path.join(tempDir, "inside.txt");
		expect(engine.assertWithinWorkspace(insidePath)).toBe(path.resolve(insidePath));

		const outsidePath = path.join(tempDir, "..", "outside-secret.txt");
		expect(() => engine.assertWithinWorkspace(outsidePath)).toThrow(
			"Workspace confinement violation"
		);

		// Confinement check must also fail on recordBeforeModification
		await expect(engine.recordBeforeModification(outsidePath)).rejects.toThrow(
			"Workspace confinement violation"
		);
	});

	it("TDD 2: should detect external conflicts during rollback and preserve external edits without force", async () => {
		const filePath = path.join(tempDir, "conflict-target.txt");
		await fs.writeFile(filePath, "state 0 - clean", "utf8");

		engine.begin("Agent edit step");
		await engine.recordBeforeModification(filePath);

		// Agent applies edit
		await fs.writeFile(filePath, "state 1 - agent changes", "utf8");
		await engine.recordAfterModification(filePath);

		// External user/process edits file concurrently
		await fs.writeFile(filePath, "state 2 - external concurrent modification", "utf8");

		// Rollback without force must detect conflict and NOT overwrite
		const result = await engine.rollback(undefined, { force: false });
		expect(result.conflicts).toContain(path.resolve(filePath));
		expect(result.rolledBackFiles).not.toContain(path.resolve(filePath));

		const preservedContent = await fs.readFile(filePath, "utf8");
		expect(preservedContent).toBe("state 2 - external concurrent modification");
	});

	it("TDD 3: should overwrite conflicted files during rollback when force is true", async () => {
		const filePath = path.join(tempDir, "force-rollback.txt");
		await fs.writeFile(filePath, "state 0 - pristine", "utf8");

		engine.begin("Agent edit step");
		await engine.recordBeforeModification(filePath);

		await fs.writeFile(filePath, "state 1 - agent edit", "utf8");
		await engine.recordAfterModification(filePath);

		// External conflict
		await fs.writeFile(filePath, "state 2 - rogue edit", "utf8");

		// Rollback with force: true must overwrite conflict
		const result = await engine.rollback(undefined, { force: true });
		expect(result.conflicts).toContain(path.resolve(filePath));
		expect(result.rolledBackFiles).toContain(path.resolve(filePath));

		const restoredContent = await fs.readFile(filePath, "utf8");
		expect(restoredContent).toBe("state 0 - pristine");
	});

	it("TDD 4: should calculate exact line-by-line diffs accurately", () => {
		const before = "alpha\nbeta\ngamma";
		const after = "alpha\nbeta\ndelta\nepsilon";

		const diff = computeExactLineDiff(before, after);
		// 'gamma' removed (1), 'delta' and 'epsilon' added (2)
		expect(diff.added).toBe(2);
		expect(diff.removed).toBe(1);

		const emptyBefore = computeExactLineDiff(null, "one\ntwo");
		expect(emptyBefore.added).toBe(2);
		expect(emptyBefore.removed).toBe(0);

		const emptyAfter = computeExactLineDiff("one\ntwo", null);
		expect(emptyAfter.added).toBe(0);
		expect(emptyAfter.removed).toBe(2);
	});

	it("TDD 5: should persist and recover checkpoints across engine instances via SQLite", async () => {
		const dbPath = path.join(tempDir, "checkpoints.db");
		const engineWithDb = new TransactionalEditEngine(tempDir, dbPath);

		const testFile = path.join(tempDir, "durable-file.txt");
		await fs.writeFile(testFile, "initial content", "utf8");

		const ckptId = engineWithDb.begin("Durable Checkpoint");
		await engineWithDb.recordBeforeModification(testFile);

		await fs.writeFile(testFile, "modified durable content", "utf8");
		await engineWithDb.recordAfterModification(testFile);
		engineWithDb.commit(ckptId);

		// Spawn a second, brand new engine pointing to the same SQLite database
		const secondEngine = new TransactionalEditEngine(tempDir, dbPath);
		const recovered = secondEngine.recoverCheckpoints();

		expect(recovered.length).toBe(1);
		expect(recovered[0].id).toBe(ckptId);
		expect(recovered[0].label).toBe("Durable Checkpoint");
		expect(recovered[0].status).toBe("committed");
		expect(recovered[0].fileCount).toBe(1);

		engineWithDb.close();
		secondEngine.close();
	});
});
