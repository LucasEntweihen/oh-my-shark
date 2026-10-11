import { Command, Flags } from "@oh-my-pi/pi-utils/cli";
import * as path from "node:path";
import { launchAuroraGuiApp } from "../aurora/launcher";

export default class GuiBuildCommand extends Command {
	static description = "Build or launch the Aurora AI Desktop GUI Window Application";

	static flags = {
		build: Flags.boolean({ char: "b", description: "Build the web assets for the GUI desktop package", default: false }),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GuiBuildCommand);

		if (flags.build) {
			process.stdout.write("Compiling Aurora AI React application into site/dist/...\n");
			const siteDir = path.resolve(import.meta.dir, "..", "..", "..", "site");
			const proc = Bun.spawn(["bun", "run", "build"], {
				cwd: siteDir,
				stdout: "inherit",
				stderr: "inherit",
			});
			const code = await proc.exited;
			if (code !== 0) {
				process.stderr.write(`Build failed with exit code ${code}\n`);
				process.exitCode = code;
				return;
			}
			process.stdout.write("Aurora AI desktop assets successfully built.\n");
			return;
		}

		const result = await launchAuroraGuiApp(process.cwd());
		if (!result.ok) {
			process.stderr.write(`Failed to launch Aurora GUI: ${result.reason}\n`);
			process.exitCode = 1;
		}
	}
}
