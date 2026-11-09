/**
 * Manage skills (search, install, list, inspect, update, doctor).
 */
import { Args, Command, Flags } from "@oh-my-pi/pi-utils/cli";
import { skillsHelp as commandHelp } from "../cli/command-help";
import { type SkillsAction, type SkillsCommandArgs, runSkillsCommand } from "../cli/skills-cli";
import { initTheme } from "../modes/theme/theme";

const ACTIONS: SkillsAction[] = [
	"search",
	"install",
	"list",
	"inspect",
	"update",
	"uninstall",
	"doctor",
	"config",
];

export default class Skills extends Command {
	static description = commandHelp.description;
	static args = {
		action: Args.string({
			description: "Skill action (search, install, list, inspect, update, uninstall, doctor, config)",
			required: false,
			options: ACTIONS,
		}),
		targets: Args.string({
			description: "Query term, package repo, skill ID, or options",
			required: false,
			multiple: true,
		}),
	};

	static flags = {
		json: Flags.boolean({ description: "Output JSON" }),
		force: Flags.boolean({ description: "Force install/overwrite existing skills" }),
		"dry-run": Flags.boolean({ description: "Show planned actions without writing changes" }),
		skill: Flags.string({ description: "Specific skill name to install from a repository" }),
		scope: Flags.string({
			description: 'Install scope: "user" (default) or "project"',
			options: ["user", "project"],
		}),
		all: Flags.boolean({ description: "Operate on all skills" }),
	};

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Skills);
		const action = (args.action ?? "list") as SkillsAction;
		const targets = Array.isArray(args.targets) ? args.targets : args.targets ? [args.targets] : [];

		const cmd: SkillsCommandArgs = {
			action,
			args: targets,
			flags: {
				json: flags.json,
				force: flags.force,
				dryRun: flags["dry-run"],
				skill: flags.skill,
				scope: flags.scope as "user" | "project" | undefined,
				all: flags.all,
			},
		};

		await initTheme();
		await runSkillsCommand(cmd);
	}
}
