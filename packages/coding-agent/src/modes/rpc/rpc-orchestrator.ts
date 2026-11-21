import { getGlobalOrchestrator, type SharkOrchestratorEngine } from "../../orchestrator";
import type { OrchestratorRun } from "../../orchestrator/types";
import { getDeepSeaCockpit } from "../../tui/deep-sea-command";
import type {
	RpcCommand,
	RpcOrchestratorEventFrame,
	RpcOrchestratorRun,
	RpcOrchestratorRunSummary,
	RpcOrchestratorWorker,
	RpcVerificationGateResult,
} from "./rpc-types";

function syncCockpit(run: OrchestratorRun | null): void {
	try {
		getDeepSeaCockpit().syncFromOrchestrator(run);
	} catch {
		// Non-fatal cockpit sync
	}
}

export function subscribeRpcOrchestratorEvents(
	output: (frame: RpcOrchestratorEventFrame) => void,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): () => void {
	return engine.subscribe(event => {
		syncCockpit(event.run ?? null);
		output({
			type: "orchestrator_event",
			runId: event.runId,
			eventType: event.eventType,
			phase: event.phase,
			timestamp: event.timestamp,
			payload: event.payload,
			...(event.run ? { run: event.run } : {}),
		});
	});
}

export function handleRpcOrchestratorGetState(
	command: Extract<RpcCommand, { type: "orchestrator_get_state" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { activeRun: RpcOrchestratorRun | null; runs: RpcOrchestratorRunSummary[] } {
	const activeRun = engine.getRun(command.runId);
	const runs = engine.listRuns();
	return { activeRun, runs };
}

export function handleRpcOrchestratorPlan(
	command: Extract<RpcCommand, { type: "orchestrator_plan" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { run: RpcOrchestratorRun } {
	const run = engine.createPlan({
		goal: command.goal,
		tasks: command.tasks,
		approvalPolicy: command.approvalPolicy,
		maxConcurrency: command.maxConcurrency,
	});
	syncCockpit(run);
	return { run };
}

export async function handleRpcOrchestratorStart(
	command: Extract<RpcCommand, { type: "orchestrator_start" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): Promise<{ run: RpcOrchestratorRun }> {
	const run = await engine.startRun(command.runId);
	syncCockpit(run);
	return { run };
}

export function handleRpcOrchestratorApprovePlan(
	command: Extract<RpcCommand, { type: "orchestrator_approve_plan" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { run: RpcOrchestratorRun } {
	const run = engine.approvePlan(command.runId, command.notes);
	syncCockpit(run);
	return { run };
}

export function handleRpcOrchestratorRejectPlan(
	command: Extract<RpcCommand, { type: "orchestrator_reject_plan" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { run: RpcOrchestratorRun } {
	const run = engine.rejectPlan(command.runId, command.reason);
	syncCockpit(run);
	return { run };
}

export function handleRpcOrchestratorSteerWorker(
	command: Extract<RpcCommand, { type: "orchestrator_steer_worker" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { ok: boolean; worker?: RpcOrchestratorWorker } {
	const result = engine.steerWorker(command.runId, command.workerId, command.message);
	if (result.run) syncCockpit(result.run);
	return result.worker ? { ok: result.ok, worker: result.worker } : { ok: result.ok };
}

export function handleRpcOrchestratorPause(
	command: Extract<RpcCommand, { type: "orchestrator_pause" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { run: RpcOrchestratorRun } {
	const run = engine.pauseRun(command.runId);
	syncCockpit(run);
	return { run };
}

export async function handleRpcOrchestratorResume(
	command: Extract<RpcCommand, { type: "orchestrator_resume" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): Promise<{ run: RpcOrchestratorRun }> {
	const run = await engine.resumeRun(command.runId);
	syncCockpit(run);
	return { run };
}

export function handleRpcOrchestratorAbort(
	command: Extract<RpcCommand, { type: "orchestrator_abort" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): { run: RpcOrchestratorRun } {
	const run = engine.abortRun(command.runId, command.reason);
	syncCockpit(run);
	return { run };
}

export async function handleRpcOrchestratorVerifyWave(
	command: Extract<RpcCommand, { type: "orchestrator_verify_wave" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): Promise<{ passed: boolean; report: RpcVerificationGateResult; run: RpcOrchestratorRun }> {
	const result = await engine.verifyWave(command.runId, command.waveIndex);
	syncCockpit(result.run);
	return result;
}

export async function handleRpcOrchestratorRollbackWave(
	command: Extract<RpcCommand, { type: "orchestrator_rollback_wave" }>,
	engine: SharkOrchestratorEngine = getGlobalOrchestrator(),
): Promise<{ rolledBackFiles: string[]; run: RpcOrchestratorRun }> {
	const result = await engine.rollbackWave(command.runId, command.waveIndex);
	syncCockpit(result.run);
	return { rolledBackFiles: result.rolledBackFiles, run: result.run };
}
