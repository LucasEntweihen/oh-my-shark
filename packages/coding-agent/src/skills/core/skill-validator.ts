/**
 * Universal Skills Engine - Validator
 *
 * Structural and security validation for skill packages and metadata.
 */
import type { UniversalSkill } from "../types";

export interface ValidationIssue {
	field?: string;
	message: string;
	severity: "error" | "warning";
}

export interface SkillValidationResult {
	valid: boolean;
	issues: ValidationIssue[];
}

const TRAVERSAL_PATTERN = /(?:\.\.[/\\]|[/\\]\.\.)/;
const DANGEROUS_SHELL_PATTERNS = [
	/rm\s+-rf\s+[/~]/,
	/:(){ :|:& };:/,
	/>\s*\/dev\/sd[a-z]/,
	/mkfs\./,
	/dd\s+if=.*of=\/dev/,
];

/**
 * Validates a normalized skill record against structure and safety constraints.
 */
export function validateSkill(skill: UniversalSkill): SkillValidationResult {
	const issues: ValidationIssue[] = [];

	if (!skill.id || skill.id.trim().length === 0) {
		issues.push({ field: "id", message: "Skill must have a non-empty id", severity: "error" });
	}

	if (!skill.name || skill.name.trim().length === 0) {
		issues.push({ field: "name", message: "Skill must have a non-empty name", severity: "error" });
	}

	if (!skill.filePath || skill.filePath.trim().length === 0) {
		issues.push({ field: "filePath", message: "Skill must have an absolute file path", severity: "error" });
	}

	if (!skill.description || skill.description.trim().length === 0) {
		issues.push({
			field: "description",
			message: "Skill is missing a description (required for discovery and model invocation)",
			severity: "warning",
		});
	}

	// Security checks: check for path traversal in declared dependencies or subpaths
	for (const dep of skill.dependencies) {
		if (TRAVERSAL_PATTERN.test(dep)) {
			issues.push({
				field: "dependencies",
				message: `Dependency "${dep}" contains path traversal characters`,
				severity: "error",
			});
		}
	}

	// Content security check: detect dangerous destructive shell execution patterns
	for (const pattern of DANGEROUS_SHELL_PATTERNS) {
		if (pattern.test(skill.content)) {
			issues.push({
				field: "content",
				message: `Skill content matches potentially destructive shell command pattern: ${pattern.source}`,
				severity: "warning",
			});
		}
	}

	const hasErrors = issues.some(i => i.severity === "error");
	return {
		valid: !hasErrors,
		issues,
	};
}
