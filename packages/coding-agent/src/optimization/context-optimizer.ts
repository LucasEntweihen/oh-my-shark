/**
 * Oh My Shark — Context & Token Optimizer
 * Otimizador profundo de recursos, memória, CPU e tokens.
 *
 * Implementa:
 * 1. FileReadCache: Cache LRU inteligente indexado por mtime e tamanho, evitando
 *    I/O repetido de disco e alocações de buffer desnecessárias.
 * 2. ToolResultCompactor: Compactação semântica de saídas de ferramentas extensas
 *    em mensagens históricas para economizar tokens sem perda de informação crítica.
 * 3. Telemetria e métricas de eficiência mensuráveis.
 */

import * as fs from "node:fs";

export interface CacheEntry<T> {
	value: T;
	mtimeMs: number;
	size: number;
	timestamp: number;
}

export interface OptimizationMetrics {
	fileReadHits: number;
	fileReadMisses: number;
	bytesSavedFromDisk: number;
	compactedToolResults: number;
	estimatedTokensSaved: number;
}

/**
 * Cache LRU em memória com invalidação estrita por modificação de arquivo (mtime + size).
 */
export class FileReadCache {
	readonly #cache = new Map<string, CacheEntry<string>>();
	readonly #maxEntries: number;
	readonly #ttlMs: number;
	#hits = 0;
	#misses = 0;
	#bytesSaved = 0;

	constructor(options?: { maxEntries?: number; ttlMs?: number }) {
		this.#maxEntries = options?.maxEntries ?? 256;
		this.#ttlMs = options?.ttlMs ?? 60_000; // 1 minuto padrão
	}

	get hits(): number {
		return this.#hits;
	}

	get misses(): number {
		return this.#misses;
	}

	get bytesSaved(): number {
		return this.#bytesSaved;
	}

	/**
	 * Lê um arquivo do cache se válido, ou executa leitura nativa do disco se modificado/ausente.
	 */
	readTextSync(filePath: string): string {
		try {
			const stat = fs.statSync(filePath);
			const now = Date.now();
			const entry = this.#cache.get(filePath);

			if (entry) {
				const isFresh = now - entry.timestamp < this.#ttlMs;
				const isUnchanged = entry.mtimeMs === stat.mtimeMs && entry.size === stat.size;

				if (isFresh && isUnchanged) {
					this.#hits++;
					this.#bytesSaved += stat.size;
					// Reordenar para política LRU
					this.#cache.delete(filePath);
					this.#cache.set(filePath, entry);
					return entry.value;
				}
			}

			// Miss ou arquivo desatualizado: ler disco
			this.#misses++;
			const content = fs.readFileSync(filePath, "utf-8");

			// Se atingiu o limite de capacidade, desalocar o item mais antigo (primeira chave)
			if (this.#cache.size >= this.#maxEntries) {
				const oldestKey = this.#cache.keys().next().value;
				if (oldestKey) {
					this.#cache.delete(oldestKey);
				}
			}

			this.#cache.set(filePath, {
				value: content,
				mtimeMs: stat.mtimeMs,
				size: stat.size,
				timestamp: now,
			});

			return content;
		} catch (error) {
			this.#misses++;
			// Propagar erro padrão do fs caso arquivo não exista
			throw error;
		}
	}

	/**
	 * Invalida um arquivo específico (por exemplo, após um edit ou write).
	 */
	invalidate(filePath: string): void {
		this.#cache.delete(filePath);
	}

	/**
	 * Invalida todo o cache.
	 */
	clear(): void {
		this.#cache.clear();
	}
}

/**
 * Compactador Semântico de Resultados de Ferramentas no Histórico de Conversa.
 * Reduz a extensão de saídas gigantescas que já foram consumidas pelas turns anteriores.
 */
export class ToolResultCompactor {
	readonly #maxRetainedLines: number;
	readonly #maxRetainedChars: number;
	#compactedCount = 0;
	#tokensSaved = 0;

	constructor(options?: { maxRetainedLines?: number; maxRetainedChars?: number }) {
		this.#maxRetainedLines = options?.maxRetainedLines ?? 40;
		this.#maxRetainedChars = options?.maxRetainedChars ?? 2_500;
	}

	get compactedCount(): number {
		return this.#compactedCount;
	}

	get tokensSaved(): number {
		return this.#tokensSaved;
	}

	/**
	 * Compacta uma string de saída de ferramenta caso ela exceda os limites configurados.
	 * Preserva o início, o final e métricas essenciais para o modelo entender o resultado.
	 */
	compactOutput(toolName: string, output: string): { content: string; wasCompacted: boolean } {
		if (output.length <= this.#maxRetainedChars) {
			return { content: output, wasCompacted: false };
		}

		const lines = output.split(/\r?\n/);
		if (lines.length <= this.#maxRetainedLines && output.length <= this.#maxRetainedChars) {
			return { content: output, wasCompacted: false };
		}

		const originalCharLength = output.length;
		const originalLineCount = lines.length;

		// Preservar as primeiras 15 linhas e as últimas 15 linhas
		const headCount = Math.min(15, Math.floor(lines.length / 2));
		const tailCount = Math.min(15, Math.floor(lines.length / 2));
		const headLines = lines.slice(0, headCount);
		const tailLines = lines.slice(lines.length - tailCount);
		const elidedCount = originalLineCount - headCount - tailCount;

		const compacted = [
			...headLines,
			`\n[... Oh My Shark Context Optimizer: ${elidedCount} linhas compactadas do output da tool "${toolName}" (${originalCharLength} caracteres originais) ...]`,
			...tailLines,
		].join("\n");

		this.#compactedCount++;
		// Estimativa conservadora de 4 caracteres por token
		const savedChars = Math.max(0, originalCharLength - compacted.length);
		this.#tokensSaved += Math.floor(savedChars / 4);

		return {
			content: compacted,
			wasCompacted: true,
		};
	}
}

/**
 * Singleton ou orquestrador central de otimizações do harness Oh My Shark.
 */
export class ContextOptimizer {
	readonly fileCache: FileReadCache;
	readonly compactor: ToolResultCompactor;

	constructor() {
		this.fileCache = new FileReadCache();
		this.compactor = new ToolResultCompactor();
	}

	/**
	 * Coleta telemetria e métricas de desempenho em tempo real.
	 */
	getMetrics(): OptimizationMetrics {
		return {
			fileReadHits: this.fileCache.hits,
			fileReadMisses: this.fileCache.misses,
			bytesSavedFromDisk: this.fileCache.bytesSaved,
			compactedToolResults: this.compactor.compactedCount,
			estimatedTokensSaved: this.compactor.tokensSaved,
		};
	}

	/**
	 * Resumo formatado para logs e diagnósticos.
	 */
	formatMetricsSummary(): string {
		const m = this.getMetrics();
		const totalDiskReads = m.fileReadHits + m.fileReadMisses;
		const hitRate = totalDiskReads > 0 ? ((m.fileReadHits / totalDiskReads) * 100).toFixed(1) : "0.0";
		const mbSaved = (m.bytesSavedFromDisk / (1024 * 1024)).toFixed(2);

		return (
			`[OMSK Context Optimizer] Cache Hit Rate: ${hitRate}% (${m.fileReadHits}/${totalDiskReads}) | ` +
			`I/O Evitado: ${mbSaved} MB | Tokens Economizados: ~${m.estimatedTokensSaved} | Tool Compacts: ${m.compactedToolResults}`
		);
	}
}

export const globalContextOptimizer = new ContextOptimizer();
