/**
 * Universal Skills Engine - CLI Handler
 *
 * Implements command handlers for:
 * ohms skills search <query>
 * ohms skills install <target> [--skill <name>] [--scope user|project] [--force]
 * ohms skills list [--all] [--json]
 * ohms skills inspect <skillId>
 * ohms skills update [skillId]
 * ohms skills uninstall <skillId>
 * ohms skills doctor
 */
import chalk from "@oh-my-pi/pi-utils/chalk";
import { runSkillsDoctor } from "../skills/core/skill-doctor";
import { getUniversalSkillRegistry } from "../skills/core/skill-registry";
import { searchCuratedSkills } from "../skills/discovery/marketplace-discovery";
import { installSkills } from "../skills/installation/installer";
import { uninstallSkill } from "../skills/installation/uninstaller";
import { updateAllSkills, updateSingleSkill } from "../skills/installation/updater";
import type { UniversalSkill } from "../skills/types";

export type SkillsAction =
	| "search"
	| "install"
	| "list"
	| "inspect"
	| "update"
	| "uninstall"
	| "doctor"
	| "config";

export interface SkillsCommandFlags {
	json?: boolean;
	force?: boolean;
	scope?: "user" | "project";
	skill?: string;
	all?: boolean;
	dryRun?: boolean;
}

export interface SkillsCommandArgs {
	action: SkillsAction;
	args: string[];
	flags: SkillsCommandFlags;
}

