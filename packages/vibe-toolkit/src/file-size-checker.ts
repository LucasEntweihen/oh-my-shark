import * as fs from "node:fs";
import * as path from "node:path";

export interface FileSizeViolation {
	path: string;
	relativePath: string;
	lines: number;
	exceededBy: number;
}

export interface FileSizeScanResult {
	maxLinesAllowed: number;
	totalFilesScanned: number;
	violatingFiles: FileSizeViolation[];
	pass: boolean;
}

export const VIBE_FILE_SIZE_LIMIT = 350;

const DEFAULT_IGNORED_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	"out",
	"assets",
	"temp",
	"coverage",
	".turbo",
]);

const SUPPORTED_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs",
	".py",
	".rs",
	".go",
]);

/**
 * Recursively scans files in targetDir and identifies any code files exceeding the max line limit.
 */
export function checkFileSizes(
	targetDir: string,
	options: {
		maxLines?: number;
		ignoredDirs?: Set<string>;
		extensions?: Set<string>;
		baseDir?: string;
	} = {},
): FileSizeScanResult {
	const maxLinesAllowed = options.maxLines ?? VIBE_FILE_SIZE_LIMIT;
	const ignoredDirs = options.ignoredDirs ?? DEFAULT_IGNORED_DIRS;
	const extensions = options.extensions ?? SUPPORTED_EXTENSIONS;
	const baseDir = options.baseDir ?? targetDir;

	const violatingFiles: FileSizeViolation[] = [];
	let totalFilesScanned = 0;

	function walk(currentDir: string): void {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (!ignoredDirs.has(entry.name) && !entry.name.startsWith(".")) {
					walk(fullPath);
				}
				continue;
			}

			if (!entry.isFile()) continue;

			const ext = path.extname(entry.name);
			if (!extensions.has(ext)) continue;

			totalFilesScanned++;
			try {
				const content = fs.readFileSync(fullPath, "utf-8");
				// Count lines accurately
				const lines = content.split(/\r?\n/).length;
				if (lines > maxLinesAllowed) {
					violatingFiles.push({
						path: fullPath,
						relativePath: path.relative(baseDir, fullPath).replace(/\\/g, "/"),
						lines,
						exceededBy: lines - maxLinesAllowed,
					});
				}
			} catch {
				// Read error skipped
			}
		}
	}

	walk(targetDir);

	// Sort highest violations first
	violatingFiles.sort((a, b) => b.lines - a.lines);

	return {
		maxLinesAllowed,
		totalFilesScanned,
		violatingFiles,
		pass: violatingFiles.length === 0,
	};
}
