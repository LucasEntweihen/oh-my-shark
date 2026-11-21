import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	CheckpointEngine,
	ExecutionFSM,
	type ExecutionState,
	IndependentVerifier,
	SharkSelfRepair,
} from "@ohms/execution-engine";
import { SharkEventBus } from "@ohms/kernel";
import { type ContractRisk, ImpactAnalyzer, ProjectGraph } from "@ohms/project-intelligence";
import { type PlannedTask, planWaves } from "@oh-my-pi/pi-vibe-toolkit";
import { TransactionalEditEngine } from "../edit/transactional-engine";
import { getMenteEmTeiaStore, MenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import { TaskPlanEngine } from "../task/plan-engine";
import { TddEnforcer } from "./tdd-enforcer";
import type {
	CompleteWorkerInput,
	CreatePlanOptions,
	OrchestratorEngineOptions,
	OrchestratorEvent,
	OrchestratorEventListener,
	OrchestratorPhase,
	OrchestratorRun,
	OrchestratorRunSummary,
	OrchestratorTaskDraft,
	OrchestratorWave,
	OrchestratorWorker,
	RollbackWaveResult,
	TddCategoryProof,
	VerificationGateResult,
	VerifyWaveOptions,
} from "./types";

const RISK_ORDER: Record<ContractRisk, number> = {
	none: 0,
	low: 1,
	medium: 2,
	high: 3,
	breaking: 4,
};

function defaultDraftsForGoal(goal: string): OrchestratorTaskDraft[] {
	return [
		{
			id: "w1-lead",
			title: `Architecture & Contract Spec: ${goal}`,
			role: "shark-lead",
			files: ["docs/architecture-plan.md"],
			acceptanceCriteria: ["DAG contract and module boundaries defined"],
			replanIf: ["Scope or interface contract changes mid-execution"],
		},
		{
			id: "w2-arch",
			title: `Core Implementation: ${goal}`,
			role: "code-architect",
			dependencies: ["w1-lead"],
			files: ["src/implementation"],
			acceptanceCriteria: ["Strict TypeScript without any", "File line limit respected"],
			replanIf: ["Breaking change detected in downstream callers"],
		},
		{
			id: "w3-verify",
			title: `TDD & Verification Gate: ${goal}`,
			role: "verification-specialist",
			dependencies: ["w2-arch"],
			files: ["test/verification"],
			acceptanceCriteria: ["All verification checks and TDD proofs pass"],
			replanIf: ["Verification detects contract regression"],
		},
		{
			id: "w4-sec",
			title: `Security & Confinement Audit: ${goal}`,
			role: "security-sentinel",
			dependencies: ["w2-arch"],
			files: ["docs/security-audit.md"],
			acceptanceCriteria: ["No path traversal or injection risks"],
			replanIf: ["Critical security vulnerability discovered"],
		},
	];
}

function cloneRun(run: OrchestratorRun): OrchestratorRun {
	return structuredClone(run);
}

export class SharkOrchestratorEngine {
	readonly #storageDir: string;
	readonly #baseDir: string;
	readonly #eventBus: SharkEventBus;
	readonly #teiaStore: MenteEmTeiaStore;
	readonly #impactAnalyzer: ImpactAnalyzer;
	readonly #txEngine: TransactionalEditEngine;
	readonly #checkpointEngine: CheckpointEngine;
	readonly #tddEnforcer: TddEnforcer;
	readonly #verifier = new IndependentVerifier();
	readonly #runs = new Map<string, OrchestratorRun>();
	readonly #fsms = new Map<string, ExecutionFSM>();
	readonly #repairs = new Map<string, SharkSelfRepair>();
	readonly #prePausePhase = new Map<string, OrchestratorPhase>();
	readonly #workerProofs = new Map<string, Map<string, TddCategoryProof[]>>();
	readonly #listeners = new Set<OrchestratorEventListener>();
	#activeRunId: string | null = null;

	constructor(options: OrchestratorEngineOptions = {}) {
		this.#storageDir = options.storageDir ?? path.join(os.homedir(), ".omsk", "orchestrator");
		this.#baseDir = path.resolve(options.baseDir ?? process.cwd());
		this.#eventBus = options.eventBus ?? new SharkEventBus();
		this.#teiaStore =
			options.teiaStore ??
			(options.storageDir ? new MenteEmTeiaStore(path.join(this.#storageDir, "teia.db")) : getMenteEmTeiaStore());
		this.#impactAnalyzer = options.impactAnalyzer ?? new ImpactAnalyzer(new ProjectGraph());
		this.#txEngine = options.txEngine ?? new TransactionalEditEngine(this.#baseDir);
		this.#checkpointEngine = options.checkpointEngine ?? new CheckpointEngine();
		this.#tddEnforcer = options.tddEnforcer ?? new TddEnforcer({ minTestsPerCategory: options.minTestsPerCategory });
		this.#loadRunsFromDisk();
	}

	public subscribe(listener: OrchestratorEventListener): () => void {
		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	}

	public getRun(runId?: string): OrchestratorRun | null {
		const targetId = runId ?? this.#activeRunId;
		if (!targetId) return null;
		const cached = this.#runs.get(targetId);
		if (cached) return cloneRun(cached);
		const diskRun = this.#readRunFromDisk(targetId);
		if (diskRun) {
			this.#runs.set(diskRun.id, diskRun);
			return cloneRun(diskRun);
		}
		return null;
	}

	public listRuns(): OrchestratorRunSummary[] {
		this.#loadRunsFromDisk();
		return Array.from(this.#runs.values())
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.map(r => ({
				id: r.id,
				goal: r.goal,
				phase: r.phase,
				currentWaveIndex: r.currentWaveIndex,
				totalWaves: r.waves.length,
				workerCount: Object.keys(r.workers).length,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
			}));
	}

	public createPlan(options: CreatePlanOptions): OrchestratorRun {
		const goal = options.goal.trim();
		if (!goal) throw new Error("Orchestrator goal cannot be empty.");

		const now = Date.now();
		const runId = `orch_${now}_${Math.random().toString(36).slice(2, 7)}`;
		const drafts = options.tasks && options.tasks.length > 0 ? options.tasks : defaultDraftsForGoal(goal);
		const approvalPolicy = options.approvalPolicy ?? "approve-before-dispatch";
		const maxConcurrency = Math.max(1, options.maxConcurrency ?? 4);
		const maxRepairAttempts = Math.max(1, options.maxRepairAttempts ?? 3);

		const normalized = drafts.map((d, idx) => {
			const id = d.id?.trim() || `w${idx + 1}`;
			const ownedFiles = Array.from(new Set(d.contract?.ownedFiles ?? d.files ?? []));
			const dependencies = Array.from(new Set(d.dependencies ?? []));
			return {
				id,
				title: d.title.trim() || `Worker ${idx + 1}`,
				role: d.role ?? "code-architect",
				dependencies,
				resources: d.resources,
				contract: {
					inputs: d.contract?.inputs ?? d.inputs ?? [],
					ownedFiles,
					acceptanceCriteria: d.contract?.acceptanceCriteria ?? d.acceptanceCriteria ?? [],
					replanIf: d.contract?.replanIf ?? d.replanIf ?? [],
				},
			};
		});

		const planEngine = new TaskPlanEngine(path.join(this.#storageDir, `${runId}.tasks.json`));
		for (const item of normalized) {
			planEngine.addTask({
				id: item.id,
				title: item.title,
				status: "pending",
				priority: "normal",
				dependencies: item.dependencies,
				files: item.contract.ownedFiles,
				completionCriteria: item.contract.acceptanceCriteria,
			});
		}

		const validation = planEngine.validateGraph();
		if (validation.hasCycles) {
			throw new Error(
				`Dependency cycle detected in orchestrator plan: ${validation.cyclePath?.join(" -> ") ?? "cycle"}`,
			);
		}
		if (validation.missingDependencies.length > 0) {
			const missing = validation.missingDependencies.map(m => `${m.taskId} -> ${m.missingId}`).join(", ");
			throw new Error(`Missing task dependencies in orchestrator plan: ${missing}`);
		}

		const topoOrder = planEngine.getTopologicalOrder();
		const byId = new Map(normalized.map(item => [item.id, item]));
		const plannedTasks: PlannedTask[] = topoOrder
			.map(id => byId.get(id))
			.filter((item): item is NonNullable<typeof item> => item !== undefined)
			.map(item => ({
				id: item.id,
				title: item.title,
				files: item.contract.ownedFiles,
				dependsOn: item.dependencies,
				resources: item.resources,
			}));

		const wavePlan = planWaves(plannedTasks);
		if (!wavePlan.valid || wavePlan.hasCycles) {
			const reasons = wavePlan.conflicts.map(c => c.reason).join("; ");
			throw new Error(`Wave planning failed: ${reasons || "invalid dependency graph"}`);
		}

		const waves: OrchestratorWave[] = [];
		const workers: Record<string, OrchestratorWorker> = {};
		let waveIndex = 0;

		for (const plannedWave of wavePlan.waves) {
			for (let offset = 0; offset < plannedWave.tasks.length; offset += maxConcurrency) {
				const chunk = plannedWave.tasks.slice(offset, offset + maxConcurrency);
				const workerIds: string[] = [];
				for (const t of chunk) {
					const draft = byId.get(t.id)!;
					workerIds.push(draft.id);
					workers[draft.id] = {
						id: draft.id,
						title: draft.title,
						role: draft.role,
						waveIndex,
						status: "pending",
						contract: draft.contract,
						dependencies: draft.dependencies,
						repairAttempt: 0,
					};
				}
				const parallel = chunk.length > 1 && chunk.every(t => t.files.length > 0);
				waves.push({ index: waveIndex, status: "pending", workerIds, parallel });
				waveIndex++;
			}
		}

		const allFiles = Array.from(new Set(normalized.flatMap(n => n.contract.ownedFiles)));
		const impactRisk = this.#computeMaxRisk(allFiles);
		const planApproved = approvalPolicy === "auto";
		const phase: OrchestratorPhase = planApproved ? "PLANNING" : "AWAITING_APPROVAL";

		const run: OrchestratorRun = {
			id: runId,
			goal,
			phase,
			approvalPolicy,
			maxConcurrency,
			maxRepairAttempts,
			planApproved,
			waves,
			workers,
			currentWaveIndex: 0,
			impactRisk,
			createdAt: now,
			updatedAt: now,
		};

		this.#syncFsm(runId, "INVESTIGATING", "Analyzing task DAG");
		this.#syncFsm(runId, "PLANNED", "Waves partitioned");
		this.#repairs.set(runId, new SharkSelfRepair({ maxAttempts: maxRepairAttempts }));
		this.#saveAndActivate(run);

		this.#eventBus.emit({
			type: "task.planned",
			taskId: runId,
			objective: goal,
			operationCount: Object.keys(workers).length,
			timestamp: now,
		});
		this.#safeRecordDecision(`Orchestrator Plan: ${goal}`, `Waves: ${waves.length}, Risk: ${impactRisk}`, allFiles);
		this.#emit(run, "plan_created", {
			waveCount: waves.length,
			workerCount: Object.keys(workers).length,
			impactRisk,
		});
		return cloneRun(run);
	}

	public approvePlan(runId: string, notes?: string): OrchestratorRun {
		const run = this.#requireRun(runId);
		if (run.phase === "ABORTED" || run.phase === "COMMITTED") {
			throw new Error(`Cannot approve run "${runId}" in terminal phase "${run.phase}".`);
		}
		run.planApproved = true;
		run.approvalNotes = notes;
		run.rejectionReason = undefined;
		if (run.phase === "AWAITING_APPROVAL") {
			run.phase = run.waves.some(w => w.status === "completed") ? "DISPATCHING" : "PLANNING";
		}
		this.#saveRun(run);
		this.#emit(run, "plan_approved", { notes });
		return cloneRun(run);
	}

	public rejectPlan(runId: string, reason: string): OrchestratorRun {
		const run = this.#requireRun(runId);
		if (run.phase === "COMMITTED") {
			throw new Error(`Cannot reject already committed run "${runId}".`);
		}
		run.planApproved = false;
		run.rejectionReason = reason.trim() || "Rejected by operator";
		run.phase = "ABORTED";
		this.#syncFsm(runId, "ABORTED", run.rejectionReason);
		this.#saveRun(run);
		this.#emit(run, "plan_rejected", { reason: run.rejectionReason });
		return cloneRun(run);
	}

	public async startRun(runId: string): Promise<OrchestratorRun> {
		const run = this.#requireRun(runId);
		if (run.phase === "ABORTED" || run.phase === "COMMITTED") {
			throw new Error(`Cannot start run "${runId}" in terminal phase "${run.phase}".`);
		}
		if (!run.planApproved) {
			if (run.approvalPolicy === "auto") {
				run.planApproved = true;
			} else {
				run.phase = "AWAITING_APPROVAL";
				this.#saveRun(run);
				throw new Error(`Run "${runId}" requires plan approval before dispatch.`);
			}
		}
		return this.dispatchNextWave(runId);
	}

	public async dispatchNextWave(runId: string): Promise<OrchestratorRun> {
		const run = this.#requireRun(runId);
		if (run.phase === "PAUSED") throw new Error(`Run "${runId}" is paused; resume before dispatching.`);
		if (run.phase === "ABORTED" || run.phase === "COMMITTED") {
			throw new Error(`Run "${runId}" is in terminal phase "${run.phase}".`);
		}
		if (!run.planApproved) {
			run.phase = "AWAITING_APPROVAL";
			this.#saveRun(run);
			throw new Error(`Run "${runId}" requires approval before dispatching wave.`);
		}

		const nextWave = run.waves.find(
			w =>
				w.status === "pending" ||
				w.status === "running" ||
				w.status === "rolled_back" ||
				(w.status === "failed" && run.phase === "REPAIRING"),
		);
		if (!nextWave) {
			run.phase = "COMMITTED";
			this.#syncFsm(runId, "COMMITTED", "All waves completed");
			this.#saveRun(run);
			this.#emit(run, "run_committed", {});
			return cloneRun(run);
		}

		if (run.approvalPolicy === "phase-gate" && nextWave.index > 0 && run.phase === "AWAITING_APPROVAL") {
			throw new Error(`Wave #${nextWave.index} requires phase-gate approval before dispatch.`);
		}

		run.currentWaveIndex = nextWave.index;
		run.phase = "DISPATCHING";
		const ownedFiles = Array.from(
			new Set(nextWave.workerIds.flatMap(id => run.workers[id]?.contract.ownedFiles ?? [])),
		);
		run.impactRisk = this.#computeMaxRisk(ownedFiles);

		const ckptId = this.#txEngine.begin(`orchestrator:${runId}:wave-${nextWave.index}`);
		const snapshotContents: Record<string, string> = {};
		for (const file of ownedFiles) {
			try {
				await this.#txEngine.recordBeforeModification(file, ckptId);
				const resolved = path.resolve(this.#baseDir, file);
				if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
					snapshotContents[file] = fs.readFileSync(resolved, "utf8");
				}
			} catch {
				// Non-fatal if file does not exist on disk yet or cannot be snapshotted
			}
		}
		this.#checkpointEngine.createCheckpoint(`${runId}-w${nextWave.index}`, snapshotContents);
		nextWave.checkpointId = ckptId;
		nextWave.status = "running";

		const now = Date.now();
		for (const workerId of nextWave.workerIds) {
			const worker = run.workers[workerId];
			if (worker) {
				worker.status = "running";
				worker.startedAt = worker.startedAt ?? now;
			}
		}

		run.phase = "EXECUTING";
		if (this.#fsms.get(runId)?.getState() === "VALIDATING") {
			this.#syncFsm(runId, "WAITING_FOR_APPROVAL", "Advancing to next wave");
		}
		this.#syncFsm(runId, "EXECUTING", `Dispatching wave #${nextWave.index}`);
		this.#saveRun(run);

		this.#eventBus.emit({
			type: "tool.started",
			operationId: ckptId,
			toolName: `orchestrator.wave.${nextWave.index}`,
			parameters: { runId, waveIndex: nextWave.index, workerIds: nextWave.workerIds },
			timestamp: now,
		});
		this.#emit(run, "wave_dispatched", {
			waveIndex: nextWave.index,
			checkpointId: ckptId,
			workerIds: nextWave.workerIds,
		});
		return cloneRun(run);
	}

	public steerWorker(
		runId: string,
		workerId: string,
		message: string,
	): { ok: boolean; worker?: OrchestratorWorker; run?: OrchestratorRun } {
		const run = this.#runs.get(runId) ?? this.#readRunFromDisk(runId);
		if (!run) return { ok: false };
		this.#runs.set(run.id, run);

		const worker = run.workers[workerId];
		if (!worker) return { ok: false };
		const trimmed = message.trim();
		if (!trimmed) return { ok: false };

		worker.lastSteeringNote = trimmed;
		if (worker.status === "pending" || worker.status === "running" || worker.status === "repaired") {
			worker.status = "steered";
		}
		this.#saveRun(run);
		this.#emit(run, "worker_steered", { workerId, message: trimmed });
		return { ok: true, worker: structuredClone(worker), run: cloneRun(run) };
	}

	public pauseRun(runId: string): OrchestratorRun {
		const run = this.#requireRun(runId);
		if (run.phase === "ABORTED" || run.phase === "COMMITTED") {
			throw new Error(`Cannot pause run "${runId}" in terminal phase "${run.phase}".`);
		}
		if (run.phase !== "PAUSED") {
			this.#prePausePhase.set(runId, run.phase);
			run.phase = "PAUSED";
			this.#saveRun(run);
			this.#emit(run, "run_paused", {});
		}
		return cloneRun(run);
	}

	public async resumeRun(runId: string): Promise<OrchestratorRun> {
		const run = this.#requireRun(runId);
		if (run.phase !== "PAUSED") return cloneRun(run);
		const restored = this.#prePausePhase.get(runId) ?? "PLANNING";
		this.#prePausePhase.delete(runId);
		run.phase = restored;
		this.#saveRun(run);
		this.#emit(run, "run_resumed", { restoredPhase: restored });
		if (restored === "DISPATCHING" && run.planApproved) {
			return this.dispatchNextWave(runId);
		}
		return cloneRun(run);
	}

	public abortRun(runId: string, reason?: string): OrchestratorRun {
		const run = this.#requireRun(runId);
		if (run.phase === "COMMITTED") {
			throw new Error(`Cannot abort already committed run "${runId}".`);
		}
		const now = Date.now();
		for (const worker of Object.values(run.workers)) {
			if (
				worker.status === "pending" ||
				worker.status === "running" ||
				worker.status === "steered" ||
				worker.status === "verifying"
			) {
				worker.status = "aborted";
				worker.finishedAt = now;
				if (reason) worker.error = reason;
			}
		}
		run.phase = "ABORTED";
		this.#syncFsm(runId, "ABORTED", reason ?? "Aborted by operator");
		this.#saveRun(run);
		this.#emit(run, "run_aborted", { reason: reason ?? "Aborted" });
		return cloneRun(run);
	}

	public async completeWorker(runId: string, workerId: string, input: CompleteWorkerInput): Promise<OrchestratorRun> {
		const run = this.#requireRun(runId);
		const worker = run.workers[workerId];
		if (!worker) throw new Error(`Worker "${workerId}" not found in run "${runId}".`);

		const now = Date.now();
		worker.finishedAt = now;
		if (input.outputSummary !== undefined) worker.outputSummary = input.outputSummary;

		const wave = run.waves[worker.waveIndex];
		if (wave?.checkpointId && input.modifiedFiles) {
			for (const file of input.modifiedFiles) {
				await this.#txEngine.recordAfterModification(file, wave.checkpointId).catch(() => {});
			}
		}

		if (input.tddProofs) {
			let runProofs = this.#workerProofs.get(runId);
			if (!runProofs) {
				runProofs = new Map();
				this.#workerProofs.set(runId, runProofs);
			}
			runProofs.set(workerId, [...input.tddProofs]);
		}

		if (input.success) {
			worker.status = "completed";
			worker.error = undefined;
			if (
				wave &&
				wave.workerIds.every(
					id => run.workers[id]?.status === "completed" || run.workers[id]?.status === "repaired",
				)
			) {
				wave.status = "verifying";
				run.phase = "VERIFYING";
			}
			this.#saveRun(run);
			this.#emit(run, "worker_completed", { workerId, outputSummary: input.outputSummary });
			return cloneRun(run);
		}

		const errMsg = input.error ?? "Worker execution failed";
		worker.error = errMsg;
		const repairer = this.#repairs.get(runId) ?? new SharkSelfRepair({ maxAttempts: run.maxRepairAttempts });
		this.#repairs.set(runId, repairer);
		const diagnosis = repairer.diagnose(errMsg);

		if (diagnosis.recoverable && worker.repairAttempt < run.maxRepairAttempts && repairer.canAttemptRepair()) {
			worker.repairAttempt += 1;
			worker.status = "repaired";
			worker.lastSteeringNote = diagnosis.suggestedAction;
			repairer.recordAttempt(diagnosis, diagnosis.suggestedAction, true);
			run.phase = "REPAIRING";
			this.#saveRun(run);
			this.#emit(run, "worker_repair_scheduled", {
				workerId,
				attempt: worker.repairAttempt,
				failureClass: diagnosis.failureClass,
				suggestedAction: diagnosis.suggestedAction,
			});
		} else {
			worker.status = "failed";
			if (wave) wave.status = "failed";
			run.phase = "BLOCKED";
			this.#saveRun(run);
			this.#emit(run, "worker_failed", { workerId, error: errMsg, failureClass: diagnosis.failureClass });
		}
		return cloneRun(run);
	}

	public async verifyWave(
		runId: string,
		waveIndex: number,
		options: VerifyWaveOptions = {},
	): Promise<{ passed: boolean; report: VerificationGateResult; run: OrchestratorRun }> {
		const run = this.#requireRun(runId);
		const wave = run.waves[waveIndex];
		if (!wave) throw new Error(`Wave #${waveIndex} not found in run "${runId}".`);

		wave.status = "verifying";
		run.phase = "VERIFYING";
		this.#syncFsm(runId, "VALIDATING", `Verifying wave #${waveIndex}`);

		const diagnostics: string[] = [...(options.diagnostics ?? [])];
		let workersOk = true;
		const workerProofs: Record<string, readonly TddCategoryProof[] | undefined> = {};
		const runProofMap = this.#workerProofs.get(runId);
		const ownedFiles: string[] = [];

		for (const workerId of wave.workerIds) {
			const worker = run.workers[workerId];
			if (!worker) continue;
			ownedFiles.push(...worker.contract.ownedFiles);
			if (worker.status === "failed" || worker.status === "aborted") {
				workersOk = false;
				diagnostics.push(`Worker "${workerId}" is in ${worker.status} state.`);
			} else if (worker.status === "pending" || worker.status === "running" || worker.status === "steered") {
				workersOk = false;
				diagnostics.push(`Worker "${workerId}" has not completed yet (status=${worker.status}).`);
			}
			workerProofs[workerId] = options.tddProofs ?? runProofMap?.get(workerId);
		}

		const contentMap = new Map<string, string>();
		for (const file of ownedFiles) {
			const resolved = path.resolve(this.#baseDir, file);
			if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
				try {
					contentMap.set(resolved, fs.readFileSync(resolved, "utf8"));
				} catch {
					// Ignore unreadable files
				}
			}
		}
		const verifierReport = this.#verifier.verifyAll({
			files: ownedFiles,
			contentMap,
			workspaceRoot: this.#baseDir,
		});
		if (verifierReport.verdict === "REJECTED") {
			diagnostics.push(...verifierReport.blockingFailures);
		}

		const hasAnyProofs = Object.values(workerProofs).some(p => p && p.length > 0);
		const requireTdd = options.requireTdd ?? hasAnyProofs;
		const tddResult = this.#tddEnforcer.verifyWaveProofs(workerProofs, {
			required: requireTdd,
			minTestsPerCategory: options.minTestsPerCategory,
		});
		diagnostics.push(...tddResult.diagnostics);

		const exitCodeOk = options.exitCode === undefined || options.exitCode === 0;
		const passed = workersOk && verifierReport.verdict === "APPROVED" && tddResult.passed && exitCodeOk;
		const now = Date.now();
		const report: VerificationGateResult = {
			waveIndex,
			passed,
			exitCode: passed ? 0 : (options.exitCode ?? 1),
			summary: passed
				? `Wave #${waveIndex} passed verification (${tddResult.totalPassed}/${tddResult.totalTests} tests).`
				: `Wave #${waveIndex} failed verification (${diagnostics[0] ?? "gate rejected"}).`,
			tddProofs: tddResult.proofs,
			diagnostics,
			timestamp: now,
		};
		wave.verification = report;

		for (const proof of tddResult.proofs) {
			try {
				const targetFile = ownedFiles[0] ?? proof.testFiles[0] ?? "workspace";
				this.#teiaStore.recordTestRun(
					proof.testFiles[0] ?? proof.category,
					targetFile,
					proof.exitCode === 0 && proof.passedCount >= proof.totalCount,
					proof.totalCount,
					0,
					report.summary,
				);
			} catch {
				// Non-fatal provenance failure
			}
		}

		if (passed) {
			wave.status = "completed";
			for (const workerId of wave.workerIds) {
				const worker = run.workers[workerId];
				if (worker && worker.status !== "completed") worker.status = "completed";
			}
			if (wave.checkpointId) this.#txEngine.commit(wave.checkpointId);

			const allDone = run.waves.every(w => w.status === "completed");
			if (allDone) {
				run.phase = "COMMITTED";
				this.#syncFsm(runId, "COMMITTED", report.summary);
				this.#eventBus.emit({
					type: "task.committed",
					taskId: runId,
					checkpointId: wave.checkpointId ?? `wave-${waveIndex}`,
					artifacts: ownedFiles,
					timestamp: now,
				});
			} else {
				run.currentWaveIndex = Math.min(run.waves.length - 1, waveIndex + 1);
				if (run.approvalPolicy === "phase-gate") {
					run.planApproved = false;
					run.phase = "AWAITING_APPROVAL";
					this.#syncFsm(runId, "WAITING_FOR_APPROVAL", `Phase-gate before wave #${run.currentWaveIndex}`);
				} else {
					run.phase = "DISPATCHING";
					this.#syncFsm(runId, "WAITING_FOR_APPROVAL", `Wave #${waveIndex} verified`);
				}
			}
		} else {
			wave.status = "failed";
			this.#syncFsm(runId, "RECOVERING", report.summary);
			this.#eventBus.emit({
				type: "validation.failed",
				taskId: runId,
				reason: report.summary,
				failedCheck: `wave-${waveIndex}`,
				timestamp: now,
			});
			const repairer = this.#repairs.get(runId) ?? new SharkSelfRepair({ maxAttempts: run.maxRepairAttempts });
			this.#repairs.set(runId, repairer);
			const diag = repairer.diagnose(diagnostics.join("\n"));
			const canRepair =
				diag.recoverable &&
				wave.workerIds.some(id => (run.workers[id]?.repairAttempt ?? 0) < run.maxRepairAttempts);
			if (canRepair && repairer.canAttemptRepair()) {
				run.phase = "REPAIRING";
				repairer.recordAttempt(diag, diag.suggestedAction, false);
				for (const id of wave.workerIds) {
					const w = run.workers[id];
					if (w && w.status !== "completed") {
						w.repairAttempt += 1;
						w.status = "repaired";
						w.lastSteeringNote = diag.suggestedAction;
					}
				}
			} else {
				run.phase = "BLOCKED";
			}
		}

		this.#saveRun(run);
		this.#emit(run, "wave_verified", { waveIndex, passed, summary: report.summary });
		return { passed, report, run: cloneRun(run) };
	}

	public async rollbackWave(
		runId: string,
		waveIndex: number,
		options: { force?: boolean } = {},
	): Promise<RollbackWaveResult> {
		const run = this.#requireRun(runId);
		const wave = run.waves[waveIndex];
		if (!wave) throw new Error(`Wave #${waveIndex} not found in run "${runId}".`);

		let rolledBackFiles: string[] = [];
		let conflicts: string[] = [];

		if (wave.checkpointId) {
			const res = await this.#txEngine.rollback(wave.checkpointId, { force: options.force });
			rolledBackFiles = res.rolledBackFiles;
			conflicts = res.conflicts;
		}

		wave.status = "rolled_back";
		for (const workerId of wave.workerIds) {
			const worker = run.workers[workerId];
			if (worker) {
				worker.status = "pending";
				worker.error = undefined;
			}
		}
		if (run.phase !== "ABORTED") run.phase = "PAUSED";
		for (const file of rolledBackFiles) {
			try {
				this.#teiaStore.invalidateEdgesForFile(file, `Rolled back wave #${waveIndex} in ${runId}`);
			} catch {
				// Non-fatal
			}
		}
		this.#safeRecordDecision(
			`Rollback wave #${waveIndex} (${runId})`,
			`Files restored: ${rolledBackFiles.length}`,
			rolledBackFiles,
		);
		this.#saveRun(run);
		this.#emit(run, "wave_rolled_back", { waveIndex, rolledBackFiles, conflicts });
		return { rolledBackFiles, conflicts, run: cloneRun(run) };
	}

	#computeMaxRisk(files: string[]): ContractRisk {
		let maxRisk: ContractRisk = "none";
		for (const file of files) {
			const res = this.#impactAnalyzer.analyze(file);
			if (RISK_ORDER[res.contractRisk] > RISK_ORDER[maxRisk]) maxRisk = res.contractRisk;
		}
		return maxRisk;
	}

	#syncFsm(runId: string, nextState: ExecutionState, reason?: string): void {
		let fsm = this.#fsms.get(runId);
		if (!fsm) {
			fsm = new ExecutionFSM();
			this.#fsms.set(runId, fsm);
		}
		if (fsm.getState() !== nextState && fsm.canTransitionTo(nextState)) {
			fsm.transition(nextState, reason);
		}
	}

	#requireRun(runId: string): OrchestratorRun {
		const run = this.#runs.get(runId) ?? this.#readRunFromDisk(runId);
		if (!run) throw new Error(`Orchestrator run "${runId}" not found.`);
		this.#runs.set(run.id, run);
		return run;
	}

	#saveAndActivate(run: OrchestratorRun): void {
		this.#activeRunId = run.id;
		this.#runs.set(run.id, run);
		this.#persistRun(run);
	}

	#saveRun(run: OrchestratorRun): void {
		run.updatedAt = Date.now();
		this.#runs.set(run.id, run);
		this.#persistRun(run);
	}

	#persistRun(run: OrchestratorRun): void {
		try {
			fs.mkdirSync(this.#storageDir, { recursive: true });
			const target = path.join(this.#storageDir, `${run.id}.json`);
			const serialized = JSON.stringify(run, null, 2);
			const tmp = `${target}.tmp.${process.pid}.${Date.now()}`;
			fs.writeFileSync(tmp, serialized, "utf8");
			try {
				fs.renameSync(tmp, target);
			} catch {
				fs.writeFileSync(target, serialized, "utf8");
				try {
					fs.unlinkSync(tmp);
				} catch {
					// Ignore temp cleanup error
				}
			}
		} catch {
			// Persistence failure is non-fatal in restricted sandboxes
		}
	}

	#readRunFromDisk(runId: string): OrchestratorRun | null {
		try {
			const filePath = path.join(this.#storageDir, `${runId}.json`);
			if (!fs.existsSync(filePath)) return null;
			return JSON.parse(fs.readFileSync(filePath, "utf8")) as OrchestratorRun;
		} catch {
			return null;
		}
	}

	#loadRunsFromDisk(): void {
		try {
			if (!fs.existsSync(this.#storageDir)) return;
			let latestRun: OrchestratorRun | null = null;
			for (const entry of fs.readdirSync(this.#storageDir)) {
				if (!entry.endsWith(".json") || entry.endsWith(".tasks.json")) continue;
				const parsed = this.#readRunFromDisk(entry.slice(0, -5));
				if (parsed) {
					if (!this.#runs.has(parsed.id)) {
						this.#runs.set(parsed.id, parsed);
					}
					if (!latestRun || parsed.updatedAt > latestRun.updatedAt) {
						latestRun = parsed;
					}
				}
			}
			if (!this.#activeRunId && latestRun) {
				this.#activeRunId = latestRun.id;
			}
		} catch {
			// Ignore unreadable directory
		}
	}

	#safeRecordDecision(title: string, rationale: string, files: string[]): void {
		try {
			this.#teiaStore.recordDecision(title, rationale, files, []);
		} catch {
			// Non-fatal
		}
	}

	#emit(run: OrchestratorRun, eventType: string, payload: Record<string, unknown>): void {
		const event: OrchestratorEvent = {
			runId: run.id,
			eventType,
			phase: run.phase,
			timestamp: Date.now(),
			payload,
			run: cloneRun(run),
		};
		for (const listener of this.#listeners) {
			try {
				listener(event);
			} catch {
				// Isolate listener failures
			}
		}
	}
}
