/**
 * OhMyShark (OMSK) Controlled Self-Repair Engine
 * Diagnoses failure classes, computes minimal surgical corrections,
 * enforces strict retry bounds (max 3), and triggers safe rollbacks.
 */

export type FailureClass =
  | "SYNTAX_ERROR"
  | "TYPE_ERROR"
  | "IMPORT_ERROR"
  | "TEST_FAILURE"
  | "SAFETY_VIOLATION"
  | "RUNTIME_EXCEPTION";

export interface DiagnosedFailure {
  failureClass: FailureClass;
  message: string;
  sourceFile?: string;
  line?: number;
  recoverable: boolean;
  suggestedAction: string;
}

export interface RepairAttempt {
  attemptNumber: number;
  diagnosedFailure: DiagnosedFailure;
  appliedAction: string;
  timestamp: number;
  success: boolean;
}

export class SharkSelfRepair {
  private maxAttempts: number;
  private attempts: RepairAttempt[] = [];

  constructor(options: { maxAttempts?: number } = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
  }

  /**
   * Classifies error messages and stack traces into structured failure classes.
   */
  public diagnose(errorText: string): DiagnosedFailure {
    const text = errorText.toLowerCase();

    if (text.includes("syntaxerror") || text.includes("unexpected token") || text.includes("unbalanced")) {
      const match = errorText.match(/([a-zA-Z0-9_\-./\\]+\.(?:ts|js|json)):(\d+)/);
      return {
        failureClass: "SYNTAX_ERROR",
        message: errorText.slice(0, 200),
        sourceFile: match?.[1],
        line: match ? parseInt(match[2], 10) : undefined,
        recoverable: true,
        suggestedAction: "Rebalance syntax tokens or fix malformed JSON/TypeScript syntax.",
      };
    }

    if (text.includes("confinement violation") || text.includes("path traversal") || text.includes("forbidden-escape")) {
      return {
        failureClass: "SAFETY_VIOLATION",
        message: errorText.slice(0, 200),
        recoverable: false,
        suggestedAction: "Halt execution: abort operation and trigger immediate rollback to protect host workspace.",
      };
    }

    if (text.includes("cannot find module") || text.includes("module not found") || text.includes("enoent")) {
      return {
        failureClass: "IMPORT_ERROR",
        message: errorText.slice(0, 200),
        recoverable: true,
        suggestedAction: "Resolve relative import path or verify module export declarations.",
      };
    }

    if (text.includes("typeerror") || text.includes("is not assignable") || text.includes("property does not exist")) {
      return {
        failureClass: "TYPE_ERROR",
        message: errorText.slice(0, 200),
        recoverable: true,
        suggestedAction: "Align interface properties, refine type guards, or provide exact types.",
      };
    }

    if (text.includes("fail") || text.includes("expect(") || text.includes("assertionerror")) {
      return {
        failureClass: "TEST_FAILURE",
        message: errorText.slice(0, 200),
        recoverable: true,
        suggestedAction: "Adjust implementation invariants to fulfill test observable contracts.",
      };
    }

    return {
      failureClass: "RUNTIME_EXCEPTION",
      message: errorText.slice(0, 200),
      recoverable: true,
      suggestedAction: "Isolate exception stack trace and apply defensive handling.",
    };
  }

  /**
   * Evaluates if a repair attempt can be safely scheduled within retry limits.
   */
  public canAttemptRepair(): boolean {
    return this.attempts.length < this.maxAttempts;
  }

  /**
   * Records a repair attempt.
   */
  public recordAttempt(failure: DiagnosedFailure, action: string, success: boolean): RepairAttempt {
    const attempt: RepairAttempt = {
      attemptNumber: this.attempts.length + 1,
      diagnosedFailure: failure,
      appliedAction: action,
      timestamp: Date.now(),
      success,
    };
    this.attempts.push(attempt);
    return attempt;
  }

  public getAttempts(): readonly RepairAttempt[] {
    return this.attempts;
  }

  public reset(): void {
    this.attempts = [];
  }
}
