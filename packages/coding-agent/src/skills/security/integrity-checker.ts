/**
 * Universal Skills Engine - Integrity Checker
 *
 * Verifies SHA-256 hashes against manifests to prevent tampering.
 */
import * as fs from "node:fs/promises";
import { computeContentHash } from "../core/skill-parser";
import type { SkillManifest, UniversalSkill } from "../types";

export interface IntegrityCheckResult {
	matches: boolean;
	expectedHash?: string;
	actualHash: string;
	filePath: string;
	error?: string;
}

/**
 * Validates the file content on disk against the expected hash in the manifest.
 */
export async function verifySkillIntegrity(
	skill: UniversalSkill,
	manifest?: SkillManifest,
): Promise<IntegrityCheckResult> {
	try {
		const raw = await fs.readFile(skill.filePath, "utf8");
		const actualHash = computeContentHash(raw);
		const expectedHash = manifest?.hash || skill.contentHash;

		return {
			matches: actualHash === expectedHash,
			expectedHash,
			actualHash,
			filePath: skill.filePath,
		};
	} catch (err) {
		return {
			matches: false,
			actualHash: "",
			filePath: skill.filePath,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
