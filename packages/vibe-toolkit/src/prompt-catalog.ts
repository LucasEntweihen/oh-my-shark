import * as fs from "node:fs";
import * as path from "node:path";

export interface VibePromptMeta {
	id: string;
	title: string;
	filename: string;
	category: "setup" | "quality" | "orchestration" | "review";
	summary: string;
	whenToUse: string;
}

export const VIBE_PROMPT_CATALOG: readonly VibePromptMeta[] = [
	{
		id: "01",
		title: "Project Sanitation",
		filename: "01-project-sanitation.md",
		category: "quality",
		summary: "Remove dead code, orphan files, redundant dependencies and stale configs safely.",
		whenToUse: "When cleaning up a messy or bloated repository before making significant architectural changes.",
	},
	{
		id: "02",
		title: "ESLint Warning Burndown",
		filename: "02-eslint-warning-burndown.md",
		category: "quality",
		summary: "Progressive, safe elimination of linter warnings without breaking behavior or masking errors.",
		whenToUse: "When paying down technical lint debt across a codebase incrementally.",
	},
	{
		id: "03",
		title: "Multi-Agent Code Review",
		filename: "03-multi-agent-code-review.md",
		category: "review",
		summary: "Parallel read-only review from distinct specialized angles (security, types, performance, tests).",
		whenToUse: "After implementing a nontrivial feature or before a critical release.",
	},
	{
		id: "04",
		title: "Brainstorm to Plan",
		filename: "04-brainstorm-to-plan.md",
		category: "orchestration",
		summary: "Transform ambiguous ideas or goals into a concrete, reviewable, bite-sized execution plan.",
		whenToUse: "Before touching code on large features or complex refactors.",
	},
	{
		id: "05",
		title: "Parallel Wave Dispatch",
		filename: "05-parallel-wave-dispatch.md",
		category: "orchestration",
		summary: "Dispatches independent task waves with strictly disjoint files and serialized commits.",
		whenToUse: "When executing a plan with multiple independent tasks to maximize throughput safely.",
	},
	{
		id: "06",
		title: "Memory Bootstrap",
		filename: "06-memory-bootstrap.md",
		category: "setup",
		summary: "Sets up persistent two-layer memory (session and durable project lessons).",
		whenToUse: "When bootstrapping long-term context retention across agent sessions.",
	},
	{
		id: "07",
		title: "ESLint Complete Setup",
		filename: "07-eslint-complete-setup.md",
		category: "quality",
		summary: "Installs modern, type-checked ESLint configuration with canonical scripts.",
		whenToUse: "When setting up linting from scratch or migrating to flat config.",
	},
	{
		id: "08",
		title: "ESLint Quality Gates Install",
		filename: "08-eslint-quality-gates-install.md",
		category: "quality",
		summary: "Enforces architectural boundaries, forbidden globals, and strict type constraints.",
		whenToUse: "When locking down quality standards and preventing architectural drift.",
	},
	{
		id: "09",
		title: "File Size Refactor (350-line gate)",
		filename: "09-file-size-refactor.md",
		category: "quality",
		summary: "Decomposes oversized files (>350 lines) into focused, single-responsibility modules.",
		whenToUse: "When a module grows beyond 350 lines and risks becoming an unmaintainable monolith.",
	},
	{
		id: "10",
		title: "Development Environment Setup",
		filename: "10-development-environment-setup.md",
		category: "setup",
		summary: "Prepares developer workstation with runtimes, CLI tools, MCP servers, and manifests.",
		whenToUse: "When onboarding a new development machine or standardizing local environments.",
	},
	{
		id: "11",
		title: "Next Project Bootstrap",
		filename: "11-next-project-bootstrap.md",
		category: "setup",
		summary: "Creates new application with PRODUCT.md, canonical 9-doc harness, and quality gates.",
		whenToUse: "When starting a greenfield project from a high-level product idea.",
	},
	{
		id: "12",
		title: "Existing Project Setup / Adoption",
		filename: "12-existing-project-setup.md",
		category: "setup",
		summary: "Diagnoses, adopts, and upgrades the toolkit in an existing project, preserving stack and contracts.",
		whenToUse: "When integrating the Vibe Coding Toolkit into an existing codebase.",
	},
	{
		id: "13",
		title: "Security Review",
		filename: "13-security-review.md",
		category: "review",
		summary: "Differential security analysis covering OWASP, secrets, trust boundaries, and injection vectors.",
		whenToUse: "When changing auth, permissions, data boundaries, or external inputs.",
	},
	{
		id: "14",
		title: "Harness Evaluation",
		filename: "14-harness-evaluation.md",
		category: "orchestration",
		summary: "Tests harness resilience, disposable tasks, instructions adherence, and agent recovery.",
		whenToUse: "When validating that the AI coding harness and tools operate correctly end-to-end.",
	},
];

const PROMPT_LOOKUP = new Map<string, VibePromptMeta>();
for (const p of VIBE_PROMPT_CATALOG) {
	PROMPT_LOOKUP.set(p.id, p);
	PROMPT_LOOKUP.set(p.filename, p);
	PROMPT_LOOKUP.set(p.title.toLowerCase().replace(/\s+/g, "-"), p);
}

/**
 * Returns prompt content from disk.
 */
export function getPromptContent(promptIdOrName: string): string | undefined {
	const prompt = PROMPT_LOOKUP.get(promptIdOrName);
	if (!prompt) return undefined;

	const promptPath = path.resolve(import.meta.dir, "../assets/docs/prompts", prompt.filename);
	try {
		return fs.readFileSync(promptPath, "utf-8");
	} catch {
		return undefined;
	}
}

/**
 * Returns metadata for a prompt.
 */
export function lookupPrompt(promptIdOrName: string): VibePromptMeta | undefined {
	return PROMPT_LOOKUP.get(promptIdOrName);
}
