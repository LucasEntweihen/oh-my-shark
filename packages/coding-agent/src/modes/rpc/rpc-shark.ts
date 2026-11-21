import type { SharkEvent } from "@ohms/kernel";
import { PRODUCT_VERSION } from "@oh-my-pi/pi-utils";
import { lookup as lookupSetting } from "../../config/registry";
import { getTransactionalEditEngine, writeAtomic } from "../../edit/transactional-engine";
import { getMenteEmTeiaStore, type TeiaNodeKind } from "../../memories/mente-em-teia-sqlite";
import type { AgentSession } from "../../session/agent-session";
import {
	globalSharkAnalyzer,
	globalSharkBus,
	globalSharkCapabilities,
	globalSharkCheckpoints,
	globalSharkFSM,
	globalSharkGraph,
	globalSharkIndexer,
	globalSharkLayout,
	globalSharkPanelExtensions,
	globalSharkPermissions,
	globalSharkSession,
	globalSharkThemes,
} from "../../slash-commands/builtin-shark";
import {
	type CockpitConfig,
	type CockpitDensityMode,
	type CockpitSidebarMode,
	getDeepSeaCockpit,
} from "../../tui/deep-sea-command";
import type {
	RpcSharkCapabilityInfo,
	RpcSharkChangesSummary,
	RpcSharkCheckpointInfo,
	RpcSharkEventFrame,
	RpcSharkEventRecord,
	RpcSharkImpactResult,
	RpcSharkStatusSnapshot,
	RpcTeiaEdgeInfo,
	RpcTeiaNodeInfo,
} from "./rpc-types";

function projectSharkEvent(event: SharkEvent): RpcSharkEventRecord {
	const details: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(event)) {
		if (key !== "type" && key !== "timestamp") {
			details[key] = value;
		}
	}
	return {
		type: event.type,
		timestamp: event.timestamp,
		details,
	};
}

export function subscribeRpcSharkEvents(output: (frame: RpcSharkEventFrame) => void): () => void {
	return globalSharkBus.subscribe("*", event => {
		output({
			type: "shark_event",
			event: projectSharkEvent(event),
		});
	});
}

export async function buildRpcSharkStatus(session: AgentSession): Promise<RpcSharkStatusSnapshot> {
	const cwd = session.sessionManager.getCwd();
	const cockpit = getDeepSeaCockpit();
	const txEngine = getTransactionalEditEngine(cwd);
	await cockpit.syncFromEditEngine(txEngine).catch(() => {});
	const changes = cockpit.getChanges();
	const checks = cockpit.getChecksSummary();

	return {
		version: PRODUCT_VERSION,
		kernel: {
			eventCount: globalSharkBus.getHistory().length,
			permissions: globalSharkPermissions.listGranted(),
			sessionState: globalSharkSession.getActiveSession()?.state ?? "ready",
		},
		intelligence: {
			graphNodes: globalSharkGraph.getAllNodes().length,
			cachedFiles: globalSharkIndexer.getCachedFilesCount(),
		},
		capabilities: {
			count: globalSharkCapabilities.getCount(),
		},
		execution: {
			fsmState: globalSharkFSM.getState(),
			checkpointsCount: txEngine.listCheckpoints().length + globalSharkCheckpoints.getCheckpointCount(),
		},
		layout: {
			preset: globalSharkLayout.getPreset(),
			theme: globalSharkThemes.getTheme(),
			panelCount: globalSharkPanelExtensions.getAll().length,
		},
		cockpit: {
			config: { ...cockpit.getConfig() },
			mission: cockpit.getMission(),
			changes,
			passedChecks: checks.passed,
			totalChecks: checks.total,
		},
	};
}

export function buildRpcSharkEvents(limit?: number): { events: RpcSharkEventRecord[] } {
	const safeLimit = Math.max(1, Math.min(500, limit ?? 50));
	const history = globalSharkBus.getHistory();
	const recent = history.slice(-safeLimit).map(projectSharkEvent);
	return { events: recent };
}

