import { describe, it, expect } from "bun:test";
import {
  ExecutionFSM,
  CheckpointEngine,
  PlanValidator,
} from "../src/index";

describe("Shark Transactional Execution Engine (Module 4 - Resilient Execution & Checkpoints)", () => {
  it("Test 1: should enforce valid FSM transitions and reject illegal state jumps", () => {
    const fsm = new ExecutionFSM();
    expect(fsm.getState()).toBe("CREATED");

    // Illegal jump from CREATED directly to COMMITTED
    expect(() => {
      fsm.transition("COMMITTED");
    }).toThrow(/Illegal state transition/);

    // Valid progression
    fsm.transition("INVESTIGATING");
    expect(fsm.getState()).toBe("INVESTIGATING");

    fsm.transition("PLANNED");
    expect(fsm.getState()).toBe("PLANNED");

    fsm.transition("EXECUTING");
    expect(fsm.getState()).toBe("EXECUTING");

    fsm.transition("VALIDATING");
    expect(fsm.getState()).toBe("VALIDATING");

    fsm.transition("COMMITTED", "All tests passed and code committed cleanly");
    expect(fsm.getState()).toBe("COMMITTED");
    expect(fsm.isTerminal()).toBe(true);

    const history = fsm.getHistory();
    expect(history.length).toBe(5);
    expect(history[4].to).toBe("COMMITTED");
  });

  it("Test 2: should create checkpoints with SHA-256 snapshots and retrieve state", () => {
    const engine = new CheckpointEngine();

    const initialFiles = {
      "src/core.ts": "export const VERSION = '1.0';",
      "src/config.json": '{"mode": "production"}',
    };

    const checkpoint = engine.createCheckpoint("op-step-1", initialFiles);

    expect(checkpoint.id.startsWith("chk-")).toBe(true);
    expect(checkpoint.operationId).toBe("op-step-1");
    expect(engine.getCheckpointCount()).toBe(1);

    const retrieved = engine.getCheckpoint(checkpoint.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.files["src/core.ts"].content).toBe("export const VERSION = '1.0';");
    expect(typeof retrieved?.files["src/core.ts"].hash).toBe("string");
    expect(retrieved?.files["src/core.ts"].hash.length).toBe(64); // SHA-256 hex string
  });

  it("Test 3: should perform selective rollback per file to a previous checkpoint", () => {
    const engine = new CheckpointEngine();

    const originalFileContent = "export function stableCalculation() { return 10; }";
    const chk = engine.createCheckpoint("op-baseline", {
      "src/calc.ts": originalFileContent,
      "src/other.ts": "const x = 1;",
    });

    // Simulate bad edit
    const buggyFileContent = "export function stableCalculation() { throw new Error('bug'); }";
    expect(buggyFileContent).not.toBe(originalFileContent);

    // Rollback only src/calc.ts
    const restoredContent = engine.rollbackFile(chk.id, "src/calc.ts");
    expect(restoredContent).toBe(originalFileContent);

    // Full checkpoint rollback
    const allRestored = engine.rollbackCheckpoint(chk.id);
    expect(allRestored["src/calc.ts"]).toBe(originalFileContent);
    expect(allRestored["src/other.ts"]).toBe("const x = 1;");
  });

  it("Test 4: should detect external concurrency conflict when file hash has drifted", () => {
    const engine = new CheckpointEngine();

    const baselineContent = "console.log('original baseline');";
    const expectedHash = engine.computeHash(baselineContent);

    // File was modified externally in the background
    const externalModifiedContent = "console.log('concurrent modification by human');";

    const hasConflict = engine.detectExternalConflict(externalModifiedContent, expectedHash);
    expect(hasConflict).toBe(true);

    // When content matches expected baseline
    const noConflict = engine.detectExternalConflict(baselineContent, expectedHash);
    expect(noConflict).toBe(false);
  });

  it("Test 5: should route to RECOVERING state when plan validation fails rather than committing blindly", () => {
    const fsm = new ExecutionFSM();
    fsm.transition("INVESTIGATING");
    fsm.transition("PLANNED");
    fsm.transition("EXECUTING");
    fsm.transition("VALIDATING");

    const validator = new PlanValidator();

    // Check 1: Artifact check (passes)
    validator.addCheck("artifact-exists", "Verifies target binary was created", () => true);

    // Check 2: Test assertion (fails)
    validator.addCheck("regression-suite", "Ensures zero regressions", () => ({
      pass: false,
      message: "Test suite failed: 2 broken tests in auth module",
    }));

    const report = validator.validate();
    expect(report.valid).toBe(false);
    expect(report.failedChecks).toContain("regression-suite");
    expect(report.errors[0]).toContain("2 broken tests");

    // Because validation failed, transition to RECOVERING instead of COMMITTED
    fsm.transition("RECOVERING", report.errors.join("; "));
    expect(fsm.getState()).toBe("RECOVERING");

    // From RECOVERING, can loop back to EXECUTING after fix
    fsm.transition("EXECUTING", "Attempting fix for broken auth tests");
    expect(fsm.getState()).toBe("EXECUTING");
  });
});
