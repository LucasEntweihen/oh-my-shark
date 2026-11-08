/**
 * Launch OhMyShark Desktop GUI or start in RPC-UI mode for GUI connection.
 */

import { Command } from "@oh-my-pi/pi-utils/cli";
import { type Args as ParsedArgs, parseArgs, reportCliUsageError } from "../cli/args";
import { desktopHelp as commandHelp } from "../cli/command-help";
import { runRootCommand } from "../main";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export default class Desktop extends Command {
	static description = commandHelp.description;
	static strict = false;

	async run(): Promise<void> {
		const appDir = join(process.cwd(), "apps", "desktop");
		const candidates = [
			join(appDir, "src-tauri", "target", "release", "omsk-desktop.exe"),
			join(appDir, "src-tauri", "target", "debug", "omsk-desktop.exe"),
			join(appDir, "src-tauri", "target", "release", "omsk-desktop"),
			join(appDir, "src-tauri", "target", "debug", "omsk-desktop"),
		];
		const found = candidates.find((p) => existsSync(p));
		if (found) {
			console.log(`Launching OMSK Desktop GUI from ${found}...`);
			const child = spawn(found, [], { detached: true, stdio: "ignore" });
			child.unref();
			return;
		}

		let parsed: ParsedArgs;
		try {
			parsed = parseArgs(this.argv);
		} catch (error) {
			if (reportCliUsageError(error)) {
				process.exitCode = 2;
				return;
			}
			throw error;
		}
		// Default to rpc-ui for GUI connection when executable not yet compiled
		parsed.mode = "rpc-ui";
		await runRootCommand(parsed, this.argv);
	}
}
