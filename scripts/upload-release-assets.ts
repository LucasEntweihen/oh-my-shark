import * as fs from "node:fs";
import * as path from "node:path";

const releaseId = process.argv[2] ?? "430914173"; // omsk-v0.0.48
const binariesDir = path.resolve("packages/coding-agent/binaries");

// Get GitHub token
const tokenProc = Bun.spawnSync(["gh", "auth", "token"]);
const token = tokenProc.stdout.toString().trim();
if (!token) {
	console.error("Failed to retrieve gh auth token");
	process.exit(1);
}

// Check existing assets
console.log("Checking currently uploaded assets...");
interface GitHubAsset {
	name: string;
}
const listRes = await fetch(`https://api.github.com/repos/LucasEntweihen/oh-my-shark/releases/${releaseId}/assets`, {
	headers: {
		Authorization: `token ${token}`,
		"User-Agent": "omsk-uploader",
	},
});
const existingAssets = (await listRes.json()) as GitHubAsset[];
const existingNames = new Set(Array.isArray(existingAssets) ? existingAssets.map((a) => a.name) : []);
console.log("Already uploaded:", Array.from(existingNames));

const allAssets = fs.readdirSync(binariesDir).filter((f) => !f.endsWith(".old") && !f.endsWith(".tmp"));

for (const assetName of allAssets) {
	if (existingNames.has(assetName)) {
		console.log(`[SKIP] Already present: ${assetName}`);
		continue;
	}

	const filePath = path.join(binariesDir, assetName);
	const stat = fs.statSync(filePath);
	const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
	console.log(`[UPLOADING] ${assetName} (${sizeMB} MB)...`);

	const uploadUrl = `https://uploads.github.com/repos/LucasEntweihen/oh-my-shark/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`;
	
	const curlProc = Bun.spawnSync([
		"curl",
		"-fL",
		"--http1.1",
		"-X", "POST",
		"-H", `Authorization: token ${token}`,
		"-H", "Content-Type: application/octet-stream",
		"--data-binary", `@${filePath}`,
		uploadUrl,
	]);

	if (curlProc.exitCode === 0) {
		console.log(`[SUCCESS] Uploaded ${assetName}`);
	} else {
		console.error(`[ERROR] Failed to upload ${assetName}:`, curlProc.stderr.toString());
	}
}

console.log("Asset upload workflow complete.");
