/**
 * Mente em Teia (Web of Mind) - Structured Evidence & Provenance Knowledge Graph for OMSK.
 * Persists project decisions, symbols, files, tests, errors, and fixes into a fast local SQLite database.
 * Provides high-speed relational queries, FTS5 lexical search, multi-hop subgraphs, and invalidation management.
 */
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export type TeiaNodeKind = "file" | "symbol" | "decision" | "task" | "test" | "evidence" | "fix";
export type TeiaRelation = "defines" | "imports" | "tests" | "fixes" | "relies_on" | "evidences" | "invalidates";

export interface TeiaNode {
	id: string;
	kind: TeiaNodeKind;
	name: string;
	content?: string;
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
}

export interface TeiaEdge {
	id: string;
	sourceId: string;
	targetId: string;
	relation: TeiaRelation;
	confidence: number;
	createdAt: number;
}

export interface TeiaConnectedGraph {
	node: TeiaNode;
	incoming: Array<{ node: TeiaNode; relation: TeiaRelation; confidence: number }>;
	outgoing: Array<{ node: TeiaNode; relation: TeiaRelation; confidence: number }>;
}

export interface MultiHopSubgraph {
	rootNodeId: string;
	maxDepth: number;
	nodes: TeiaNode[];
	edges: TeiaEdge[];
}

export interface FileStalenessCheck {
	isStale: boolean;
	recordedHash?: string;
	currentHash: string;
}

