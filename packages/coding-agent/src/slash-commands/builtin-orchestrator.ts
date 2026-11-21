import { getGlobalOrchestrator } from "../orchestrator";
import type { OrchestratorApprovalPolicy, OrchestratorRun, OrchestratorTaskDraft } from "../orchestrator/types";
import { getDeepSeaCockpit } from "../tui/deep-sea-command";
import { renderOrchestratorBoard } from "../tui/orchestrator-board";
import { commandConsumed, errorMessage, parseSubcommand } from "./helpers/parse";
import type {
	ParsedSlashCommand,
	SlashCommandResult,
	SlashCommandRuntime,
	SlashCommandSpec,
	SubcommandDef,
	TuiSlashCommandRuntime,
} from "./types";

export const ORCHESTRATOR_SUBCOMMANDS: SubcommandDef[] = [
	{ name: "plan", description: "Create a DAG wave execution plan from a goal", usage: "<goal> [--auto|--phase-gate]" },
	{ name: "start", description: "Start dispatching waves for an approved orchestrator run", usage: "[runId]" },
	{ name: "status", description: "Render the responsive Shark Orchestrator Mission Board", usage: "[runId]" },
	{ name: "approve", description: "Approve a pending orchestrator plan or phase-gate", usage: "[runId] [notes]" },
	{ name: "reject", description: "Reject and abort a pending orchestrator plan", usage: "[runId] <reason>" },
	{ name: "steer", description: "Send live steering instructions to a worker", usage: "<workerId> <message>" },
	{ name: "pause", description: "Pause the active orchestrator run", usage: "[runId]" },
	{ name: "resume", description: "Resume a paused orchestrator run", usage: "[runId]" },
	{ name: "abort", description: "Abort an orchestrator run and active workers", usage: "[runId] [reason]" },
	{ name: "verify", description: "Run verification & TDD gate on a wave", usage: "[waveIndex] [--run <runId>]" },
	{
		name: "rollback",
		description: "Roll back a wave to its pre-wave atomic checkpoint",
		usage: "[waveIndex] [--force]",
	},
	{ name: "history", description: "List persisted orchestrator runs", usage: "" },
	{ name: "help", description: "Show /orchestrator command reference", usage: "" },
];

export function formatOrchestratorHelp(): string {
	return [
		"🦈 Shark Orchestrator (/orchestrator | /orch | /swarm | /team)",
		"",
		"Subcommands:",
		"  /orchestrator plan <goal> [--auto|--phase-gate]   Build DAG & disjoint wave plan",
		"  /orchestrator approve [runId] [notes]             Approve pending plan/phase-gate",
		"  /orchestrator reject [runId] <reason>             Reject plan with reason",
		"  /orchestrator start [runId]                       Dispatch wave execution",
		"  /orchestrator status [runId]                      Show Mission Board (default)",
		"  /orchestrator steer <workerId> <message>          Steer running worker",
		"  /orchestrator pause [runId]                       Pause active run",
		"  /orchestrator resume [runId]                      Resume paused run",
		"  /orchestrator abort [runId] [reason]              Abort run & workers",
		"  /orchestrator verify [waveIndex] [--run <runId>]  Verify wave & TDD proofs",
		"  /orchestrator rollback [waveIndex] [--force]      Rollback wave checkpoint",
		"  /orchestrator history                             List orchestrator runs",
		"  /orchestrator help                                Show this help",
	].join("\n");
}

function splitFirstToken(text: string): { first: string; rest: string } {
	const trimmed = text.trim();
	if (!trimmed) return { first: "", rest: "" };
	const idx = trimmed.search(/\s/);
	if (idx === -1) return { first: trimmed, rest: "" };
	return { first: trimmed.slice(0, idx), rest: trimmed.slice(idx + 1).trim() };
}

