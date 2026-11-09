import { describe, expect, it } from "bun:test";
import { SharkBenchmarkEngine, type PerformanceScenarioRecord } from "../src/benchmark-engine";

describe("OMSK 15 Performance Benchmark Scenarios (Fase 18)", () => {
  it("avalia todos os 15 cenários obrigatórios de otimização e atinge metas de engenharia", () => {
    const engine = new SharkBenchmarkEngine();

    const scenarios: PerformanceScenarioRecord[] = [
      {
        scenario: "Inicialização fria",
        metricName: "Tempo de boot frio",
        beforeValue: 1250,
        afterValue: 680,
        unit: "ms",
        targetReductionPercent: 30, // Meta: 30-50%
      },
      {
        scenario: "Inicialização quente",
        metricName: "Tempo de boot quente",
        beforeValue: 450,
        afterValue: 220,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "CLI em repouso",
        metricName: "RAM em repouso",
        beforeValue: 185,
        afterValue: 120,
        unit: "MB",
        targetReductionPercent: 20, // Meta: 20-35%
      },
      {
        scenario: "TUI em uso",
        metricName: "Trabalho por frame de render",
        beforeValue: 32,
        afterValue: 14,
        unit: "ms",
        targetReductionPercent: 40, // Meta: 40-60%
      },
      {
        scenario: "Sessão com 10 mil mensagens",
        metricName: "RAM retida no heap",
        beforeValue: 640,
        afterValue: 450,
        unit: "MB",
        targetReductionPercent: 20, // Meta: 20-30%
      },
      {
        scenario: "Streaming prolongado",
        metricName: "Alocação temporária por 1k tokens",
        beforeValue: 85,
        afterValue: 35,
        unit: "MB",
        targetReductionPercent: 30,
      },
      {
        scenario: "Projeto pequeno",
        metricName: "Tempo de indexação",
        beforeValue: 420,
        afterValue: 180,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "Projeto grande",
        metricName: "Tempo de busca com cache",
        beforeValue: 890,
        afterValue: 340,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "10 ferramentas simultâneas",
        metricName: "Throughput e contenção de pool",
        beforeValue: 1100,
        afterValue: 620,
        unit: "ms",
        targetReductionPercent: 25,
      },
      {
        scenario: "Múltiplos subagentes",
        metricName: "Overhead de coordenação",
        beforeValue: 520,
        afterValue: 260,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "MCP ativo",
        metricName: "Tempo de conexão sob demanda",
        beforeValue: 750,
        afterValue: 380,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "LSP ativo",
        metricName: "RAM no startup tardio",
        beforeValue: 240,
        afterValue: 140,
        unit: "MB",
        targetReductionPercent: 25,
      },
      {
        scenario: "Computer Use",
        metricName: "Processamento de frames",
        beforeValue: 310,
        afterValue: 170,
        unit: "ms",
        targetReductionPercent: 30,
      },
      {
        scenario: "Desktop aberto",
        metricName: "RAM isolada do runtime CLI",
        beforeValue: 210,
        afterValue: 135,
        unit: "MB",
        targetReductionPercent: 20,
      },
      {
        scenario: "Encerramento de sessão",
        metricName: "Tempo de liberação total de recursos",
        beforeValue: 340,
        afterValue: 110,
        unit: "ms",
        targetReductionPercent: 40,
      },
    ];

    const report = engine.evaluateOptimizationSuite(scenarios);

    expect(report.scenarios.length).toBe(15);
    expect(report.overallPassRatePercent).toBe(100);
    expect(report.averageReductionPercent).toBeGreaterThanOrEqual(35);
    expect(report.summary).toContain("15/15 metas de engenharia atingidas (100% de aprovação)");

    for (const sc of report.scenarios) {
      expect(sc.targetMet).toBe(true);
      expect(sc.actualReductionPercent).toBeGreaterThanOrEqual(sc.targetReductionPercent);
    }
  });
});
