import type { ProjectGraph, SymbolNode } from "./graph";

export type ContractRisk = "none" | "low" | "medium" | "high" | "breaking";

export interface ImpactAnalysisResult {
  targetId: string;
  affectedFiles: string[];
  dependentCallers: string[];
  associatedTests: string[];
  contractRisk: ContractRisk;
  explanation: string;
}

export class ImpactAnalyzer {
  private readonly graph: ProjectGraph;

  constructor(graph: ProjectGraph) {
    this.graph = graph;
  }

  public analyze(targetId: string, options: { isDeleted?: boolean; signatureChanged?: boolean } = {}): ImpactAnalysisResult {
    const node = this.graph.getNode(targetId);
    const transitive = this.graph.getTransitiveDependents(targetId);
    const directCallers = this.graph.findCallers(targetId);
    const tests = this.graph.getAssociatedTests(targetId);

    // Also look for tests among transitive dependents
    for (const depId of transitive) {
      const depNode = this.graph.getNode(depId);
      if (depNode?.kind === "test" && !tests.includes(depId)) {
        tests.push(depId);
      }
    }

    // Determine affected files
    const affectedFilesSet = new Set<string>();
    if (node?.kind === "file") {
      affectedFilesSet.add(node.path);
    } else if (node?.kind === "symbol") {
      affectedFilesSet.add(node.filePath);
    }

    for (const depId of transitive) {
      const depNode = this.graph.getNode(depId);
      if (depNode?.kind === "file") {
        affectedFilesSet.add(depNode.path);
      } else if (depNode?.kind === "symbol") {
        affectedFilesSet.add(depNode.filePath);
      }
    }

    // Evaluate contract risk
    let contractRisk: ContractRisk = "none";
    let explanation = "No significant risk detected.";

    const isExportedSymbol = node?.kind === "symbol" && (node as SymbolNode).exported;

    if (options.isDeleted) {
      if (isExportedSymbol) {
        contractRisk = "breaking";
        explanation = `Exported public symbol "${targetId}" was deleted, breaking all external callers.`;
      } else {
        contractRisk = "high";
        explanation = `Internal symbol or file "${targetId}" was deleted.`;
      }
    } else if (options.signatureChanged) {
      if (isExportedSymbol) {
        contractRisk = "breaking";
        explanation = `Signature of exported symbol "${targetId}" changed. Call sites require refactoring.`;
      } else {
        contractRisk = "medium";
        explanation = `Internal signature of "${targetId}" changed.`;
      }
    } else if (transitive.length > 5) {
      contractRisk = "high";
      explanation = `Modification affects ${transitive.length} transitive dependents across ${affectedFilesSet.size} files.`;
    } else if (transitive.length > 0) {
      contractRisk = "low";
      explanation = `Modification affects ${transitive.length} local dependents.`;
    }

    return {
      targetId,
      affectedFiles: Array.from(affectedFilesSet),
      dependentCallers: directCallers,
      associatedTests: tests,
      contractRisk,
      explanation,
    };
  }
}
