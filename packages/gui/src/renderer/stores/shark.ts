import { createStore } from "zustand/vanilla";
import type {
	RpcResponse,
	RpcSharkCapabilityInfo,
	RpcSharkChangesSummary,
	RpcSharkCheckpointInfo,
	RpcSharkEventRecord,
	RpcSharkImpactResult,
	RpcSharkStatusSnapshot,
	RpcTeiaEdgeInfo,
	RpcTeiaNodeInfo,
	SharkCockpitConfig,
	SharkEventFrame,
	SharkTeiaRecordDecisionInput,
} from "../../shared/rpc-types";
import { describeError } from "../lib/errors";
import {
	activeTabCommand,
	createScopedStoreHook,
	focusedRuntimeTabId,
	type TabCommand,
} from "./session-runtime-context";

const MAX_SHARK_EVENTS = 250;

export interface SharkBridge {
	getStatus: () => Promise<RpcResponse>;
	getEvents: (limit?: number) => Promise<RpcResponse>;
	impactAnalysis: (target: string) => Promise<RpcResponse>;
	getCapabilities: (query?: string) => Promise<RpcResponse>;
	getCheckpoints: () => Promise<RpcResponse>;
	rollbackCheckpoint: (checkpointId: string, force?: boolean) => Promise<RpcResponse>;
	teiaSearch: (query?: string, options?: { kind?: string; limit?: number }) => Promise<RpcResponse>;
	teiaRecordDecision: (input: SharkTeiaRecordDecisionInput) => Promise<RpcResponse>;
	setCockpitConfig: (patch: SharkCockpitConfig) => Promise<RpcResponse>;
}

export interface SharkRollbackResult {
	rolledBackFiles: string[];
	conflicts: string[];
}

export interface SharkStore {
	status: RpcSharkStatusSnapshot | null;
	events: RpcSharkEventRecord[];
	impactResult: RpcSharkImpactResult | null;
	capabilities: RpcSharkCapabilityInfo[];
	checkpoints: RpcSharkCheckpointInfo[];
	changesSummary: RpcSharkChangesSummary | null;
	teiaNodes: RpcTeiaNodeInfo[];
	teiaEdges: RpcTeiaEdgeInfo[];
	cockpitConfig: Record<string, unknown>;
	activeModes: string[];
	xlr8Basic: boolean;
	loading: boolean;
	error: string | null;

