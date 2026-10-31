import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "..");
const omskGuiDir = path.resolve(rootDir, "..", "OMSK-gui");
const appsOmskGuiResources = path.join(rootDir, "apps", "omsk-gui", "resources");
const appDataOmskGuiResources = path.join(
	os.homedir(),
	"AppData",
	"Local",
	"Programs",
	"OMSK GUI",
	"resources",
);
const desktopShortcut = path.join(os.homedir(), "Desktop", "OMSK GUI.lnk");

console.log("=== OMSK GUI Sync & Build Pipeline ===");
console.log(`Root dir: ${rootDir}`);
console.log(`OMSK-gui source: ${omskGuiDir}`);

if (!fs.existsSync(omskGuiDir)) {
	console.error(`ERROR: OMSK-gui directory not found at ${omskGuiDir}`);
	process.exit(1);
}

// 1. Build frontend dist
console.log("\n[1/4] Building web frontend dist in OMSK-gui...");
execSync("bun run build", { cwd: omskGuiDir, stdio: "inherit" });

// 2. Compile electron main & preload
console.log("\n[2/4] Compiling electron main & preload...");
execSync("bun run compile:electron", { cwd: omskGuiDir, stdio: "inherit" });

// 3. Stage and pack app.asar
console.log("\n[3/4] Packaging app.asar...");
const tempStaging = fs.mkdtempSync(path.join(os.tmpdir(), "omsk-gui-staging-"));
try {
	const distSrc = path.join(omskGuiDir, "dist");
	const electronDistSrc = path.join(omskGuiDir, "electron", "dist");
	const pkgJsonSrc = path.join(omskGuiDir, "package.json");

	fs.cpSync(distSrc, path.join(tempStaging, "dist"), { recursive: true });
	fs.cpSync(electronDistSrc, path.join(tempStaging, "electron", "dist"), { recursive: true });
	fs.copyFileSync(pkgJsonSrc, path.join(tempStaging, "package.json"));

	const tempAsar = path.join(os.tmpdir(), `omsk-app-${Date.now()}.asar`);
	execSync(`npx --yes @electron/asar pack "${tempStaging}" "${tempAsar}"`, {
		cwd: omskGuiDir,
		stdio: "inherit",
	});

	const asarSize = fs.statSync(tempAsar).size;
	console.log(`Successfully generated app.asar (${(asarSize / 1024 / 1024).toFixed(2)} MB)`);

	// Helper for atomic file replacement on Windows
	const safeDeploy = (destFile: string, label: string) => {
		const destDir = path.dirname(destFile);
		if (!fs.existsSync(destDir)) {
			console.log(`Skipping ${label} (target directory does not exist)`);
			return;
		}

		try {
			// Direct copy attempt
			fs.copyFileSync(tempAsar, destFile);
			console.log(`✓ Updated ${label}: ${destFile}`);
		} catch (err: unknown) {
			const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";
			if (code === "EBUSY" || code === "EPERM") {
				const oldFile = `${destFile}.old`;
				try {
					if (fs.existsSync(oldFile)) {
						try { fs.unlinkSync(oldFile); } catch {}
					}
					fs.renameSync(destFile, oldFile);
					fs.copyFileSync(tempAsar, destFile);
					console.log(`✓ Updated ${label} via atomic rename-to-old: ${destFile}`);
				} catch (renameErr) {
					console.error(`✗ Failed to replace locked file at ${destFile}:`, renameErr);
				}
			} else {
				console.error(`✗ Error deploying to ${destFile}:`, err);
			}
		}
	};

	// 4. Deploy to targets
	console.log("\n[4/4] Deploying official app.asar to target locations...");
	
	// Target A: Live AppData (used by Desktop shortcut)
	safeDeploy(path.join(appDataOmskGuiResources, "app.asar"), "Desktop Installation (AppData)");

	// Target B: Repo distribution (apps/omsk-gui)
	safeDeploy(path.join(appsOmskGuiResources, "app.asar"), "Repo Distribution (apps/omsk-gui)");

	// Cleanup temp asar
	try { fs.unlinkSync(tempAsar); } catch {}
} finally {
	try { fs.rmSync(tempStaging, { recursive: true, force: true }); } catch {}
}

// 5. Verification of desktop shortcut
console.log("\n=== Verifying Desktop Shortcut ===");
if (fs.existsSync(desktopShortcut)) {
	console.log(`✓ Desktop shortcut verified: ${desktopShortcut}`);
} else {
	console.warn(`! Desktop shortcut not found at: ${desktopShortcut}`);
}

console.log("\n✨ OMSK GUI 100% Oficial sincronizada com sucesso!");
