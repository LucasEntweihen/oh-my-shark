import { createStore } from "zustand/vanilla";
import type {
	OrchestratorApprovalPolicy,
	OrchestratorEventFrame,
	OrchestratorPlanInput,
	OrchestratorRollbackWaveResult,
	OrchestratorVerificationGateResult,
	RpcOrchestratorRun,
	RpcOrchestratorRunSummary,
	RpcOrchestratorTaskDraft,
	RpcOrchestratorWorker,
	RpcResponse,
} from "../../shared/rpc-types";
import { describeError } from "../lib/errors";
import {
	activeTabCommand,
	createScopedStoreHook,
	focusedRuntimeTabId,
	type TabCommand,
} from "./session-runtime-context";

const MAX_ORCHESTRATOR_EVENTS = 200;

export interface OrchestratorBridge {
	getState: (runId?: string) => Promise<RpcResponse>;
	plan: (input: OrchestratorPlanInput) => Promise<RpcResponse>;
	start: (runId: string) => Promise<RpcResponse>;
	approvePlan: (runId: string, notes?: string) => Promise<RpcResponse>;
	rejectPlan: (runId: string, reason: string) => Promise<RpcResponse>;
	steerWorker: (runId: string, workerId: string, message: string) => Promise<RpcResponse>;
	pause: (runId: string) => Promise<RpcResponse>;
	resume: (runId: string) => Promise<RpcResponse>;
	abort: (runId: string, reason?: string) => Promise<RpcResponse>;
	verifyWave: (runId: string, waveIndex: number) => Promise<RpcResponse>;
	rollbackWave: (runId: string, waveIndex: number) => Promise<RpcResponse>;
}

export interface OrchestratorStore {
	activeRun: RpcOrchestratorRun | null;
	runs: RpcOrchestratorRunSummary[];
	loading: boolean;
	error: string | null;
	selectedWaveIndex: number;
	selectedWorkerId: string | null;
	events: OrchestratorEventFrame[];

	refresh: (runId?: string) => Promise<void>;
	createPlan: (
		goal: string,
		tasks?: RpcOrchestratorTaskDraft[],
		approvalPolicy?: OrchestratorApprovalPolicy,
		maxConcurrency?: number,
	) => Promise<RpcOrchestratorRun | null>;
	approvePlan: (runId: string, notes?: string) => Promise<RpcOrchestratorRun | null>;
	rejectPlan: (runId: string, reason: string) => Promise<RpcOrchestratorRun | null>;
	startRun: (runId: string) => Promise<RpcOrchestratorRun | null>;
	steerWorker: (runId: string, workerId: string, message: string) => Promise<boolean>;
	pauseRun: (runId: string) => Promise<RpcOrchestratorRun | null>;
	resumeRun: (runId: string) => Promise<RpcOrchestratorRun | null>;
	abortRun: (runId: string, reason?: string) => Promise<RpcOrchestratorRun | null>;
	verifyWave: (runId: string, waveIndex: number) => Promise<OrchestratorVerificationGateResult | null>;
	rollbackWave: (runId: string, waveIndex: number) => Promise<OrchestratorRollbackWaveResult | null>;
	applyEvent: (frame: OrchestratorEventFrame) => void;
	selectWave: (index: number) => void;
	selectWorker: (id: string | null) => void;
	clearError: () => void;
	reset: () => void;
}

function summarizeRun(run: RpcOrchestratorRun): RpcOrchestratorRunSummary {
	return {
		id: run.id,
		goal: run.goal,
		phase: run.phase,
		currentWaveIndex: run.currentWaveIndex,
		totalWaves: run.waves.length,
		workerCount: Object.keys(run.workers).length,
		createdAt: run.createdAt,
		updatedAt: run.updatedAt,
	};
}

