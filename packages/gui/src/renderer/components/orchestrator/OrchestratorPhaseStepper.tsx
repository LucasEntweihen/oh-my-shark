import { AlertTriangle, Check, Clock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrchestratorPhase, RpcOrchestratorRun } from "../../../shared/rpc-types";
import { cx, formatDuration, formatTimeAgo } from "../../lib/format";
import { Badge, type BadgeVariant } from "../common";

const PIPELINE_STEPS = [
	{ id: "PLAN", label: "PLAN" },
	{ id: "APPROVAL GATE", label: "APPROVAL GATE" },
	{ id: "WAVE DISPATCH", label: "WAVE DISPATCH" },
	{ id: "VERIFY", label: "VERIFY" },
	{ id: "COMMIT", label: "COMMIT" },
] as const;

const ACTIVE_PHASES = new Set<OrchestratorPhase>(["PLANNING", "DISPATCHING", "EXECUTING", "VERIFYING", "REPAIRING"]);

function stepIndexForPhase(phase: OrchestratorPhase): number {
	switch (phase) {
		case "CREATED":
		case "PLANNING":
			return 0;
		case "AWAITING_APPROVAL":
			return 1;
		case "DISPATCHING":
		case "EXECUTING":
		case "PAUSED":
			return 2;
		case "VERIFYING":
		case "REPAIRING":
			return 3;
		case "COMMITTED":
			return 4;
		case "ABORTED":
		case "BLOCKED":
			return 2;
	}
}

export function phaseBadgeVariant(phase: OrchestratorPhase): BadgeVariant {
	switch (phase) {
		case "COMMITTED":
			return "success";
		case "AWAITING_APPROVAL":
		case "PAUSED":
		case "REPAIRING":
			return "warning";
		case "ABORTED":
		case "BLOCKED":
			return "error";
		case "DISPATCHING":
		case "EXECUTING":
		case "VERIFYING":
		case "PLANNING":
			return "info";
		default:
			return "default";
	}
}

function riskBadgeVariant(risk: string | undefined): BadgeVariant {
	switch (risk?.toLowerCase()) {
		case "breaking":
		case "high":
		case "critical":
			return "error";
		case "medium":
			return "warning";
		case "low":
		case "none":
			return "success";
		default:
			return "muted";
	}
}

export function OrchestratorPhaseStepper({ run }: { run: RpcOrchestratorRun | null }) {
	const [now, setNow] = useState(() => Date.now());
	const isLive = run ? ACTIVE_PHASES.has(run.phase) : false;

	useEffect(() => {
		if (!isLive) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, [isLive]);

	const activeIdx = run ? stepIndexForPhase(run.phase) : 0;
	const elapsedMs = run ? Math.max(0, (isLive ? now : run.updatedAt) - run.createdAt) : 0;
	const failedState = run?.phase === "ABORTED" || run?.phase === "BLOCKED";

	return (
		<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					{run ? (
						<Badge variant={phaseBadgeVariant(run.phase)} dot pulse={isLive}>
							{run.phase}
						</Badge>
					) : (
						<Badge variant="muted">IDLE</Badge>
					)}
					{run?.impactRisk && (
						<Badge variant={riskBadgeVariant(run.impactRisk)}>
							<ShieldAlert size={11} />
							Risk: {run.impactRisk.toUpperCase()}
						</Badge>
					)}
					{run && (
						<span className="font-mono text-omsk-xs text-[var(--omsk-muted)]">
							Wave {Math.min(run.currentWaveIndex + 1, Math.max(1, run.waves.length))}/
							{Math.max(1, run.waves.length)}
						</span>
					)}
				</div>
				{run && (
					<div className="flex items-center gap-3 text-omsk-xs text-[var(--omsk-dim)] tabular-nums">
						<span className="flex items-center gap-1" title="Elapsed time since plan creation">
							<Clock size={12} />
							{formatDuration(elapsedMs)}
						</span>
						<span>Updated {formatTimeAgo(new Date(run.updatedAt).toISOString(), { compact: true })}</span>
					</div>
				)}
			</div>

			<ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
				{PIPELINE_STEPS.map((step, index) => {
					const completed = run !== null && (run.phase === "COMMITTED" || index < activeIdx);
					const current = run !== null && !completed && index === activeIdx;
					const haltedHere = failedState && current;
					return (
						<li
							key={step.id}
							className={cx(
								"flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
								completed &&
									"border-[color-mix(in_srgb,var(--omsk-success)_45%,transparent)] bg-[var(--omsk-success-dim)]",
								current && !haltedHere && "border-[var(--omsk-border-accent)] bg-[var(--omsk-accent-dim)]",
								haltedHere &&
									"border-[color-mix(in_srgb,var(--omsk-error)_50%,transparent)] bg-[var(--omsk-error-dim)]",
								!completed && !current && "border-[var(--omsk-border-muted)]",
							)}
						>
							<span
								className={cx(
									"flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-omsk-xxs font-semibold",
									completed && "border-[var(--omsk-success)] text-[var(--omsk-success)]",
									current && !haltedHere && "border-[var(--omsk-accent)] text-[var(--omsk-accent)]",
									haltedHere && "border-[var(--omsk-error)] text-[var(--omsk-error)]",
									!completed && !current && "border-[var(--omsk-border)] text-[var(--omsk-dim)]",
								)}
							>
								{completed ? <Check size={11} /> : haltedHere ? <AlertTriangle size={11} /> : index + 1}
							</span>
							<span
								className={cx(
									"truncate text-omsk-xs font-semibold tracking-wide",
									completed
										? "text-[var(--omsk-success)]"
										: haltedHere
											? "text-[var(--omsk-error)]"
											: current
												? "text-[var(--omsk-text)]"
												: "text-[var(--omsk-dim)]",
								)}
							>
								{step.label}
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
