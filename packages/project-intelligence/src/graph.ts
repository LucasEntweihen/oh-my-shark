export type NodeKind = "file" | "symbol" | "test";
export type EdgeKind = "imports" | "calls" | "tests" | "implements";

export interface BaseNode {
  id: string;
  kind: NodeKind;
}

export interface FileNode extends BaseNode {
  kind: "file";
  path: string;
  exports: string[];
  language: string;
}

export interface SymbolNode extends BaseNode {
  kind: "symbol";
  name: string;
  filePath: string;
  exported: boolean;
  signature?: string;
}

export interface TestNode extends BaseNode {
  kind: "test";
  filePath: string;
  testCount: number;
}

export type ProjectNode = FileNode | SymbolNode | TestNode;

export interface ProjectEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export class ProjectGraph {
  private readonly nodes = new Map<string, ProjectNode>();
  private readonly forwardEdges = new Map<string, Set<ProjectEdge>>();
  private readonly reverseEdges = new Map<string, Set<ProjectEdge>>();

  public addNode(node: ProjectNode): void {
    this.nodes.set(node.id, node);
  }

  public getNode(id: string): ProjectNode | undefined {
    return this.nodes.get(id);
  }

  public addEdge(edge: ProjectEdge): void {
    let fSet = this.forwardEdges.get(edge.from);
    if (!fSet) {
      fSet = new Set();
      this.forwardEdges.set(edge.from, fSet);
    }
    fSet.add(edge);

    let rSet = this.reverseEdges.get(edge.to);
    if (!rSet) {
      rSet = new Set();
      this.reverseEdges.set(edge.to, rSet);
    }
    rSet.add(edge);
  }

  public getDependencies(id: string, kind?: EdgeKind): string[] {
    const edges = this.forwardEdges.get(id);
    if (!edges) return [];
    const results: string[] = [];
    for (const edge of edges) {
      if (!kind || edge.kind === kind) {
        results.push(edge.to);
      }
    }
    return results;
  }

  public getDependents(id: string, kind?: EdgeKind): string[] {
    const edges = this.reverseEdges.get(id);
    if (!edges) return [];
    const results: string[] = [];
    for (const edge of edges) {
      if (!kind || edge.kind === kind) {
        results.push(edge.from);
      }
    }
    return results;
  }

  public findCallers(symbolId: string): string[] {
    return this.getDependents(symbolId, "calls");
  }

  public getAssociatedTests(targetId: string): string[] {
    const directTests = this.getDependents(targetId, "tests");
    if (directTests.length > 0) return directTests;

    // If target is symbol, check tests on its parent file
    const node = this.nodes.get(targetId);
    if (node && node.kind === "symbol") {
      return this.getDependents(node.filePath, "tests");
    }

    return [];
  }

  public getTransitiveDependents(id: string): string[] {
    const visited = new Set<string>();
    const queue = [id];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const direct = this.getDependents(current);
      for (const dep of direct) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(visited);
  }

  public getAllNodes(): ProjectNode[] {
    return Array.from(this.nodes.values());
  }
}
