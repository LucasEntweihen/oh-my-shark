import type { ProjectGraph, ProjectNode } from "./graph";

export interface IndexEntry {
  filePath: string;
  hash: string;
  indexedAt: number;
  extractedNodes: string[];
}

export class IncrementalIndexer {
  private readonly indexCache = new Map<string, IndexEntry>();
  private readonly graph: ProjectGraph;

  constructor(graph: ProjectGraph) {
    this.graph = graph;
  }

  public computeHash(content: string): string {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(content);
    return hasher.digest("hex");
  }

  public shouldReindex(filePath: string, content: string): boolean {
    const entry = this.indexCache.get(filePath);
    if (!entry) return true;
    const currentHash = this.computeHash(content);
    return entry.hash !== currentHash;
  }

  public indexFile(filePath: string, content: string, extractNodesFn: (content: string) => ProjectNode[]): {
    cacheHit: boolean;
    nodesIndexed: number;
    hash: string;
  } {
    const currentHash = this.computeHash(content);
    const existing = this.indexCache.get(filePath);

    if (existing && existing.hash === currentHash) {
      return {
        cacheHit: true,
        nodesIndexed: existing.extractedNodes.length,
        hash: currentHash,
      };
    }

    const nodes = extractNodesFn(content);
    const nodeIds: string[] = [];
    for (const node of nodes) {
      this.graph.addNode(node);
      nodeIds.push(node.id);
    }

    this.indexCache.set(filePath, {
      filePath,
      hash: currentHash,
      indexedAt: Date.now(),
      extractedNodes: nodeIds,
    });

    return {
      cacheHit: false,
      nodesIndexed: nodes.length,
      hash: currentHash,
    };
  }

  public getCacheEntry(filePath: string): IndexEntry | undefined {
    return this.indexCache.get(filePath);
  }

  public invalidate(filePath: string): void {
    this.indexCache.delete(filePath);
  }

  public getCachedFilesCount(): number {
    return this.indexCache.size;
  }
}
