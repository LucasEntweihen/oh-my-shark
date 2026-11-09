/**
 * Universal Skills Engine - Doctor
 *
 * Runs comprehensive diagnostics on installed and local skills:
 * integrity hashes, collisions, missing dependencies, permissions, and directory health.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
	getDefaultProjectSkillsDir,
	getDefaultUserInstalledSkillsDir,
} from "../discovery/local-discovery";
import { verifySkillIntegrity } from "../security/integrity-checker";
import type { SkillDoctorIssue, SkillDoctorReport, SkillManifest } from "../types";
import { getUniversalSkillRegistry } from "./skill-registry";
import { validateSkill } from "./skill-validator";

export async function runSkillsDoctor(options: { cwd?: string; home?: string } = {}): Promise<SkillDoctorReport> {
	const registry = getUniversalSkillRegistry();
	await registry.refresh(options);

	const allSkills = registry.getAll();
	const issues: SkillDoctorIssue[] = [];
	const scannedDirs: string[] = [];

	const userInstalledDir = getDefaultUserInstalledSkillsDir(options.home);
	const projectDir = getDefaultProjectSkillsDir(options.cwd);
	scannedDirs.push(userInstalledDir, projectDir);

	// Check base directories access
	for (const dir of [userInstalledDir, projectDir]) {
		try {
			await fs.mkdir(dir, { recursive: true });
			await fs.access(dir, fs.constants.R_OK | fs.constants.W_OK);
		} catch (err) {
			issues.push({
				severity: "warning",
				skillPath: dir,
				message: `Skills directory is not accessible or writable: ${dir}`,
				remediation: "Check filesystem permissions or run setup with appropriate privileges.",
			});
		}
	}

	// Track collisions and validate each skill
	const seenIds = new Map<string, string>();
	let installedCount = 0;
	let localCount = 0;

	for (const skill of allSkills) {
		if (skill.level === "installed") {
			installedCount++;
		} else {
			localCount++;
		}

		// Collision check
		const existingPath = seenIds.get(skill.id);
		if (existingPath) {
			issues.push({
				severity: "warning",
				skillId: skill.id,
				skillPath: skill.filePath,
				message: `Skill ID collision: "${skill.id}" is also defined at ${existingPath}. Highest priority level won.`,
			});
		} else {
			seenIds.set(skill.id, skill.filePath);
		}

		// Validation check
		const validation = validateSkill(skill);
		for (const issue of validation.issues) {
			issues.push({
				severity: issue.severity,
				skillId: skill.id,
				skillPath: skill.filePath,
				message: issue.message,
			});
		}

		// Dependency resolution check
		for (const depId of skill.dependencies) {
			if (!registry.get(depId)) {
				issues.push({
					severity: "warning",
					skillId: skill.id,
					skillPath: skill.filePath,
					message: `Missing declared dependency: "${depId}" is required by "${skill.id}".`,
					remediation: `Install the missing dependency using: ohms skills install ${depId}`,
				});
			}
		}

		// Integrity check for installed skills with manifest
		if (skill.level === "installed") {
			try {
				const manifestPath = path.join(skill.baseDir, ".skill-manifest.json");
				const manifestRaw = await fs.readFile(manifestPath, "utf8");
				const manifest = JSON.parse(manifestRaw) as SkillManifest;
				const integrity = await verifySkillIntegrity(skill, manifest);
				if (!integrity.matches) {
					issues.push({
						severity: "error",
						skillId: skill.id,
						skillPath: skill.filePath,
						message: `Integrity check failed: file hash ${integrity.actualHash.slice(0, 8)} does not match manifest hash ${integrity.expectedHash?.slice(0, 8)}.`,
						remediation: `Reinstall or update the skill: ohms skills update ${skill.id}`,
					});
				}
			} catch {
				// Manifest absent or unreadable
			}
		}
	}

	const hasErrors = issues.some(i => i.severity === "error");

	return {
		healthy: !hasErrors,
		totalDiscovered: allSkills.length,
		installedCount,
		localCount,
		issues,
		scannedDirectories: scannedDirs,
	};
}
