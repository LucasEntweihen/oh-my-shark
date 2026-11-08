import { describe, expect, it } from "bun:test";
import { ExecutionFSM, SharkSelfRepair } from "../packages/execution-engine/src/index";

describe("Subagent 3 TDD: Transactional FSM & Controlled Self-Repair", () => {
  it("1. Follows valid execution lifecycle transitions from CREATED to COMMITTED", () => {
    const fsm = new ExecutionFSM();
    expect(fsm.getState()).toBe("CREATED");

    fsm.transition("INVESTIGATING", "Investigating codebase");
    expect(fsm.getState()).toBe("INVESTIGATING");

    fsm.transition("PLANNED", "Created DAG plan");
    expect(fsm.getState()).toBe("PLANNED");

    fsm.transition("EXECUTING", "Applying atomic changes");
    expect(fsm.getState()).toBe("EXECUTING");

    fsm.transition("VALIDATING", "Running independent verifier");
    expect(fsm.getState()).toBe("VALIDATING");

    fsm.transition("COMMITTED", "All verification layers passed");
    expect(fsm.getState()).toBe("COMMITTED");
  });

  it("2. Rejects illegal state transitions with explicit exception", () => {
    const fsm = new ExecutionFSM();
    expect(() => fsm.transition("COMMITTED")).toThrow(/Illegal state transition/);
  });

  it("3. Diagnoses syntax errors and extracts offending file and line number", () => {
    const repair = new SharkSelfRepair();
    const errorMsg = "SyntaxError: Unexpected token '}' at src/auth/token.ts:42";

    const diagnosis = repair.diagnose(errorMsg);
    expect(diagnosis.failureClass).toBe("SYNTAX_ERROR");
    expect(diagnosis.sourceFile).toBe("src/auth/token.ts");
    expect(diagnosis.line).toBe(42);
    expect(diagnosis.recoverable).toBe(true);
  });

  it("4. Identifies safety violations as unrecoverable and mandates rollback", () => {
    const repair = new SharkSelfRepair();
    const errorMsg = "Confinement violation: path '../../escape.txt' is outside workspace";

    const diagnosis = repair.diagnose(errorMsg);
    expect(diagnosis.failureClass).toBe("SAFETY_VIOLATION");
    expect(diagnosis.recoverable).toBe(false);
    expect(diagnosis.suggestedAction).toContain("abort operation and trigger immediate rollback");
  });

  it("5. Strictly bounds repair attempts to prevent infinite retry loops", () => {
    const repair = new SharkSelfRepair({ maxAttempts: 3 });
    const dummyDiagnosis = repair.diagnose("TypeError: foo is not a function");

    expect(repair.canAttemptRepair()).toBe(true);
    repair.recordAttempt(dummyDiagnosis, "Fix call site 1", false);

    expect(repair.canAttemptRepair()).toBe(true);
    repair.recordAttempt(dummyDiagnosis, "Fix call site 2", false);

    expect(repair.canAttemptRepair()).toBe(true);
    repair.recordAttempt(dummyDiagnosis, "Fix call site 3", false);

    // Limit reached
    expect(repair.canAttemptRepair()).toBe(false);
    expect(repair.getAttempts().length).toBe(3);
  });
});
