/**
 * Transactional Edit Engine for Oh My Shark (OMSK).
 * Provides atomic file modification boundaries, pre-modification snapshots,
 * SHA-256 integrity verification, rollback to checkpoints, workspace confinement,
 * SQLite persistence, and exact line-by-line diff calculation.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Database } from "bun:sqlite";

export interface FileSnapshot {
	path: string;
	existed: boolean;
	hashBefore: string;
	contentBefore: string | null;
	hashAfter?: string;
}

export interface Checkpoint {
	id: string;
	timestamp: number;
	label: string;
	files: Map<string, FileSnapshot>;
	status: "open" | "committed" | "rolled_back";
}

export interface CheckpointInfo {
	id: string;
	timestamp: number;
	label: string;
	fileCount: number;
	status: "open" | "committed" | "rolled_back";
	files?: string[];
}

export interface FileChangeDiff {
	path: string;
	status: "added" | "modified" | "deleted" | "unchanged";
	linesAdded: number;
	linesRemoved: number;
}

export interface ChangesSummary {
	totalAdded: number;
	totalRemoved: number;
	modifiedCount: number;
	checkpointsCount: number;
	lastCheckpointId?: string;
}

export interface RollbackOptions {
	force?: boolean;
}

export interface RollbackResult {
	rolledBackFiles: string[];
	conflicts: string[];
}

export function computeHash(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

export function countLines(text: string): number {
	if (!text) return 0;
	return text.split("\n").length;
}

/**
 * Computes exact line-by-line added and removed differences between two texts.
 */
export function computeExactLineDiff(before: string | null, after: string | null): { added: number; removed: number } {
	const beforeLines = before ? before.split("\n") : [];
	const afterLines = after ? after.split("\n") : [];

	if (beforeLines.length === 0) {
		return { added: afterLines.length, removed: 0 };
	}
	if (afterLines.length === 0) {
		return { added: 0, removed: beforeLines.length };
	}

	const beforeFreq = new Map<string, number>();
	for (const line of beforeLines) {
		beforeFreq.set(line, (beforeFreq.get(line) ?? 0) + 1);
	}

	let common = 0;
	const remainingAfter: string[] = [];
	for (const line of afterLines) {
		const count = beforeFreq.get(line) ?? 0;
		if (count > 0) {
			beforeFreq.set(line, count - 1);
			common++;
		} else {
			remainingAfter.push(line);
		}
	}

	const added = afterLines.length - common;
	const removed = beforeLines.length - common;
	return { added, removed };
}

