/**
 * Universal Skills Engine - Type Definitions
 *
 * Full type contracts for the OMSK Universal Skills Engine:
 * discovery, parsing, validation, security, execution, and marketplace.
 */
import type { SourceMeta } from "../capability/types";

export type SkillTrustLevel = "trusted" | "verified" | "community" | "untrusted";

export type SkillPermissionType = "filesystem" | "network" | "shell" | "env";

export interface SkillPermissions {
	filesystem?: "workspace" | "full" | false;
	network?: boolean;
	shell?: boolean;
	env?: boolean;
}

export type SkillCompatibilityStandard =
	| "agentskills"
	| "claude-code"
	| "codex"
	| "opencode"
	| "cursor"
	| "windsurf"
	| "generic-markdown";

export type SkillActivationLevel = 1 | 2 | 3;

/**
 * Extended YAML Frontmatter specification for Agent Skills and cross-ecosystem formats.
 */
export interface SkillFrontmatter {
	name?: string;
	description?: string;
	version?: string;
	author?: string;
	repository?: string;
	license?: string;
	tags?: string[];
	category?: string;
	globs?: string[];
	alwaysApply?: boolean;
	hide?: boolean;
	/** Standard Agent Skills disable model invocation flag */
	disableModelInvocation?: boolean;
	"disable-model-invocation"?: boolean;
	triggers?: string[];
	requirements?: string[];
	permissions?: SkillPermissions;
	dependencies?: string[];
	compatibility?: Partial<Record<SkillCompatibilityStandard, boolean>>;
	[key: string]: unknown;
}

/**
 * Core normalized Skill representation used by the Universal Skills Engine.
 */
export interface UniversalSkill {
	/** Unique skill identifier (kebab-case) */
	id: string;
	/** Display name */
	name: string;
	/** Concise functional description (used in Discovery Level 1) */
	description: string;
	/** Semantic version */
	version: string;
	/** Absolute path to entrypoint file (SKILL.md) */
	filePath: string;
	/** Directory containing the skill and its local resources */
	baseDir: string;
	/** Raw markdown content */
	content: string;
	/** Structured parsed frontmatter */
	frontmatter: SkillFrontmatter;
	/** Filesystem isolation root (Agent Plugins / Containment root) */
	containRoot?: string;
	/** Source scope: project-local or user-global */
	level: "project" | "user" | "installed" | "builtin";
	/** Source provider metadata */
	source: string;
	/** Provenance repository (e.g. "obra/superpowers", "anthropics/skills") */
	repository?: string;
	/** Calculated trust level */
	trust: SkillTrustLevel;
	/** Declared permissions */
	permissions: SkillPermissions;
	/** Declared dependencies (skill IDs) */
	dependencies: string[];
	/** Detected standard */
	standard: SkillCompatibilityStandard;
	/** SHA-256 hash of the entrypoint file */
	contentHash: string;
	/** Whether the skill is hidden from Level 1 system prompt listing */
	hide: boolean;
	/** Raw source metadata for capability registry compatibility */
	_source?: SourceMeta;
}

/**
 * Manifest created by the installer upon installing a skill or pack.
 */
export interface SkillManifest {
	id: string;
	name: string;
	version: string;
	description: string;
	source: "github" | "local" | "url" | "curated";
	repository?: string;
	subpath?: string;
	entrypoint: string;
	trust: SkillTrustLevel;
	permissions: SkillPermissions;
	dependencies: string[];
	compatibility: Partial<Record<SkillCompatibilityStandard, boolean>>;
	hash: string;
	installedAt: string;
	updatedAt: string;
	scope: "user" | "project";
}

/**
 * Curated entry in the Universal Skills Engine Marketplace Index (75 Essential Skills).
 */
export interface CuratedSkillEntry {
	id: string;
	name: string;
	category:
		| "autonomous-engineering"
		| "anthropic-official"
		| "frontend-web"
		| "advanced-quality"
		| "backend-infra-security";
	repository: string;
	subpath?: string;
	description: string;
	utility: string;
	tags: string[];
	priority: "maximum" | "high" | "standard";
	dependencies?: string[];
	permissions?: SkillPermissions;
}

/**
 * Search filter options for discovery.
 */
export interface SkillSearchOptions {
	query: string;
	category?: string;
	repository?: string;
	source?: "all" | "installed" | "local" | "marketplace" | "github";
	limit?: number;
}

/**
 * Search result item.
 */
export interface SkillSearchResult {
	id: string;
	name: string;
	description: string;
	utility?: string;
	repository?: string;
	category?: string;
	isInstalled: boolean;
	source: "installed" | "local" | "curated" | "github";
	trust: SkillTrustLevel;
	version?: string;
}

/**
 * Installation options.
 */
export interface SkillInstallOptions {
	target: string; // "owner/repo", "owner/repo --skill <name>", local path, or URL
	skillName?: string;
	scope?: "user" | "project";
	force?: boolean;
	dryRun?: boolean;
}

/**
 * Installation outcome report.
 */
export interface SkillInstallResult {
	success: boolean;
	installedSkills: UniversalSkill[];
	manifests: SkillManifest[];
	warnings: string[];
	errors: string[];
	scope: "user" | "project";
	targetDir: string;
}

/**
 * Doctor diagnostic report.
 */
export interface SkillDoctorIssue {
	severity: "error" | "warning" | "info";
	skillId?: string;
	skillPath?: string;
	message: string;
	remediation?: string;
}

export interface SkillDoctorReport {
	healthy: boolean;
	totalDiscovered: number;
	installedCount: number;
	localCount: number;
	issues: SkillDoctorIssue[];
	scannedDirectories: string[];
}
