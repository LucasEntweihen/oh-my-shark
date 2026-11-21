import type { TddCategoryProof } from "./types";

export interface TddCheckOptions {
	required?: boolean;
	minTestsPerCategory?: number;
	expectedCategories?: string[];
}

export interface TddWorkerViolation {
	workerId: string;
	category?: string;
	reason: string;
}

export interface TddVerificationResult {
	passed: boolean;
	totalPassed: number;
	totalTests: number;
	proofs: TddCategoryProof[];
	diagnostics: string[];
	violations: TddWorkerViolation[];
}

export function formatTddProofSummary(proof: TddCategoryProof): string {
	const state = proof.exitCode === 0 && proof.passedCount >= proof.totalCount ? "PASS" : "FAIL";
	return `[${proof.category}] ${state} ${proof.passedCount}/${proof.totalCount} (exit=${proof.exitCode}, files=${proof.testFiles.length})`;
}

/**
 * Enforces OhMyShark's strict TDD contract across orchestrator workers and waves:
 * every modification category requires >= minTestsPerCategory passing tests,
 * clean exit code (0), and non-empty test file evidence.
 */
export class TddEnforcer {
	readonly #defaultMinTestsPerCategory: number;

	constructor(options: { minTestsPerCategory?: number } = {}) {
		this.#defaultMinTestsPerCategory = Math.max(1, options.minTestsPerCategory ?? 5);
	}

	public get minTestsPerCategory(): number {
		return this.#defaultMinTestsPerCategory;
	}

	public verifyWorkerProofs(
		workerId: string,
		proofs: readonly TddCategoryProof[] | undefined,
		options: TddCheckOptions = {},
	): TddVerificationResult {
		const required = options.required ?? true;
		const minTests = Math.max(1, options.minTestsPerCategory ?? this.#defaultMinTestsPerCategory);
		const diagnostics: string[] = [];
		const violations: TddWorkerViolation[] = [];
		const normalizedProofs: TddCategoryProof[] = proofs ? [...proofs] : [];
		let totalPassed = 0;
		let totalTests = 0;

		if (normalizedProofs.length === 0) {
			if (required) {
				const reason = `Worker "${workerId}" submitted no TDD category proofs (required >= ${minTests} passing tests per category).`;
				violations.push({ workerId, reason });
				diagnostics.push(reason);
			} else {
				diagnostics.push(`Worker "${workerId}": TDD proofs optional and omitted.`);
			}
			return {
				passed: !required,
				totalPassed: 0,
				totalTests: 0,
				proofs: [],
				diagnostics,
				violations,
			};
		}

		const seenCategories = new Set<string>();

		for (const proof of normalizedProofs) {
			const category = proof.category.trim();
			if (!category) {
				const reason = `Worker "${workerId}" submitted a TDD proof with an empty category.`;
				violations.push({ workerId, reason });
				diagnostics.push(reason);
				continue;
			}
			seenCategories.add(category);

			totalPassed += Math.max(0, proof.passedCount);
			totalTests += Math.max(0, proof.totalCount);

			const validFiles = Array.isArray(proof.testFiles)
				? proof.testFiles.filter(f => typeof f === "string" && f.trim().length > 0)
				: [];

			if (validFiles.length === 0) {
				const reason = `Worker "${workerId}" [${category}] has empty testFiles list.`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			}

			if (proof.exitCode !== 0) {
				const reason = `Worker "${workerId}" [${category}] exited with non-zero exitCode=${proof.exitCode}.`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			}

			if (!proof.command || !proof.command.trim()) {
				const reason = `Worker "${workerId}" [${category}] is missing the executed test command.`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			}

			if (proof.totalCount <= 0) {
				const reason = `Worker "${workerId}" [${category}] reported totalCount=${proof.totalCount} (must be > 0).`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			} else if (proof.passedCount < proof.totalCount) {
				const reason = `Worker "${workerId}" [${category}] has failing tests (${proof.passedCount}/${proof.totalCount} passed).`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			}

			if (required && proof.passedCount < minTests) {
				const reason = `Worker "${workerId}" [${category}] passed ${proof.passedCount} tests, below minimum required (${minTests}).`;
				violations.push({ workerId, category, reason });
				diagnostics.push(reason);
			}

			diagnostics.push(`Worker "${workerId}" ${formatTddProofSummary(proof)}`);
		}

		if (options.expectedCategories) {
			for (const expected of options.expectedCategories) {
				if (!seenCategories.has(expected)) {
					const reason = `Worker "${workerId}" missing required TDD category "${expected}".`;
					violations.push({ workerId, category: expected, reason });
					diagnostics.push(reason);
				}
			}
		}

		return {
			passed: violations.length === 0,
			totalPassed,
			totalTests,
			proofs: normalizedProofs,
			diagnostics,
			violations,
		};
	}

	public verifyWaveProofs(
		workerProofs: Record<string, readonly TddCategoryProof[] | undefined>,
		options: TddCheckOptions = {},
	): TddVerificationResult {
		const entries = Object.entries(workerProofs);
		if (entries.length === 0) {
			const required = options.required ?? true;
			const msg = required
				? "No workers present in wave to verify TDD proofs."
				: "Wave has no workers; TDD verification skipped.";
			return {
				passed: !required,
				totalPassed: 0,
				totalTests: 0,
				proofs: [],
				diagnostics: [msg],
				violations: required ? [{ workerId: "wave", reason: msg }] : [],
			};
		}

		const allProofs: TddCategoryProof[] = [];
		const allDiagnostics: string[] = [];
		const allViolations: TddWorkerViolation[] = [];
		let totalPassed = 0;
		let totalTests = 0;

		for (const [workerId, proofs] of entries) {
			const result = this.verifyWorkerProofs(workerId, proofs, options);
			allProofs.push(...result.proofs);
			allDiagnostics.push(...result.diagnostics);
			allViolations.push(...result.violations);
			totalPassed += result.totalPassed;
			totalTests += result.totalTests;
		}

		return {
			passed: allViolations.length === 0,
			totalPassed,
			totalTests,
			proofs: allProofs,
			diagnostics: allDiagnostics,
			violations: allViolations,
		};
	}
}
