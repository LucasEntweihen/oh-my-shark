import type { CheckpointEngine } from "@ohms/execution-engine";
import type { SharkEventBus } from "@ohms/kernel";
import type { ImpactAnalyzer } from "@ohms/project-intelligence";
import type { TransactionalEditEngine } from "../edit/transactional-engine";
import type { MenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import type { TddEnforcer } from "./tdd-enforcer";

export type OrchestratorPhase =
	| "CREATED"
	| "PLANNING"
	| "AWAITING_APPROVAL"
	| "DISPATCHING"
	| "EXECUTING"
	| "VERIFYING"
	| "REPAIRING"
	| "COMMITTED"
	| "PAUSED"
	| "ABORTED"
	| "BLOCKED";

export type OrchestratorApprovalPolicy = "auto" | "approve-before-dispatch" | "phase-gate";

export type OrchestratorWorkerRole =
	| "shark-lead"
	| "code-architect"
	| "verification-specialist"
	| "security-sentinel"
	| "theological-scholar";

export interface TddCategoryProof {
	category: string;
	passedCount: number;
	totalCount: number;
	testFiles: string[];
	command: string;
	exitCode: number;
}

export interface VerificationGateResult {
	waveIndex: number;
	passed: boolean;
	exitCode: number;
	summary: string;
	tddProofs: TddCategoryProof[];
	diagnostics: string[];
	timestamp: number;
}

export interface OrchestratorHandoffContract {
	inputs: string[];
	ownedFiles: string[];
	acceptanceCriteria: string[];
	replanIf: string[];
}

export type OrchestratorWorkerStatus =
	| "pending"
	| "running"
	| "steered"
	| "verifying"
	| "completed"
	| "failed"
	| "repaired"
	| "aborted";

export interface OrchestratorWorker {
	id: string;
	title: string;
	role: OrchestratorWorkerRole;
	waveIndex: number;
	status: OrchestratorWorkerStatus;
	contract: OrchestratorHandoffContract;
	dependencies: string[];
	lastSteeringNote?: string;
	repairAttempt: number;
	outputSummary?: string;
	error?: string;
	startedAt?: number;
	finishedAt?: number;
}

export type OrchestratorWaveStatus = "pending" | "running" | "verifying" | "completed" | "failed" | "rolled_back";

export interface OrchestratorWave {
	index: number;
	status: OrchestratorWaveStatus;
	workerIds: string[];
	checkpointId?: string;
	parallel: boolean;
	verification?: VerificationGateResult;
}

export interface OrchestratorRun {
	id: string;
	goal: string;
	phase: OrchestratorPhase;
	approvalPolicy: OrchestratorApprovalPolicy;
	maxConcurrency: number;
	maxRepairAttempts: number;
	planApproved: boolean;
	approvalNotes?: string;
	rejectionReason?: string;
	waves: OrchestratorWave[];
	workers: Record<string, OrchestratorWorker>;
	currentWaveIndex: number;
	impactRisk?: string;
	createdAt: number;
	updatedAt: number;
}

export interface OrchestratorEvent {
	runId: string;
	eventType: string;
	phase: OrchestratorPhase;
	timestamp: number;
	payload: Record<string, unknown>;
	run?: OrchestratorRun;
}

export interface OrchestratorTaskDraft {
	id?: string;
	title: string;
	role?: OrchestratorWorkerRole;
	dependencies?: string[];
	contract?: Partial<OrchestratorHandoffContract>;
	files?: string[];
	inputs?: string[];
	acceptanceCriteria?: string[];
	replanIf?: string[];
	resources?: string[];
}

export interface CreatePlanOptions {
	goal: string;
	tasks?: OrchestratorTaskDraft[];
	approvalPolicy?: OrchestratorApprovalPolicy;
	maxConcurrency?: number;
	maxRepairAttempts?: number;
}

export interface CompleteWorkerInput {
	success: boolean;
	outputSummary?: string;
	error?: string;
	tddProofs?: TddCategoryProof[];
	modifiedFiles?: string[];
}

export interface VerifyWaveOptions {
	tddProofs?: TddCategoryProof[];
	requireTdd?: boolean;
	minTestsPerCategory?: number;
	diagnostics?: string[];
	command?: string;
	exitCode?: number;
}

export interface RollbackWaveResult {
	rolledBackFiles: string[];
	conflicts: string[];
	run: OrchestratorRun;
}

export interface OrchestratorRunSummary {
	id: string;
	goal: string;
	phase: OrchestratorPhase;
	currentWaveIndex: number;
	totalWaves: number;
	workerCount: number;
	createdAt: number;
	updatedAt: number;
}

export type OrchestratorEventListener = (event: OrchestratorEvent) => void;

export interface OrchestratorEngineOptions {
	storageDir?: string;
	baseDir?: string;
	eventBus?: SharkEventBus;
	teiaStore?: MenteEmTeiaStore;
	impactAnalyzer?: ImpactAnalyzer;
	txEngine?: TransactionalEditEngine;
	checkpointEngine?: CheckpointEngine;
	tddEnforcer?: TddEnforcer;
	minTestsPerCategory?: number;
}