function computeHash(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

export class MenteEmTeiaStore {
	private db: Database;
	private hasFts = false;

	constructor(dbPath: string) {
		const dir = path.dirname(dbPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		this.db = new Database(dbPath);
		this.initSchema();
	}

	private initSchema(): void {
		this.db.run("PRAGMA journal_mode = WAL;");
		this.db.run("PRAGMA synchronous = NORMAL;");

		this.db.run(`
			CREATE TABLE IF NOT EXISTS teia_nodes (
				id TEXT PRIMARY KEY,
				kind TEXT NOT NULL,
				name TEXT NOT NULL,
				content TEXT,
				metadata_json TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			);
		`);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS teia_edges (
				id TEXT PRIMARY KEY,
				source_id TEXT NOT NULL,
				target_id TEXT NOT NULL,
				relation TEXT NOT NULL,
				confidence REAL NOT NULL DEFAULT 1.0,
				created_at INTEGER NOT NULL,
				UNIQUE(source_id, target_id, relation)
			);
		`);

		this.db.run(`CREATE INDEX IF NOT EXISTS idx_teia_nodes_kind ON teia_nodes(kind);`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_teia_nodes_name ON teia_nodes(name);`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_teia_edges_source ON teia_edges(source_id);`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_teia_edges_target ON teia_edges(target_id);`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_teia_edges_relation ON teia_edges(relation);`);

		// FTS5 Full-Text Search integration
		try {
			this.db.run(`
				CREATE VIRTUAL TABLE IF NOT EXISTS teia_fts USING fts5(
					id UNINDEXED,
					name,
					content,
					tokenize='unicode61'
				);
			`);
			this.hasFts = true;
		} catch {
			this.hasFts = false;
		}
	}

	public upsertNode(node: TeiaNode): void {
		const metaJson = node.metadata ? JSON.stringify(node.metadata) : null;
		const stmt = this.db.prepare(`
			INSERT INTO teia_nodes (id, kind, name, content, metadata_json, created_at, updated_at)
			VALUES ($id, $kind, $name, $content, $metadata_json, $created_at, $updated_at)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				content = excluded.content,
				metadata_json = excluded.metadata_json,
				updated_at = excluded.updated_at;
		`);

		stmt.run({
			$id: node.id,
			$kind: node.kind,
			$name: node.name,
			$content: node.content ?? null,
			$metadata_json: metaJson,
			$created_at: node.createdAt,
			$updated_at: node.updatedAt,
		});

		if (this.hasFts) {
			try {
				this.db.prepare(`DELETE FROM teia_fts WHERE id = ?`).run(node.id);
				this.db.prepare(`
					INSERT INTO teia_fts (id, name, content)
					VALUES (?, ?, ?)
				`).run(node.id, node.name, node.content ?? "");
			} catch {
				// Non-fatal if FTS indexing errors
			}
		}
	}

	public createEdge(edge: TeiaEdge): void {
		const stmt = this.db.prepare(`
			INSERT OR REPLACE INTO teia_edges (id, source_id, target_id, relation, confidence, created_at)
			VALUES ($id, $source_id, $target_id, $relation, $confidence, $created_at);
		`);

		stmt.run({
			$id: edge.id,
			$source_id: edge.sourceId,
			$target_id: edge.targetId,
			$relation: edge.relation,
			$confidence: edge.confidence,
			$created_at: edge.createdAt,
		});
	}

	public getNode(id: string): TeiaNode | null {
		const stmt = this.db.prepare(`SELECT * FROM teia_nodes WHERE id = ?`);
		const row = stmt.get(id) as Record<string, unknown> | null;
		if (!row) return null;

		return this.mapNodeRow(row);
	}

	public recordDecision(
		title: string,
		rationale: string,
		evidenceFiles: string[] = [],
		affectedSymbols: string[] = [],
	): string {
		const now = Date.now();
		const decisionId = `decision_${now}_${Math.random().toString(36).slice(2, 7)}`;

		this.upsertNode({
			id: decisionId,
			kind: "decision",
			name: title,
			content: rationale,
			createdAt: now,
			updatedAt: now,
		});

		for (const file of evidenceFiles) {
			const fileNodeId = `file:${file}`;
			this.upsertNode({
				id: fileNodeId,
				kind: "file",
				name: file,
				createdAt: now,
				updatedAt: now,
			});
			this.createEdge({
				id: `edge_${decisionId}_${fileNodeId}`,
				sourceId: decisionId,
				targetId: fileNodeId,
				relation: "evidences",
				confidence: 1.0,
				createdAt: now,
			});
		}

		for (const sym of affectedSymbols) {
			const symNodeId = `symbol:${sym}`;
			this.upsertNode({
				id: symNodeId,
				kind: "symbol",
				name: sym,
				createdAt: now,
				updatedAt: now,
			});
			this.createEdge({
				id: `edge_${decisionId}_${symNodeId}`,
				sourceId: decisionId,
				targetId: symNodeId,
				relation: "relies_on",
				confidence: 0.95,
				createdAt: now,
			});
		}

		return decisionId;
	}

	public recordTestEvidence(testFile: string, targetFile: string, passed: boolean, details?: string): string {
		return this.recordTestRun(testFile, targetFile, passed, 1, 0, details);
	}

	/**
	 * Records a structured test run with assertions count, duration, and status.
	 */
	public recordTestRun(
		testFile: string,
		targetFile: string,
		passed: boolean,
		assertionsCount: number,
		durationMs: number,
		details?: string,
	): string {
		const now = Date.now();
		const testId = `test_${now}_${Math.random().toString(36).slice(2, 7)}`;

		this.upsertNode({
			id: testId,
			kind: "test",
			name: `${testFile} -> ${targetFile}`,
			content: details ?? (passed ? `${assertionsCount} assertions passed` : "Test failed"),
			metadata: { passed, assertionsCount, durationMs, timestamp: now },
			createdAt: now,
			updatedAt: now,
		});

		const targetNodeId = `file:${targetFile}`;
		this.upsertNode({
			id: targetNodeId,
			kind: "file",
			name: targetFile,
			createdAt: now,
			updatedAt: now,
		});

		this.createEdge({
			id: `edge_${testId}_${targetNodeId}`,
			sourceId: testId,
			targetId: targetNodeId,
			relation: "tests",
			confidence: 1.0,
			createdAt: now,
		});

		return testId;
	}

	/**
	 * Records or updates a file node with SHA-256 content hash to monitor staleness.
	 */
	public recordFileNode(filePath: string, content?: string): string {
		const fileNodeId = `file:${filePath}`;
		const now = Date.now();
		const hash = content !== undefined ? computeHash(content) : undefined;

		this.upsertNode({
			id: fileNodeId,
			kind: "file",
			name: filePath,
			metadata: hash ? { hash, lastHashedAt: now } : undefined,
			createdAt: now,
			updatedAt: now,
		});

		return fileNodeId;
	}

	/**
	 * Checks if a recorded file node has become stale compared to current disk content.
	 */
	public checkStaleness(fileNodeId: string, currentContent: string): FileStalenessCheck {
		const node = this.getNode(fileNodeId);
		const currentHash = computeHash(currentContent);

		if (!node || !node.metadata || typeof node.metadata.hash !== "string") {
			return { isStale: true, currentHash };
		}

		const recordedHash = node.metadata.hash as string;
		return {
			isStale: recordedHash !== currentHash,
			recordedHash,
			currentHash,
		};
	}

	/**
	 * Marks a node as invalidated with an explanation.
	 */
	public invalidateNode(nodeId: string, reason: string): boolean {
		const node = this.getNode(nodeId);
		if (!node) return false;

		const now = Date.now();
		const updatedMetadata = {
			...(node.metadata ?? {}),
			invalidated: true,
			invalidationReason: reason,
			invalidatedAt: now,
		};

		this.upsertNode({
			...node,
			metadata: updatedMetadata,
			updatedAt: now,
		});

		return true;
	}

	/**
	 * Invalidates all outgoing/incoming edges connected to a file path.
	 */
	public invalidateEdgesForFile(filePath: string, reason: string): number {
		const fileNodeId = `file:${filePath}`;
		const edgesStmt = this.db.prepare(`
			SELECT id FROM teia_edges WHERE source_id = ? OR target_id = ?
		`);
		const edges = edgesStmt.all(fileNodeId, fileNodeId) as Array<{ id: string }>;

		const updateStmt = this.db.prepare(`
			UPDATE teia_edges SET confidence = 0.0 WHERE id = ?
		`);

		for (const edge of edges) {
			updateStmt.run(edge.id);
		}

		const now = Date.now();
		const invalidationNodeId = `invalidation_${now}_${Math.random().toString(36).slice(2, 6)}`;
		this.upsertNode({
			id: invalidationNodeId,
			kind: "evidence",
			name: `Invalidation: ${filePath}`,
			content: reason,
			createdAt: now,
			updatedAt: now,
		});

		this.createEdge({
			id: `edge_${invalidationNodeId}_${fileNodeId}`,
			sourceId: invalidationNodeId,
			targetId: fileNodeId,
			relation: "invalidates",
			confidence: 1.0,
			createdAt: now,
		});

		return edges.length;
	}

	/**
	 * Searches knowledge using SQLite FTS5 index. Falls back to lexical LIKE if FTS is unavailable.
	 */
	public searchFts(query: string, limit: number = 25): TeiaNode[] {
		const trimmed = query.trim();
		if (!trimmed) return [];

		if (this.hasFts) {
			try {
				// Escape single quotes for FTS match
				const cleanQuery = trimmed.replace(/'/g, "''").replace(/[^a-zA-Z0-9_* ]/g, " ");
				const stmt = this.db.prepare(`
					SELECT n.*
					FROM teia_nodes n
					JOIN teia_fts f ON n.id = f.id
					WHERE teia_fts MATCH ?
					ORDER BY rank
					LIMIT ?
				`);
				const rows = stmt.all(cleanQuery, limit) as Record<string, unknown>[];
				if (rows.length > 0) {
					return rows.map((r) => this.mapNodeRow(r));
				}
			} catch {
				// Fall through to LIKE search
			}
		}

		return this.searchKnowledge(trimmed).slice(0, limit);
	}

	public searchKnowledge(query: string, kind?: TeiaNodeKind): TeiaNode[] {
		const searchPattern = `%${query}%`;
		const sql = kind
			? `SELECT * FROM teia_nodes WHERE kind = ? AND (name LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 25`
			: `SELECT * FROM teia_nodes WHERE (name LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 25`;

		const stmt = this.db.prepare(sql);
		const rows = (kind ? stmt.all(kind, searchPattern, searchPattern) : stmt.all(searchPattern, searchPattern)) as Record<string, unknown>[];

		return rows.map((r) => this.mapNodeRow(r));
	}

	public getConnectedGraph(nodeId: string): TeiaConnectedGraph | null {
		const node = this.getNode(nodeId);
		if (!node) return null;

		const outStmt = this.db.prepare(`
			SELECT e.relation, e.confidence, n.*
			FROM teia_edges e
			JOIN teia_nodes n ON e.target_id = n.id
			WHERE e.source_id = ?
		`);
		const outRows = outStmt.all(nodeId) as Record<string, unknown>[];

		const inStmt = this.db.prepare(`
			SELECT e.relation, e.confidence, n.*
			FROM teia_edges e
			JOIN teia_nodes n ON e.source_id = n.id
			WHERE e.target_id = ?
		`);
		const inRows = inStmt.all(nodeId) as Record<string, unknown>[];

		return {
			node,
			outgoing: outRows.map((r) => ({
				relation: r.relation as TeiaRelation,
				confidence: Number(r.confidence),
				node: this.mapNodeRow(r),
			})),
			incoming: inRows.map((r) => ({
				relation: r.relation as TeiaRelation,
				confidence: Number(r.confidence),
				node: this.mapNodeRow(r),
			})),
		};
	}

	/**
	 * Traverses the graph in multiple hops starting from a root node up to maxDepth.
	 * Prevents cyclical infinite loops using a visited set.
	 */
	public getMultiHopSubgraph(startNodeId: string, maxDepth: number = 2): MultiHopSubgraph {
		const root = this.getNode(startNodeId);
		if (!root) {
			return { rootNodeId: startNodeId, maxDepth, nodes: [], edges: [] };
		}

		const visitedNodes = new Map<string, TeiaNode>();
		const collectedEdges = new Map<string, TeiaEdge>();
		visitedNodes.set(root.id, root);

		let currentQueue = [root.id];
		let currentDepth = 0;

		const edgeStmt = this.db.prepare(`
			SELECT * FROM teia_edges
			WHERE source_id = ? OR target_id = ?
		`);

		while (currentQueue.length > 0 && currentDepth < maxDepth) {
			const nextQueue: string[] = [];

			for (const nodeId of currentQueue) {
				const edges = edgeStmt.all(nodeId, nodeId) as Array<{
					id: string;
					source_id: string;
					target_id: string;
					relation: string;
					confidence: number;
					created_at: number;
				}>;

				for (const edge of edges) {
					if (!collectedEdges.has(edge.id)) {
						collectedEdges.set(edge.id, {
							id: edge.id,
							sourceId: edge.source_id,
							targetId: edge.target_id,
							relation: edge.relation as TeiaRelation,
							confidence: edge.confidence,
							createdAt: edge.created_at,
						});
					}

					const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
					if (!visitedNodes.has(neighborId)) {
						const neighborNode = this.getNode(neighborId);
						if (neighborNode) {
							visitedNodes.set(neighborId, neighborNode);
							nextQueue.push(neighborId);
						}
					}
				}
			}

			currentQueue = nextQueue;
			currentDepth++;
		}

		return {
			rootNodeId: startNodeId,
			maxDepth,
			nodes: Array.from(visitedNodes.values()),
			edges: Array.from(collectedEdges.values()),
		};
	}

	public exportGraphSnapshot(): { nodes: TeiaNode[]; edges: TeiaEdge[] } {
		const nodeRows = this.db.prepare(`SELECT * FROM teia_nodes ORDER BY updated_at DESC LIMIT 200`).all() as Record<string, unknown>[];
		const edgeRows = this.db.prepare(`SELECT * FROM teia_edges ORDER BY created_at DESC LIMIT 300`).all() as Record<string, unknown>[];

		return {
			nodes: nodeRows.map((r) => this.mapNodeRow(r)),
			edges: edgeRows.map((e) => ({
				id: String(e.id),
				sourceId: String(e.source_id),
				targetId: String(e.target_id),
				relation: e.relation as TeiaRelation,
				confidence: Number(e.confidence),
				createdAt: Number(e.created_at),
			})),
		};
	}

	public close(): void {
		this.db.close();
	}

	private mapNodeRow(row: Record<string, unknown>): TeiaNode {
		return {
			id: String(row.id),
			kind: row.kind as TeiaNodeKind,
			name: String(row.name),
			content: row.content ? String(row.content) : undefined,
			metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : undefined,
			createdAt: Number(row.created_at),
			updatedAt: Number(row.updated_at),
		};
	}
}

let activeTeiaStore: MenteEmTeiaStore | null = null;

export function getMenteEmTeiaStore(customDbPath?: string): MenteEmTeiaStore {
	if (!activeTeiaStore || customDbPath) {
		const defaultPath = customDbPath ?? path.join(process.cwd(), ".omsk", "teia.db");
		activeTeiaStore = new MenteEmTeiaStore(defaultPath);
	}
	return activeTeiaStore;
}
