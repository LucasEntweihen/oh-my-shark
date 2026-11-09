/**
 * Universal Skills Engine - Local Discovery
 *
 * Scans workspace and user home directories for skills across all supported ecosystems:
 * .ohms, .omp, .claude, .agents, .codex, .github, and installed skill roots.
 */
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { buildUniversalSkillRecord } from "../core/skill-parser";
import type { UniversalSkill } from "../types";

export interface DiscoveredSkillPath {
	filePath: string;
	level: "project" | "user" | "installed" | "builtin";
	source: string;
	containRoot: string;
}

const PROJECT_SKILL_SUBDIRS = [
	".ohms/skills",
	".omp/skills",
	".claude/skills",
	".agents/skills",
	".agent/skills",
	".codex/skills",
	".github/skills",
];

const USER_SKILL_SUBDIRS = [
	".ohms/skills/installed",
	".ohms/agent/skills",
	".omp/skills/installed",
	".omp/agent/skills",
	".claude/skills",
	".codex/skills",
	".agents/skills",
];

async function isDirectory(dirPath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(dirPath);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(filePath);
		return stat.isFile();
	} catch {
		return false;
	}
}

/**
 * Recursively scans a root directory looking for SKILL.md files.
 */
export async function scanDirectoryForSkills(
	rootDir: string,
	options: {
		level: "project" | "user" | "installed" | "builtin";
		sourcePrefix: string;
		maxDepth?: number;
	},
): Promise<DiscoveredSkillPath[]> {
	const results: DiscoveredSkillPath[] = [];
	if (!(await isDirectory(rootDir))) {
		return results;
	}

	const maxDepth = options.maxDepth ?? 3;

	async function walk(currentDir: string, currentDepth: number): Promise<void> {
		if (currentDepth > maxDepth) return;
		try {
			const entries = await fs.readdir(currentDir, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.name.startsWith(".") && entry.name !== ".ohms" && entry.name !== ".omp") {
					continue;
				}
				const fullPath = path.join(currentDir, entry.name);
				if (entry.isDirectory()) {
					// Check if this directory directly contains a SKILL.md
					const candidateSkillFile = path.join(fullPath, "SKILL.md");
					if (await fileExists(candidateSkillFile)) {
						results.push({
							filePath: candidateSkillFile,
							level: options.level,
							source: `${options.sourcePrefix}:${path.basename(fullPath)}`,
							containRoot: fullPath,
						});
					} else {
						await walk(fullPath, currentDepth + 1);
					}
				}
			}
		} catch {
			// Ignore read errors for inaccessible folders
		}
	}

	await walk(rootDir, 0);
	return results;
}

/**
 * Discovers all local and installed skills for a given workspace and user environment.
 */
export async function discoverAllLocalSkills(options: { cwd?: string; home?: string } = {}): Promise<UniversalSkill[]> {
	const cwd = options.cwd || process.cwd();
	const home = options.home || os.homedir();
	const skills: UniversalSkill[] = [];
	const seenPaths = new Set<string>();

	// 1. Scan project-level directories
	for (const sub of PROJECT_SKILL_SUBDIRS) {
		const candidateDir = path.join(cwd, sub);
		const discovered = await scanDirectoryForSkills(candidateDir, {
			level: "project",
			sourcePrefix: `project:${sub}`,
		});
		for (const item of discovered) {
			if (!seenPaths.has(item.filePath)) {
				seenPaths.add(item.filePath);
				try {
					const content = await fs.readFile(item.filePath, "utf8");
					skills.push(
						buildUniversalSkillRecord(item.filePath, content, {
							level: "project",
							source: item.source,
							containRoot: item.containRoot,
						}),
					);
				} catch {}
			}
		}
	}

	// 2. Scan user-level directories
	for (const sub of USER_SKILL_SUBDIRS) {
		const candidateDir = path.join(home, sub);
		const isInstalled = sub.includes("installed");
		const discovered = await scanDirectoryForSkills(candidateDir, {
			level: isInstalled ? "installed" : "user",
			sourcePrefix: isInstalled ? `installed:${sub}` : `user:${sub}`,
		});
		for (const item of discovered) {
			if (!seenPaths.has(item.filePath)) {
				seenPaths.add(item.filePath);
				try {
					const content = await fs.readFile(item.filePath, "utf8");
					skills.push(
						buildUniversalSkillRecord(item.filePath, content, {
							level: item.level,
							source: item.source,
							containRoot: item.containRoot,
						}),
					);
				} catch {}
			}
		}
	}

	return skills;
}

/**
 * Returns the default directory for user-installed skills: ~/.ohms/skills/installed
 */
export function getDefaultUserInstalledSkillsDir(home: string = os.homedir()): string {
	return path.join(home, ".ohms", "skills", "installed");
}

/**
 * Returns the default directory for project-installed skills: .ohms/skills
 */
export function getDefaultProjectSkillsDir(cwd: string = process.cwd()): string {
	return path.join(cwd, ".ohms", "skills");
}
