import { CheckCircle2, Cpu, FileCode2, GitCommitHorizontal, Layers, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type {
	OrchestratorWaveStatus,
	OrchestratorWorkerRole,
	OrchestratorWorkerStatus,
	RpcOrchestratorRun,
	RpcOrchestratorWorker,
} from "../../../shared/rpc-types";
import { cx } from "../../lib/format";
import { Badge, type BadgeVariant, Button, Input } from "../common";

const ROLE_META: Record<OrchestratorWorkerRole, { label: string; color: string }> = {
	"shark-lead": { label: "@shark-lead", color: "#00E5FF" },
	"code-architect": { label: "@code-architect", color: "#10B981" },
	"verification-specialist": { label: "@verification-specialist", color: "#38BDF8" },
	"security-sentinel": { label: "@security-sentinel", color: "#EF4444" },
	"theological-scholar": { label: "@theological-scholar", color: "#D4AF37" },
};

function waveVariant(status: OrchestratorWaveStatus): BadgeVariant {
	switch (status) {
		case "completed":
			return "success";
		case "running":
		case "verifying":
			return "info";
		case "failed":
			return "error";
		case "rolled_back":
			return "warning";
		default:
			return "muted";
	}
}

function workerVariant(status: OrchestratorWorkerStatus): BadgeVariant {
	switch (status) {
		case "completed":
		case "repaired":
			return "success";
		case "running":
		case "verifying":
		case "steered":
			return "info";
		case "failed":
		case "aborted":
			return "error";
		default:
			return "muted";
	}
}

interface WorkerCardProps {
	worker: RpcOrchestratorWorker;
	selected: boolean;
	busy: boolean;
	onSelect: () => void;
	onSteer: (workerId: string, message: string) => Promise<boolean>;
}

function WorkerCard({ worker, selected, busy, onSelect, onSteer }: WorkerCardProps) {
	const [steerDraft, setSteerDraft] = useState("");
	const [steering, setSteering] = useState(false);
	const role = ROLE_META[worker.role] ?? { label: `@${worker.role}`, color: "var(--omp-accent)" };

	const submitSteer = async () => {
		const trimmed = steerDraft.trim();
		if (!trimmed || steering) return;
		setSteering(true);
		const ok = await onSteer(worker.id, trimmed);
		setSteering(false);
		if (ok) setSteerDraft("");
	};

	return (
		<div
			className={cx(
				"flex flex-col gap-2 rounded-lg border p-3 transition-colors",
				selected
					? "border-[var(--omp-border-accent)] bg-[var(--omp-selected-bg)]"
					: "border-[var(--omp-border-muted)] hover:border-[var(--omp-border)]",
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left focus:outline-none">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="truncate text-omp-md font-semibold text-[var(--omp-text)]">{worker.title}</span>
						<span className="font-mono text-omp-xxs text-[var(--omp-dim)]">#{worker.id}</span>
					</div>
				</button>
				<div className="flex shrink-0 items-center gap-1.5">
					<span
						className="inline-flex items-center gap-1 rounded-full border px-2 py-px font-mono text-omp-xxs font-medium"
						style={{
							borderColor: `color-mix(in srgb, ${role.color} 45%, transparent)`,
							color: role.color,
						}}
					>
						<Cpu size={10} />
						{role.label}
					</span>
					<Badge
						variant={workerVariant(worker.status)}
						dot
						pulse={worker.status === "running" || worker.status === "verifying"}
					>
						{worker.status}
					</Badge>
					{worker.repairAttempt > 0 && <Badge variant="warning">repair #{worker.repairAttempt}</Badge>}
				</div>
			</div>

			{worker.contract.ownedFiles.length > 0 && (
				<div className="flex flex-wrap items-center gap-1">
					<span className="text-omp-xxs font-medium text-[var(--omp-dim)]">Files:</span>
					{worker.contract.ownedFiles.map(file => (
						<span
							key={file}
							className="inline-flex items-center gap-1 rounded border border-[var(--omp-border-muted)] bg-[var(--omp-code-bg)] px-1.5 py-0.5 font-mono text-omp-xxs text-[var(--omp-text-secondary)]"
						>
							<FileCode2 size={10} className="text-[var(--omp-accent)]" />
							{file}
						</span>
					))}
				</div>
			)}

			{worker.dependencies.length > 0 && (
				<div className="flex flex-wrap items-center gap-1 text-omp-xxs text-[var(--omp-dim)]">
					<span>Depends on:</span>
					{worker.dependencies.map(dep => (
						<span key={dep} className="rounded border border-[var(--omp-border-muted)] px-1.5 font-mono">
							#{dep}
						</span>
					))}
				</div>
			)}

			{(selected || worker.contract.acceptanceCriteria.length > 0 || worker.contract.replanIf.length > 0) && (
				<div className="grid grid-cols-1 gap-2 border-t border-[var(--omp-border-muted)] pt-2 text-omp-xs sm:grid-cols-2">
					{worker.contract.acceptanceCriteria.length > 0 && (
						<div>
							<div className="mb-1 text-omp-xxs font-semibold uppercase tracking-wide text-[var(--omp-dim)]">
								Acceptance Criteria
							</div>
							<ul className="space-y-0.5 text-[var(--omp-text-secondary)]">
								{worker.contract.acceptanceCriteria.map(criterion => (
									<li key={criterion} className="flex items-start gap-1">
										<CheckCircle2 size={11} className="mt-0.5 shrink-0 text-[var(--omp-success)]" />
										<span>{criterion}</span>
									</li>
								))}
							</ul>
						</div>
					)}
					{worker.contract.replanIf.length > 0 && (
						<div>
							<div className="mb-1 text-omp-xxs font-semibold uppercase tracking-wide text-[var(--omp-dim)]">
								Replan If
							</div>
							<ul className="space-y-0.5 text-[var(--omp-warning)]">
								{worker.contract.replanIf.map(trigger => (
									<li key={trigger}>• {trigger}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{worker.lastSteeringNote && (
				<div className="rounded border border-[color-mix(in_srgb,var(--omp-accent)_35%,transparent)] bg-[var(--omp-accent-dim)] px-2.5 py-1.5 text-omp-xs text-[var(--omp-text)]">
					<span className="font-semibold text-[var(--omp-accent)]">Steer note: </span>
					{worker.lastSteeringNote}
				</div>
			)}
			{worker.outputSummary && (
				<div className="rounded border border-[var(--omp-border-muted)] bg-[var(--omp-code-bg)] px-2.5 py-1.5 font-mono text-omp-xs text-[var(--omp-text-secondary)]">
					{worker.outputSummary}
				</div>
			)}
			{worker.error && (
				<div className="rounded border border-[color-mix(in_srgb,var(--omp-error)_45%,transparent)] bg-[var(--omp-error-dim)] px-2.5 py-1.5 text-omp-xs text-[var(--omp-error)]">
					{worker.error}
				</div>
			)}

			<div className="flex items-center gap-1.5 pt-1">
				<div className="min-w-0 flex-1">
					<Input
						compact
						value={steerDraft}
						onChange={e => setSteerDraft(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") {
								e.preventDefault();
								void submitSteer();
							}
						}}
						placeholder={`Steer @${worker.role} (${worker.id})…`}
						aria-label={`Steer worker ${worker.id}`}
					/>
				</div>
				<Button
					size="sm"
					variant="secondary"
					loading={steering}
					disabled={busy || !steerDraft.trim()}
					icon={<Send size={12} />}
					onClick={() => void submitSteer()}
				>
					Steer
				</Button>
			</div>
		</div>
	);
}

export interface OrchestratorWaveBoardProps {
	run: RpcOrchestratorRun;
	selectedWaveIndex: number;
	selectedWorkerId: string | null;
	busy: boolean;
	onSelectWave: (index: number) => void;
	onSelectWorker: (id: string | null) => void;
	onSteerWorker: (workerId: string, message: string) => Promise<boolean>;
	onVerifyWave: (waveIndex: number) => Promise<void>;
	onRollbackWave: (waveIndex: number) => Promise<void>;
}

export function OrchestratorWaveBoard({
	run,
	selectedWaveIndex,
	selectedWorkerId,
	busy,
	onSelectWave,
	onSelectWorker,
	onSteerWorker,
	onVerifyWave,
	onRollbackWave,
}: OrchestratorWaveBoardProps) {
	const sortedWaves = [...run.waves].sort((a, b) => a.index - b.index);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<h3 className="flex items-center gap-2 text-omp-md font-semibold text-[var(--omp-text)]">
					<Layers size={15} className="text-[var(--omp-accent)]" />
					Parallel Wave Lanes ({sortedWaves.length})
				</h3>
				<span className="text-omp-xs text-[var(--omp-dim)]">Concurrency cap: {run.maxConcurrency}</span>
			</div>

			{sortedWaves.map(wave => {
				const selected = wave.index === selectedWaveIndex;
				const workers = wave.workerIds
					.map(id => run.workers[id])
					.filter((worker): worker is RpcOrchestratorWorker => worker !== undefined);
				return (
					<div
						key={wave.index}
						className={cx("omsk-wave-lane p-3 transition-colors", selected && "omsk-wave-lane--selected")}
					>
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<button
								type="button"
								onClick={() => onSelectWave(wave.index)}
								className="flex flex-wrap items-center gap-2 text-left focus:outline-none"
							>
								<span className="font-mono text-omp-md font-semibold text-[var(--omp-text)]">
									Wave #{wave.index}
								</span>
								<Badge
									variant={waveVariant(wave.status)}
									dot
									pulse={wave.status === "running" || wave.status === "verifying"}
								>
									{wave.status}
								</Badge>
								<Badge variant={wave.parallel ? "info" : "muted"}>
									{wave.parallel ? "Parallel Lane" : "Serialized Lane"}
								</Badge>
								{wave.checkpointId && (
									<span className="inline-flex items-center gap-1 rounded border border-[var(--omp-border-muted)] bg-[var(--omp-code-bg)] px-2 py-0.5 font-mono text-omp-xxs text-[var(--omp-muted)]">
										<GitCommitHorizontal size={11} />
										{wave.checkpointId}
									</span>
								)}
							</button>

							<div className="flex items-center gap-1.5">
								<Button
									size="sm"
									variant="secondary"
									disabled={busy}
									icon={<ShieldCheck size={12} />}
									onClick={() => void onVerifyWave(wave.index)}
								>
									Verify Wave
								</Button>
								<Button
									size="sm"
									variant="danger"
									disabled={busy}
									icon={<RotateCcw size={12} />}
									onClick={() => void onRollbackWave(wave.index)}
								>
									Rollback Wave
								</Button>
							</div>
						</div>

						<div className={cx("grid gap-2.5", wave.parallel ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
							{workers.map(worker => (
								<WorkerCard
									key={worker.id}
									worker={worker}
									selected={selectedWorkerId === worker.id}
									busy={busy}
									onSelect={() => onSelectWorker(selectedWorkerId === worker.id ? null : worker.id)}
									onSteer={onSteerWorker}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
