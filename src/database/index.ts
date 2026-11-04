import { Database } from "bun:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { ensureProjectOmskDir, getProjectAgentDbPath, getProjectRoot } from "../config/paths";

export interface DatabaseStats {
	path: string;
	sizeBytes: number;
	tables: number;
	journalMode: string;
}

const connectionPool = new Map<string, OmskSharedDatabase>();

/**
 * Shared SQLite database manager optimized for high-concurrency multi-process read/write access.
 * Applies Write-Ahead Logging (WAL) and bounded busy timeouts to ensure zero-lock contention.
 */
export class OmskSharedDatabase {
	private readonly db: Database;
	private readonly filePath: string;

	constructor(dbPath: string = getProjectAgentDbPath()) {
		this.filePath = path.resolve(dbPath);
		const dir = path.dirname(this.filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
		}

		this.db = new Database(this.filePath);
		this.initializeOptimizations();
	}

	private initializeOptimizations(): void {
		// WAL allows concurrent readers alongside a writer without locking
		this.db.run("PRAGMA journal_mode = WAL;");
		this.db.run("PRAGMA synchronous = NORMAL;");
		this.db.run("PRAGMA busy_timeout = 5000;");
		this.db.run("PRAGMA cache_size = -8000;"); // 8MB memory cache
	}

	/**
	 * Gets or creates a pooled singleton database instance for the specified path.
	 */
	static getShared(dbPath: string = getProjectAgentDbPath()): OmskSharedDatabase {
		const resolved = path.resolve(dbPath);
		const existing = connectionPool.get(resolved);
		if (existing && !existing.isClosed()) {
			return existing;
		}
		const instance = new OmskSharedDatabase(resolved);
		connectionPool.set(resolved, instance);
		return instance;
	}

	/**
	 * Returns whether the database connection has been closed.
	 */
	isClosed(): boolean {
		try {
			this.db.query("SELECT 1;").get();
			return false;
		} catch {
			return true;
		}
	}

	/**
	 * Executes a query returning multiple typed rows.
	 */
	query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
		const statement = this.db.query(sql);
		return statement.all(...params) as T[];
	}

	/**
	 * Executes a query returning a single typed row or null.
	 */
	queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
		const statement = this.db.query(sql);
		const result = statement.get(...params);
		return (result ?? null) as T | null;
	}

	/**
	 * Runs a state-changing SQL statement and returns modification stats.
	 */
	run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number | bigint } {
		const statement = this.db.query(sql);
		return statement.run(...params) as { changes: number; lastInsertRowid: number | bigint };
	}

	/**
	 * Executes an atomic transaction callback with rollbacks on failure.
	 */
	transaction<T>(fn: () => T): T {
		return this.db.transaction(fn)();
	}

	/**
	 * Lists all user table names in the database.
	 */
	getTables(): string[] {
		const rows = this.query<{ name: string }>(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;",
		);
		return rows.map(r => r.name);
	}

	/**
	 * Retrieves the CREATE TABLE definition for a specific table.
	 */
	getTableSchema(tableName: string): string | null {
		const row = this.queryOne<{ sql: string }>(
			"SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;",
			[tableName],
		);
		return row?.sql ?? null;
	}

	/**
	 * Returns physical and runtime statistics of the database file.
	 */
	getStats(): DatabaseStats {
		let sizeBytes = 0;
		if (fs.existsSync(this.filePath)) {
			try {
				sizeBytes = fs.statSync(this.filePath).size;
			} catch {}
		}
		const tables = this.getTables().length;
		const journalRow = this.queryOne<{ journal_mode: string }>("PRAGMA journal_mode;");
		return {
			path: this.filePath,
			sizeBytes,
			tables,
			journalMode: journalRow?.journal_mode ?? "unknown",
		};
	}

	/**
	 * Accesses the underlying native bun:sqlite Database instance.
	 */
	get raw(): Database {
		return this.db;
	}

	/**
	 * Closes the database connection and removes it from the pool.
	 */
	close(): void {
		try {
			this.db.close();
		} catch {}
		connectionPool.delete(this.filePath);
	}
}

/** Convenience helper to get the default project database */
export function getSharedDatabase(dbPath?: string): OmskSharedDatabase {
	ensureProjectOmskDir(getProjectRoot());
	return OmskSharedDatabase.getShared(dbPath);
}
