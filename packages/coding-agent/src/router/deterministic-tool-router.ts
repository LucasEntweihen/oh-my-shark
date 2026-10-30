/**
 * Deterministic Tool Router for Oh My Shark (OMSK).
 * Routes user or subagent investigation intents to the optimal, lowest-cost tool
 * without requiring intermediate LLM calls.
 * 
 * Strategy:
 * - AST pattern ($A, $$$ARGS, structural AST changes) -> ast_edit
 * - Symbol navigation, definition, hover, type reference -> lsp
 * - Exact string matching, regex, phrase queries -> grep (ripgrep)
 * - Large file inspection -> progressive_read
 * - Conceptual or architectural history -> semantic_memory / mente_em_teia
 */

export type RoutedTool = "grep" | "lsp" | "ast_edit" | "progressive_read" | "semantic_memory" | "read";

export interface RouteQueryContext {
	filePath?: string;
	language?: string;
	fileSizeLines?: number;
	intentType?: "search" | "edit" | "inspect" | "debug";
}

export interface RouteDecision {
	primaryTool: RoutedTool;
	confidence: number;
	rationale: string;
	optimizedParams: Record<string, unknown>;
	secondaryFallback?: RoutedTool;
}

export class DeterministicToolRouter {
	public route(query: string, context: RouteQueryContext = {}): RouteDecision {
		const trimmed = query.trim();

		// 1. AST Structural Patterns: contains metavariables like $VAR, $$$NAME, or ast-grep operators
		if (/\$[A-Z0-9_]+|\$\$\$[A-Z0-9_]+/.test(trimmed)) {
			return {
				primaryTool: "ast_edit",
				confidence: 0.98,
				rationale: "Detected metavariable syntax ($VAR or $$$NAME) suited for structural AST pattern matching.",
				optimizedParams: { pattern: trimmed, language: context.language ?? "typescript" },
				secondaryFallback: "grep",
			};
		}

		// 2. Progressive read for large files
		if (context.intentType === "inspect" && (context.fileSizeLines ?? 0) > 80 && context.filePath) {
			return {
				primaryTool: "progressive_read",
				confidence: 0.95,
				rationale: "Target file exceeds 80 lines; progressive reading reduces token consumption.",
				optimizedParams: { filePath: context.filePath, level: 1 },
				secondaryFallback: "read",
			};
		}

		// 3. LSP Definition / Reference lookups: exact identifier with symbol context
		const isSingleSymbol = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed) && trimmed.length > 2;
		const hasSymbolKeyword = /\b(definition|references|implements|signature|typedef)\b/i.test(trimmed);

		if ((isSingleSymbol || hasSymbolKeyword) && context.filePath) {
			return {
				primaryTool: "lsp",
				confidence: 0.92,
				rationale: "Identifier/symbol query with active file context routed to Language Server Protocol.",
				optimizedParams: {
					symbol: isSingleSymbol ? trimmed : trimmed.replace(/\b(definition|references|implements)\b/gi, "").trim(),
					file: context.filePath,
				},
				secondaryFallback: "grep",
			};
		}

		// 4. Semantic / Architectural Concept
		const isConceptualQuestion = /\b(why|architecture|decision|flow|concept|teia|design rationale)\b/i.test(trimmed);
		if (isConceptualQuestion) {
			return {
				primaryTool: "semantic_memory",
				confidence: 0.88,
				rationale: "Conceptual architecture or provenance question routed to Mente em Teia SQLite memory.",
				optimizedParams: { query: trimmed },
				secondaryFallback: "grep",
			};
		}

		// 5. Default High-Speed Text Search (ripgrep)
		return {
			primaryTool: "grep",
			confidence: 0.90,
			rationale: "Text pattern search routed directly to high-speed ripgrep text engine.",
			optimizedParams: { pattern: trimmed, path: context.filePath ?? "." },
			secondaryFallback: "read",
		};
	}
}

let defaultToolRouter: DeterministicToolRouter | null = null;

export function getDeterministicToolRouter(): DeterministicToolRouter {
	if (!defaultToolRouter) {
		defaultToolRouter = new DeterministicToolRouter();
	}
	return defaultToolRouter;
}
