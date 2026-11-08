/**
 * OhMyShark (OMSK) Context Engine
 * Context engineering with adaptive intent scoring, structural relevance,
 * token budgeting, and stale context detection.
 */

export type TaskIntent = "bug_fix" | "feature" | "refactor" | "optimization" | "security";

export interface ContextSourceItem {
  id: string;
  path: string;
  type: "file" | "symbol" | "test" | "interface" | "doc";
  content: string;
  symbols?: string[];
  dependencies?: string[];
  lastModified?: number;
  hash?: string;
}

export interface ScoredContextItem extends ContextSourceItem {
  score: number;
  reasons: string[];
}

export interface ContextAssemblyResult {
  intent: TaskIntent;
  items: ScoredContextItem[];
  totalTokensEstimate: number;
  excludedCount: number;
  staleCount: number;
}

export class SharkContextEngine {
  private fileHashes = new Map<string, string>();

  /**
   * Infers task intent from natural language instructions.
   */
  public inferIntent(instruction: string): TaskIntent {
    const lower = instruction.toLowerCase();
    if (lower.includes("vulnerab") || lower.includes("security") || lower.includes("seguran") || lower.includes("cve")) {
      return "security";
    }
    if (lower.includes("optimi") || lower.includes("otimiza") || lower.includes("perform") || lower.includes("gargalo")) {
      return "optimization";
    }
    if (lower.includes("refactor") || lower.includes("refatora") || lower.includes("limpar") || lower.includes("reorganiza")) {
      return "refactor";
    }
    if (lower.includes("fix") || lower.includes("bug") || lower.includes("erro") || lower.includes("falha") || lower.includes("crash")) {
      return "bug_fix";
    }
    return "feature";
  }

  /**
   * Scores an individual item's relevance based on query keywords, graph relations, and intent.
   */
  public scoreItem(item: ContextSourceItem, query: string, intent: TaskIntent): ScoredContextItem {
    let score = 0;
    const reasons: string[] = [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    // 1. Lexical match in path and symbols
    const pathLower = item.path.toLowerCase();
    for (const token of queryTokens) {
      if (pathLower.includes(token)) {
        score += 25;
        reasons.push(`Path matches token '${token}'`);
      }
      if (item.symbols?.some(s => s.toLowerCase().includes(token))) {
        score += 35;
        reasons.push(`Symbol matches token '${token}'`);
      }
      if (item.content.toLowerCase().includes(token)) {
        score += 10;
        reasons.push(`Content matches token '${token}'`);
      }
    }

    // 2. Intent-specific priority weighting
    switch (intent) {
      case "bug_fix":
        if (item.type === "test" || item.path.includes(".test.") || item.path.includes(".spec.")) {
          score += 30;
          reasons.push("Test file prioritized for bug fix");
        }
        break;
      case "security":
        if (item.path.includes("auth") || item.path.includes("token") || item.path.includes("security") || item.path.includes("crypto")) {
          score += 40;
          reasons.push("Security-critical component match");
        }
        break;
      case "refactor":
        if (item.type === "interface" || (item.dependencies && item.dependencies.length > 3)) {
          score += 25;
          reasons.push("Core architectural interface prioritized for refactor");
        }
        break;
      case "optimization":
        if (item.path.includes("perf") || item.path.includes("bench") || item.path.includes("cache")) {
          score += 30;
          reasons.push("Performance/caching module prioritized");
        }
        break;
      case "feature":
      default:
        if (item.type === "file" && !item.path.includes(".test.")) {
          score += 15;
          reasons.push("Source module prioritized for feature development");
        }
        break;
    }

    return {
      ...item,
      score: Math.min(100, Math.max(0, score)),
      reasons,
    };
  }

  /**
   * Assembles high-signal context within a token budget.
   */
  public assembleContext(
    items: ContextSourceItem[],
    query: string,
    options: { maxTokens?: number; intent?: TaskIntent } = {}
  ): ContextAssemblyResult {
    const intent = options.intent ?? this.inferIntent(query);
    const maxTokens = options.maxTokens ?? 8000;

    const scored = items.map(item => this.scoreItem(item, query, intent));
    scored.sort((a, b) => b.score - a.score);

    const selected: ScoredContextItem[] = [];
    let currentTokens = 0;
    let excludedCount = 0;
    let staleCount = 0;

    for (const item of scored) {
      // Rough heuristic: ~4 chars per token
      const itemTokens = Math.ceil(item.content.length / 4);

      if (this.isStale(item.path, item.hash)) {
        staleCount++;
      }

      if (currentTokens + itemTokens <= maxTokens && item.score > 0) {
        selected.push(item);
        currentTokens += itemTokens;
      } else {
        excludedCount++;
      }
    }

    return {
      intent,
      items: selected,
      totalTokensEstimate: currentTokens,
      excludedCount,
      staleCount,
    };
  }

  /**
   * Tracks and detects stale context based on SHA-256 or fast hashes.
   */
  public updateHash(path: string, hash: string): void {
    this.fileHashes.set(path, hash);
  }

  public isStale(path: string, currentHash?: string): boolean {
    if (!currentHash) return false;
    const recorded = this.fileHashes.get(path);
    if (!recorded) return false;
    return recorded !== currentHash;
  }
}