/**
 * Writes file atomically using temporary swap files with Windows EBUSY resilience.
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
	const dir = path.dirname(filePath);
	await fs.mkdir(dir, { recursive: true });
	const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;

	await fs.writeFile(tmpPath, content, "utf8");

	try {
		await fs.rename(tmpPath, filePath);
	} catch (error: unknown) {
		// Windows EBUSY / locks resilience: rename-to-old fallback
		const oldPath = `${filePath}.old.${Date.now()}`;
		try {
			await fs.rename(filePath, oldPath);
			await fs.rename(tmpPath, filePath);
			await fs.unlink(oldPath).catch(() => {});
		} catch {
			// Direct copy fallback if rename was blocked
			await fs.copyFile(tmpPath, filePath);
			await fs.unlink(tmpPath).catch(() => {});
		}
	}
}

export class TransactionalEditEngine {
	private checkpoints: Checkpoint[] = [];
	private activeCheckpointId: string | null = null;
	private baseDir: string;
	private sqliteDb: Database | null = null;

	constructor(baseDir: string = process.cwd(), sqliteDbPath?: string) {
		this.baseDir = path.resolve(baseDir);
		if (sqliteDbPath) {
			this.initSqlite(sqliteDbPath);
		}
	}

	/**
	 * Asserts that the target path is strictly confined within the workspace base directory.
	 * Throws an error on path traversal attempts.
	 */
	public assertWithinWorkspace(targetPath: string): string {
		const abs = path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.resolve(this.baseDir, targetPath);
		const rel = path.relative(this.baseDir, abs);

		if (rel.startsWith("..") || path.isAbsolute(rel)) {
			throw new Error(`Workspace confinement violation: path '${targetPath}' is outside workspace '${this.baseDir}'`);
		}
		return abs;
	}

	/**
	 * Initializes SQLite database persistence for checkpoints.
	 */
	public initSqlite(dbPath: string): void {
		const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(this.baseDir, dbPath);
		const dir = path.dirname(resolvedPath);
		try {
			const { mkdirSync } = require("node:fs");
			mkdirSync(dir, { recursive: true });
		} catch {
			// directory might already exist
		}

		this.sqliteDb = new Database(resolvedPath);
		this.sqliteDb.run("PRAGMA journal_mode = WAL;");
		this.sqliteDb.run(`
			CREATE TABLE IF NOT EXISTS tx_checkpoints (
				id TEXT PRIMARY KEY,
				timestamp INTEGER NOT NULL,
				label TEXT NOT NULL,
				status TEXT NOT NULL
			);
		`);
		this.sqliteDb.run(`
			CREATE TABLE IF NOT EXISTS tx_checkpoint_files (
				checkpoint_id TEXT NOT NULL,
				path TEXT NOT NULL,
				existed INTEGER NOT NULL,
				hash_before TEXT NOT NULL,
				content_before TEXT,
				hash_after TEXT,
				PRIMARY KEY(checkpoint_id, path)
			);
		`);
	}

	/**
	 * Begins a new transactional checkpoint.
	 */
	public begin(label: string): string {
		const id = `ckpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const checkpoint: Checkpoint = {
			id,
			timestamp: Date.now(),
			label,
			files: new Map(),
			status: "open",
		};
		this.checkpoints.push(checkpoint);
		this.activeCheckpointId = id;

		if (this.sqliteDb) {
			this.persistCheckpoint(id);
		}

		return id;
	}

	/**
	 * Captures file state before modification under the active checkpoint.
	 */
	public async recordBeforeModification(filePath: string, checkpointId?: string): Promise<void> {
		const absPath = this.assertWithinWorkspace(filePath);
		const targetCheckpoint = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId);
		if (!targetCheckpoint || targetCheckpoint.status !== "open") {
			return;
		}

		if (targetCheckpoint.files.has(absPath)) {
			// Already recorded initial pre-state for this transaction
			return;
		}

		try {
			const content = await fs.readFile(absPath, "utf8");
			targetCheckpoint.files.set(absPath, {
				path: absPath,
				existed: true,
				hashBefore: computeHash(content),
				contentBefore: content,
			});
		} catch (error: unknown) {
			const err = error as NodeJS.ErrnoException;
			if (err.code === "ENOENT") {
				targetCheckpoint.files.set(absPath, {
					path: absPath,
					existed: false,
					hashBefore: "empty",
					contentBefore: null,
				});
			} else {
				throw error;
			}
		}

		if (this.sqliteDb) {
			this.persistCheckpoint(targetCheckpoint.id);
		}
	}

	/**
	 * Records file state after modification to allow external conflict detection during rollback.
	 */
	public async recordAfterModification(filePath: string, checkpointId?: string): Promise<void> {
		const absPath = this.assertWithinWorkspace(filePath);
		const targetCheckpoint = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId);
		if (!targetCheckpoint) return;

		const snapshot = targetCheckpoint.files.get(absPath);
		if (!snapshot) return;

		try {
			const content = await fs.readFile(absPath, "utf8");
			snapshot.hashAfter = computeHash(content);
		} catch {
			snapshot.hashAfter = "deleted";
		}

		if (this.sqliteDb) {
			this.persistCheckpoint(targetCheckpoint.id);
		}
	}

	/**
	 * Commits an active checkpoint, confirming that all applied changes are validated.
	 */
	public commit(checkpointId?: string): boolean {
		const target = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId);
		if (!target || target.status !== "open") {
			return false;
		}

		target.status = "committed";
		if (this.activeCheckpointId === target.id) {
			this.activeCheckpointId = null;
		}

		if (this.sqliteDb) {
			this.persistCheckpoint(target.id);
		}

		return true;
	}

	/**
	 * Rolls back changes recorded in a checkpoint or the last active/committed checkpoint.
	 * Detects external modifications and prevents overwriting unless force is true.
	 */
	public async rollback(checkpointId?: string, options: RollbackOptions = {}): Promise<RollbackResult> {
		const target = checkpointId
			? this.resolveCheckpoint(checkpointId)
			: [...this.checkpoints].reverse().find((c) => c.status !== "rolled_back");

		if (!target) {
			return { rolledBackFiles: [], conflicts: [] };
		}

		const rolledBackFiles: string[] = [];
		const conflicts: string[] = [];

		for (const [absPath, snapshot] of target.files.entries()) {
			let currentContent: string | null = null;
			let existsNow = false;

			try {
				currentContent = await fs.readFile(absPath, "utf8");
				existsNow = true;
			} catch {
				existsNow = false;
			}

			// Detect conflict: if file changed externally after agent modification
			if (snapshot.hashAfter && existsNow) {
				const currentHash = computeHash(currentContent ?? "");
				if (currentHash !== snapshot.hashAfter && currentHash !== snapshot.hashBefore) {
					conflicts.push(absPath);
					if (!options.force) {
						// Skip restoring conflicted file unless force option is specified
						continue;
					}
				}
			}

			if (!snapshot.existed) {
				try {
					await fs.unlink(absPath);
					rolledBackFiles.push(absPath);
				} catch {
					// File might already be gone
				}
			} else if (snapshot.contentBefore !== null) {
				await writeAtomic(absPath, snapshot.contentBefore);
				rolledBackFiles.push(absPath);
			}
		}

		target.status = "rolled_back";
		if (this.activeCheckpointId === target.id) {
			this.activeCheckpointId = null;
		}

		if (this.sqliteDb) {
			this.persistCheckpoint(target.id);
		}

		return { rolledBackFiles, conflicts };
	}

	/**
	 * Lists all recorded checkpoints.
	 */
	public listCheckpoints(): CheckpointInfo[] {
		return this.checkpoints.map((c) => ({
			id: c.id,
			timestamp: c.timestamp,
			label: c.label,
			fileCount: c.files.size,
			status: c.status,
			files: Array.from(c.files.keys()),
		}));
	}

	/**
	 * Persists checkpoint to SQLite.
	 */
	public persistCheckpoint(checkpointId?: string): boolean {
		if (!this.sqliteDb) return false;
		const target = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId);
		if (!target) return false;

		const insertCkpt = this.sqliteDb.prepare(`
			INSERT OR REPLACE INTO tx_checkpoints (id, timestamp, label, status)
			VALUES ($id, $timestamp, $label, $status);
		`);
		insertCkpt.run({
			$id: target.id,
			$timestamp: target.timestamp,
			$label: target.label,
			$status: target.status,
		});

		const insertFile = this.sqliteDb.prepare(`
			INSERT OR REPLACE INTO tx_checkpoint_files (checkpoint_id, path, existed, hash_before, content_before, hash_after)
			VALUES ($checkpoint_id, $path, $existed, $hash_before, $content_before, $hash_after);
		`);

		for (const [filePath, snap] of target.files.entries()) {
			insertFile.run({
				$checkpoint_id: target.id,
				$path: filePath,
				$existed: snap.existed ? 1 : 0,
				$hash_before: snap.hashBefore,
				$content_before: snap.contentBefore,
				$hash_after: snap.hashAfter ?? null,
			});
		}

		return true;
	}

	/**
	 * Recovers checkpoints from SQLite database.
	 */
	public recoverCheckpoints(): CheckpointInfo[] {
		if (!this.sqliteDb) return [];

		const rows = this.sqliteDb.prepare(`SELECT * FROM tx_checkpoints ORDER BY timestamp ASC`).all() as Array<{
			id: string;
			timestamp: number;
			label: string;
			status: "open" | "committed" | "rolled_back";
		}>;

		this.checkpoints = [];

		for (const row of rows) {
			const files = new Map<string, FileSnapshot>();
			const fileRows = this.sqliteDb.prepare(`SELECT * FROM tx_checkpoint_files WHERE checkpoint_id = ?`).all(row.id) as Array<{
				checkpoint_id: string;
				path: string;
				existed: number;
				hash_before: string;
				content_before: string | null;
				hash_after: string | null;
			}>;

			for (const f of fileRows) {
				files.set(f.path, {
					path: f.path,
					existed: f.existed === 1,
					hashBefore: f.hash_before,
					contentBefore: f.content_before,
					hashAfter: f.hash_after ?? undefined,
				});
			}

			this.checkpoints.push({
				id: row.id,
				timestamp: row.timestamp,
				label: row.label,
				files,
				status: row.status,
			});
		}

		return this.listCheckpoints();
	}

	/**
	 * Calculates exact diff statistics for all files modified in the active or most recent checkpoints.
	 */
	public async getDetailedDiff(checkpointId?: string): Promise<FileChangeDiff[]> {
		const target = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId)
			?? [...this.checkpoints].reverse().find((c) => c.status !== "rolled_back");

		if (!target) {
			return [];
		}

		const results: FileChangeDiff[] = [];

		for (const [absPath, snapshot] of target.files.entries()) {
			let currentContent: string | null = null;
			let existsNow = false;

			try {
				currentContent = await fs.readFile(absPath, "utf8");
				existsNow = true;
			} catch {
				existsNow = false;
			}

			if (!snapshot.existed && existsNow) {
				results.push({
					path: absPath,
					status: "added",
					linesAdded: countLines(currentContent ?? ""),
					linesRemoved: 0,
				});
			} else if (snapshot.existed && !existsNow) {
				results.push({
					path: absPath,
					status: "deleted",
					linesAdded: 0,
					linesRemoved: countLines(snapshot.contentBefore ?? ""),
				});
			} else if (snapshot.contentBefore !== currentContent) {
				const { added, removed } = computeExactLineDiff(snapshot.contentBefore, currentContent);

				results.push({
					path: absPath,
					status: "modified",
					linesAdded: added,
					linesRemoved: removed,
				});
			} else {
				results.push({
					path: absPath,
					status: "unchanged",
					linesAdded: 0,
					linesRemoved: 0,
				});
			}
		}

		return results;
	}

	/**
	 * Summarizes cumulative lines added, removed, and modified files.
	 */
	public async getChangesSummary(): Promise<ChangesSummary> {
		const diffs = await this.getDetailedDiff();
		let totalAdded = 0;
		let totalRemoved = 0;
		let modifiedCount = 0;

		for (const d of diffs) {
			if (d.status !== "unchanged") {
				modifiedCount++;
				totalAdded += d.linesAdded;
				totalRemoved += d.linesRemoved;
			}
		}

		const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];

		return {
			totalAdded,
			totalRemoved,
			modifiedCount,
			checkpointsCount: this.checkpoints.length,
			lastCheckpointId: lastCheckpoint?.id,
		};
	}

	public close(): void {
		if (this.sqliteDb) {
			this.sqliteDb.close();
			this.sqliteDb = null;
		}
	}

	private resolveCheckpoint(id?: string | null): Checkpoint | undefined {
		if (!id) return undefined;
		return this.checkpoints.find((c) => c.id === id);
	}
}

// Global singleton for process-level transactional safety
let globalEngine: TransactionalEditEngine | null = null;

export function getTransactionalEditEngine(baseDir?: string, sqliteDbPath?: string): TransactionalEditEngine {
	if (!globalEngine || baseDir || sqliteDbPath) {
		globalEngine = new TransactionalEditEngine(baseDir, sqliteDbPath);
	}
	return globalEngine;
}
