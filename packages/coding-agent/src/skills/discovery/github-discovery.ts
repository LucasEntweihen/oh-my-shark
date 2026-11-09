/**
 * Universal Skills Engine - GitHub Discovery & Remote Fetcher
 *
 * Discovers and downloads skills directly from GitHub repositories.
 */
import { computeContentHash } from "../core/skill-parser";

export interface RemoteSkillFile {
	path: string;
	content: string;
}

export interface RemoteSkillPackage {
	id: string;
	name: string;
	repository: string;
	subpath: string;
	entrypointContent: string;
	resources: RemoteSkillFile[];
	hash: string;
}

function getGitHubHeaders(): Record<string, string> {
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	const headers: Record<string, string> = {
		"User-Agent": "OMSK-Universal-Skills-Engine/1.0",
		Accept: "application/vnd.github.v3+json",
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

/**
 * Fetches raw file content from GitHub repository.
 */
export async function fetchRawGitHubFile(
	repository: string,
	filePath: string,
	branch: string = "main",
): Promise<string | null> {
	const rawUrl = `https://raw.githubusercontent.com/${repository}/${branch}/${filePath}`;
	try {
		const res = await fetch(rawUrl, { headers: getGitHubHeaders() });
		if (res.ok) {
			return await res.text();
		}
		// If main failed, attempt master branch
		if (branch === "main") {
			const fallbackUrl = `https://raw.githubusercontent.com/${repository}/master/${filePath}`;
			const fallbackRes = await fetch(fallbackUrl, { headers: getGitHubHeaders() });
			if (fallbackRes.ok) {
				return await fallbackRes.text();
			}
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Attempts to locate and download a skill package from a GitHub repository.
 */
export async function fetchRemoteSkill(
	repository: string,
	skillName: string,
	options: { subpath?: string; branch?: string } = {},
): Promise<RemoteSkillPackage | null> {
	const candidatePaths = [
		options.subpath ? `${options.subpath}/SKILL.md` : null,
		`skills/${skillName}/SKILL.md`,
		`${skillName}/SKILL.md`,
		`skills/${skillName}.md`,
		`${skillName}.md`,
		"SKILL.md",
	].filter((p): p is string => p !== null);

	let entrypointContent: string | null = null;
	let resolvedSubpath = options.subpath || `skills/${skillName}`;

	for (const candidate of candidatePaths) {
		const content = await fetchRawGitHubFile(repository, candidate, options.branch);
		if (content) {
			entrypointContent = content;
			resolvedSubpath = candidate.replace(/\/SKILL\.md$/, "").replace(/\.md$/, "");
			break;
		}
	}

	if (!entrypointContent) {
		return null;
	}

	const hash = computeContentHash(entrypointContent);
	return {
		id: skillName.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
		name: skillName,
		repository,
		subpath: resolvedSubpath,
		entrypointContent,
		resources: [],
		hash,
	};
}
