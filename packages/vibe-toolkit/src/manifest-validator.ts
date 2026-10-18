import * as fs from "node:fs";
import * as path from "node:path";

export interface CanonicalFileStatus {
	file: string;
	exists: boolean;
	templatePath: string;
	sizeBytes?: number;
}

export interface ManifestValidationResult {
	valid: boolean;
	totalExpected: number;
	existingCount: number;
	missingCount: number;
	files: CanonicalFileStatus[];
}

export const CANONICAL_MANIFEST_FILES: Record<string, string> = {
	"PRODUCT.md": "product.md.template",
	"README.md": "project-docs/README.md.template",
	"AGENTS.md": "AGENTS.md.template",
	"CLAUDE.md": "CLAUDE.md.template",
	"docs/architecture.md": "project-docs/architecture.md.template",
	"docs/design.md": "project-docs/design.md.template",
	"docs/onboarding.md": "project-docs/onboarding.md.template",
	"docs/quality.md": "project-docs/quality.md.template",
	"docs/setup.md": "project-docs/setup.md.template",
};

/**
 * Returns absolute path to the templates directory in assets.
 */
export function getAssetsTemplatesDir(): string {
	return path.resolve(import.meta.dir, "../assets/templates");
}

/**
 * Validates presence of the 9 canonical documentation files in the target directory.
 */
export function validateManifest(targetDir: string): ManifestValidationResult {
	const files: CanonicalFileStatus[] = [];
	let existingCount = 0;

	for (const [canonicalFile, templateRel] of Object.entries(CANONICAL_MANIFEST_FILES)) {
		const fullPath = path.resolve(targetDir, canonicalFile);
		const exists = fs.existsSync(fullPath);
		let sizeBytes: number | undefined;

		if (exists) {
			try {
				const stat = fs.statSync(fullPath);
				sizeBytes = stat.size;
				existingCount++;
			} catch {
				// Stat error fallback
			}
		}

		files.push({
			file: canonicalFile,
			exists,
			templatePath: templateRel,
			sizeBytes,
		});
	}

	const missingCount = files.length - existingCount;

	return {
		valid: missingCount === 0,
		totalExpected: files.length,
		existingCount,
		missingCount,
		files,
	};
}

/**
 * Generates missing canonical files in targetDir from templates.
 */
export function scaffoldMissingManifestFiles(
	targetDir: string,
	options: { projectName?: string; overwrite?: boolean } = {},
): { created: string[]; skipped: string[] } {
	const templatesDir = getAssetsTemplatesDir();
	const created: string[] = [];
	const skipped: string[] = [];

	for (const [canonicalFile, templateRel] of Object.entries(CANONICAL_MANIFEST_FILES)) {
		const destPath = path.resolve(targetDir, canonicalFile);
		const templatePath = path.resolve(templatesDir, templateRel);

		if (fs.existsSync(destPath) && !options.overwrite) {
			skipped.push(canonicalFile);
			continue;
		}

		let content = "";
		if (fs.existsSync(templatePath)) {
			content = fs.readFileSync(templatePath, "utf-8");
			if (options.projectName) {
				content = content.replaceAll("{{PROJECT_NAME}}", options.projectName);
			}
		} else {
			content = `# ${canonicalFile}\n\nCanônico para governança do projeto.\n`;
		}

		const parentDir = path.dirname(destPath);
		if (!fs.existsSync(parentDir)) {
			fs.mkdirSync(parentDir, { recursive: true });
		}

		fs.writeFileSync(destPath, content, "utf-8");
		created.push(canonicalFile);
	}

	return { created, skipped };
}
