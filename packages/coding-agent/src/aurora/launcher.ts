#!/usr/bin/env bun
/**
 * Servidor e Runtime Local da Interface Gráfica Aurora AI para omsk
 *
 * Expõe a aplicação React compilada em porta efêmera e abre diretamente
 * em janela de aplicativo dedicada (--app) usando o motor Chromium/Edge nativo do sistema,
 * garantindo aparência de app desktop puro (.exe), sem barras de endereço do navegador.
 */

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { logger } from "@oh-my-pi/pi-utils";

const packageDir = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageDir, "..", "..");
const siteDistDir = path.join(repoRoot, "site", "dist");

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

	if (!fs.existsSync(siteDistDir)) {
		return {
			ok: false,
			reason: `Diretório de build do site não encontrado em ${siteDistDir}. Execute 'bun run build' em site/ primeiro.`,
		};
	}

	const server = http.createServer((req, res) => {
		const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
		let filePath = path.join(siteDistDir, parsedUrl.pathname === "/" ? "index.html" : parsedUrl.pathname);

		if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
			filePath = path.join(siteDistDir, "index.html");
		}

		const ext = path.extname(filePath);
		const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

		try {
			const data = fs.readFileSync(filePath);
			res.writeHead(200, {
				"Content-Type": contentType,
				"Cache-Control": "no-cache",
			});
			res.end(data);
		} catch (err) {
			res.writeHead(500);
			res.end(`Internal Server Error: ${String(err)}`);
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

	const appUrl = `http://127.0.0.1:${port}/`;
	const browserBin = findDesktopWindowExecutable();

	if (!browserBin) {
		// Abre no navegador padrão se não encontrar Edge/Chrome standalone
		logger.info(`Abrindo interface Aurora AI em ${appUrl}`);
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