function upsertRunSummary(
	runs: readonly RpcOrchestratorRunSummary[],
	run: RpcOrchestratorRun,
): RpcOrchestratorRunSummary[] {
	const summary = summarizeRun(run);
	const existingIndex = runs.findIndex(item => item.id === run.id);
	const next =
		existingIndex === -1 ? [summary, ...runs] : runs.map((item, idx) => (idx === existingIndex ? summary : item));
	return [...next].sort((a, b) => b.updatedAt - a.updatedAt);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractRun(data: unknown): RpcOrchestratorRun | null {
	if (!isRecord(data)) return null;
	if (isRecord(data.run) && typeof data.run.id === "string") {
		return data.run as unknown as RpcOrchestratorRun;
	}
	return null;
}

function resolveOrchestratorBridge(command?: TabCommand, tabId?: string): OrchestratorBridge {
	const hasPreload = typeof window !== "undefined" && window.omp?.orchestrator != null;
	const isFocusedOrUnbound = !command || command === activeTabCommand || !tabId || tabId === focusedRuntimeTabId();
	if (hasPreload && isFocusedOrUnbound) {
		return window.omp.orchestrator;
	}
	const exec = command ?? activeTabCommand;
	return {
		getState: runId => exec({ type: "orchestrator_get_state", runId }),
		plan: input => exec({ type: "orchestrator_plan", ...input }, 120_000),
		start: runId => exec({ type: "orchestrator_start", runId }, 120_000),
		approvePlan: (runId, notes) => exec({ type: "orchestrator_approve_plan", runId, notes }),
		rejectPlan: (runId, reason) => exec({ type: "orchestrator_reject_plan", runId, reason }),
		steerWorker: (runId, workerId, message) => exec({ type: "orchestrator_steer_worker", runId, workerId, message }),
		pause: runId => exec({ type: "orchestrator_pause", runId }),
		resume: runId => exec({ type: "orchestrator_resume", runId }),
		abort: (runId, reason) => exec({ type: "orchestrator_abort", runId, reason }),
		verifyWave: (runId, waveIndex) => exec({ type: "orchestrator_verify_wave", runId, waveIndex }, 120_000),
		rollbackWave: (runId, waveIndex) => exec({ type: "orchestrator_rollback_wave", runId, waveIndex }, 60_000),
	};
}

const INITIAL_STATE = {
	activeRun: null as RpcOrchestratorRun | null,
	runs: [] as RpcOrchestratorRunSummary[],
	loading: false,
	error: null as string | null,
	selectedWaveIndex: 0,
	selectedWorkerId: null as string | null,
	events: [] as OrchestratorEventFrame[],
};

export function createOrchestratorStore(command?: TabCommand, tabId?: string) {
	let refreshSeq = 0;
	const bridge = () => resolveOrchestratorBridge(command, tabId);

	return createStore<OrchestratorStore>()((set, _get) => {
		const runMutation = async (
			invoke: (client: OrchestratorBridge) => Promise<RpcResponse>,
		): Promise<RpcOrchestratorRun | null> => {
			set({ loading: true, error: null });
			try {
				const response = await invoke(bridge());
				if (!response.success) {
					set({ loading: false, error: describeError(response.error) });
					return null;
				}
				const run = extractRun(response.data);
				if (!run) {
					set({ loading: false });
					return null;
				}
				set(state => ({
					activeRun: run,
					runs: upsertRunSummary(state.runs, run),
					selectedWaveIndex:
						run.waves.length === 0 ? 0 : Math.min(state.selectedWaveIndex, Math.max(0, run.waves.length - 1)),
					loading: false,
					error: null,
				}));
				return run;
			} catch (cause) {
				set({ loading: false, error: describeError(cause) });
				return null;
			}
		};

		return {
			...INITIAL_STATE,

			refresh: async runId => {
				const seq = ++refreshSeq;
				set({ loading: true, error: null });
				try {
					const response = await bridge().getState(runId);
					if (seq !== refreshSeq) return;
					if (!response.success) {
						set({ loading: false, error: describeError(response.error) });
						return;
					}
					const payload = isRecord(response.data) ? response.data : {};
					const activeRun = isRecord(payload.activeRun)
						? (payload.activeRun as unknown as RpcOrchestratorRun)
						: null;
					const runs = Array.isArray(payload.runs) ? (payload.runs as RpcOrchestratorRunSummary[]) : [];
					set(state => ({
						activeRun,
						runs,
						selectedWaveIndex: activeRun
							? activeRun.id !== state.activeRun?.id
								? activeRun.currentWaveIndex
								: Math.min(state.selectedWaveIndex, Math.max(0, activeRun.waves.length - 1))
							: 0,
						selectedWorkerId:
							activeRun && state.selectedWorkerId && state.selectedWorkerId in activeRun.workers
								? state.selectedWorkerId
								: null,
						loading: false,
						error: null,
					}));
				} catch (cause) {
					if (seq === refreshSeq) {
						set({ loading: false, error: describeError(cause) });
					}
				}
			},

			createPlan: async (goal, tasks, approvalPolicy, maxConcurrency) => {
				const trimmed = goal.trim();
				if (!trimmed) {
					set({ error: "Orchestrator goal cannot be empty." });
					return null;
				}
				set({ loading: true, error: null });
				try {
					const response = await bridge().plan({
						goal: trimmed,
						...(tasks && tasks.length > 0 ? { tasks } : {}),
						...(approvalPolicy ? { approvalPolicy } : {}),
						...(maxConcurrency !== undefined ? { maxConcurrency } : {}),
					});
					if (!response.success) {
						set({ loading: false, error: describeError(response.error) });
						return null;
					}
					const run = extractRun(response.data);
					if (!run) {
						set({ loading: false, error: "Malformed orchestrator_plan response." });
						return null;
					}
					set(state => ({
						activeRun: run,
						runs: upsertRunSummary(state.runs, run),
						selectedWaveIndex: run.currentWaveIndex,
						selectedWorkerId: null,
						loading: false,
						error: null,
					}));
					return run;
				} catch (cause) {
					set({ loading: false, error: describeError(cause) });
					return null;
				}
			},

			approvePlan: (runId, notes) => runMutation(client => client.approvePlan(runId, notes)),

			rejectPlan: (runId, reason) => runMutation(client => client.rejectPlan(runId, reason)),

			startRun: runId => runMutation(client => client.start(runId)),

			steerWorker: async (runId, workerId, message) => {
				const trimmed = message.trim();
				if (!trimmed) return false;
				set({ error: null });
				try {
					const response = await bridge().steerWorker(runId, workerId, trimmed);
					if (!response.success) {
						set({ error: describeError(response.error) });
						return false;
					}
					const payload = isRecord(response.data) ? response.data : {};
					const ok = payload.ok === true;
					const worker = isRecord(payload.worker)
						? (payload.worker as unknown as RpcOrchestratorWorker)
						: undefined;
					if (worker) {
						set(state => {
							if (!state.activeRun || state.activeRun.id !== runId) return state;
							return {
								activeRun: {
									...state.activeRun,
									updatedAt: Date.now(),
									workers: {
										...state.activeRun.workers,
										[worker.id]: worker,
									},
								},
							};
						});
					}
					return ok;
				} catch (cause) {
					set({ error: describeError(cause) });
					return false;
				}
			},

			pauseRun: runId => runMutation(client => client.pause(runId)),

			resumeRun: runId => runMutation(client => client.resume(runId)),

			abortRun: (runId, reason) => runMutation(client => client.abort(runId, reason)),

			verifyWave: async (runId, waveIndex) => {
				set({ loading: true, error: null });
				try {
					const response = await bridge().verifyWave(runId, waveIndex);
					if (!response.success) {
						set({ loading: false, error: describeError(response.error) });
						return null;
					}
					const payload = isRecord(response.data) ? response.data : {};
					const run = extractRun(payload);
					const report = isRecord(payload.report)
						? (payload.report as unknown as OrchestratorVerificationGateResult)
						: null;
					set(state => ({
						...(run
							? {
								activeRun: run,
								runs: upsertRunSummary(state.runs, run),
							}
							: {}),
						selectedWaveIndex: waveIndex,
						loading: false,
						error: null,
					}));
					return report;
				} catch (cause) {
					set({ loading: false, error: describeError(cause) });
					return null;
				}
			},

			rollbackWave: async (runId, waveIndex) => {
				set({ loading: true, error: null });
				try {
					const response = await bridge().rollbackWave(runId, waveIndex);
					if (!response.success) {
						set({ loading: false, error: describeError(response.error) });
						return null;
					}
					const payload = isRecord(response.data) ? response.data : {};
					const run = extractRun(payload);
					const rolledBackFiles = Array.isArray(payload.rolledBackFiles)
						? payload.rolledBackFiles.filter((file): file is string => typeof file === "string")
						: [];
					if (!run) {
						set({ loading: false });
						return null;
					}
					set(state => ({
						activeRun: run,
						runs: upsertRunSummary(state.runs, run),
						selectedWaveIndex: waveIndex,
						loading: false,
						error: null,
					}));
					return { rolledBackFiles, run };
				} catch (cause) {
					set({ loading: false, error: describeError(cause) });
					return null;
				}
			},

			applyEvent: frame => {
				set(state => {
					const nextEvents = [...state.events, frame].slice(-MAX_ORCHESTRATOR_EVENTS);
					const frameRun = frame.run ?? null;
					if (frameRun) {
						const isTargetActive = !state.activeRun || state.activeRun.id === frameRun.id;
						return {
							events: nextEvents,
							runs: upsertRunSummary(state.runs, frameRun),
							...(isTargetActive
								? {
									activeRun: frameRun,
									selectedWaveIndex:
										state.activeRun?.id !== frameRun.id
											? frameRun.currentWaveIndex
											: Math.min(state.selectedWaveIndex, Math.max(0, frameRun.waves.length - 1)),
								}
								: {}),
						};
					}
					if (state.activeRun && state.activeRun.id === frame.runId) {
						return {
							events: nextEvents,
							activeRun: {
								...state.activeRun,
								phase: frame.phase,
								updatedAt: frame.timestamp,
							},
						};
					}
					return { events: nextEvents };
				});
			},

			selectWave: index => set({ selectedWaveIndex: Math.max(0, index) }),

			selectWorker: id => set({ selectedWorkerId: id }),

			clearError: () => set({ error: null }),

			reset: () => {
				refreshSeq++;
				set(INITIAL_STATE);
			},
		};
	});
}

const defaultOrchestratorStore = createOrchestratorStore();
export const useOrchestratorStore = createScopedStoreHook("orchestrator", defaultOrchestratorStore);
