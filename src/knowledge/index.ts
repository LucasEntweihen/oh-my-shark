import * as fs from "node:fs";
import * as path from "node:path";
import {
	type FileStalenessCheck,
	MenteEmTeiaStore,
	type MultiHopSubgraph,
	type TeiaConnectedGraph,
	type TeiaEdge,
	type TeiaNode,
	type TeiaNodeKind,
	type TeiaRelation,
} from "../../packages/coding-agent/src/memories/mente-em-teia-sqlite";
import {
	ensureProjectOmskDir,
	getProjectKnowledgeDbPath,
	getProjectKnowledgeJsonPath,
	getProjectRoot,
} from "../config/paths";

export type {
	FileStalenessCheck,
	MultiHopSubgraph,
	TeiaConnectedGraph,
	TeiaEdge,
	TeiaNode,
	TeiaNodeKind,
	TeiaRelation,
};

export interface KnowledgeSearchOptions {
	kind?: TeiaNodeKind;
	limit?: number;
}

export interface KnowledgeExportSnapshot {
	exportedAt: number;
	projectRoot: string;
	totalNodes: number;
	nodes: TeiaNode[];
	decisions: TeiaNode[];
	facts: TeiaNode[];
	evidences: TeiaNode[];
}

let cachedKnowledge: OmskSharedKnowledge | undefined;

/**
 * High-performance shared knowledge base, information store, and relational semantic graph for OMSK.
 * Stores architectural decisions, facts, evidence, files, symbols, and connections in SQLite with FTS5 lexical search.
 */
export class OmskSharedKnowledge {
	private readonly store: MenteEmTeiaStore;
	private readonly dbPath: string;

	constructor(dbPath: string = getProjectKnowledgeDbPath()) {
		this.dbPath = path.resolve(dbPath);
		const dir = path.dirname(this.dbPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
		}
		this.store = new MenteEmTeiaStore(this.dbPath);
	}

	/**
	 * Accesses the underlying MenteEmTeiaStore instance.
	 */
	get raw(): MenteEmTeiaStore {
		return this.store;
	}

	/**
	 * Records an architectural or design decision with related files and symbols.
	 */
	recordDecision(
		title: string,
		rationale: string,
		files: string[] = [],
		symbols: string[] = [],
		metadata?: Record<string, unknown>,
	): string {
		const decisionId = this.store.recordDecision(title, rationale, files, symbols);
		if (metadata && Object.keys(metadata).length > 0) {
			const existing = this.store.getNode(decisionId);
			if (existing) {
				const mergedMeta = { ...(existing.metadata ?? {}), ...metadata };
				this.store.upsertNode({
					...existing,
					metadata: mergedMeta,
					updatedAt: Date.now(),
				});
			}
		}
		this.exportJsonSync();
		return decisionId;
	}

	/**
	 * Records a verified fact or general knowledge item.
	 */
	recordFact(
		name: string,
		content: string,
		category: string = "general",
		metadata?: Record<string, unknown>,
	): string {
		const now = Date.now();
		const id = `fact_${now}_${Math.random().toString(36).slice(2, 8)}`;
		const meta = { category, ...(metadata ?? {}) };
		this.store.upsertNode({
			id,
			kind: "evidence",
			name,
			content,
			metadata: meta,
			createdAt: now,
			updatedAt: now,
		});
		this.exportJsonSync();
		return id;
	}

	/**
	 * Records evidence or diagnostic observation.
	 */
	recordEvidence(name: string, content: string, metadata?: Record<string, unknown>): string {
		const now = Date.now();
		const id = `evidence_${now}_${Math.random().toString(36).slice(2, 8)}`;
		this.store.upsertNode({
			id,
			kind: "evidence",
			name,
			content,
			metadata,
			createdAt: now,
			updatedAt: now,
		});
		this.exportJsonSync();
		return id;
	}
	/**
	 * Links two knowledge nodes with a semantic relation and confidence score.
	 */
	link(sourceId: string, targetId: string, relation: TeiaRelation, confidence: number = 1.0): string {
		const edgeId = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		this.store.createEdge({
			id: edgeId,
			sourceId,
			targetId,
			relation,
			confidence,
			createdAt: Date.now(),
		});
		this.exportJsonSync();
		return edgeId;
	}

