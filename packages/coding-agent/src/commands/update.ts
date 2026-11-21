/**
 * Check for and install updates.
 */

import chalk from "@oh-my-pi/pi-utils/chalk";
import { APP_NAME } from "@oh-my-pi/pi-utils/dirs";
import { Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { updateHelp as commandHelp } from "../cli/command-help";
import { CliUsageError } from "../cli/usage-error";

export default class Update extends Command {
	static description = commandHelp.description;
	static flags = {
		force: Flags.boolean({ char: "f", description: "Force update", default: false }),
		check: Flags.boolean({ char: "c", description: "Check for updates without installing", default: false }),
		plugins: Flags.boolean({ char: "l", description: "Update installed plugins", default: false }),
		canary: Flags.boolean({ description: "Switch to the canary channel and update", default: false }),
		stable: Flags.boolean({ description: "Switch back to the stable channel", default: false }),
	};

	static examples = [`${APP_NAME} update`, `${APP_NAME} update --check`, `${APP_NAME} update --canary`];

	async run(): Promise<void> {
		const { flags } = await this.parse(Update);
		// The ordinary updater must remain separate from the native-backed plugin/theme graph:
		// a missing pi_natives addon must not prevent the user from replacing the binary.
		// Load plugin management only for the explicit --plugins branch.
		if (flags.canary && flags.stable) throw new CliUsageError("--canary and --stable are mutually exclusive");
		if (flags.plugins) {
			const { runPluginCommand } = await import("../cli/plugin-cli");
			await runPluginCommand({ action: "upgrade", args: [], flags: flags.check ? { dryRun: true } : {} });
		} else {
			try {
				const { runUpdateCommand } = await import("../cli/update-cli");
				await runUpdateCommand({
					force: flags.force,
					check: flags.check,
					channel: flags.canary ? "canary" : flags.stable ? "stable" : undefined,
				});
			} catch (err) {
				console.error(chalk.red(err instanceof Error ? err.message : String(err)));
				process.exit(1);
			}
		}
	}
}
