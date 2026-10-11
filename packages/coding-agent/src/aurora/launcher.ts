#!/usr/bin/env bun
/**
 * Servidor e Runtime Local da Interface Gráfica Aurora AI para omsk
 *
 * Utiliza o bundle embutido de assets estáticos compilados ou o diretório local site/dist,
 * servindo em porta efêmera local e abrindo em janela nativa dedicada (--app).
 */

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { logger } from "@oh-my-pi/pi-utils";
import { AURORA_WEB_ASSETS } from "./bundle.generated";

function findDesktopWindowExecutable(): string | null {
	const platform = os.platform();
	const home = os.homedir();

	if (platform === "win32") {
		const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
		const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
		const localAppData = process.env.LOCALAPPDATA ?? path.join(home, "AppData\\Local");

		const candidates = [
			path.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe"),
			path.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
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
		// Linux
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

const MIME_TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

export async function launchAuroraGuiApp(cwd?: string): Promise<{ ok: boolean; reason?: string }> {
	const workingDir = cwd ?? process.cwd();

	const server = http.createServer((req, res) => {
		const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
		let cleanPath = parsedUrl.pathname.replace(/^\//, "");
		if (!cleanPath || cleanPath === "index.html") {
			cleanPath = "index.html";
		}

		let assetContent = AURORA_WEB_ASSETS[cleanPath];
		if (!assetContent) {
			// Roteador SPA: fallback para index.html
			cleanPath = "index.html";
			assetContent = AURORA_WEB_ASSETS["index.html"];
		}

		if (!assetContent) {
			res.writeHead(404);
			res.end("Not Found");
			return;
		}

		const ext = path.extname(cleanPath);
		const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

		res.writeHead(200, {
			"Content-Type": contentType,
			"Cache-Control": "no-cache",
		});

		if (assetContent.startsWith("base64:")) {
			const buffer = Buffer.from(assetContent.slice(7), "base64");
			res.end(buffer);
		} else {
			res.end(assetContent);
		}
	});

	const { port } = await new Promise<{ port: number }>((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const addr = server.address();
			if (addr && typeof addr === "object") {
				resolve({ port: addr.port });
			} else {
				reject(new Error("Failed to get port from server"));
			}
		});
	});

	// Força abertura direta no modo aplicação na interface Aurora (/app)
	const appUrl = `http://127.0.0.1:${port}/?mode=app#app`;
	const browserBin = findDesktopWindowExecutable();

	if (!browserBin) {
		logger.info(`Abrindo interface gráfica Aurora AI em ${appUrl}`);
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
		"--window-size=1280,820",
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
}

if (import.meta.main) {
	await launchAuroraGuiApp();
}
