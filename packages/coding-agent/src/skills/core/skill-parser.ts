/**
 * Universal Skills Engine - Parser
 *
 * Parses SKILL.md, YAML frontmatter, markdown sections, and extracts metadata.
 */
import { createHash } from "node:crypto";
import * as path from "node:path";
import { YAML } from "bun";
import type { SkillCompatibilityStandard, SkillFrontmatter, UniversalSkill } from "../types";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export interface ParsedSkillFile {
	frontmatter: SkillFrontmatter;
	markdown: string;
	contentHash: string;
	standard: SkillCompatibilityStandard;
	sections: Map<string, string>;
}

/**
 * Calculates SHA-256 checksum of raw file content.
 */
export function computeContentHash(content: string): string {
	return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Parses markdown into top-level heading sections for structured extraction.
 */
export function extractMarkdownSections(markdown: string): Map<string, string> {
	const sections = new Map<string, string>();
	const lines = markdown.split("\n");
	let currentHeading = "overview";
	let currentBuffer: string[] = [];

	for (const line of lines) {
		const match = line.match(/^#{1,3}\s+(.+)$/);
		if (match) {
			if (currentBuffer.length > 0) {
				sections.set(currentHeading.toLowerCase().trim(), currentBuffer.join("\n").trim());
				currentBuffer = [];
			}
			currentHeading = match[1].trim();
		} else {
			currentBuffer.push(line);
		}
	}

	if (currentBuffer.length > 0) {
		sections.set(currentHeading.toLowerCase().trim(), currentBuffer.join("\n").trim());
	}

	return sections;
}

/**
 * Detects the originating ecosystem standard based on frontmatter keys and file conventions.
 */
export function detectSkillStandard(frontmatter: SkillFrontmatter, filePath: string): SkillCompatibilityStandard {
	const lowerPath = filePath.toLowerCase();
	if (lowerPath.includes(".claude") || lowerPath.includes("claude-plugins")) {
		return "claude-code";
	}
	if (lowerPath.includes(".codex")) {
		return "codex";
	}
	if (lowerPath.includes(".opencode")) {
		return "opencode";
	}
	if (lowerPath.includes(".cursor") || lowerPath.endsWith(".cursorrules")) {
		return "cursor";
	}
	if (lowerPath.includes(".windsurf")) {
		return "windsurf";
	}
	if (
		frontmatter["disable-model-invocation"] !== undefined ||
		frontmatter.disableModelInvocation !== undefined ||
		frontmatter.globs !== undefined ||
		frontmatter.alwaysApply !== undefined
	) {
		return "agentskills";
	}
	return "generic-markdown";
}

/**
 * Parses a raw skill string into normalized components.
 */
export function parseSkillContent(rawContent: string, filePath: string): ParsedSkillFile {
	const contentHash = computeContentHash(rawContent);
	let frontmatter: SkillFrontmatter = {};
	let markdown = rawContent;

	const match = rawContent.match(FRONTMATTER_RE);
	if (match) {
		const rawYaml = match[1];
		markdown = match[2];
		try {
			const parsed = YAML.parse(rawYaml);
			if (parsed && typeof parsed === "object") {
				frontmatter = parsed as SkillFrontmatter;
			}
		} catch {
			// Fallback: YAML parse error handled gracefully
		}
	}

	// Normalize disable-model-invocation
	if (frontmatter["disable-model-invocation"] !== undefined && frontmatter.disableModelInvocation === undefined) {
		frontmatter.disableModelInvocation = Boolean(frontmatter["disable-model-invocation"]);
	}

	const standard = detectSkillStandard(frontmatter, filePath);
	const sections = extractMarkdownSections(markdown);

	return {
		frontmatter,
		markdown,
		contentHash,
		standard,
		sections,
	};
}

/**
 * Builds a normalized UniversalSkill record from parsed file data.
 */
export function buildUniversalSkillRecord(
	filePath: string,
	rawContent: string,
	options: {
		level?: "project" | "user" | "installed" | "builtin";
		source?: string;
		repository?: string;
		containRoot?: string;
		fallbackName?: string;
	} = {},
): UniversalSkill {
	const parsed = parseSkillContent(rawContent, filePath);
	const baseDir = path.dirname(filePath);
	const dirName = path.basename(baseDir);

	// Derive ID and Name
	const rawName =
		typeof parsed.frontmatter.name === "string" && parsed.frontmatter.name.trim()
			? parsed.frontmatter.name.trim()
			: options.fallbackName || dirName || "unnamed-skill";

	const id = rawName
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "");

	// Derive Description
	let description = typeof parsed.frontmatter.description === "string" ? parsed.frontmatter.description.trim() : "";
	if (!description) {
		const overview = parsed.sections.get("overview") || parsed.sections.get("objective") || "";
		description = overview.split("\n")[0]?.replace(/^#+\s*/, "").slice(0, 200).trim() || "";
	}

	const hide =
		parsed.frontmatter.hide === true ||
		parsed.frontmatter.disableModelInvocation === true ||
		parsed.frontmatter["disable-model-invocation"] === true;

	const version = typeof parsed.frontmatter.version === "string" ? parsed.frontmatter.version : "1.0.0";
	const dependencies = Array.isArray(parsed.frontmatter.dependencies) ? parsed.frontmatter.dependencies : [];
	const permissions = parsed.frontmatter.permissions || {
		filesystem: "workspace",
		network: false,
		shell: false,
	};

	return {
		id,
		name: rawName,
		description,
		version,
		filePath,
		baseDir,
		content: rawContent,
		frontmatter: parsed.frontmatter,
		containRoot: options.containRoot || baseDir,
		level: options.level || "project",
		source: options.source || "local:project",
		repository: options.repository,
		trust: "trusted",
		permissions,
		dependencies,
		standard: parsed.standard,
		contentHash: parsed.contentHash,
		hide,
	};
}