	/**
	 * Retrieves a single node by its identifier.
	 */
	getNode(id: string): TeiaNode | null {
		return this.store.getNode(id) ?? null;
	}

	/**
	 * Retrieves the immediate incoming and outgoing connections for a node.
	 */
	getConnectedGraph(nodeId: string): TeiaConnectedGraph | null {
		return this.store.getConnectedGraph(nodeId) ?? null;
	}

	/**
	 * Traverses the knowledge graph up to maxDepth hops from the root node.
	 */
	getMultiHopSubgraph(rootNodeId: string, maxDepth: number = 2): MultiHopSubgraph {
		return this.store.getMultiHopSubgraph(rootNodeId, maxDepth);
	}

	/**
	 * Searches knowledge nodes using lexical full-text search (FTS5).
	 */
	search(query: string, options: KnowledgeSearchOptions = {}): TeiaNode[] {
		const trimmed = query.trim();
		if (!trimmed) {
			return this.listRecent(options.kind, options.limit);
		}
		if (options.kind) {
			return this.store.searchKnowledge(trimmed, options.kind).slice(0, options.limit ?? 25);
		}
		return this.store.searchFts(trimmed, options.limit ?? 25);
	}

	/**
	 * Lists recent knowledge nodes, optionally filtered by kind.
	 */
	listRecent(kind?: TeiaNodeKind, limit: number = 50): TeiaNode[] {
		const all = this.store.exportGraphSnapshot().nodes;
		const filtered = kind ? all.filter(n => n.kind === kind) : all;
		return filtered.slice(0, limit);
	}

	/**
	 * Synchronously exports the entire knowledge base to the JSON file on the root.
	 */
	exportJsonSync(destPath: string = getProjectKnowledgeJsonPath()): KnowledgeExportSnapshot {
		const allNodes = this.store.exportGraphSnapshot().nodes;
		const decisions = allNodes.filter(n => n.kind === "decision");
		const evidences = allNodes.filter(n => n.kind === "evidence");
		const facts = evidences.filter(n => (n.metadata as { category?: string })?.category !== undefined);

		const snapshot: KnowledgeExportSnapshot = {
			exportedAt: Date.now(),
			projectRoot: getProjectRoot(),
			totalNodes: allNodes.length,
			nodes: allNodes,
			decisions,
			facts,
			evidences,
		};

		try {
			const dir = path.dirname(destPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
			}
			fs.writeFileSync(destPath, JSON.stringify(snapshot, null, 2), "utf8");
		} catch (err) {
			console.error(`[OMSK Knowledge] Failed to export JSON snapshot: ${String(err)}`);
		}

		return snapshot;
	}

	/**
	 * Asynchronously exports the entire knowledge base to the JSON file on the root.
	 */
	async exportJson(destPath: string = getProjectKnowledgeJsonPath()): Promise<KnowledgeExportSnapshot> {
		return this.exportJsonSync(destPath);
	}

	/**
	 * Closes the knowledge store SQLite database.
	 */
	close(): void {
		this.store.close();
		if (cachedKnowledge === this) {
			cachedKnowledge = undefined;
		}
	}
}

/**
 * Returns the singleton shared knowledge base for the project root.
 */
export function getSharedKnowledge(dbPath?: string): OmskSharedKnowledge {
	ensureProjectOmskDir(getProjectRoot());
	if (!cachedKnowledge) {
		cachedKnowledge = new OmskSharedKnowledge(dbPath);
	}
	return cachedKnowledge;
}
