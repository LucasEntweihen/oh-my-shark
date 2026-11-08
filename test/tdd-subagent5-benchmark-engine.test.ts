import { describe, expect, it } from "bun:test";
import {
  SharkBenchmarkEngine,
  type SystemMetrics,
} from "../packages/execution-engine/src/index";

describe("Subagent 5 TDD: Shark Benchmark Engine & Performance Lab", () => {
  const engine = new SharkBenchmarkEngine();

  const baselineMetrics: SystemMetrics = {
    taskSuccessRate: 75,
    testPassRate: 80,
    regressionRate: 15,
    timeToCompletionMs: 45000,
    timeToFirstTokenMs: 800,
    tokenConsumption: 12000,
    toolEfficiencyCalls: 12,
    contextPrecision: 65,
    startupTimeMs: 1800,
    recoveryRate: 50,
  };

  it("1. Computes weighted superiority score comparing target against baseline", () => {
    const omskMetrics: SystemMetrics = {
      taskSuccessRate: 92,
      testPassRate: 95,
      regressionRate: 3,
      timeToCompletionMs: 22000,
      timeToFirstTokenMs: 350,
      tokenConsumption: 6500,
      toolEfficiencyCalls: 5,
      contextPrecision: 90,
      startupTimeMs: 450,
      recoveryRate: 95,
    };

    const comparison = engine.compare("OhMyShark (OMSK)", omskMetrics, "Oh My Pi (OMP)", baselineMetrics);
    expect(comparison.superiorityScore).toBeGreaterThan(1.0);
    expect(comparison.summary).toContain("superiority");
    expect(comparison.advantages.length).toBeGreaterThanOrEqual(4);
  });

  it("2. Identifies specific advantages for lower regression and higher success", () => {
    const omskMetrics: SystemMetrics = {
      ...baselineMetrics,
      taskSuccessRate: 90,
      regressionRate: 5,
    };

    const comparison = engine.compare("OMSK", omskMetrics, "OMP Baseline", baselineMetrics);
    expect(comparison.advantages.some(a => a.includes("Higher task success rate"))).toBe(true);
    expect(comparison.advantages.some(a => a.includes("Lower regression rate"))).toBe(true);
  });

  it("3. Identifies token efficiency advantage when target consumes fewer tokens", () => {
    const omskMetrics: SystemMetrics = {
      ...baselineMetrics,
      tokenConsumption: 5000, // consumes 5000 vs baseline 12000
    };

    const comparison = engine.compare("OMSK", omskMetrics, "OMP Baseline", baselineMetrics);
    expect(comparison.advantages.some(a => a.includes("token consumption"))).toBe(true);
  });

  it("4. Evaluates parity (1.0x score) when target and baseline metrics are identical", () => {
    const comparison = engine.compare("Target", baselineMetrics, "Baseline", baselineMetrics);
    expect(comparison.superiorityScore).toBeCloseTo(1.0, 1);
    expect(comparison.disadvantages.length).toBe(0);
  });

  it("5. Penalizes score and identifies disadvantages when target underperforms", () => {
    const degradedMetrics: SystemMetrics = {
      ...baselineMetrics,
      taskSuccessRate: 50, // lower than baseline 75
      regressionRate: 35,  // worse than baseline 15
    };

    const comparison = engine.compare("Degraded Target", degradedMetrics, "Baseline", baselineMetrics);
    expect(comparison.superiorityScore).toBeLessThan(1.0);
    expect(comparison.disadvantages.some(d => d.includes("Lower task success rate"))).toBe(true);
  });
});
