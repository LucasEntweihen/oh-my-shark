#!/usr/bin/env bun
/**
 * Launcher oficial CosmoSky com abertura instantânea de janela nativa.
 */
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "@oh-my-pi/pi-utils";
import { createAuroraHttpServer } from "./server";

function findDesktopWindowExecutable(): string | null {
	const platform = os.platform();
	const home = os.homedir();

	if (platform === "win32") {
		const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
		const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
		const localAppData = process.env.LOCALAPPDATA ?? path.join(home, "AppData\\Local");

		const candidates = [
			path.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
			path.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe"),
			path.join(localAppData, "Microsoft\\Edge\\Application\\msedge.exe"),
			path.join(programFiles, "Google\\Chrome\\Application\\chrome.exe"),
			path.join(programFilesX86, "Google\\Chrome\\Application\\chrome.exe"),
			path.join(localAppData, "Google\\Chrome\\Application\\chrome.exe"),
			path.join(programFiles, "BraveSoftware\\Brave-Browser\\Application\\brave.exe"),
		];

		for (const cand of candidates) {
			if (fs.existsSync(cand)) return cand;
		}
	} else if (platform === "darwin") {
		const candidates = [
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
		];
		for (const cand of candidates) {
			if (fs.existsSync(cand)) return cand;
		}
	} else {
		const binaries = [
			"microsoft-edge",
			"google-chrome",
			"google-chrome-stable",
			"chromium",
			"chromium-browser",
			"brave-browser",
		];
		for (const bin of binaries) {
			try {
				const check = Bun.spawnSync(["which", bin]);
				if (check.exitCode === 0) {
					const resolved = check.stdout.toString().trim();
					if (resolved && fs.existsSync(resolved)) return resolved;
				}
			} catch {}
		}
	}

	return null;
}

export async function launchAuroraGuiApp(cwd?: string): Promise<{ ok: boolean; reason?: string }> {
	const workingDir = cwd ?? process.cwd();

	try {
		const { port } = await createAuroraHttpServer(workingDir);
		const appUrl = `http://127.0.0.1:${port}/?mode=app#app`;
		const browserBin = findDesktopWindowExecutable();

		if (!browserBin) {
			logger.info(`Abrindo interface CosmoSky em ${appUrl}`);
			if (process.platform === "win32") {
				Bun.spawn(["cmd", "/c", "start", appUrl], { detached: true }).unref();
			} else if (process.platform === "darwin") {
				Bun.spawn(["open", appUrl], { detached: true }).unref();
			} else {
				Bun.spawn(["xdg-open", appUrl], { detached: true }).unref();
			}
			return { ok: true };
		}

		const child = Bun.spawn([
			browserBin,
			`--app=${appUrl}`,
			"--window-size=1280,840",
			"--window-position=60,60",
			"--disable-default-apps",
			"--no-first-run",
		], {
			cwd: workingDir,
			stdin: "ignore",
			stdout: "ignore",
			stderr: "ignore",
			detached: true,
		});

		child.unref();
		return { ok: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("Falha ao iniciar CosmoSky", { error: msg });
		return { ok: false, reason: msg };
	}
}

const isProcessEntry = import.meta.main || process.env.PI_COMPILED === "true";

if (isProcessEntry) {
	launchAuroraGuiApp().catch(err => {
		console.error("CosmoSky startup error:", err);
		process.exit(1);
	});
}