function parsePlanArgs(raw: string): {
	goal: string;
	approvalPolicy: OrchestratorApprovalPolicy;
	maxConcurrency?: number;
	tasks?: OrchestratorTaskDraft[];
} {
	const trimmed = raw.trim();
	if (trimmed.startsWith("{")) {
		const parsed = JSON.parse(trimmed) as {
			goal?: string;
			approvalPolicy?: OrchestratorApprovalPolicy;
			maxConcurrency?: number;
			tasks?: OrchestratorTaskDraft[];
		};
		return {
			goal: parsed.goal ?? "",
			approvalPolicy: parsed.approvalPolicy ?? "approve-before-dispatch",
			maxConcurrency: parsed.maxConcurrency,
			tasks: parsed.tasks,
		};
	}

	let approvalPolicy: OrchestratorApprovalPolicy = "approve-before-dispatch";
	let maxConcurrency: number | undefined;
	let working = trimmed;

	if (/\s--auto\b|^--auto\b/.test(working)) {
		approvalPolicy = "auto";
		working = working.replace(/(?:^|\s)--auto\b/g, " ").trim();
	} else if (/\s--phase-gate\b|^--phase-gate\b/.test(working)) {
		approvalPolicy = "phase-gate";
		working = working.replace(/(?:^|\s)--phase-gate\b/g, " ").trim();
	}

	const concMatch = working.match(/(?:^|\s)--concurrency\s+(\d+)/);
	if (concMatch?.[1]) {
		maxConcurrency = Number.parseInt(concMatch[1], 10);
		working = working.replace(concMatch[0], " ").trim();
	}

	let tasks: OrchestratorTaskDraft[] | undefined;
	const tasksIdx = working.indexOf("--tasks ");
	if (tasksIdx !== -1) {
		const jsonText = working.slice(tasksIdx + "--tasks ".length).trim();
		working = working.slice(0, tasksIdx).trim();
		const parsedTasks = JSON.parse(jsonText);
		if (Array.isArray(parsedTasks)) {
			tasks = parsedTasks as OrchestratorTaskDraft[];
		}
	}

	const unquoted = working.replace(/^["'](.*)["']$/, "$1").trim();
	return { goal: unquoted, approvalPolicy, maxConcurrency, tasks };
}

function resolveRunOrOptionalId(rest: string): { runId: string | undefined; remainder: string } {
	const engine = getGlobalOrchestrator();
	const { first, rest: tail } = splitFirstToken(rest);
	if (first && engine.getRun(first)) {
		return { runId: first, remainder: tail };
	}
	return { runId: engine.getRun()?.id, remainder: rest.trim() };
}

function parseWaveFlags(rest: string): { waveIndex?: number; runId?: string; force: boolean } {
	const engine = getGlobalOrchestrator();
	let working = rest.trim();
	let force = false;
	if (/\b--force\b/.test(working)) {
		force = true;
		working = working.replace(/--force/g, " ").trim();
	}
	let runId: string | undefined;
	const runMatch = working.match(/--run\s+(\S+)/);
	if (runMatch?.[1]) {
		runId = runMatch[1];
		working = working.replace(runMatch[0], " ").trim();
	}
	let waveIndex: number | undefined;
	const tokens = working.split(/\s+/).filter(Boolean);
	for (const tok of tokens) {
		if (/^\d+$/.test(tok) && waveIndex === undefined) {
			waveIndex = Number.parseInt(tok, 10);
		} else if (!runId && engine.getRun(tok)) {
			runId = tok;
		}
	}
	return { waveIndex, runId: runId ?? engine.getRun()?.id, force };
}

function syncCockpit(run: OrchestratorRun | null): void {
	try {
		getDeepSeaCockpit().syncFromOrchestrator(run);
	} catch {
		// Non-blocking cockpit sync
	}
}

export async function runOrchestratorSlashCommand(
	args: string,
	boardWidth = 104,
): Promise<{ output: string; failed?: boolean }> {
	const engine = getGlobalOrchestrator();
	const { verb, rest } = parseSubcommand(args);
	const action = verb || "status";

	try {
		switch (action) {
			case "help":
				return { output: formatOrchestratorHelp() };

			case "history": {
				const runs = engine.listRuns();
				if (runs.length === 0) {
					return { output: "No orchestrator runs persisted yet. Use /orchestrator plan <goal>." };
				}
				const lines = ["🦈 Shark Orchestrator Runs:", ""];
				for (const item of runs) {
					lines.push(
						`  • ${item.id}  [${item.phase}]  wave ${item.currentWaveIndex + 1}/${Math.max(1, item.totalWaves)} (${item.workerCount} workers) — ${item.goal}`,
					);
				}
				return { output: lines.join("\n") };
			}

			case "plan": {
				if (!rest.trim()) {
					return { output: "Usage: /orchestrator plan <goal> [--auto|--phase-gate]", failed: true };
				}
				const parsed = parsePlanArgs(rest);
				if (!parsed.goal) {
					return { output: "Error: plan goal cannot be empty.", failed: true };
				}
				const run = engine.createPlan(parsed);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "status": {
				const targetId = rest.trim() || undefined;
				const run = engine.getRun(targetId);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "approve": {
				const { runId, remainder } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to approve.", failed: true };
				const run = engine.approvePlan(runId, remainder || undefined);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "reject": {
				const { runId, remainder } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to reject.", failed: true };
				if (!remainder) return { output: "Usage: /orchestrator reject [runId] <reason>", failed: true };
				const run = engine.rejectPlan(runId, remainder);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "start": {
				const { runId } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to start.", failed: true };
				const run = await engine.startRun(runId);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "steer": {
				const { runId, remainder } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to steer.", failed: true };
				const { first: workerId, rest: message } = splitFirstToken(remainder);
				if (!workerId || !message) {
					return { output: "Usage: /orchestrator steer [runId] <workerId> <message>", failed: true };
				}
				const res = engine.steerWorker(runId, workerId, message);
				if (!res.ok || !res.run) {
					return { output: `Worker "${workerId}" not found in run "${runId}".`, failed: true };
				}
				syncCockpit(res.run);
				return { output: renderOrchestratorBoard(res.run, boardWidth) };
			}

			case "pause": {
				const { runId } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to pause.", failed: true };
				const run = engine.pauseRun(runId);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "resume": {
				const { runId } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to resume.", failed: true };
				const run = await engine.resumeRun(runId);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "abort": {
				const { runId, remainder } = resolveRunOrOptionalId(rest);
				if (!runId) return { output: "No active orchestrator run to abort.", failed: true };
				const run = engine.abortRun(runId, remainder || undefined);
				syncCockpit(run);
				return { output: renderOrchestratorBoard(run, boardWidth) };
			}

			case "verify": {
				const { waveIndex, runId } = parseWaveFlags(rest);
				if (!runId) return { output: "No active orchestrator run to verify.", failed: true };
				const current = engine.getRun(runId);
				if (!current) return { output: `Orchestrator run "${runId}" not found.`, failed: true };
				const idx = waveIndex ?? current.currentWaveIndex;
				const { passed, report, run } = await engine.verifyWave(runId, idx);
				syncCockpit(run);
				return {
					output: `${renderOrchestratorBoard(run, boardWidth)}\n\n${passed ? "✅" : "❌"} ${report.summary}`,
					failed: !passed,
				};
			}

			case "rollback": {
				const { waveIndex, runId, force } = parseWaveFlags(rest);
				if (!runId) return { output: "No active orchestrator run to roll back.", failed: true };
				const current = engine.getRun(runId);
				if (!current) return { output: `Orchestrator run "${runId}" not found.`, failed: true };
				const idx = waveIndex ?? current.currentWaveIndex;
				const { rolledBackFiles, conflicts, run } = await engine.rollbackWave(runId, idx, { force });
				syncCockpit(run);
				const summary =
					`⏪ Rolled back wave #${idx}: ${rolledBackFiles.length} file(s) restored` +
					(conflicts.length > 0 ? ` (${conflicts.length} conflict(s))` : "");
				return { output: `${renderOrchestratorBoard(run, boardWidth)}\n\n${summary}` };
			}

			default:
				return {
					output: `Unknown /orchestrator subcommand "${action}".\n\n${formatOrchestratorHelp()}`,
					failed: true,
				};
		}
	} catch (err: unknown) {
		return { output: `Orchestrator error: ${errorMessage(err)}`, failed: true };
	}
}

export const ORCHESTRATOR_SLASH_COMMAND: SlashCommandSpec = {
	name: "orchestrator",
	aliases: ["orch", "swarm", "team"],
	description: "Controla o Shark Orchestrator Engine (DAG waves, workers, TDD gate, rollback & Mission Board)",
	icon: "action",
	allowArgs: true,
	subcommands: ORCHESTRATOR_SUBCOMMANDS,
	subcommandOptional: true,
	handle: async (cmd: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
		const res = await runOrchestratorSlashCommand(cmd.args ?? "", 104);
		await runtime.output(res.output);
		return commandConsumed({ failed: res.failed });
	},
	handleTui: async (cmd: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
		const termCols = typeof process !== "undefined" && process.stdout?.columns ? process.stdout.columns : 108;
		const width = Math.max(60, Math.min(160, termCols - 4));
		const res = await runOrchestratorSlashCommand(cmd.args ?? "", width);
		if (!runtime.draftDetached && typeof runtime.ctx.editor?.setText === "function") {
			runtime.ctx.editor.setText("");
		}
		runtime.ctx.showStatus(res.output);
		return commandConsumed({ failed: res.failed });
	},
};

export const BUILTIN_ORCHESTRATOR_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [ORCHESTRATOR_SLASH_COMMAND];
