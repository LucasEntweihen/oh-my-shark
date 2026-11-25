import { truncate as truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui/text/width";
import type {
	OrchestratorPhase,
	OrchestratorRun,
	OrchestratorWave,
	OrchestratorWorker,
	OrchestratorWorkerRole,
	TddCategoryProof,
} from "../orchestrator/types";

const c = {
	bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
	dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
	cyan: (s: string) => `\x1b[38;2;0;221;245m${s}\x1b[39m`,
	blue: (s: string) => `\x1b[38;2;56;189;248m${s}\x1b[39m`,
	border: (s: string) => `\x1b[38;2;24;84;132m${s}\x1b[39m`,
	green: (s: string) => `\x1b[38;2;16;185;129m${s}\x1b[39m`,
	yellow: (s: string) => `\x1b[38;2;245;158;11m${s}\x1b[39m`,
	red: (s: string) => `\x1b[38;2;239;68;68m${s}\x1b[39m`,
	gold: (s: string) => `\x1b[38;2;212;175;55m${s}\x1b[39m`,
	white: (s: string) => `\x1b[38;2;241;245;249m${s}\x1b[39m`,
	pillCyan: (s: string) => `\x1b[7;38;2;0;221;245m${s}\x1b[27m`,
	pillAmber: (s: string) => `\x1b[7;38;2;245;158;11m${s}\x1b[27m`,
	pillRed: (s: string) => `\x1b[7;38;2;239;68;68m${s}\x1b[27m`,
	pillGreen: (s: string) => `\x1b[7;38;2;16;185;129m${s}\x1b[27m`,
};

function padLine(text: string, width: number): string {
	const clipped = truncateToWidth(text, width);
	const w = visibleWidth(clipped);
	return w >= width ? clipped : `${clipped}${" ".repeat(width - w)}`;
}

function boxRow(content: string, totalWidth: number): string {
	const innerW = Math.max(10, totalWidth - 4);
	return `${c.border("│")} ${padLine(content, innerW)} ${c.border("│")}`;
}

function boxDivider(totalWidth: number, label?: string): string {
	const innerW = Math.max(10, totalWidth - 2);
	if (!label) return c.border(`├${"─".repeat(innerW)}┤`);
	const clipped = truncateToWidth(` ${label} `, Math.max(4, innerW - 4));
	const rem = Math.max(0, innerW - visibleWidth(clipped) - 1);
	return `${c.border("├─")}${clipped}${c.border(`${"─".repeat(rem)}┤`)}`;
}

function phaseBadge(phase: OrchestratorPhase): string {
	switch (phase) {
		case "COMMITTED":
			return c.pillGreen(` ${phase} `);
		case "AWAITING_APPROVAL":
		case "PAUSED":
		case "REPAIRING":
			return c.pillAmber(` ${phase} `);
		case "ABORTED":
		case "BLOCKED":
			return c.pillRed(` ${phase} `);
		default:
			return c.pillCyan(` ${phase} `);
	}
}

function roleChip(role: OrchestratorWorkerRole): string {
	const tag = `@${role}`;
	switch (role) {
		case "shark-lead":
			return c.cyan(c.bold(tag));
		case "code-architect":
			return c.green(c.bold(tag));
		case "verification-specialist":
			return c.blue(c.bold(tag));
		case "security-sentinel":
			return c.red(c.bold(tag));
		case "theological-scholar":
			return c.gold(c.bold(tag));
	}
}

function workerIcon(status: OrchestratorWorker["status"]): string {
	switch (status) {
		case "completed":
			return c.green("✔");
		case "running":
			return c.cyan("▶");
		case "steered":
			return c.yellow("◈");
		case "verifying":
			return c.blue("◎");
		case "repaired":
			return c.yellow("↻");
		case "failed":
		case "aborted":
			return c.red("✖");
		default:
			return c.dim("○");
	}
}

function renderPhaseStepper(phase: OrchestratorPhase, innerW: number): string {
	const stages: Array<{ key: string; match: OrchestratorPhase[] }> = [
		{ key: "PLAN", match: ["CREATED", "PLANNING"] },
		{ key: "APPROVE", match: ["AWAITING_APPROVAL"] },
		{ key: "DISPATCH", match: ["DISPATCHING"] },
		{ key: "EXEC", match: ["EXECUTING", "REPAIRING"] },
		{ key: "VERIFY", match: ["VERIFYING"] },
		{ key: "COMMIT", match: ["COMMITTED"] },
	];
	const activeIdx = stages.findIndex(s => s.match.includes(phase));
	const sep = innerW >= 84 ? c.border(" ─▶ ") : c.border("→");
	const parts = stages.map((stage, idx) => {
		if (stage.match.includes(phase)) return c.pillCyan(` ${stage.key} `);
		if (phase === "COMMITTED" || (activeIdx > idx && phase !== "ABORTED" && phase !== "BLOCKED")) {
			return c.green(`✓${stage.key}`);
		}
		return c.dim(stage.key);
	});
	const suffix =
		phase === "PAUSED" || phase === "BLOCKED" || phase === "ABORTED" || phase === "REPAIRING"
			? `  ${phaseBadge(phase)}`
			: "";
	return truncateToWidth(`${parts.join(sep)}${suffix}`, innerW);
}

function renderTddGauge(proof: TddCategoryProof, maxW: number): string {
	const ratio = proof.totalCount > 0 ? Math.min(1, proof.passedCount / proof.totalCount) : 0;
	const barW = maxW >= 72 ? 12 : 8;
	const filled = Math.round(ratio * barW);
	const barStr = c.green("█".repeat(filled)) + c.dim("░".repeat(Math.max(0, barW - filled)));
	const status =
		proof.exitCode === 0 && proof.passedCount >= proof.totalCount
			? c.green(`${proof.passedCount}/${proof.totalCount}`)
			: c.red(`${proof.passedCount}/${proof.totalCount}`);
	return truncateToWidth(
		`TDD [${c.cyan(proof.category)}] ${barStr} ${status} ${c.dim(`exit:${proof.exitCode}`)}`,
		maxW,
	);
}

function renderWorkerCard(worker: OrchestratorWorker, maxRepair: number, cardW: number): string[] {
	const innerW = Math.max(18, cardW - 4);
	const top = c.border(`╭${"─".repeat(cardW - 2)}╮`);
	const bot = c.border(`╰${"─".repeat(cardW - 2)}╯`);
	const lines: string[] = [top];

	const repairBadge = worker.repairAttempt > 0 ? ` ${c.yellow(`↻${worker.repairAttempt}/${maxRepair}`)}` : "";
	const header = `${workerIcon(worker.status)} ${roleChip(worker.role)} ${c.dim(`[${worker.id}]`)} ${c.white(worker.status.toUpperCase())}${repairBadge}`;
	lines.push(`${c.border("│")} ${padLine(header, innerW)} ${c.border("│")}`);
	lines.push(`${c.border("│")} ${padLine(c.bold(worker.title), innerW)} ${c.border("│")}`);

	if (worker.dependencies.length > 0) {
		lines.push(
			`${c.border("│")} ${padLine(c.dim(`deps: ${worker.dependencies.join(", ")}`), innerW)} ${c.border("│")}`,
		);
	}

	const chips =
		worker.contract.ownedFiles.length > 0
			? worker.contract.ownedFiles.map(f => c.cyan(`[${f}]`)).join(" ")
			: c.dim("[serial:no-owned-files]");
	lines.push(`${c.border("│")} ${padLine(`files: ${chips}`, innerW)} ${c.border("│")}`);

	if (worker.lastSteeringNote) {
		lines.push(
			`${c.border("│")} ${padLine(c.yellow(`🧭 steer: ${worker.lastSteeringNote}`), innerW)} ${c.border("│")}`,
		);
	}
	for (const trigger of worker.contract.replanIf.slice(0, 2)) {
		lines.push(`${c.border("│")} ${padLine(c.yellow(`⚠ replanIf: ${trigger}`), innerW)} ${c.border("│")}`);
	}
	if (worker.error) {
		lines.push(`${c.border("│")} ${padLine(c.red(`✖ err: ${worker.error}`), innerW)} ${c.border("│")}`);
	} else if (worker.outputSummary) {
		lines.push(`${c.border("│")} ${padLine(c.dim(`out: ${worker.outputSummary}`), innerW)} ${c.border("│")}`);
	}

	lines.push(bot);
	return lines;
}

function mergeCardColumns(cards: string[][], colW: number, cols: number): string[] {
	const merged: string[] = [];
	for (let i = 0; i < cards.length; i += cols) {
		const slice = cards.slice(i, i + cols);
		const maxH = Math.max(...slice.map(card => card.length));
		for (let r = 0; r < maxH; r++) {
			merged.push(slice.map(card => padLine(card[r] ?? "", colW)).join(" "));
		}
	}
	return merged;
}

function renderWaveLane(run: OrchestratorRun, wave: OrchestratorWave, totalW: number): string[] {
	const innerW = Math.max(20, totalW - 4);
	const modeChip = wave.parallel ? c.cyan("⚡ PARALLEL") : c.dim("⛓ SERIAL");
	const ckptChip = wave.checkpointId ? c.gold(`🔐 ${wave.checkpointId}`) : c.dim("🔐 ckpt:pending");
	const statusColor =
		wave.status === "completed"
			? c.green(wave.status.toUpperCase())
			: wave.status === "failed" || wave.status === "rolled_back"
				? c.red(wave.status.toUpperCase())
				: wave.status === "running" || wave.status === "verifying"
					? c.cyan(wave.status.toUpperCase())
					: c.dim(wave.status.toUpperCase());

	const lines: string[] = [
		boxDivider(totalW, `${c.bold(`WAVE #${wave.index}`)} ${statusColor} ${modeChip} ${ckptChip}`),
	];

	const waveWorkers = wave.workerIds
		.map(id => run.workers[id])
		.filter((w): w is OrchestratorWorker => w !== undefined);

	const cols = innerW >= 150 && waveWorkers.length >= 3 ? 3 : innerW >= 102 && waveWorkers.length >= 2 ? 2 : 1;
	const colW = cols === 1 ? innerW : Math.floor((innerW - (cols - 1)) / cols);
	const cardBlocks = waveWorkers.map(w => renderWorkerCard(w, run.maxRepairAttempts, colW));
	for (const row of mergeCardColumns(cardBlocks, colW, cols)) {
		lines.push(boxRow(row, totalW));
	}

	if (wave.verification) {
		const v = wave.verification;
		const badge = v.passed ? c.green("✔ GATE PASS") : c.red("✖ GATE FAIL");
		lines.push(boxRow(`${badge} ${c.white(v.summary)}`, totalW));
		for (const proof of v.tddProofs.slice(0, 4)) {
			lines.push(boxRow(renderTddGauge(proof, innerW), totalW));
		}
		if (!v.passed) {
			for (const diag of v.diagnostics.slice(0, 2)) {
				lines.push(boxRow(c.red(`  • ${diag}`), totalW));
			}
		}
	}

	return lines;
}

/**
 * Renders the responsive Shark Orchestrator Mission Board using ANSI box drawing.
 * Adapts cleanly from 60 columns up to 160+ columns.
 */
export function renderOrchestratorBoard(run: OrchestratorRun | null, width = 100): string {
	const safeW = Math.max(58, width);
	const innerW = safeW - 4;
	const topBorder = c.border(`╭${"─".repeat(safeW - 2)}╮`);
	const botBorder = c.border(`╰${"─".repeat(safeW - 2)}╯`);

	if (!run) {
		return [
			topBorder,
			boxRow(`${c.cyan(c.bold("🦈 SHARK ORCHESTRATOR"))} ${c.dim("· Mission Board")}`, safeW),
			boxDivider(safeW),
			boxRow(c.dim("No active orchestrator run in progress."), safeW),
			boxRow(`${c.white("Start:")} ${c.cyan('/orchestrator plan "<goal>"')}`, safeW),
			boxRow(c.dim("Commands: plan | approve | start | steer | verify | rollback | pause | abort"), safeW),
			botBorder,
		].join("\n");
	}

	const approvalChip = run.planApproved ? c.green("✔ APPROVED") : c.yellow("⏳ AWAITING APPROVAL");
	const riskChip = run.impactRisk ? c.blue(`risk:${run.impactRisk}`) : "";
	const header = `${c.cyan(c.bold("🦈 SHARK ORCHESTRATOR"))} ${c.dim(`[${run.id}]`)} ${phaseBadge(run.phase)}`;
	const meta = `${c.dim("policy:")} ${c.white(run.approvalPolicy)}  ${c.dim("concurrency:")} ${c.white(String(run.maxConcurrency))}  ${approvalChip}  ${riskChip}`;

	const lines: string[] = [
		topBorder,
		boxRow(header, safeW),
		boxRow(`${c.bold("Goal:")} ${c.white(run.goal)}`, safeW),
		boxRow(meta, safeW),
		boxRow(renderPhaseStepper(run.phase, innerW), safeW),
	];

	if (run.rejectionReason) {
		lines.push(boxRow(c.red(`✖ Rejected: ${run.rejectionReason}`), safeW));
	} else if (run.approvalNotes) {
		lines.push(boxRow(c.green(`✔ Approval Notes: ${run.approvalNotes}`), safeW));
	}

	for (const wave of run.waves) {
		lines.push(...renderWaveLane(run, wave, safeW));
	}

	lines.push(boxDivider(safeW));
	lines.push(
		boxRow(
			c.dim(
				"Controls: /orchestrator approve | start | steer <id> <msg> | verify [w] | rollback [w] | pause | abort",
			),
			safeW,
		),
	);
	lines.push(botBorder);

	return lines.join("\n");
}
