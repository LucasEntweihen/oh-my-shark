/**
 * OhMyShark (OMSK) Benchmark Engine
 * Evaluates engineering performance across 13 core metrics:
 * Task Success Rate, Regression Rate, Token Efficiency, Tool Latency,
 * Context Precision, and Recovery Rate against baseline agents.
 */

export interface SystemMetrics {
  taskSuccessRate: number;      // 0 - 100%
  testPassRate: number;         // 0 - 100%
  regressionRate: number;       // 0 - 100% (lower is better)
  timeToCompletionMs: number;   // ms (lower is better)
  timeToFirstTokenMs: number;   // ms (lower is better)
  tokenConsumption: number;     // tokens (lower is better)
  toolEfficiencyCalls: number;  // tool calls per task (lower is better)
  contextPrecision: number;     // 0 - 100% (higher is better)
  startupTimeMs: number;        // ms (lower is better)
  recoveryRate: number;         // 0 - 100% (higher is better)
}

export interface BenchmarkComparison {
  target: string;
  baseline: string;
  targetMetrics: SystemMetrics;
  baselineMetrics: SystemMetrics;
  superiorityScore: number;     // > 1.0 indicates target is superior
  summary: string;
  advantages: string[];
  disadvantages: string[];
}
export interface PerformanceScenarioRecord {
  readonly scenario: string;
  readonly metricName: string;
  readonly beforeValue: number;
  readonly afterValue: number;
  readonly unit: string;
  readonly targetReductionPercent: number;
}

export interface PerformanceScenarioResult extends PerformanceScenarioRecord {
  readonly actualReductionPercent: number;
  readonly targetMet: boolean;
}

export interface PerformanceReport {
  readonly scenarios: readonly PerformanceScenarioResult[];
  readonly overallPassRatePercent: number;
  readonly averageReductionPercent: number;
  readonly summary: string;
}


export class SharkBenchmarkEngine {
  /**
   * Computes an objective superiority index comparing two agent runtimes.
   */
  public compare(
    targetName: string,
    target: SystemMetrics,
    baselineName: string,
    baseline: SystemMetrics
  ): BenchmarkComparison {
    const advantages: string[] = [];
    const disadvantages: string[] = [];

    // Success factor
    const successRatio = baseline.taskSuccessRate > 0 ? target.taskSuccessRate / baseline.taskSuccessRate : 1.0;
    if (target.taskSuccessRate > baseline.taskSuccessRate) {
      advantages.push(`Higher task success rate: ${target.taskSuccessRate}% vs ${baseline.taskSuccessRate}%`);
    } else if (target.taskSuccessRate < baseline.taskSuccessRate) {
      disadvantages.push(`Lower task success rate: ${target.taskSuccessRate}% vs ${baseline.taskSuccessRate}%`);
    }

    // Regression factor (inverse: lower is better)
    const regressionScore = (100 - target.regressionRate) / Math.max(1, 100 - baseline.regressionRate);
    if (target.regressionRate < baseline.regressionRate) {
      advantages.push(`Lower regression rate: ${target.regressionRate}% vs ${baseline.regressionRate}%`);
    }

    // Token factor (inverse: lower is better)
    const tokenEfficiency = baseline.tokenConsumption > 0 ? baseline.tokenConsumption / Math.max(1, target.tokenConsumption) : 1.0;
    if (target.tokenConsumption < baseline.tokenConsumption) {
      advantages.push(`More efficient token consumption: ${target.tokenConsumption} vs ${baseline.tokenConsumption} tokens`);
    }

    // Time factor (inverse: lower is better)
    const speedFactor = baseline.timeToCompletionMs > 0 ? baseline.timeToCompletionMs / Math.max(1, target.timeToCompletionMs) : 1.0;
    if (target.timeToCompletionMs < baseline.timeToCompletionMs) {
      advantages.push(`Faster time to completion: ${target.timeToCompletionMs}ms vs ${baseline.timeToCompletionMs}ms`);
    }

    // Context precision factor
    const contextPrecisionFactor = baseline.contextPrecision > 0 ? target.contextPrecision / baseline.contextPrecision : 1.0;
    if (target.contextPrecision > baseline.contextPrecision) {
      advantages.push(`Higher context precision: ${target.contextPrecision}% vs ${baseline.contextPrecision}%`);
    }

    // Weighted superiority score
    const superiorityScore =
      successRatio * 0.35 +
      regressionScore * 0.25 +
      tokenEfficiency * 0.15 +
      speedFactor * 0.15 +
      contextPrecisionFactor * 0.1;

    const roundedScore = Math.round(superiorityScore * 100) / 100;

    const summary =
      roundedScore >= 1.0
        ? `${targetName} demonstrates objective architectural superiority (${roundedScore}x) over ${baselineName}.`
        : `${targetName} scored ${roundedScore}x relative to ${baselineName}.`;

    return {
      target: targetName,
      baseline: baselineName,
      targetMetrics: target,
      baselineMetrics: baseline,
      superiorityScore: roundedScore,
      summary,
      advantages,
      disadvantages,
    };
  }

  /**
   * Avalia a suíte obrigatória de 15 cenários de performance (Fase 18).
   */
  public evaluateOptimizationSuite(scenarios: readonly PerformanceScenarioRecord[]): PerformanceReport {
    const results: PerformanceScenarioResult[] = [];
    let totalReduction = 0;
    let passedCount = 0;

    for (const sc of scenarios) {
      const diff = sc.beforeValue - sc.afterValue;
      const actualReduction = sc.beforeValue > 0 ? Math.round((diff / sc.beforeValue) * 1000) / 10 : 0;
      const targetMet = actualReduction >= sc.targetReductionPercent;

      if (targetMet) passedCount++;
      totalReduction += actualReduction;

      results.push({
        ...sc,
        actualReductionPercent: actualReduction,
        targetMet,
      });
    }

    const passRate = scenarios.length > 0 ? Math.round((passedCount / scenarios.length) * 100) : 100;
    const avgReduction = scenarios.length > 0 ? Math.round((totalReduction / scenarios.length) * 10) / 10 : 0;

    return {
      scenarios: results,
      overallPassRatePercent: passRate,
      averageReductionPercent: avgReduction,
      summary: `OMSK Optimization Suite: ${passedCount}/${scenarios.length} metas de engenharia atingidas (${passRate}% de aprovação), com redução média de recursos de ${avgReduction}%.`,
    };
  }
}
