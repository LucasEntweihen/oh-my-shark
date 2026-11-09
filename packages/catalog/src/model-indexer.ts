/**
 * @file packages/catalog/src/model-indexer.ts
 * @description Indexador e particionador sob demanda do catálogo de modelos do OMSK.
 * Projetado para a Fase 09 do Roteiro de Otimização OMSK.
 * Permite resolução sob demanda sem carregar os 10MB brutos de uma vez na memória.
 */

import type { ModelSpec, Api } from "./types";

export interface ModelCatalogIndexEntry {
  readonly providerId: string;
  readonly modelId: string;
  readonly name?: string;
  readonly contextWindow?: number;
  readonly maxTokens?: number;
}

export class ModelCatalogIndexer {
  private static instance: ModelCatalogIndexer | null = null;
  private providerIndex: Map<string, Set<string>> = new Map();
  private modelIndex: Map<string, ModelCatalogIndexEntry> = new Map();
  private cache: Map<string, ModelSpec<Api>> = new Map();
  private maxCacheEntries: number = 500;

  private constructor() {}

  public static getInstance(): ModelCatalogIndexer {
    if (!ModelCatalogIndexer.instance) {
      ModelCatalogIndexer.instance = new ModelCatalogIndexer();
    }
    return ModelCatalogIndexer.instance;
  }

  /**
   * Registra um lote de modelos para um provider gerando apenas os índices compactos em memória.
   */
  public registerProviderModels(providerId: string, models: readonly ModelSpec<Api>[]): void {
    let set = this.providerIndex.get(providerId);
    if (!set) {
      set = new Set();
      this.providerIndex.set(providerId, set);
    }

    for (const m of models) {
      set.add(m.id);
      this.modelIndex.set(m.id, {
        providerId,
        modelId: m.id,
        name: m.name,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
      });

      // Keep in fast lookup cache
      if (this.cache.size < this.maxCacheEntries) {
        this.cache.set(`${providerId}:${m.id}`, m);
      }
    }
  }

  public getModelIdsForProvider(providerId: string): string[] {
    const set = this.providerIndex.get(providerId);
    return set ? Array.from(set) : [];
  }

  public getIndexEntry(modelId: string): ModelCatalogIndexEntry | undefined {
    return this.modelIndex.get(modelId);
  }

  public getCachedSpec(providerId: string, modelId: string): ModelSpec<Api> | undefined {
    return this.cache.get(`${providerId}:${modelId}`);
  }

  public setCachedSpec(providerId: string, modelId: string, spec: ModelSpec<Api>): void {
    if (this.cache.size >= this.maxCacheEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(`${providerId}:${modelId}`, spec);
  }

  public searchModels(query: string, limit: number = 20): ModelCatalogIndexEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: ModelCatalogIndexEntry[] = [];
    for (const entry of this.modelIndex.values()) {
      if (
        entry.modelId.toLowerCase().includes(q) ||
        (entry.name && entry.name.toLowerCase().includes(q)) ||
        entry.providerId.toLowerCase().includes(q)
      ) {
        results.push(entry);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  public getStats(): { totalIndexedModels: number; totalProviders: number; cachedSpecs: number } {
    return {
      totalIndexedModels: this.modelIndex.size,
      totalProviders: this.providerIndex.size,
      cachedSpecs: this.cache.size,
    };
  }

  public clear(): void {
    this.providerIndex.clear();
    this.modelIndex.clear();
    this.cache.clear();
  }
}