export function runRpcSharkImpactAnalysis(target: string): RpcSharkImpactResult {
	const trimmed = target.trim();
	if (!trimmed) {
		throw new Error("Impact analysis target cannot be empty.");
	}
	const result = globalSharkAnalyzer.analyze(trimmed);
	return {
		targetId: result.targetId,
		affectedFiles: result.affectedFiles,
		dependentCallers: result.dependentCallers,
		associatedTests: result.associatedTests,
		contractRisk: result.contractRisk,
		explanation: result.explanation,
	};
}

export function buildRpcSharkCapabilities(query?: string): { capabilities: RpcSharkCapabilityInfo[] } {
	const q = query?.trim();
	const caps = q ? globalSharkCapabilities.search(q) : globalSharkCapabilities.getActiveCapabilities();
	return {
		capabilities: caps.map(cap => ({
			id: cap.id,
			name: cap.name,
			description: cap.description,
			originType: cap.origin.type,
			originSource: cap.origin.source,
			permissions: [...cap.permissions],
			dependencies: [...cap.dependencies],
			riskLevel: cap.trust.riskLevel,
			verified: cap.trust.verified,
			enabled: cap.enabled !== false,
		})),
	};
}

export async function buildRpcSharkCheckpoints(
	session: AgentSession,
): Promise<{ checkpoints: RpcSharkCheckpointInfo[]; changes: RpcSharkChangesSummary }> {
	const txEngine = getTransactionalEditEngine(session.sessionManager.getCwd());
	const checkpoints = txEngine.listCheckpoints().map(ckpt => ({
		id: ckpt.id,
		timestamp: ckpt.timestamp,
		label: ckpt.label,
		fileCount: ckpt.fileCount,
		status: ckpt.status,
		files: [...(ckpt.files ?? [])],
	}));
	const changes = await txEngine.getChangesSummary();
	return { checkpoints, changes };
}

export async function applyRpcSharkRollbackCheckpoint(
	session: AgentSession,
	checkpointId: string,
	force?: boolean,
): Promise<{ rolledBackFiles: string[]; conflicts: string[] }> {
	const id = checkpointId.trim();
	if (!id) throw new Error("checkpointId cannot be empty.");

	const txEngine = getTransactionalEditEngine(session.sessionManager.getCwd());
	const existing = txEngine.listCheckpoints().find(c => c.id === id);
	if (existing) {
		return txEngine.rollback(id, { force });
	}

	const memCheckpoint = globalSharkCheckpoints.getCheckpoint(id);
	if (memCheckpoint) {
		const restored = globalSharkCheckpoints.rollbackCheckpoint(id);
		const rolledBackFiles: string[] = [];
		for (const [filePath, content] of Object.entries(restored)) {
			const absPath = txEngine.assertWithinWorkspace(filePath);
			await writeAtomic(absPath, content);
			rolledBackFiles.push(absPath);
		}
		return { rolledBackFiles, conflicts: [] };
	}

	throw new Error(`Checkpoint "${id}" not found.`);
}

