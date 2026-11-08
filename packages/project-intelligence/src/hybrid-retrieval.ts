/**
 * OhMyShark (OMSK) Hybrid Retrieval
 * Combines Lexical (FTS5 / tokens), Structural (AST / Graph), Contextual (history),
 * and Semantic scoring with weighted reranking and deduplication.
 */

export interface RetrievalDocument {
  id: string;
  path: string;
  title: string;
  content: string;
  symbols?: string[];
  callers?: string[];
  dependencies?: string[];
  lastAccessed?: number;
  tags?: string[];
}

export interface RetrievalResult {
  document: RetrievalDocument;
  score: number;
  lexicalScore: number;
  structuralScore: number;
  contextualScore: number;
  semanticScore: number;
  matchReasons: string[];
}

export interface HybridRetrievalWeights {
  lexical: number;
  structural: number;
  contextual: number;
  semantic: number;
}

export const DEFAULT_HYBRID_WEIGHTS: HybridRetrievalWeights = {
  lexical: 0.35,
  structural: 0.35,
  contextual: 0.15,
  semantic: 0.15,
};

export class SharkHybridRetrieval {
  private documents: Map<string, RetrievalDocument> = new Map();
  private weights: HybridRetrievalWeights;

  constructor(weights: HybridRetrievalWeights = DEFAULT_HYBRID_WEIGHTS) {
    this.weights = weights;
  }

  public index(doc: RetrievalDocument): void {
    this.documents.set(doc.id, doc);
  }

  public indexBatch(docs: RetrievalDocument[]): void {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
  }

  /**
   * Performs hybrid search combining all 4 retrieval dimensions.
   */
  public search(
    query: string,
    options: {
      limit?: number;
      activeSymbols?: string[];
      activeFiles?: string[];
    } = {}
  ): RetrievalResult[] {
    const limit = options.limit ?? 10;
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const activeSymbolsSet = new Set((options.activeSymbols ?? []).map(s => s.toLowerCase()));
    const activeFilesSet = new Set((options.activeFiles ?? []).map(f => f.toLowerCase()));

    const results: RetrievalResult[] = [];

    for (const doc of this.documents.values()) {
      const matchReasons: string[] = [];

      // 1. Lexical Scoring (0-100)
      let lexicalScore = 0;
      const docText = `${doc.title} ${doc.path} ${doc.content}`.toLowerCase();
      for (const token of queryTokens) {
        if (doc.title.toLowerCase().includes(token)) {
          lexicalScore += 30;
          matchReasons.push(`Title matches '${token}'`);
        } else if (doc.path.toLowerCase().includes(token)) {
          lexicalScore += 20;
          matchReasons.push(`Path matches '${token}'`);
        } else if (docText.includes(token)) {
          lexicalScore += 10;
        }
      }
      lexicalScore = Math.min(100, lexicalScore);

      // 2. Structural Scoring (0-100)
      let structuralScore = 0;
      if (doc.symbols && doc.symbols.length > 0) {
        for (const sym of doc.symbols) {
          const symLower = sym.toLowerCase();
          if (queryTokens.some(t => symLower.includes(t))) {
            structuralScore += 40;
            matchReasons.push(`Symbol '${sym}' matches query`);
          }
          if (activeSymbolsSet.has(symLower)) {
            structuralScore += 30;
            matchReasons.push(`Symbol '${sym}' is in active scope`);
          }
        }
      }
      if (options.activeFiles && doc.dependencies) {
        for (const dep of doc.dependencies) {
          if (activeFilesSet.has(dep.toLowerCase())) {
            structuralScore += 25;
            matchReasons.push(`Direct dependency on active file '${dep}'`);
          }
        }
      }
      structuralScore = Math.min(100, structuralScore);

      // 3. Contextual Scoring (0-100)
      let contextualScore = 0;
      if (doc.lastAccessed) {
        const ageHours = (Date.now() - doc.lastAccessed) / (1000 * 60 * 60);
        if (ageHours < 1) contextualScore += 50;
        else if (ageHours < 24) contextualScore += 30;
        else if (ageHours < 72) contextualScore += 10;
      }
      if (doc.tags?.some(t => queryTokens.includes(t.toLowerCase()))) {
        contextualScore += 40;
        matchReasons.push("Tag matches query context");
      }
      contextualScore = Math.min(100, contextualScore);

      // 4. Semantic Scoring heuristic (0-100)
      let semanticScore = 0;
      const combinedOverlap = queryTokens.filter(t => docText.includes(t)).length;
      if (queryTokens.length > 0) {
        semanticScore = Math.min(100, Math.round((combinedOverlap / queryTokens.length) * 100));
      }

      // Weighted Reranking
      const totalScore =
        lexicalScore * this.weights.lexical +
        structuralScore * this.weights.structural +
        contextualScore * this.weights.contextual +
        semanticScore * this.weights.semantic;

      if (totalScore > 0) {
        results.push({
          document: doc,
          score: Math.round(totalScore * 100) / 100,
          lexicalScore,
          structuralScore,
          contextualScore,
          semanticScore,
          matchReasons,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}
