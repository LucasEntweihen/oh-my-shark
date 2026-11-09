/**
 * @file packages/terminal-layout/src/incremental-renderer.ts
 * @description Renderizador incremental, dirty region tracking e cache de renderização da TUI.
 * Projetado para a Fase 06 do Roteiro de Otimização OMSK.
 * Evita redesenho da tela inteira a cada token de streaming recebido.
 */

export interface RenderableRegion {
  readonly id: string;
  readonly content: string;
  readonly version: number;
}

export interface RenderFrameResult {
  readonly renderedRegions: string[];
  readonly skippedRegions: string[];
  readonly durationMs: number;
  readonly fullRedraw: boolean;
}

export class IncrementalTuiRenderer {
  private lastRenderedContent: Map<string, string> = new Map();
  private dirtyRegions: Set<string> = new Set();
  private markdownCache: Map<string, string> = new Map();
  private widthCache: Map<string, number> = new Map();
  private maxCacheSize: number = 1000;

  // Frame coalescing state
  private pendingRenderPromise: Promise<RenderFrameResult> | null = null;
  private minFrameIntervalMs: number = 16; // ~60fps target
  private lastFrameTimestamp: number = 0;

  constructor(options: { minFrameIntervalMs?: number; maxCacheSize?: number } = {}) {
    this.minFrameIntervalMs = options.minFrameIntervalMs ?? 16;
    this.maxCacheSize = options.maxCacheSize ?? 1000;
  }

  public markDirty(regionId: string): void {
    this.dirtyRegions.add(regionId);
  }

  public markAllDirty(): void {
    for (const id of this.lastRenderedContent.keys()) {
      this.dirtyRegions.add(id);
    }
  }

  public isDirty(regionId: string): boolean {
    return this.dirtyRegions.has(regionId) || !this.lastRenderedContent.has(regionId);
  }

  /**
   * Renderiza apenas as regiões que sofreram modificação desde o último frame.
   */
  public renderIncremental(regions: RenderableRegion[], forceFullRedraw: boolean = false): RenderFrameResult {
    const start = performance.now();
    const rendered: string[] = [];
    const skipped: string[] = [];

    for (const region of regions) {
      const prev = this.lastRenderedContent.get(region.id);
      const needsRender = forceFullRedraw || this.dirtyRegions.has(region.id) || prev !== region.content;

      if (needsRender) {
        rendered.push(region.id);
        this.lastRenderedContent.set(region.id, region.content);
        this.dirtyRegions.delete(region.id);
      } else {
        skipped.push(region.id);
      }
    }

    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    this.lastFrameTimestamp = performance.now();

    return {
      renderedRegions: rendered,
      skippedRegions: skipped,
      durationMs,
      fullRedraw: forceFullRedraw,
    };
  }

  /**
   * Cache de Markdown processado: reutiliza renderização de blocos idênticos.
   */
  public getCachedMarkdown(source: string, renderFn: (src: string) => string): string {
    if (this.markdownCache.has(source)) {
      return this.markdownCache.get(source)!;
    }

    const rendered = renderFn(source);

    if (this.markdownCache.size >= this.maxCacheSize) {
      const oldestKey = this.markdownCache.keys().next().value;
      if (oldestKey !== undefined) this.markdownCache.delete(oldestKey);
    }

    this.markdownCache.set(source, rendered);
    return rendered;
  }

  /**
   * Cache de cálculo de largura visual (colunas ANSI) para evitar recalcular em loops.
   */
  public getCachedStringWidth(str: string, computeFn: (s: string) => number): number {
    if (this.widthCache.has(str)) {
      return this.widthCache.get(str)!;
    }

    const width = computeFn(str);

    if (this.widthCache.size >= this.maxCacheSize) {
      const oldestKey = this.widthCache.keys().next().value;
      if (oldestKey !== undefined) this.widthCache.delete(oldestKey);
    }

    this.widthCache.set(str, width);
    return width;
  }

  public clearCaches(): void {
    this.markdownCache.clear();
    this.widthCache.clear();
    this.lastRenderedContent.clear();
    this.dirtyRegions.clear();
  }

  public getStats(): { cachedMarkdownBlocks: number; cachedWidths: number; trackedRegions: number } {
    return {
      cachedMarkdownBlocks: this.markdownCache.size,
      cachedWidths: this.widthCache.size,
      trackedRegions: this.lastRenderedContent.size,
    };
  }
}
