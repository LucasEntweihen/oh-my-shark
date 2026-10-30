/**
 * Mente em Teia (Web of Mind) - Structured Evidence & Provenance Knowledge Graph for OMSK.
 * Persists project decisions, symbols, files, tests, errors, and fixes into a fast local SQLite database.
 * Provides high-speed relational queries without requiring remote or heavy local neural models.
 */
import { Database } from "bun:sqlite";
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

export class MenteEmTeiaStore {
	private db: Database;

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
		const now = Date.now();
		const testId = `test_${now}_${Math.random().toString(36).slice(2, 7)}`;

		this.upsertNode({
			id: testId,
			kind: "test",
			name: `${testFile} -> ${targetFile}`,
			content: details ?? (passed ? "All assertions passed" : "Test failed"),
			metadata: { passed, timestamp: now },
			createdAt: now,
			updatedAt: now,
		});

		const targetNodeId = `file:${targetFile}`;
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

	public searchKnowledge(query: string, kind?: TeiaNodeKind): TeiaNode[] {
		const searchPattern = `%${query}%`;
		const sql = kind
			? `SELECT * FROM teia_nodes WHERE kind = ? AND (name LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 25`
			: `SELECT * FROM teia_nodes WHERE (name LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 25`;

		const stmt = this.db.prepare(sql);
		const rows = (kind ? stmt.all(kind, searchPattern, searchPattern) : stmt.all(searchPattern, searchPattern)) as Record<string, unknown>[];

		return rows.map((row) => ({
			id: String(row.id),
			kind: row.kind as TeiaNodeKind,
			name: String(row.name),
			content: row.content ? String(row.content) : undefined,
			metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : undefined,
			createdAt: Number(row.created_at),
			updatedAt: Number(row.updated_at),
		}));
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
				node: {
					id: String(r.id),
					kind: r.kind as TeiaNodeKind,
					name: String(r.name),
					content: r.content ? String(r.content) : undefined,
					createdAt: Number(r.created_at),
					updatedAt: Number(r.updated_at),
				},
			})),
			incoming: inRows.map((r) => ({
				relation: r.relation as TeiaRelation,
				confidence: Number(r.confidence),
				node: {
					id: String(r.id),
					kind: r.kind as TeiaNodeKind,
					name: String(r.name),
					content: r.content ? String(r.content) : undefined,
					createdAt: Number(r.created_at),
					updatedAt: Number(r.updated_at),
				},
			})),
		};
	}

	public exportGraphSnapshot(): { nodes: TeiaNode[]; edges: TeiaEdge[] } {
		const nodeRows = this.db.prepare(`SELECT * FROM teia_nodes ORDER BY updated_at DESC LIMIT 200`).all() as Record<string, unknown>[];
		const edgeRows = this.db.prepare(`SELECT * FROM teia_edges ORDER BY created_at DESC LIMIT 300`).all() as Record<string, unknown>[];

		const nodes: TeiaNode[] = nodeRows.map((r) => ({
			id: String(r.id),
			kind: r.kind as TeiaNodeKind,
			name: String(r.name),
			content: r.content ? String(r.content) : undefined,
			metadata: r.metadata_json ? JSON.parse(String(r.metadata_json)) : undefined,
			createdAt: Number(r.created_at),
			updatedAt: Number(r.updated_at),
		}));

		const edges: TeiaEdge[] = edgeRows.map((e) => ({
			id: String(e.id),
			sourceId: String(e.source_id),
			targetId: String(e.target_id),
			relation: e.relation as TeiaRelation,
			confidence: Number(e.confidence),
			createdAt: Number(e.created_at),
		}));

		return { nodes, edges };
	}

	public close(): void {
		this.db.close();
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