export function searchRpcSharkTeia(
	query?: string,
	kind?: string,
	limit?: number,
): { nodes: RpcTeiaNodeInfo[]; edges: RpcTeiaEdgeInfo[] } {
	const store = getMenteEmTeiaStore();
	const safeLimit = Math.max(1, Math.min(200, limit ?? 50));
	const trimmedQuery = query?.trim() ?? "";
	const trimmedKind = kind?.trim() as TeiaNodeKind | undefined;
	const snapshot = store.exportGraphSnapshot();

	let matchedNodes = trimmedQuery
		? trimmedKind
			? store.searchKnowledge(trimmedQuery, trimmedKind)
			: store.searchFts(trimmedQuery, safeLimit)
		: snapshot.nodes;

	if (trimmedKind && trimmedQuery) {
		matchedNodes = matchedNodes.filter(n => n.kind === trimmedKind);
	} else if (trimmedKind && !trimmedQuery) {
		matchedNodes = matchedNodes.filter(n => n.kind === trimmedKind);
	}

	const limitedNodes = matchedNodes.slice(0, safeLimit);
	const nodeIds = new Set(limitedNodes.map(n => n.id));
	const edges = snapshot.edges
		.filter(e => (!trimmedQuery && !trimmedKind) || nodeIds.has(e.sourceId) || nodeIds.has(e.targetId))
		.slice(0, safeLimit * 2);

	return {
		nodes: limitedNodes.map(n => ({
			id: n.id,
			kind: n.kind,
			name: n.name,
			...(n.content !== undefined ? { content: n.content } : {}),
			...(n.metadata !== undefined ? { metadata: n.metadata } : {}),
			createdAt: n.createdAt,
			updatedAt: n.updatedAt,
		})),
		edges: edges.map(e => ({
			id: e.id,
			sourceId: e.sourceId,
			targetId: e.targetId,
			relation: e.relation,
			confidence: e.confidence,
			createdAt: e.createdAt,
		})),
	};
}

export function recordRpcSharkTeiaDecision(
	title: string,
	rationale: string,
	files?: string[],
	symbols?: string[],
): { id: string } {
	const cleanTitle = title.trim();
	const cleanRationale = rationale.trim();
	if (!cleanTitle) throw new Error("Decision title cannot be empty.");
	if (!cleanRationale) throw new Error("Decision rationale cannot be empty.");

	const store = getMenteEmTeiaStore();
	const id = store.recordDecision(cleanTitle, cleanRationale, files ?? [], symbols ?? []);
	getDeepSeaCockpit().syncFromMenteEmTeia(store);
	return { id };
}

const VALID_DENSITIES = new Set<CockpitDensityMode>(["auto", "compact", "standard", "advanced"]);
const VALID_SIDEBARS = new Set<CockpitSidebarMode>(["auto", "visible", "collapsed", "hidden"]);

export async function applyRpcSharkCockpitConfig(
	session: AgentSession,
	patch: Record<string, unknown>,
): Promise<{ config: Record<string, unknown> }> {
	const cockpit = getDeepSeaCockpit();
	const update: Partial<CockpitConfig> = {};

	if (typeof patch.density === "string" && VALID_DENSITIES.has(patch.density as CockpitDensityMode)) {
		update.density = patch.density as CockpitDensityMode;
	}
	if (typeof patch.sidebar === "string" && VALID_SIDEBARS.has(patch.sidebar as CockpitSidebarMode)) {
		update.sidebar = patch.sidebar as CockpitSidebarMode;
	}
	if (typeof patch.eventStreamLines === "number" && Number.isFinite(patch.eventStreamLines)) {
		update.eventStreamLines = Math.max(0, Math.min(16, Math.trunc(patch.eventStreamLines)));
	}
	if (typeof patch.showTips === "boolean") update.showTips = patch.showTips;
	if (typeof patch.showMemoryGraph === "boolean") update.showMemoryGraph = patch.showMemoryGraph;
	if (typeof patch.showRecentFiles === "boolean") update.showRecentFiles = patch.showRecentFiles;
	if (typeof patch.showProgress === "boolean") update.showProgress = patch.showProgress;
	if (typeof patch.showShortcuts === "boolean") update.showShortcuts = patch.showShortcuts;
	if (typeof patch.autoHeight === "boolean") update.autoHeight = patch.autoHeight;

	cockpit.setConfig(update);

	for (const [key, value] of Object.entries(update)) {
		const setting = lookupSetting(`cockpit.${key}`);
		if (!setting) continue;
		try {
			setting.assertWritable(value);
			setting.set(session.settings, value as never);
		} catch {
			// Skip invalid setting persistence while keeping live cockpit updated
		}
	}
	await session.settings.flush().catch(() => {});

	return { config: { ...cockpit.getConfig() } };
}
