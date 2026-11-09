/**
 * Universal Skills Engine - Uninstaller
 *
 * Safely uninstalls and cleans up managed skill directories and manifests.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
	getDefaultProjectSkillsDir,
	getDefaultUserInstalledSkillsDir,
} from "../discovery/local-discovery";

export interface UninstallResult {
	success: boolean;
	removedPath?: string;
	message: string;
}

/**
 * Safely removes a skill directory if it is contained within the authorized skills base directory.
 */
export async function uninstallSkill(
	skillId: string,
	options: { scope?: "user" | "project"; cwd?: string; home?: string } = {},
): Promise<UninstallResult> {
	const normalizedId = skillId.toLowerCase().trim();
	const scope = options.scope || "user";
	const baseDir =
		scope === "user"
			? getDefaultUserInstalledSkillsDir(options.home)
			: getDefaultProjectSkillsDir(options.cwd);

	const targetPath = path.resolve(baseDir, normalizedId);

	// Security containment check: targetPath must be strictly within baseDir
	const relative = path.relative(baseDir, targetPath);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		return {
			success: false,
			message: `Security check failed: target path "${targetPath}" escapes skills directory.`,
		};
	}

	try {
		const stat = await fs.stat(targetPath);
		if (!stat.isDirectory()) {
			return {
				success: false,
				message: `Path "${targetPath}" is not a valid skill directory.`,
			};
		}

		await fs.rm(targetPath, { recursive: true, force: true });
		return {
			success: true,
			removedPath: targetPath,
			message: `Skill "${normalizedId}" uninstalled successfully from ${targetPath}.`,
		};
	} catch (err) {
		return {
			success: false,
			message: `Skill "${normalizedId}" is not installed in ${scope} scope (${targetPath}).`,
		};
	}
}
