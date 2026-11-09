/**
 * Universal Skills Engine - Installer
 *
 * Installs skills from GitHub repositories, curated packs, or local paths.
 * Generates .skill-manifest.json, evaluates trust, and sets containment boundaries.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { buildUniversalSkillRecord, computeContentHash } from "../core/skill-parser";
import { validateSkill } from "../core/skill-validator";
import { fetchRemoteSkill } from "../discovery/github-discovery";
import {
	getDefaultProjectSkillsDir,
	getDefaultUserInstalledSkillsDir,
} from "../discovery/local-discovery";
import { CURATED_75_SKILLS, findCuratedSkill } from "../discovery/marketplace-discovery";
import { evaluateSkillTrust } from "../security/trust-manager";
import type {
	CuratedSkillEntry,
	SkillInstallOptions,
	SkillInstallResult,
	SkillManifest,
	UniversalSkill,
} from "../types";

const MANIFEST_FILENAME = ".skill-manifest.json";

async function ensureDir(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
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
 * Creates or updates the skill manifest file.
 */
async function writeSkillManifest(destDir: string, manifest: SkillManifest): Promise<void> {
	const manifestPath = path.join(destDir, MANIFEST_FILENAME);
	await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

/**
 * Installs a single skill package to the target directory.
 */
async function installSingleSkillPackage(
	destDir: string,
	skillId: string,
	name: string,
	content: string,
	manifestData: Partial<SkillManifest>,
	options: { force?: boolean },
): Promise<{ skill: UniversalSkill; manifest: SkillManifest }> {
	await ensureDir(destDir);
	const entrypointPath = path.join(destDir, "SKILL.md");

	if (!options.force && (await fileExists(entrypointPath))) {
		throw new Error(`Skill "${skillId}" already exists at ${destDir}. Use --force to overwrite.`);
	}

	await fs.writeFile(entrypointPath, content, "utf8");
	const hash = computeContentHash(content);

	const manifest: SkillManifest = {
		id: skillId,
		name,
		version: manifestData.version || "1.0.0",
		description: manifestData.description || "",
		source: manifestData.source || "github",
		repository: manifestData.repository,
		subpath: manifestData.subpath,
		entrypoint: "SKILL.md",
		trust: manifestData.trust || "verified",
		permissions: manifestData.permissions || { filesystem: "workspace", network: false, shell: false },
		dependencies: manifestData.dependencies || [],
		compatibility: manifestData.compatibility || { agentskills: true, omsk: true },
		hash,
		installedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		scope: manifestData.scope || "user",
	};

	await writeSkillManifest(destDir, manifest);

	const skillRecord = buildUniversalSkillRecord(entrypointPath, content, {
		level: manifest.scope === "user" ? "installed" : "project",
		repository: manifest.repository,
		containRoot: destDir,
	});

	return { skill: skillRecord, manifest };
}

/**
 * Installs skills according to target specification:
 * - "owner/repo" (entire repository or all curated skills belonging to it)
 * - "owner/repo --skill <name>" (specific skill from that repo)
 * - "<curated-skill-id>" (installs from curated 75 index)
 */
export async function installSkills(options: SkillInstallOptions): Promise<SkillInstallResult> {
	const scope = options.scope || "user";
	const baseTargetDir =
		scope === "user" ? getDefaultUserInstalledSkillsDir() : getDefaultProjectSkillsDir();

	const installedSkills: UniversalSkill[] = [];
	const manifests: SkillManifest[] = [];
	const warnings: string[] = [];
	const errors: string[] = [];

	const target = options.target.trim();

	// Case 1: Target matches an entire repository or collection
	const isRepoTarget = target.includes("/");
	let targetRepo: string | undefined = isRepoTarget ? target : undefined;
	let specificSkill = options.skillName;

	// Case 2: Target is a curated skill ID (e.g. "brainstorming" or "frontend-design")
	if (!isRepoTarget && !specificSkill) {
		const curated = findCuratedSkill(target);
		if (curated) {
			targetRepo = curated.repository;
			specificSkill = curated.id;
		}
	}

	// Determine matching skills to install
	let skillsToInstall: Array<{ id: string; name: string; repo: string; subpath?: string; description?: string }> = [];

	if (targetRepo && !specificSkill) {
		// Install all curated skills belonging to this repository
		const repoSkills = CURATED_75_SKILLS.filter(s => s.repository.toLowerCase() === targetRepo!.toLowerCase());
		if (repoSkills.length > 0) {
			skillsToInstall = repoSkills.map(s => ({
				id: s.id,
				name: s.name,
				repo: s.repository,
				subpath: s.subpath,
				description: s.description,
			}));
		} else {
			// If not in curated catalog, attempt to install as single skill matching repo name
			const repoName = targetRepo.split("/")[1] || targetRepo;
			skillsToInstall.push({
				id: repoName.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
				name: repoName,
				repo: targetRepo,
				subpath: "",
			});
		}
	} else if (targetRepo && specificSkill) {
		const curated = findCuratedSkill(specificSkill, targetRepo);
		skillsToInstall.push({
			id: specificSkill.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
			name: curated?.name || specificSkill,
			repo: targetRepo,
			subpath: curated?.subpath || `skills/${specificSkill}`,
			description: curated?.description,
		});
	} else if (specificSkill) {
		const curated = findCuratedSkill(specificSkill);
		if (curated) {
			skillsToInstall.push({
				id: curated.id,
				name: curated.name,
				repo: curated.repository,
				subpath: curated.subpath,
				description: curated.description,
			});
		} else {
			errors.push(`Could not find skill "${specificSkill}" in catalog or repository.`);
		}
	} else {
		errors.push(`Invalid installation target: "${target}". Provide a valid repository (e.g. obra/superpowers) or skill name.`);
	}

	if (options.dryRun) {
		return {
			success: errors.length === 0,
			installedSkills: [],
			manifests: [],
			warnings: [`Dry run: would install ${skillsToInstall.length} skill(s) into ${baseTargetDir}`],
			errors,
			scope,
			targetDir: baseTargetDir,
		};
	}

	// Execute installations
	for (const item of skillsToInstall) {
		try {
			// 1. Try remote fetch
			const remotePkg = await fetchRemoteSkill(item.repo, item.id, { subpath: item.subpath });
			let contentToInstall: string;

			if (remotePkg) {
				contentToInstall = remotePkg.entrypointContent;
			} else {
				// Fallback: Generate valid SKILL.md based on curated catalog metadata
				const curated = findCuratedSkill(item.id, item.repo);
				if (curated) {
					contentToInstall = `---
name: ${curated.name}
description: ${curated.description}
repository: ${curated.repository}
version: 1.0.0
tags: [${curated.tags.join(", ")}]
---

# ${curated.name}

## Objective
${curated.utility}

## Requirements
1. Follow specifications and guidelines from ${curated.repository}.
2. Ensure strict verification before completion.
3. Preserve existing project conventions.

## Deliverables
- Working, verified implementation matching the stated objective.
`;
					warnings.push(`Remote repository offline or rate-limited; generated verified baseline for "${item.id}" from curated catalog.`);
				} else {
					errors.push(`Failed to download SKILL.md for "${item.id}" from ${item.repo}`);
					continue;
				}
			}

			const skillDestDir = path.join(baseTargetDir, item.id);
			const trust = evaluateSkillTrust({ level: "installed", repository: item.repo });

			const { skill, manifest } = await installSingleSkillPackage(
				skillDestDir,
				item.id,
				item.name,
				contentToInstall,
				{
					description: item.description,
					repository: item.repo,
					subpath: item.subpath,
					trust,
					scope,
				},
				{ force: options.force },
			);

			const validation = validateSkill(skill);
			if (!validation.valid) {
				warnings.push(`Skill "${item.id}" installed with validation warnings: ${validation.issues.map(i => i.message).join("; ")}`);
			}

			installedSkills.push(skill);
			manifests.push(manifest);
		} catch (err) {
			errors.push(`Error installing skill "${item.id}": ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	return {
		success: installedSkills.length > 0 && errors.length === 0,
		installedSkills,
		manifests,
		warnings,
		errors,
		scope,
		targetDir: baseTargetDir,
	};
}
