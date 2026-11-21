/**
 * Launch OhMyShark Desktop GUI or start in RPC-UI mode for GUI connection.
 */

import { Command } from "@oh-my-pi/pi-utils/cli";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { type Args as ParsedArgs, parseArgs, reportCliUsageError } from "../cli/args";
import { desktopHelp as commandHelp } from "../cli/command-help";
import { runRootCommand } from "../main";

function findRepoRoot(): string | null {
	const starts = [process.cwd(), resolve(import.meta.dir, "..", "..", "..", "..")];
	for (const start of starts) {
		let dir = resolve(start);
		for (let i = 0; i < 8; i++) {
			if (existsSync(join(dir, "packages", "gui", "package.json"))) {
				return dir;
			}
			const parent = dirname(dir);
			if (parent === dir) break;
			dir = parent;
		}
	}
	return null;
}

function findExeOnPath(binary: string): string | null {
	const fromBun = typeof Bun !== "undefined" && typeof Bun.which === "function" ? Bun.which(binary) : null;
	if (fromBun) return fromBun;
	const pathEnv = process.env.PATH ?? "";
	const sep = process.platform === "win32" ? ";" : ":";
	for (const dir of pathEnv.split(sep)) {
		if (!dir) continue;
		const candidate = join(dir, binary);
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

function collectGuiCandidates(repoRoot: string | null): string[] {
	const candidates: string[] = [];
	const explicit = process.env.OMSK_GUI_BIN;
	if (explicit) candidates.push(explicit);

	if (repoRoot) {
		const guiDist = join(repoRoot, "packages", "gui", "dist");
		if (process.platform === "win32") {
			candidates.push(join(guiDist, "win-unpacked", "OhMyShark.exe"));
			if (existsSync(guiDist)) {
				try {
					const distExes = readdirSync(guiDist)
						.filter((name) => /^OhMyShark-.*\.exe$/i.test(name))
						.sort((a, b) => {
							const aPortable = a.toLowerCase().includes("portable") ? 0 : 1;
							const bPortable = b.toLowerCase().includes("portable") ? 0 : 1;
							return aPortable - bPortable || b.localeCompare(a);
						});
					for (const name of distExes) {
						candidates.push(join(guiDist, name));
					}
				} catch {
					// Ignore unreadable dist folder
				}
			}
		} else if (process.platform === "darwin") {
			candidates.push(join(guiDist, "mac-arm64", "OhMyShark.app", "Contents", "MacOS", "OhMyShark"));
			candidates.push(join(guiDist, "mac", "OhMyShark.app", "Contents", "MacOS", "OhMyShark"));
			candidates.push(join(guiDist, "mac-x64", "OhMyShark.app", "Contents", "MacOS", "OhMyShark"));
		} else {
			candidates.push(join(guiDist, "linux-unpacked", "omsk-gui"));
		}
	}

	if (process.platform === "win32") {
		const localAppData = process.env.LOCALAPPDATA;
		if (localAppData) {
			candidates.push(join(localAppData, "Programs", "OhMyShark", "OhMyShark.exe"));
		}
		const programFiles = process.env.PROGRAMFILES;
		if (programFiles) {
			candidates.push(join(programFiles, "OhMyShark", "OhMyShark.exe"));
		}
	} else if (process.platform === "darwin") {
		candidates.push("/Applications/OhMyShark.app");
		candidates.push(join(homedir(), "Applications", "OhMyShark.app"));
	} else {
		const fromPath = findExeOnPath("omsk-gui");
		if (fromPath) candidates.push(fromPath);
		candidates.push("/usr/bin/omsk-gui", "/usr/local/bin/omsk-gui");
	}

	return candidates;
}

export default class Desktop extends Command {
	static description = commandHelp.description;
	static strict = false;

	async run(): Promise<void> {
		const repoRoot = findRepoRoot();
		const isDev = this.argv.includes("--dev");
		const passThroughArgv = this.argv.filter((arg) => arg !== "--dev");

		if (isDev) {
			if (!repoRoot) {
				console.error("Cannot launch OhMyShark Desktop in --dev mode: packages/gui workspace not found.");
				process.exitCode = 1;
				return;
			}
			console.log(`Launching OhMyShark Desktop GUI in dev mode from ${join(repoRoot, "packages", "gui")}...`);
			const bunExe = typeof process.execPath === "string" && process.execPath.toLowerCase().includes("bun")
				? process.execPath
				: "bun";
			const exitCode = await new Promise<number>((resolveExit, rejectExit) => {
				const child = spawn(bunExe, ["--cwd=packages/gui", "run", "dev", ...passThroughArgv], {
					cwd: repoRoot,
					stdio: "inherit",
				});
				child.on("error", rejectExit);
				child.on("exit", (code) => resolveExit(code ?? 0));
			});
			process.exitCode = exitCode;
			return;
		}

		const found = collectGuiCandidates(repoRoot).find((candidate) => existsSync(candidate));
		if (found) {
			console.log(`Launching OhMyShark Desktop GUI from ${found}...`);
			if (process.platform === "darwin" && found.endsWith(".app")) {
				const child = spawn("open", ["-a", found, ...(passThroughArgv.length > 0 ? ["--args", ...passThroughArgv] : [])], {
					detached: true,
					stdio: "ignore",
				});
				child.unref();
			} else {
				const child = spawn(found, passThroughArgv, { detached: true, stdio: "ignore" });
				child.unref();
			}
			return;
		}

		let parsed: ParsedArgs;
		try {
			parsed = parseArgs(passThroughArgv);
		} catch (error) {
			if (reportCliUsageError(error)) {
				process.exitCode = 2;
				return;
			}
			throw error;
		}
		// Default to rpc-ui for GUI connection when executable not yet compiled
		parsed.mode = "rpc-ui";
		await runRootCommand(parsed, passThroughArgv);
	}
}
