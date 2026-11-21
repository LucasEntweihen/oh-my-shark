import { Check, Pause, Play, Plus, Radar, RefreshCw, Rocket, Square, Trash2, Workflow, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type {
	OrchestratorApprovalPolicy,
	OrchestratorWorkerRole,
	RpcOrchestratorTaskDraft,
} from "../../../shared/rpc-types";
import { useOrchestratorStore } from "../../stores/orchestrator";
import { toast } from "../../stores/toast";
import { useUiStore } from "../../stores/ui";
import { Badge, Button, Input, Modal, TextArea } from "../common";
import { OrchestratorPhaseStepper } from "./OrchestratorPhaseStepper";
import { OrchestratorVerificationLedger } from "./OrchestratorVerificationLedger";
import { OrchestratorWaveBoard } from "./OrchestratorWaveBoard";

export interface OrchestratorStudioProps {
	open?: boolean;
	onClose?: () => void;
}

interface DraftTaskForm {
	id: string;
	title: string;
	role: OrchestratorWorkerRole;
	filesCsv: string;
	depsCsv: string;
	replanCsv: string;
}

const POLICIES: { id: OrchestratorApprovalPolicy; label: string }[] = [
	{ id: "approve-before-dispatch", label: "Approve Before Dispatch" },
	{ id: "phase-gate", label: "Phase Gate (per wave)" },
	{ id: "auto", label: "Auto Dispatch" },
];

const ROLES: OrchestratorWorkerRole[] = [
	"shark-lead",
	"code-architect",
	"verification-specialist",
	"security-sentinel",
	"theological-scholar",
];

export function OrchestratorStudio({ open = true, onClose }: OrchestratorStudioProps) {
	const handleClose = onClose ?? (() => useUiStore.getState().closeOrchestrator());
	const activeRun = useOrchestratorStore(s => s.activeRun);
	const runs = useOrchestratorStore(s => s.runs);
	const loading = useOrchestratorStore(s => s.loading);
	const error = useOrchestratorStore(s => s.error);
	const selectedWaveIndex = useOrchestratorStore(s => s.selectedWaveIndex);
	const selectedWorkerId = useOrchestratorStore(s => s.selectedWorkerId);
	const events = useOrchestratorStore(s => s.events);
	const refresh = useOrchestratorStore(s => s.refresh);
	const createPlan = useOrchestratorStore(s => s.createPlan);
	const approvePlan = useOrchestratorStore(s => s.approvePlan);
	const rejectPlan = useOrchestratorStore(s => s.rejectPlan);
	const startRun = useOrchestratorStore(s => s.startRun);
	const steerWorker = useOrchestratorStore(s => s.steerWorker);
	const pauseRun = useOrchestratorStore(s => s.pauseRun);
	const resumeRun = useOrchestratorStore(s => s.resumeRun);
	const abortRun = useOrchestratorStore(s => s.abortRun);
	const verifyWave = useOrchestratorStore(s => s.verifyWave);
	const rollbackWave = useOrchestratorStore(s => s.rollbackWave);
	const selectWave = useOrchestratorStore(s => s.selectWave);
	const selectWorker = useOrchestratorStore(s => s.selectWorker);
	const clearError = useOrchestratorStore(s => s.clearError);

	const [goal, setGoal] = useState("");
	const [approvalPolicy, setApprovalPolicy] = useState<OrchestratorApprovalPolicy>("approve-before-dispatch");
	const [maxConcurrency, setMaxConcurrency] = useState(4);
	const [customTasks, setCustomTasks] = useState<DraftTaskForm[]>([]);
	const [showBuilder, setShowBuilder] = useState(true);
	const [approvalNotes, setApprovalNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [abortReason, setAbortReason] = useState("");

	useEffect(() => {
		if (!open) return;
		void refresh();
	}, [open, refresh]);

	const handleCreatePlan = async () => {
		const drafts: RpcOrchestratorTaskDraft[] | undefined =
			customTasks.length > 0
				? customTasks
						.filter(task => task.title.trim().length > 0)
						.map((task, idx) => ({
							id: task.id.trim() || `w${idx + 1}`,
							title: task.title.trim(),
							role: task.role,
							files: task.filesCsv
								.split(",")
								.map(s => s.trim())
								.filter(Boolean),
							dependencies: task.depsCsv
								.split(",")
								.map(s => s.trim())
								.filter(Boolean),
							replanIf: task.replanCsv
								.split(",")
								.map(s => s.trim())
								.filter(Boolean),
						}))
				: undefined;
		const run = await createPlan(goal, drafts, approvalPolicy, maxConcurrency);
		if (run) {
			setShowBuilder(false);
			toast({ variant: "success", title: "Plan Created", message: `${run.waves.length} waves planned.` });
		}
	};

	const handleApproveAndDispatch = async () => {
		if (!activeRun) return;
		const approved = await approvePlan(activeRun.id, approvalNotes.trim() || undefined);
		if (!approved) return;
		await startRun(approved.id);
	};

	const handleRejectAndRevise = async () => {
		if (!activeRun) return;
		const reason = rejectionReason.trim() || "Revision requested in Orchestrator Studio";
		const rejected = await rejectPlan(activeRun.id, reason);
		if (rejected) {
			setGoal(activeRun.goal);
			setApprovalPolicy(activeRun.approvalPolicy);
			setMaxConcurrency(activeRun.maxConcurrency);
			setShowBuilder(true);
			setRejectionReason("");
			toast({ variant: "info", title: "Plan Rejected", message: "Goal loaded into planner for revision." });
		}
	};

	const isTerminal = activeRun?.phase === "COMMITTED" || activeRun?.phase === "ABORTED";
	const canApprove =
		activeRun != null && !isTerminal && (!activeRun.planApproved || activeRun.phase === "AWAITING_APPROVAL");
	const canStart =
		activeRun != null &&
		!isTerminal &&
		activeRun.planApproved &&
		(activeRun.phase === "CREATED" || activeRun.phase === "PLANNING" || activeRun.phase === "REPAIRING");
	const canPause =
		activeRun != null &&
		(activeRun.phase === "DISPATCHING" ||
			activeRun.phase === "EXECUTING" ||
			activeRun.phase === "VERIFYING" ||
			activeRun.phase === "REPAIRING");
	const canResume = activeRun?.phase === "PAUSED";

	return (
		<Modal
			dockable
			open={open}
			onClose={handleClose}
			size="full"
			bodyClassName="p-0"
			ariaLabel="Orchestrator Studio"
			title={
				<span className="flex items-center gap-2">
					<Workflow size={16} className="text-[var(--omp-accent)]" />
					<span>OMSK Orchestrator Studio</span>
					{activeRun && <Badge variant="info">{activeRun.id}</Badge>}
				</span>
			}
		>
			<div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						{runs.length > 0 && (
							<select
								aria-label="Select orchestrator run"
								value={activeRun?.id ?? ""}
								onChange={e => {
									if (e.target.value) void refresh(e.target.value);
								}}
								className="h-8 rounded-lg border border-[var(--omp-input-border)] bg-[var(--omp-input-bg)] px-2.5 text-omp-sm text-[var(--omp-text)] outline-none focus:border-[var(--omp-input-focus-border)]"
							>
								{runs.map(item => (
									<option key={item.id} value={item.id}>
										{item.phase} · {item.goal.slice(0, 48)} ({item.totalWaves}w/{item.workerCount}p)
									</option>
								))}
							</select>
						)}
						<Button
							size="sm"
							variant="secondary"
							loading={loading}
							icon={<RefreshCw size={12} />}
							onClick={() => void refresh(activeRun?.id)}
						>
							Refresh
						</Button>
						<Button
							size="sm"
							variant={showBuilder ? "primary" : "secondary"}
							icon={<Plus size={12} />}
							onClick={() => setShowBuilder(v => !v)}
						>
							{showBuilder ? "Hide Planner" : "New Plan"}
						</Button>
					</div>
					<Button
						size="sm"
						variant="ghost"
						icon={<Radar size={13} />}
						onClick={() => useUiStore.getState().openShark()}
					>
						Shark Command Center
					</Button>
				</div>

				{error && (
					<div
						role="alert"
						className="flex items-center justify-between gap-3 rounded-lg border border-[var(--omp-error)] bg-[var(--omp-error-dim)] px-3 py-2 text-omp-sm text-[var(--omp-error)]"
					>
						<span>{error}</span>
						<button type="button" onClick={clearError} className="text-omp-xs underline">
							Dismiss
						</button>
					</div>
				)}

				<OrchestratorPhaseStepper run={activeRun} />

				{(showBuilder || !activeRun) && (
					<section className="space-y-3 rounded-xl border border-[var(--omp-border-muted)] p-4">
						<div className="flex items-center justify-between gap-2">
							<h3 className="flex items-center gap-2 text-omp-md font-semibold text-[var(--omp-text)]">
								<Rocket size={15} className="text-[var(--omp-accent)]" />
								Plan Creation & DAG Partitioning
							</h3>
							<Button
								size="sm"
								variant="ghost"
								icon={<Plus size={12} />}
								onClick={() =>
									setCustomTasks(prev => [
										...prev,
										{
											id: `w${prev.length + 1}`,
											title: "",
											role: "code-architect",
											filesCsv: "",
											depsCsv: "",
											replanCsv: "",
										},
									])
								}
							>
								Add Task Node
							</Button>
						</div>

						<TextArea
							label="Mission Goal"
							rows={2}
							compact
							value={goal}
							onChange={e => setGoal(e.target.value)}
							placeholder="Describe the objective to partition into disjoint parallel waves…"
						/>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<label className="block">
								<span className="mb-1.5 block text-omp-md font-medium text-[var(--omp-text-secondary)]">
									Approval Policy
								</span>
								<select
									value={approvalPolicy}
									onChange={e => setApprovalPolicy(e.target.value as OrchestratorApprovalPolicy)}
									className="w-full rounded-lg border border-[var(--omp-input-border)] bg-[var(--omp-input-bg)] px-2.5 py-1.5 text-omp-md text-[var(--omp-text)] outline-none focus:border-[var(--omp-input-focus-border)]"
								>
									{POLICIES.map(policy => (
										<option key={policy.id} value={policy.id}>
											{policy.label}
										</option>
									))}
								</select>
							</label>
							<Input
								label="Max Wave Concurrency"
								compact
								type="number"
								min={1}
								max={16}
								value={maxConcurrency}
								onChange={e => setMaxConcurrency(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
							/>
						</div>

						{customTasks.length > 0 && (
							<div className="space-y-2">
								{customTasks.map((task, idx) => (
									<div
										key={idx}
										className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--omp-border-muted)] p-2.5 md:grid-cols-6"
									>
										<Input
											compact
											placeholder="ID (e.g. w1)"
											value={task.id}
											onChange={e =>
												setCustomTasks(prev =>
													prev.map((row, i) => (i === idx ? { ...row, id: e.target.value } : row)),
												)
											}
										/>
										<Input
											compact
											placeholder="Task title"
											value={task.title}
											onChange={e =>
												setCustomTasks(prev =>
													prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row)),
												)
											}
										/>
										<select
											value={task.role}
											onChange={e =>
												setCustomTasks(prev =>
													prev.map((row, i) =>
														i === idx ? { ...row, role: e.target.value as OrchestratorWorkerRole } : row,
													),
												)
											}
											className="rounded-lg border border-[var(--omp-input-border)] bg-[var(--omp-input-bg)] px-2 py-1.5 text-omp-sm text-[var(--omp-text)]"
										>
											{ROLES.map(role => (
												<option key={role} value={role}>
													@{role}
												</option>
											))}
										</select>
										<Input
											compact
											placeholder="Files (csv)"
											value={task.filesCsv}
											onChange={e =>
												setCustomTasks(prev =>
													prev.map((row, i) => (i === idx ? { ...row, filesCsv: e.target.value } : row)),
												)
											}
										/>
										<Input
											compact
											placeholder="Deps (csv)"
											value={task.depsCsv}
											onChange={e =>
												setCustomTasks(prev =>
													prev.map((row, i) => (i === idx ? { ...row, depsCsv: e.target.value } : row)),
												)
											}
										/>
										<div className="flex items-center gap-1">
											<Input
												compact
												placeholder="replanIf (csv)"
												value={task.replanCsv}
												onChange={e =>
													setCustomTasks(prev =>
														prev.map((row, i) =>
															i === idx ? { ...row, replanCsv: e.target.value } : row,
														),
													)
												}
											/>
											<button
												type="button"
												aria-label="Remove task"
												onClick={() => setCustomTasks(prev => prev.filter((_, i) => i !== idx))}
												className="rounded p-1.5 text-[var(--omp-dim)] hover:text-[var(--omp-error)]"
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}

						<div className="flex justify-end">
							<Button
								variant="primary"
								size="sm"
								loading={loading}
								disabled={!goal.trim()}
								onClick={() => void handleCreatePlan()}
							>
								Create Plan
							</Button>
						</div>
					</section>
				)}

				{activeRun && (
					<>
						<section className="space-y-3 rounded-xl border border-[var(--omp-border-muted)] p-4">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div>
									<div className="text-omp-xs font-semibold uppercase tracking-wide text-[var(--omp-dim)]">
										Active Mission
									</div>
									<h2 className="text-omp-lg font-semibold text-[var(--omp-text)]">{activeRun.goal}</h2>
									<div className="mt-1 flex flex-wrap gap-2 text-omp-xs text-[var(--omp-muted)]">
										<span>Policy: {activeRun.approvalPolicy}</span>
										<span>•</span>
										<span>Approved: {activeRun.planApproved ? "Yes" : "Pending"}</span>
										{activeRun.approvalNotes && <span>• Notes: {activeRun.approvalNotes}</span>}
										{activeRun.rejectionReason && (
											<span className="text-[var(--omp-error)]">
												• Rejected: {activeRun.rejectionReason}
											</span>
										)}
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-1.5">
									{canStart && (
										<Button
											size="sm"
											variant="primary"
											loading={loading}
											icon={<Play size={12} />}
											onClick={() => void startRun(activeRun.id)}
										>
											Start
										</Button>
									)}
									{canPause && (
										<Button
											size="sm"
											variant="secondary"
											loading={loading}
											icon={<Pause size={12} />}
											onClick={() => void pauseRun(activeRun.id)}
										>
											Pause
										</Button>
									)}
									{canResume && (
										<Button
											size="sm"
											variant="primary"
											loading={loading}
											icon={<Play size={12} />}
											onClick={() => void resumeRun(activeRun.id)}
										>
											Resume
										</Button>
									)}
									{!isTerminal && (
										<Button
											size="sm"
											variant="danger"
											loading={loading}
											icon={<Square size={11} />}
											onClick={() => void abortRun(activeRun.id, abortReason.trim() || undefined)}
										>
											Abort
										</Button>
									)}
								</div>
							</div>

							{canApprove && (
								<div className="grid grid-cols-1 gap-2 border-t border-[var(--omp-border-muted)] pt-3 lg:grid-cols-2">
									<div className="flex items-center gap-2">
										<div className="min-w-0 flex-1">
											<Input
												compact
												value={approvalNotes}
												onChange={e => setApprovalNotes(e.target.value)}
												placeholder="Optional approval notes…"
											/>
										</div>
										<Button
											size="sm"
											variant="primary"
											loading={loading}
											icon={<Check size={12} />}
											onClick={() => void handleApproveAndDispatch()}
										>
											Approve & Dispatch
										</Button>
									</div>
									<div className="flex items-center gap-2">
										<div className="min-w-0 flex-1">
											<Input
												compact
												value={rejectionReason}
												onChange={e => setRejectionReason(e.target.value)}
												placeholder="Reason for rejecting / revising plan…"
											/>
										</div>
										<Button
											size="sm"
											variant="danger"
											loading={loading}
											icon={<XCircle size={12} />}
											onClick={() => void handleRejectAndRevise()}
										>
											Reject & Revise
										</Button>
									</div>
								</div>
							)}

							{!isTerminal && !canApprove && (
								<div className="flex items-center gap-2 border-t border-[var(--omp-border-muted)] pt-2">
									<div className="max-w-sm flex-1">
										<Input
											compact
											value={abortReason}
											onChange={e => setAbortReason(e.target.value)}
											placeholder="Optional abort reason…"
										/>
									</div>
								</div>
							)}
						</section>

						<OrchestratorWaveBoard
							run={activeRun}
							selectedWaveIndex={selectedWaveIndex}
							selectedWorkerId={selectedWorkerId}
							busy={loading}
							onSelectWave={selectWave}
							onSelectWorker={selectWorker}
							onSteerWorker={(workerId, msg) => steerWorker(activeRun.id, workerId, msg)}
							onVerifyWave={async waveIndex => {
								const report = await verifyWave(activeRun.id, waveIndex);
								if (report) {
									toast({
										variant: report.passed ? "success" : "warning",
										title: `Wave #${waveIndex} Verification`,
										message: report.summary,
									});
								}
							}}
							onRollbackWave={async waveIndex => {
								const res = await rollbackWave(activeRun.id, waveIndex);
								if (res) {
									toast({
										variant: "info",
										title: `Wave #${waveIndex} Rolled Back`,
										message: `${res.rolledBackFiles.length} file(s) restored.`,
									});
								}
							}}
						/>

						<OrchestratorVerificationLedger
							run={activeRun}
							selectedWaveIndex={selectedWaveIndex}
							events={events}
						/>
					</>
				)}
			</div>
		</Modal>
	);
}
