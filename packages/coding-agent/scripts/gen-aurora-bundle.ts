import * as fs from "node:fs";
import * as path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "..", "..", "..");
const siteDistDir = path.join(repoRoot, "site", "dist");

function collectFiles(dir: string, baseDir: string): Record<string, string> {
	const result: Record<string, string> = {};
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			Object.assign(result, collectFiles(fullPath, baseDir));
		} else {
			const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
			const ext = path.extname(entry.name).toLowerCase();
			if (ext === ".html" || ext === ".js" || ext === ".css" || ext === ".json" || ext === ".svg") {
				result[relativePath] = fs.readFileSync(fullPath, "utf-8");
			} else {
				// Arquivos binários como woff/woff2 codificados em base64
				result[relativePath] = `base64:${fs.readFileSync(fullPath).toString("base64")}`;
			}
		}
	}

	return result;
}

const files = collectFiles(siteDistDir, siteDistDir);
const outputPath = path.join(repoRoot, "packages", "coding-agent", "src", "aurora", "bundle.generated.ts");

const generatedContent = `/** Auto-generated bundle of Aurora AI Web Assets */
export const AURORA_WEB_ASSETS: Record<string, string> = ${JSON.stringify(files, null, "\t")};
`;

fs.writeFileSync(outputPath, generatedContent, "utf-8");
console.log(`Generated ${Object.keys(files).length} web assets into ${outputPath}`);
