import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { checkPythonKernelAvailability } from "../eval/py/kernel";
import { stageRunnerScript } from "../eval/runner-cache";
import { logger } from "@oh-my-pi/pi-utils";
import TASKMANAGER_SCRIPT from "./taskmanager.py" with { type: "text" };
import taskManagerHtmlPath from "./index.html" with { type: "file" };
import { startTaskManagerServer } from "./server";

function getTaskManagerHtml(): string {
	const resolvedPath = path.isAbsolute(taskManagerHtmlPath)
		? taskManagerHtmlPath
		: path.resolve(import.meta.dir, taskManagerHtmlPath);
	return fs.readFileSync(resolvedPath, "utf-8");
}

/**
 * Busca executáveis baseados em Chromium/Edge para abrir a UI em janela de aplicativo dedicada (--app).
 * Mantém o visual 100% como janela nativa de desktop (sem abas do navegador, sem barra de endereços).
 */
function findNativeWindowExecutable(): string | null {
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
			if (fs.existsSync(cand)) {
				return cand;
			}
		}
	} else if (platform === "darwin") {
		const candidates = [
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
		];
		for (const cand of candidates) {
			if (fs.existsSync(cand)) {
				return cand;
			}
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
					if (resolved && fs.existsSync(resolved)) {
						return resolved;
					}
				}
			} catch {}
		}
	}

	return null;
}

/**
 * Lança o Task Manager GUI em uma janela nativa moderna (HTML/CSS/JS com tema cósmico e Kanban),
 * com fallback gracioso para a janela Python/Tkinter caso nenhum runtime gráfico web esteja disponível.
 */
export async function launchTaskManagerGui(cwd?: string): Promise<{ ok: boolean; reason?: string }> {
	const workingDir = cwd ?? process.cwd();

	// 1. Tentar lançar a janela nativa de desktop ultra-otimizada (HTML5 + CSS + JS acelerado por GPU)
	const nativeBrowser = findNativeWindowExecutable();
	if (nativeBrowser) {
		try {
			// Inicia o servidor HTTP local em porta efêmera para servir o Kanban Board e as APIs REST
			const htmlContent = getTaskManagerHtml();
			const { port } = await startTaskManagerServer(htmlContent);
			const appUrl = `http://127.0.0.1:${port}/`;

			const child = Bun.spawn([
				nativeBrowser,
				`--app=${appUrl}`,
				"--window-size=1200,780",
				"--window-position=80,80",
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
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			logger.warn("Native window web launch failed, attempting fallback to desktop engine", { error: msg });
		}
	}

	// 2. Fallback resiliente: Lançador em processo Python/Tkinter modernizado
	const availability = await checkPythonKernelAvailability(workingDir);
	if (!availability.ok || !availability.pythonPath) {
		return {
			ok: false,
			reason: availability.reason ?? "Nenhum runtime compatível com janela de desktop encontrado (Edge, Chrome, Chromium ou Python com Tkinter).",
		};
	}

	try {
		const scriptPath = await stageRunnerScript("omp-taskmanager-gui", "py", TASKMANAGER_SCRIPT);
		const pythonBin = availability.pythonPath;
		const child = Bun.spawn([pythonBin, scriptPath], {
			cwd: workingDir,
			stdin: "ignore",
			stdout: "ignore",
			stderr: "ignore",
			detached: true,
			env: {
				...process.env,
				PYTHONUNBUFFERED: "1",
				PYTHONIOENCODING: "utf-8",
			},
		});

		child.unref();
		return { ok: true };
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		logger.error("Failed to launch Task Manager GUI", { error: msg });
		return { ok: false, reason: msg };
	}
}
