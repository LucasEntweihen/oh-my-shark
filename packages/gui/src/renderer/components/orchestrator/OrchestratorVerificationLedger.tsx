import { Activity, CheckCircle2, FileCheck2, Terminal, XCircle } from "lucide-react";
import type { OrchestratorEventFrame, RpcOrchestratorRun } from "../../../shared/rpc-types";
import { formatClock } from "../../lib/format";
import { Badge } from "../common";

export function OrchestratorVerificationLedger({
	run,
	selectedWaveIndex,
	events,
}: {
	run: RpcOrchestratorRun | null;
	selectedWaveIndex: number;
	events: readonly OrchestratorEventFrame[];
}) {
	const wave = run?.waves.find(w => w.index === selectedWaveIndex) ?? run?.waves[0] ?? null;
	const verification = wave?.verification ?? null;

	return (
		<div className="space-y-3">
			<div className="rounded-xl border border-[var(--omp-border-muted)] p-3.5">
				<div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
					<h3 className="flex items-center gap-2 text-omp-md font-semibold text-[var(--omp-text)]">
						<FileCheck2 size={15} className="text-[var(--omp-accent)]" />
						Independent Verification & TDD Proof Ledger
						{wave ? ` · Wave #${wave.index}` : ""}
					</h3>
					{verification && (
						<Badge variant={verification.passed ? "success" : "error"} dot>
							{verification.passed ? "PASSED" : "FAILED"} (exit {verification.exitCode})
						</Badge>
					)}
				</div>

				{!verification ? (
					<div className="rounded-lg border border-dashed border-[var(--omp-border-muted)] p-4 text-omp-sm text-[var(--omp-dim)]">
						No verification gate report recorded for {wave ? `Wave #${wave.index}` : "this run"} yet. Click{" "}
						<strong className="text-[var(--omp-text-secondary)]">Verify Wave</strong> to execute independent
						checks and TDD category proofs.
					</div>
				) : (
					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-2 text-omp-sm text-[var(--omp-text-secondary)]">
							<span>{verification.summary}</span>
							<span className="font-mono text-omp-xs text-[var(--omp-dim)]">
								{formatClock(new Date(verification.timestamp).toISOString())}
							</span>
						</div>

						{verification.tddProofs.length > 0 && (
							<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
								{verification.tddProofs.map(proof => {
									const ok = proof.exitCode === 0 && proof.passedCount >= proof.totalCount;
									return (
										<div
											key={`${proof.category}:${proof.command}`}
											className="rounded-lg border border-[var(--omp-border-muted)] p-2.5"
										>
											<div className="mb-1 flex items-center justify-between gap-2">
												<span className="flex items-center gap-1.5 text-omp-sm font-semibold text-[var(--omp-text)]">
													{ok ? (
														<CheckCircle2 size={13} className="text-[var(--omp-success)]" />
													) : (
														<XCircle size={13} className="text-[var(--omp-error)]" />
													)}
													{proof.category}
												</span>
												<Badge variant={ok ? "success" : "error"}>
													{proof.passedCount}/{proof.totalCount} · exit {proof.exitCode}
												</Badge>
											</div>
											<div
												className="mb-1 truncate font-mono text-omp-xxs text-[var(--omp-muted)]"
												title={proof.command}
											>
												<Terminal size={10} className="mr-1 inline" />
												{proof.command}
											</div>
											{proof.testFiles.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{proof.testFiles.map(file => (
														<span
															key={file}
															className="rounded border border-[var(--omp-border-muted)] bg-[var(--omp-code-bg)] px-1.5 py-px font-mono text-omp-xxs text-[var(--omp-dim)]"
														>
															{file}
														</span>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}

						{verification.diagnostics.length > 0 && (
							<div>
								<div className="mb-1 text-omp-xs font-semibold text-[var(--omp-dim)]">Diagnostics</div>
								<pre className="max-h-48 overflow-auto rounded-lg border border-[var(--omp-border-muted)] bg-[var(--omp-code-bg)] p-2.5 font-mono text-omp-xs text-[var(--omp-text-secondary)]">
									{verification.diagnostics.join("\n")}
								</pre>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="rounded-xl border border-[var(--omp-border-muted)] p-3.5">
				<div className="mb-2 flex items-center justify-between gap-2">
					<h4 className="flex items-center gap-1.5 text-omp-sm font-semibold text-[var(--omp-text)]">
						<Activity size={14} className="text-[var(--omp-accent)]" />
						Live Orchestrator Event Feed ({events.length})
					</h4>
				</div>
				{events.length === 0 ? (
					<div className="text-omp-xs text-[var(--omp-dim)]">
						Waiting for live orchestrator_event frames from sidecar…
					</div>
				) : (
					<div className="max-h-40 space-y-1 overflow-y-auto font-mono text-omp-xs">
						{[...events]
							.reverse()
							.slice(0, 30)
							.map((evt, index) => (
								<div
									key={`${evt.timestamp}-${evt.eventType}-${index}`}
									className="flex flex-wrap items-center gap-2 rounded border border-[var(--omp-border-muted)] px-2 py-1"
								>
									<span className="text-[var(--omp-dim)]">
										{formatClock(new Date(evt.timestamp).toISOString())}
									</span>
									<Badge variant="info">{evt.phase}</Badge>
									<span className="font-semibold text-[var(--omp-text)]">{evt.eventType}</span>
									<span className="truncate text-[var(--omp-muted)]">{evt.runId}</span>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
}
