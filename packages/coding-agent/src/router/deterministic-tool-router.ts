/**
 * Deterministic Tool Router for Oh My Shark (OMSK).
 * Routes user or subagent investigation intents to the optimal, lowest-cost tool
 * without requiring intermediate LLM calls.
 * 
 * Strategy:
 * - Rollback / Checkpoint operations -> transactional_engine
 * - Test execution & test evidence -> test_runner
 * - Security auditing & vulnerability detection -> sec_review
 * - AST pattern ($A, $$$ARGS, structural AST changes) -> ast_edit
 * - Symbol navigation, definition, hover, type reference -> lsp
 * - Large file inspection (>80 lines) -> progressive_read
 * - Conceptual or architectural history -> semantic_memory / mente_em_teia
 * - Exact string matching, regex, phrase queries -> grep (ripgrep)
 */

export type RoutedTool =
	| "grep"
	| "lsp"
	| "ast_edit"
	| "progressive_read"
	| "semantic_memory"
	| "read"
	| "transactional_engine"
	| "test_runner"
	| "sec_review";

export interface RouteQueryContext {
	filePath?: string;
	language?: string;
	fileSizeLines?: number;
	intentType?: "search" | "edit" | "inspect" | "debug" | "test" | "rollback" | "refactor" | "audit";
}

export interface RouteDecision {
	primaryTool: RoutedTool;
	confidence: number;
	rationale: string;
	optimizedParams: Record<string, unknown>;
	secondaryFallback?: RoutedTool;
	tertiaryFallback?: RoutedTool;
}

export class DeterministicToolRouter {
	public route(query: string, context: RouteQueryContext = {}): RouteDecision {
		const trimmed = query.trim();

		// 1. Transactional Rollback & Checkpoint Intent
		if (
			context.intentType === "rollback" ||
			/\b(rollback|revert checkpoint|undo edit|restore snapshot)\b/i.test(trimmed)
		) {
			return {
				primaryTool: "transactional_engine",
				confidence: 0.99,
				rationale: "Detected rollback or checkpoint restore intent, routed directly to TransactionalEditEngine.",
				optimizedParams: { action: "rollback", targetPath: context.filePath },
				secondaryFallback: "read",
			};
		}

		// 2. Test Execution & Evidence Verification Intent
		if (
			context.intentType === "test" ||
			/\b(run test|assert|test evidence|verify test|test suite)\b/i.test(trimmed)
		) {
			return {
				primaryTool: "test_runner",
				confidence: 0.96,
				rationale: "Detected test run or verification intent, routed to test runner & evidence recorder.",
				optimizedParams: { testPath: context.filePath ?? trimmed },
				secondaryFallback: "grep",
				tertiaryFallback: "read",
			};
		}

		// 3. Security Audit & Vulnerability Review Intent
		if (
			context.intentType === "audit" ||
			/\b(sec review|security audit|vulnerability|cve|injection|audit security)\b/i.test(trimmed)
		) {
			return {
				primaryTool: "sec_review",
				confidence: 0.97,
				rationale: "Detected security audit or vulnerability review request, routed to Security Sentinel.",
				optimizedParams: { target: context.filePath ?? "." },
				secondaryFallback: "grep",
				tertiaryFallback: "ast_edit",
			};
		}

		// 4. AST Structural Patterns: contains metavariables like $VAR, $$$NAME, or ast-grep operators
		if (/\$[A-Z0-9_]+|\$\$\$[A-Z0-9_]+/.test(trimmed) || context.intentType === "refactor") {
			return {
				primaryTool: "ast_edit",
				confidence: 0.98,
				rationale: "Detected structural pattern or refactor intent suited for structural AST pattern matching.",
				optimizedParams: { pattern: trimmed, language: context.language ?? "typescript" },
				secondaryFallback: "lsp",
				tertiaryFallback: "grep",
			};
		}

		// 5. Progressive read for large files (>80 lines) or explicit outline/signatures requests
		const isOutlineQuery = /\b(outline|signatures|symbols only|level 1|level 2)\b/i.test(trimmed);
		if (
			((context.intentType === "inspect" && (context.fileSizeLines ?? 0) > 80) || isOutlineQuery) &&
			context.filePath
		) {
			return {
				primaryTool: "progressive_read",
				confidence: 0.95,
				rationale: "Target file exceeds 80 lines or requests structural outline; progressive reading minimizes context tokens.",
				optimizedParams: { filePath: context.filePath, level: isOutlineQuery ? 1 : 2 },
				secondaryFallback: "read",
				tertiaryFallback: "grep",
			};
		}

		// 6. LSP Definition / Reference lookups: exact identifier with symbol context
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
				tertiaryFallback: "progressive_read",
			};
		}

		// 7. Semantic / Architectural Concept
		const isConceptualQuestion = /\b(why|architecture|decision|flow|concept|teia|design rationale)\b/i.test(trimmed);
		if (isConceptualQuestion) {
			return {
				primaryTool: "semantic_memory",
				confidence: 0.88,
				rationale: "Conceptual architecture or provenance question routed to Mente em Teia SQLite memory.",
				optimizedParams: { query: trimmed },
				secondaryFallback: "grep",
				tertiaryFallback: "read",
			};
		}

		// 8. Default High-Speed Text Search (ripgrep)
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
