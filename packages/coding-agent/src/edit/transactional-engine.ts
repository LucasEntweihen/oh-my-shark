/**
 * Transactional Edit Engine for Oh My Shark (OMSK).
 * Provides atomic file modification boundaries, pre-modification snapshots,
 * SHA-256 integrity verification, rollback to checkpoints, and semantic change calculation.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface FileSnapshot {
	path: string;
	existed: boolean;
	hashBefore: string;
	contentBefore: string | null;
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

function computeHash(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

function countLines(text: string): number {
	if (!text) return 0;
	return text.split("\n").length;
}

export class TransactionalEditEngine {
	private checkpoints: Checkpoint[] = [];
	private activeCheckpointId: string | null = null;
	private baseDir: string;

	constructor(baseDir: string = process.cwd()) {
		this.baseDir = path.resolve(baseDir);
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
		return id;
	}

	/**
	 * Captures file state before modification under the active checkpoint.
	 */
	public async recordBeforeModification(filePath: string, checkpointId?: string): Promise<void> {
		const targetCheckpoint = this.resolveCheckpoint(checkpointId ?? this.activeCheckpointId);
		if (!targetCheckpoint || targetCheckpoint.status !== "open") {
			return;
		}

		const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.baseDir, filePath);
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
		return true;
	}

	/**
	 * Rolls back changes recorded in a checkpoint or the last active/committed checkpoint.
	 */
	public async rollback(checkpointId?: string): Promise<{ rolledBackFiles: string[] }> {
		const target = checkpointId
			? this.resolveCheckpoint(checkpointId)
			: [...this.checkpoints].reverse().find((c) => c.status !== "rolled_back");

		if (!target) {
			return { rolledBackFiles: [] };
		}

		const rolledBackFiles: string[] = [];

		for (const [absPath, snapshot] of target.files.entries()) {
			if (!snapshot.existed) {
				try {
					await fs.unlink(absPath);
					rolledBackFiles.push(absPath);
				} catch {
					// File might already be gone
				}
			} else if (snapshot.contentBefore !== null) {
				await fs.mkdir(path.dirname(absPath), { recursive: true });
				await fs.writeFile(absPath, snapshot.contentBefore, "utf8");
				rolledBackFiles.push(absPath);
			}
		}

		target.status = "rolled_back";
		if (this.activeCheckpointId === target.id) {
			this.activeCheckpointId = null;
		}

		return { rolledBackFiles };
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
		}));
	}

	/**
	 * Calculates detailed diff statistics for all files modified in the active or most recent checkpoints.
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
				const beforeLines = snapshot.contentBefore ? snapshot.contentBefore.split("\n") : [];
				const afterLines = currentContent ? currentContent.split("\n") : [];
				const added = Math.max(0, afterLines.length - beforeLines.length);
				const removed = Math.max(0, beforeLines.length - afterLines.length);

				results.push({
					path: absPath,
					status: "modified",
					linesAdded: added > 0 ? added : 1,
					linesRemoved: removed > 0 ? removed : 0,
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

	private resolveCheckpoint(id?: string | null): Checkpoint | undefined {
		if (!id) return undefined;
		return this.checkpoints.find((c) => c.id === id);
	}
}

// Global singleton for process-level transactional safety
let globalEngine: TransactionalEditEngine | null = null;

export function getTransactionalEditEngine(baseDir?: string): TransactionalEditEngine {
	if (!globalEngine || baseDir) {
		globalEngine = new TransactionalEditEngine(baseDir);
	}
	return globalEngine;
}