	refreshAll: () => Promise<void>;
	refreshStatus: () => Promise<void>;
	refreshEvents: (limit?: number) => Promise<void>;
	runImpactAnalysis: (target: string) => Promise<RpcSharkImpactResult | null>;
	searchCapabilities: (query?: string) => Promise<void>;
	refreshCheckpoints: () => Promise<void>;
	rollbackCheckpoint: (checkpointId: string, force?: boolean) => Promise<SharkRollbackResult | null>;
	searchTeia: (query?: string, kind?: string, limit?: number) => Promise<void>;
	recordTeiaDecision: (
		title: string,
		rationale: string,
		files?: string[],
		symbols?: string[],
	) => Promise<string | null>;
	updateCockpitConfig: (patch: Record<string, unknown>) => Promise<void>;
	toggleMode: (modeId: string) => void;
	toggleXlr8Basic: () => void;
	applySharkEvent: (frame: SharkEventFrame) => void;
	clearError: () => void;
	reset: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function resolveSharkBridge(command?: TabCommand, tabId?: string): SharkBridge {
	const hasPreload = typeof window !== "undefined" && window.omp?.shark != null;
	const isFocusedOrUnbound = !command || command === activeTabCommand || !tabId || tabId === focusedRuntimeTabId();
	if (hasPreload && isFocusedOrUnbound) {
		return window.omp.shark;
	}
	const exec = command ?? activeTabCommand;
	return {
		getStatus: () => exec({ type: "shark_get_status" }),
		getEvents: limit => exec({ type: "shark_get_events", limit }),
		impactAnalysis: target => exec({ type: "shark_impact_analysis", target }, 30_000),
		getCapabilities: query => exec({ type: "shark_get_capabilities", query }),
		getCheckpoints: () => exec({ type: "shark_get_checkpoints" }),
		rollbackCheckpoint: (checkpointId, force) =>
			exec({ type: "shark_rollback_checkpoint", checkpointId, force }, 60_000),
		teiaSearch: (query, options) => exec({ type: "shark_teia_search", query, ...options }),
		teiaRecordDecision: input => exec({ type: "shark_teia_record_decision", ...input }),
		setCockpitConfig: patch => exec({ type: "shark_set_cockpit_config", patch }),
	};
}

const INITIAL_STATE = {
	status: null as RpcSharkStatusSnapshot | null,
	events: [] as RpcSharkEventRecord[],
	impactResult: null as RpcSharkImpactResult | null,
	capabilities: [] as RpcSharkCapabilityInfo[],
	checkpoints: [] as RpcSharkCheckpointInfo[],
	changesSummary: null as RpcSharkChangesSummary | null,
	teiaNodes: [] as RpcTeiaNodeInfo[],
	teiaEdges: [] as RpcTeiaEdgeInfo[],
	cockpitConfig: {} as Record<string, unknown>,
	activeModes: [] as string[],
	xlr8Basic: false,
	loading: false,
	error: null as string | null,
};

export function createSharkStore(command?: TabCommand, tabId?: string) {
	const bridge = () => resolveSharkBridge(command, tabId);

	return createStore<SharkStore>()((set, get) => ({
		...INITIAL_STATE,

		refreshAll: async () => {
			set({ loading: true, error: null });
			await Promise.allSettled([
				get().refreshStatus(),
				get().refreshEvents(100),
				get().searchCapabilities(),
				get().refreshCheckpoints(),
				get().searchTeia(),
			]);
			set({ loading: false });
		},

		refreshStatus: async () => {
			try {
				const response = await bridge().getStatus();
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const snapshot = isRecord(response.data) ? (response.data as unknown as RpcSharkStatusSnapshot) : null;
				if (!snapshot) return;
				set({
					status: snapshot,
					cockpitConfig: isRecord(snapshot.cockpit?.config) ? { ...snapshot.cockpit.config } : {},
					changesSummary: snapshot.cockpit?.changes ?? null,
					error: null,
				});
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		refreshEvents: async limit => {
			try {
				const response = await bridge().getEvents(limit);
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const data = isRecord(response.data) ? response.data : {};
				const events = Array.isArray(data.events) ? (data.events as RpcSharkEventRecord[]) : [];
				set({ events: events.slice(-MAX_SHARK_EVENTS) });
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		runImpactAnalysis: async target => {
			const trimmed = target.trim();
			if (!trimmed) {
				set({ error: "Impact analysis target cannot be empty." });
				return null;
			}
			set({ loading: true, error: null });
			try {
				const response = await bridge().impactAnalysis(trimmed);
				if (!response.success) {
					set({ loading: false, error: describeError(response.error) });
					return null;
				}
				const impactResult = isRecord(response.data) ? (response.data as unknown as RpcSharkImpactResult) : null;
				set({ impactResult, loading: false, error: null });
				return impactResult;
			} catch (cause) {
				set({ loading: false, error: describeError(cause) });
				return null;
			}
		},

		searchCapabilities: async query => {
			try {
				const response = await bridge().getCapabilities(query);
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const data = isRecord(response.data) ? response.data : {};
				const capabilities = Array.isArray(data.capabilities)
					? (data.capabilities as RpcSharkCapabilityInfo[])
					: [];
				set({ capabilities, error: null });
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		refreshCheckpoints: async () => {
			try {
				const response = await bridge().getCheckpoints();
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const data = isRecord(response.data) ? response.data : {};
				const checkpoints = Array.isArray(data.checkpoints) ? (data.checkpoints as RpcSharkCheckpointInfo[]) : [];
				const changesSummary = isRecord(data.changes) ? (data.changes as unknown as RpcSharkChangesSummary) : null;
				set(state => ({
					checkpoints,
					changesSummary: changesSummary ?? state.changesSummary,
					error: null,
				}));
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		rollbackCheckpoint: async (checkpointId, force) => {
			set({ loading: true, error: null });
			try {
				const response = await bridge().rollbackCheckpoint(checkpointId, force);
				if (!response.success) {
					set({ loading: false, error: describeError(response.error) });
					return null;
				}
				const data = isRecord(response.data) ? response.data : {};
				const rolledBackFiles = Array.isArray(data.rolledBackFiles)
					? data.rolledBackFiles.filter((file): file is string => typeof file === "string")
					: [];
				const conflicts = Array.isArray(data.conflicts)
					? data.conflicts.filter((file): file is string => typeof file === "string")
					: [];
				await Promise.allSettled([get().refreshCheckpoints(), get().refreshStatus()]);
				set({ loading: false, error: null });
				return { rolledBackFiles, conflicts };
			} catch (cause) {
				set({ loading: false, error: describeError(cause) });
				return null;
			}
		},

		searchTeia: async (query, kind, limit) => {
			try {
				const response = await bridge().teiaSearch(query, {
					...(kind ? { kind } : {}),
					...(limit !== undefined ? { limit } : {}),
				});
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const data = isRecord(response.data) ? response.data : {};
				const teiaNodes = Array.isArray(data.nodes) ? (data.nodes as RpcTeiaNodeInfo[]) : [];
				const teiaEdges = Array.isArray(data.edges) ? (data.edges as RpcTeiaEdgeInfo[]) : [];
				set({ teiaNodes, teiaEdges, error: null });
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		recordTeiaDecision: async (title, rationale, files, symbols) => {
			const cleanTitle = title.trim();
			const cleanRationale = rationale.trim();
			if (!cleanTitle || !cleanRationale) {
				set({ error: "Decision title and rationale are required." });
				return null;
			}
			set({ loading: true, error: null });
			try {
				const response = await bridge().teiaRecordDecision({
					title: cleanTitle,
					rationale: cleanRationale,
					...(files && files.length > 0 ? { files } : {}),
					...(symbols && symbols.length > 0 ? { symbols } : {}),
				});
				if (!response.success) {
					set({ loading: false, error: describeError(response.error) });
					return null;
				}
				const data = isRecord(response.data) ? response.data : {};
				const id = typeof data.id === "string" ? data.id : null;
				await Promise.allSettled([get().searchTeia(), get().refreshStatus()]);
				set({ loading: false, error: null });
				return id;
			} catch (cause) {
				set({ loading: false, error: describeError(cause) });
				return null;
			}
		},

		updateCockpitConfig: async patch => {
			set({ error: null });
			try {
				const response = await bridge().setCockpitConfig(patch);
				if (!response.success) {
					set({ error: describeError(response.error) });
					return;
				}
				const data = isRecord(response.data) ? response.data : {};
				const config = isRecord(data.config) ? { ...data.config } : { ...get().cockpitConfig, ...patch };
				set(state => ({
					cockpitConfig: config,
					status: state.status
						? {
								...state.status,
								cockpit: {
									...state.status.cockpit,
									config,
								},
							}
						: null,
					error: null,
				}));
			} catch (cause) {
				set({ error: describeError(cause) });
			}
		},

		toggleMode: modeId => {
			set(state => {
				const exists = state.activeModes.includes(modeId);
				return {
					activeModes: exists ? state.activeModes.filter(id => id !== modeId) : [...state.activeModes, modeId],
				};
			});
		},

		toggleXlr8Basic: () => {
			set(state => ({ xlr8Basic: !state.xlr8Basic }));
		},

		applySharkEvent: frame => {
			set(state => ({
				events: [...state.events, frame.event].slice(-MAX_SHARK_EVENTS),
				status: state.status
					? {
							...state.status,
							kernel: {
								...state.status.kernel,
								eventCount: state.status.kernel.eventCount + 1,
							},
						}
					: null,
			}));
		},

		clearError: () => set({ error: null }),

		reset: () => set(INITIAL_STATE),
	}));
}

const defaultSharkStore = createSharkStore();
export const useSharkStore = createScopedStoreHook("shark", defaultSharkStore);