export async function runSkillsCommand(cmd: SkillsCommandArgs): Promise<void> {
	const registry = getUniversalSkillRegistry();
	await registry.ensureInitialized();

	switch (cmd.action) {
		case "search": {
			const query = cmd.args.join(" ").trim();
			if (!query) {
				console.log(chalk.yellow("Please provide a search term. Example: ohms skills search frontend"));
				return;
			}
			const results = searchCuratedSkills(query);
			if (cmd.flags.json) {
				console.log(JSON.stringify(results, null, 2));
				return;
			}
			console.log(chalk.bold.cyan(`\n  OMSK Skills Marketplace Search: "${query}"\n`));
			if (results.length === 0) {
				console.log(chalk.gray("  No matching skills found in catalog."));
				return;
			}
			for (const r of results) {
				const isInst = registry.get(r.id) !== undefined;
				const statusBadge = isInst ? chalk.green(" [INSTALLED]") : chalk.gray(" [AVAILABLE]");
				console.log(`  ${chalk.bold(r.id)}${statusBadge}`);
				console.log(`    ${chalk.dim("Repo:")} ${chalk.cyan(r.repository || "curated")}`);
				console.log(`    ${chalk.dim("Use:")}  ${r.utility || r.description}`);
				console.log();
			}
			console.log(chalk.dim(`  Total: ${results.length} result(s). Install with: ohms skills install <id>\n`));
			break;
		}

		case "install": {
			const target = cmd.args[0]?.trim();
			if (!target) {
				console.log(chalk.yellow("Usage: ohms skills install <repo|skill> [--skill <name>] [--scope user|project] [--force]"));
				return;
			}

			console.log(chalk.cyan(`\n  Installing skill: ${chalk.bold(target)}...\n`));
			const res = await installSkills({
				target,
				skillName: cmd.flags.skill,
				scope: cmd.flags.scope || "user",
				force: cmd.flags.force,
				dryRun: cmd.flags.dryRun,
			});

			if (cmd.flags.json) {
				console.log(JSON.stringify(res, null, 2));
				return;
			}

			if (res.warnings.length > 0) {
				for (const w of res.warnings) {
					console.log(chalk.yellow(`  [!] ${w}`));
				}
			}

			if (res.errors.length > 0) {
				for (const e of res.errors) {
					console.log(chalk.red(`  [x] ${e}`));
				}
			}

			if (res.success) {
				console.log(chalk.bold.green(`  ✓ Successfully installed ${res.installedSkills.length} skill(s) into ${res.targetDir}:`));
				for (const s of res.installedSkills) {
					console.log(`    - ${chalk.bold(s.id)} (${s.name})`);
				}
				console.log();
			} else {
				console.log(chalk.red("  Failed to complete installation.\n"));
			}
			break;
		}

		case "list": {
			const skills = registry.getAll();
			if (cmd.flags.json) {
				console.log(JSON.stringify(skills, null, 2));
				return;
			}
			console.log(chalk.bold.cyan("\n  OMSK Active & Installed Skills\n"));
			if (skills.length === 0) {
				console.log(chalk.gray("  No skills discovered or installed."));
				console.log(chalk.dim("  Run `ohms skills search <term>` to discover 75 curated skills.\n"));
				return;
			}
			for (const s of skills) {
				const levelColor = s.level === "project" ? chalk.cyan : s.level === "installed" ? chalk.green : chalk.yellow;
				console.log(`  ${chalk.bold(s.id)} ${levelColor(`[${s.level.toUpperCase()}]`)}`);
				console.log(`    ${chalk.dim("Name:")} ${s.name}`);
				console.log(`    ${chalk.dim("Path:")} ${chalk.gray(s.filePath)}`);
				if (s.description) {
					console.log(`    ${chalk.dim("Desc:")} ${s.description}`);
				}
				console.log();
			}
			console.log(chalk.dim(`  Total: ${skills.length} skill(s) registered.\n`));
			break;
		}

		case "inspect": {
			const skillId = cmd.args[0]?.trim();
			if (!skillId) {
				console.log(chalk.yellow("Usage: ohms skills inspect <skill-id>"));
				return;
			}
			const skill = registry.get(skillId);
			if (!skill) {
				console.log(chalk.red(`Skill "${skillId}" not found in local registry.`));
				return;
			}
			if (cmd.flags.json) {
				console.log(JSON.stringify(skill, null, 2));
				return;
			}
			console.log(chalk.bold.cyan(`\n  Skill Inspection: ${skill.id}\n`));
			console.log(`  ${chalk.dim("Name:")}        ${skill.name}`);
			console.log(`  ${chalk.dim("Level:")}       ${skill.level}`);
			console.log(`  ${chalk.dim("Source:")}      ${skill.source}`);
			console.log(`  ${chalk.dim("Trust:")}       ${skill.trust}`);
			console.log(`  ${chalk.dim("Standard:")}    ${skill.standard}`);
			console.log(`  ${chalk.dim("File:")}        ${skill.filePath}`);
			console.log(`  ${chalk.dim("Hash:")}        ${skill.contentHash}`);
			console.log(`  ${chalk.dim("Description:")} ${skill.description}`);
			if (skill.dependencies.length > 0) {
				console.log(`  ${chalk.dim("Dependencies:")} ${skill.dependencies.join(", ")}`);
			}
			console.log(chalk.bold.cyan("\n  Content Preview:\n"));
			console.log(chalk.gray(skill.content.slice(0, 800) + (skill.content.length > 800 ? "\n..." : "")));
			console.log();
			break;
		}

		case "uninstall": {
			const skillId = cmd.args[0]?.trim();
			if (!skillId) {
				console.log(chalk.yellow("Usage: ohms skills uninstall <skill-id> [--scope user|project]"));
				return;
			}
			const res = await uninstallSkill(skillId, { scope: cmd.flags.scope || "user" });
			if (res.success) {
				console.log(chalk.green(`\n  ✓ ${res.message}\n`));
			} else {
				console.log(chalk.red(`\n  [x] ${res.message}\n`));
			}
			break;
		}

		case "update": {
			const skillId = cmd.args[0]?.trim();
			if (skillId) {
				const skill = registry.get(skillId);
				if (!skill) {
					console.log(chalk.red(`Skill "${skillId}" is not installed.`));
					return;
				}
				const res = await updateSingleSkill(skill.baseDir);
				console.log(res.updated ? chalk.green(`\n  ✓ ${res.message}\n`) : chalk.gray(`\n  ${res.message}\n`));
			} else {
				console.log(chalk.cyan("\n  Updating all installed skills...\n"));
				const report = await updateAllSkills({ scope: cmd.flags.scope });
				for (const r of report.results) {
					console.log(`  ${chalk.bold(r.skillId)}: ${r.updated ? chalk.green("UPDATED") : chalk.gray("OK")} - ${r.message}`);
				}
				console.log(chalk.bold(`\n  ${report.summary}\n`));
			}
			break;
		}

		case "doctor": {
			console.log(chalk.bold.cyan("\n  Running OMSK Skills Engine Doctor...\n"));
			const report = await runSkillsDoctor();
			if (cmd.flags.json) {
				console.log(JSON.stringify(report, null, 2));
				return;
			}
			console.log(`  Discovered Skills: ${chalk.bold(String(report.totalDiscovered))} (${report.localCount} local, ${report.installedCount} installed)`);
			for (const dir of report.scannedDirectories) {
				console.log(`  Directory: ${chalk.dim(dir)}`);
			}
			console.log();

			if (report.issues.length === 0) {
				console.log(chalk.bold.green("  ✓ All skills healthy, verified, and free of collisions!\n"));
			} else {
				console.log(chalk.bold.yellow(`  Found ${report.issues.length} issue(s):\n`));
				for (const issue of report.issues) {
					const badge =
						issue.severity === "error"
							? chalk.bold.red("[ERROR]")
							: issue.severity === "warning"
								? chalk.yellow("[WARN]")
								: chalk.cyan("[INFO]");
					console.log(`  ${badge} ${issue.skillId ? chalk.bold(issue.skillId) + ": " : ""}${issue.message}`);
					if (issue.remediation) {
						console.log(`    ${chalk.dim("Remediation:")} ${chalk.green(issue.remediation)}`);
					}
				}
				console.log();
			}
			break;
		}

		case "config": {
			console.log(chalk.bold.cyan("\n  OMSK Universal Skills Engine Configuration\n"));
			console.log("  Tier 1 Discovery:        ENABLED (Always active, compact index)");
			console.log("  Tier 2 On-Demand Load:   ENABLED (Direct injection on trigger/intent)");
			console.log("  Tier 3 Resource Sandbox: ENABLED (Strict containment inside skill directory)");
			console.log("  Default User Scope:      ~/.ohms/skills/installed/");
			console.log("  Default Project Scope:   .ohms/skills/");
			console.log("  Curated 75 Catalog:      75 skills verified (obra, anthropic, vercel, addyosmani, wshobson)");
			console.log();
			break;
		}

		default: {
			console.log(chalk.yellow(`Unknown action: "${cmd.action}". Run ohms skills --help for usage.`));
		}
	}
}
