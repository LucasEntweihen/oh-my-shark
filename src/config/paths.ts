import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let cachedProjectRoot: string | undefined;

/**
 * Discovers the project root directory by searching upward for package.json or git root.
 */
export function getProjectRoot(startDir: string = process.cwd()): string {
	if (cachedProjectRoot && fs.existsSync(cachedProjectRoot)) {
		return cachedProjectRoot;
	}

	let current = path.resolve(startDir);
	while (true) {
		const pkgPath = path.join(current, "package.json");
		if (fs.existsSync(pkgPath)) {
			try {
				const content = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
				if (content.name === "ohmyshark" || content.name === "omsk") {
					cachedProjectRoot = current;
					return current;
				}
			} catch {}
		}

		const gitPath = path.join(current, ".git");
		if (fs.existsSync(gitPath)) {
			cachedProjectRoot = current;
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			break;
		}
		current = parent;
	}

	// Fallback to startDir or cwd
	cachedProjectRoot = path.resolve(startDir);
	return cachedProjectRoot;
}

/** Get the root-level .omsk directory path */
export function getProjectOmskDir(rootDir: string = getProjectRoot()): string {
	return path.join(rootDir, ".omsk");
}

/** Get the root-level agent.db path */
export function getProjectAgentDbPath(rootDir: string = getProjectRoot()): string {
	return path.join(getProjectOmskDir(rootDir), "agent.db");
}

/** Get the root-level knowledge.db path */
export function getProjectKnowledgeDbPath(rootDir: string = getProjectRoot()): string {
	return path.join(getProjectOmskDir(rootDir), "knowledge.db");
}

/** Get the root-level providers.json path */
export function getProjectProvidersJsonPath(rootDir: string = getProjectRoot()): string {
	return path.join(getProjectOmskDir(rootDir), "providers.json");
}

/** Get the root-level knowledge.json path */
export function getProjectKnowledgeJsonPath(rootDir: string = getProjectRoot()): string {
	return path.join(getProjectOmskDir(rootDir), "knowledge.json");
}

/** Get the user's global ~/.omsk/agent/agent.db path */
export function getGlobalAgentDbPath(): string {
	return path.join(os.homedir(), ".omsk", "agent", "agent.db");
}

/** Ensures that the project .omsk directory exists */
export function ensureProjectOmskDir(rootDir: string = getProjectRoot()): string {
	const dir = getProjectOmskDir(rootDir);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
	}
	return dir;
}
