/**
 * Universal Skills Engine - Updater
 *
 * Checks for updates on installed skills against remote repositories and applies them safely.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { computeContentHash } from "../core/skill-parser";
import { fetchRemoteSkill } from "../discovery/github-discovery";
import {
	getDefaultProjectSkillsDir,
	getDefaultUserInstalledSkillsDir,
} from "../discovery/local-discovery";
import type { SkillManifest } from "../types";

export interface SkillUpdateItem {
	skillId: string;
	updated: boolean;
	previousHash: string;
	newHash: string;
	message: string;
}

export interface SkillUpdateReport {
	results: SkillUpdateItem[];
	summary: string;
}

async function readManifest(skillDir: string): Promise<SkillManifest | null> {
	try {
		const manifestFile = path.join(skillDir, ".skill-manifest.json");
		const data = await fs.readFile(manifestFile, "utf8");
		return JSON.parse(data) as SkillManifest;
	} catch {
		return null;
	}
}

/**
 * Updates a single installed skill.
 */
export async function updateSingleSkill(skillDir: string): Promise<SkillUpdateItem> {
	const manifest = await readManifest(skillDir);
	const skillId = path.basename(skillDir);

	if (!manifest || !manifest.repository) {
		return {
			skillId,
			updated: false,
			previousHash: "",
			newHash: "",
			message: "Skill does not have a valid remote repository declared in manifest.",
		};
	}

	const remote = await fetchRemoteSkill(manifest.repository, manifest.id, {
		subpath: manifest.subpath,
	});

	if (!remote) {
		return {
			skillId,
			updated: false,
			previousHash: manifest.hash,
			newHash: manifest.hash,
			message: `Could not fetch remote version from ${manifest.repository}.`,
		};
	}

	const newHash = computeContentHash(remote.entrypointContent);
	if (newHash === manifest.hash) {
		return {
			skillId,
			updated: false,
			previousHash: manifest.hash,
			newHash,
			message: "Skill is already up to date.",
		};
	}

	const entrypointPath = path.join(skillDir, "SKILL.md");
	await fs.writeFile(entrypointPath, remote.entrypointContent, "utf8");

	manifest.hash = newHash;
	manifest.updatedAt = new Date().toISOString();
	await fs.writeFile(path.join(skillDir, ".skill-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

	return {
		skillId,
		updated: true,
		previousHash: manifest.hash,
		newHash,
		message: `Successfully updated skill from ${manifest.repository}.`,
	};
}

/**
 * Updates all skills installed in the specified or default scopes.
 */
export async function updateAllSkills(options: { scope?: "user" | "project"; cwd?: string; home?: string } = {}): Promise<SkillUpdateReport> {
	const scope = options.scope || "user";
	const baseDir =
		scope === "user"
			? getDefaultUserInstalledSkillsDir(options.home)
			: getDefaultProjectSkillsDir(options.cwd);

	const results: SkillUpdateItem[] = [];

	try {
		const entries = await fs.readdir(baseDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const fullPath = path.join(baseDir, entry.name);
				const res = await updateSingleSkill(fullPath);
				results.push(res);
			}
		}
	} catch {
		// Base directory does not exist or empty
	}

	const updatedCount = results.filter(r => r.updated).length;
	return {
		results,
		summary: `Scanned ${results.length} installed skills: ${updatedCount} updated, ${results.length - updatedCount} up to date.`,
	};
}
