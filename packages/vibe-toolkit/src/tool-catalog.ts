import * as fs from "node:fs";
import * as path from "node:path";

export interface VibeToolMeta {
	id: string;
	title: string;
	filename: string;
	scope: "machine" | "project" | "both";
	purpose: string;
	whenToUse: string;
}

export const VIBE_TOOL_CATALOG: readonly VibeToolMeta[] = [
	{
		id: "01",
		title: "Superpowers",
		filename: "01-superpowers.md",
		scope: "both",
		purpose: "Proportional process, design, planning, execution, and verification skills.",
		whenToUse: "Brainstorming, proportional design, planning, diagnosis, and verification.",
	},
	{
		id: "02",
		title: "Subagent Orchestration",
		filename: "02-subagent-orchestration.md",
		scope: "project",
		purpose: "Delegation, specialized roles, dynamic model selection, and parallel waves.",
		whenToUse: "Isolatable context, useful specialization, and independent tasks in waves.",
	},
	{
		id: "03",
		title: "RTK (Token Proxy)",
		filename: "03-rtk-token-proxy.md",
		scope: "machine",
		purpose: "Executes CLI commands with ultra-concise output, saving context window tokens.",
		whenToUse: "When running repetitive build/test commands where verbose logs waste prompt budget.",
	},
	{
		id: "04",
		title: "Ponytail",
		filename: "04-ponytail.md",
		scope: "project",
		purpose: "Delivers smallest complete solution, preventing over-engineering and premature abstraction.",
		whenToUse: "When keeping implementation strictly within requested boundaries.",
	},
	{
		id: "05",
		title: "Caveman",
		filename: "05-caveman.md",
		scope: "machine",
		purpose: "Concise conversational communication while preserving normal wording for code and docs.",
		whenToUse: "To eliminate marketing fluff and conversational overhead in agent dialog.",
	},
	{
		id: "06",
		title: "ESLint & Biome Quality Gates",
		filename: "06-eslint-biome-quality-gates.md",
		scope: "project",
		purpose: "Strict lint rules: 350-line limit, banned globals, structured logging, typed boundaries.",
		whenToUse: "Enforcing static invariants and preventing architectural erosion.",
	},
	{
		id: "07",
		title: "Graphify",
		filename: "07-graphify.md",
		scope: "project",
		purpose: "Extracts a queryable graph of code structure, callsites, and architecture relationships.",
		whenToUse: "Mapping large or unfamiliar codebases without reading hundreds of files blindly.",
	},
	{
		id: "08",
		title: "Obsidian Memory",
		filename: "08-obsidian-memory.md",
		scope: "both",
		purpose: "External markdown-based knowledge vault integration for cross-session knowledge.",
		whenToUse: "When maintaining a personal or team knowledge base across coding sessions.",
	},
	{
		id: "09",
		title: "Claude Memory System",
		filename: "09-claude-memory-system.md",
		scope: "both",
		purpose: "Native hierarchical memory files for persistent preferences and project conventions.",
		whenToUse: "Retaining durable lessons and discovered project idiosyncrasies.",
	},
	{
		id: "10",
		title: "Hooks Best Practices",
		filename: "10-hooks-best-practices.md",
		scope: "project",
		purpose: "Deterministic client execution hooks (pre-commit, post-checkout, tool interception).",
		whenToUse: "Automating validation before code reaches remote repositories.",
	},
	{
		id: "11",
		title: "agent-browser",
		filename: "11-agent-browser.md",
		scope: "machine",
		purpose: "Headless Chromium browser automation with console, network, and DOM inspection.",
		whenToUse: "Validating web UI behavior visually and verifying frontend interactions.",
	},
	{
		id: "12",
		title: "Context7",
		filename: "12-context7.md",
		scope: "both",
		purpose: "Queries real-time official library documentation by library ID and concept.",
		whenToUse: "Consulting current API specs without web hallucination or stale knowledge.",
	},
	{
		id: "13",
		title: "Anthropic Skills",
		filename: "13-anthropics-skills.md",
		scope: "machine",
		purpose: "Standardized skill definitions, tool invocation, and declarative recipes.",
		whenToUse: "Creating and managing modular agent capabilities.",
	},
	{
		id: "14",
		title: "Chrome DevTools MCP",
		filename: "14-chrome-devtools-mcp.md",
		scope: "machine",
		purpose: "Model Context Protocol bridge into Chrome DevTools for performance and console tracing.",
		whenToUse: "Debugging complex runtime frontend issues and network bottlenecks.",
	},
	{
		id: "15",
		title: "Codex Workflow",
		filename: "15-codex-workflow.md",
		scope: "project",
		purpose: "Adapts instructions, plugins, and MCP configurations for Codex runtime.",
		whenToUse: "Deploying the toolkit in OpenAI Codex or hybrid client environments.",
	},
	{
		id: "16",
		title: "Vercel Agent Skills",
		filename: "16-vercel-skills.md",
		scope: "project",
		purpose: "Catalog of Vercel production skills (composition, review, mobile, deployment).",
		whenToUse: "Developing and deploying modern fullstack web applications on Vercel.",
	},
	{
		id: "17",
		title: "Next.js Runtime & Performance",
		filename: "17-nextjs-runtime-and-performance.md",
		scope: "project",
		purpose: "Dev feedback loop, bundle size optimization, and Turbopack analysis.",
		whenToUse: "When profiling and optimizing Next.js bundle sizes and render times.",
	},
	{
		id: "18",
		title: "PostgreSQL Skills",
		filename: "18-postgresql-skills.md",
		scope: "project",
		purpose: "Guidance on SQL, schema design, migrations, pooling, and database indexes.",
		whenToUse: "Working on database schemas, ORMs (Drizzle/Prisma), and SQL query performance.",
	},
	{
		id: "19",
		title: "GitHub CI Repair",
		filename: "19-github-ci-repair.md",
		scope: "project",
		purpose: "Diagnoses and repairs failing GitHub Actions workflow checks.",
		whenToUse: "Investigating broken CI runs and automated pull request check failures.",
	},
	{
		id: "20",
		title: "Security Review",
		filename: "20-security-review.md",
		scope: "project",
		purpose: "Evidence-backed differential security review across changed files.",
		whenToUse: "Reviewing pull requests or commits affecting authentication, tokens, or trust boundaries.",
	},
	{
		id: "21",
		title: "shadcn/ui",
		filename: "21-shadcn-ui.md",
		scope: "project",
		purpose: "Integrates and standardizes accessible component architecture with Tailwind.",
		whenToUse: "Building modern accessible user interfaces with the shadcn component library.",
	},
	{
		id: "22",
		title: "Sentry MCP",
		filename: "22-sentry-mcp.md",
		scope: "both",
		purpose: "Investigates production crashes, exceptions, and latency issues via Sentry MCP.",
		whenToUse: "Diagnosing production issues directly from error traces and stackdumps.",
	},
];

const TOOL_LOOKUP = new Map<string, VibeToolMeta>();
for (const t of VIBE_TOOL_CATALOG) {
	TOOL_LOOKUP.set(t.id, t);
	TOOL_LOOKUP.set(t.filename, t);
	TOOL_LOOKUP.set(t.title.toLowerCase().replace(/\s+/g, "-"), t);
}

/**
 * Returns tool guide content from disk.
 */
export function getToolContent(toolIdOrName: string): string | undefined {
	const tool = TOOL_LOOKUP.get(toolIdOrName);
	if (!tool) return undefined;

	const toolPath = path.resolve(import.meta.dir, "../assets/docs/tools", tool.filename);
	try {
		return fs.readFileSync(toolPath, "utf-8");
	} catch {
		return undefined;
	}
}

/**
 * Returns metadata for a tool.
 */
export function lookupTool(toolIdOrName: string): VibeToolMeta | undefined {
	return TOOL_LOOKUP.get(toolIdOrName);
}
