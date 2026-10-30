import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TransactionalEditEngine } from "./transactional-engine";

describe("TransactionalEditEngine", () => {
	let tempDir: string;
	let engine: TransactionalEditEngine;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-tx-test-"));
		engine = new TransactionalEditEngine(tempDir);
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
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
});
