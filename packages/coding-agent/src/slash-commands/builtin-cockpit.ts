/**
 * Built-in Slash Commands for Deep Sea Cockpit, Live Diffs, Tasks, and Events in Oh My Shark (OMSK).
 * Implements /cockpit, /diff, /tasks, and /events slash commands with live runtime integration.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { PRODUCT_VERSION } from "@oh-my-pi/pi-utils";
import { getTransactionalEditEngine } from "../edit/transactional-engine";
import { getMenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import {
	DEFAULT_COCKPIT_CONFIG,
	type CockpitConfig,
	type CockpitDensityMode,
	type CockpitSidebarMode,
	getDeepSeaCockpit,
} from "../tui/deep-sea-command";
import { lookup as lookupSetting } from "../config/registry";
import type { Settings } from "../config/settings";
import { commandConsumed, parseSubcommand } from "./helpers/parse";
import type {
	ParsedSlashCommand,
	SlashCommandResult,
	SlashCommandRuntime,
	SlashCommandSpec,
	SubcommandDef,
} from "./types";

export const COCKPIT_SUBCOMMANDS: SubcommandDef[] = [
	{ name: "view", description: "Display the full Deep Sea Cockpit dashboard" },
	{ name: "cycle", description: "Cycle Cockpit density between Compact, Standard, and Advanced" },
	{ name: "compact", description: "Switch Cockpit density to Compact (single line status)" },
	{ name: "standard", description: "Switch Cockpit density to Standard (cards & summary)" },
	{ name: "advanced", description: "Switch Cockpit density to Advanced (full event stream)" },
	{ name: "density", description: "Set Cockpit density: auto, compact, standard, advanced" },
	{ name: "sidebar", description: "Set Cockpit sidebar: auto, visible, collapsed, hidden" },
	{ name: "config", description: "View or set Cockpit configuration options" },
	{ name: "layout", description: "Set default TUI layout: cockpit, compact, classic, default" },
	{ name: "reset", description: "Reset Cockpit configuration to default settings" },
	{ name: "sync", description: "Synchronize Cockpit with live EditEngine, Mente em Teia, and LSP" },
	{ name: "events", description: "Display recent Live Event Stream & Provenance" },
	{ name: "help", description: "Show Deep Sea Cockpit command options" },
];

export function formatCockpitHelp(): string {
	return [
		"🦈 Deep Sea Cockpit — Terminal Engineering Mission Control",
		"",
		"Usage:",
		"  /cockpit [subcommand] [arguments]",
		"",
		"Subcommands:",
		"  view                    Display full dashboard (default)",
		"  cycle                   Cycle density: compact -> standard -> advanced",
		"  density <mode>          Set density: auto | compact | standard | advanced",
		"  sidebar <mode>          Set sidebar: auto | visible | collapsed | hidden",
		"  config [key] [val]      View or update Cockpit configuration",
		"  layout <mode>           Set default TUI layout: cockpit | compact | classic | default",
		"  reset                   Reset Cockpit configuration to default settings",
		"  compact                 Quick switch to Compact density",
		"  standard                Quick switch to Standard density",
		"  advanced                Quick switch to Advanced density",
		"  sync                    Sync with live EditEngine, Git workspace, Mente em Teia, and LSP",
		"  events [count]          Display live event stream & provenance",
		"  help                    Show this help message",
		"",
		"Related commands:",
		"  /diff                   Show live workspace/transactional diffs",
		"  /tasks                  Show mission tasks and progress",
		"  /events                 Show live event stream and provenance",
	].join("\n");
}

function persistSettingSafe(settings: Settings | undefined, id: string, value: unknown): void {
	if (!settings) return;
	const legacySettings = settings as unknown as { set?: (key: string, val: unknown) => void };
	if (typeof settings.writeValue !== "function") {
		if (typeof legacySettings.set === "function") {
			legacySettings.set(id, value);
		}
		return;
	}
	const setting = lookupSetting(id);
	if (!setting) return;
	try {
		setting.assertWritable(value);
		setting.set(settings, value as never);
	} catch {
		// Non-blocking: ignore invalid setting persistence while keeping live cockpit updated
	}
}

export async function handleCockpitCommand(
	parsed: ParsedSlashCommand,
	runtime: SlashCommandRuntime,
): Promise<SlashCommandResult> {
	const cwd = runtime.cwd;
	const cockpit = getDeepSeaCockpit({
		version: PRODUCT_VERSION,
		modelName: runtime.session.model?.id ?? "Not configured",
		providerName: runtime.session.model?.provider ?? "",
		workspaceName: path.basename(cwd) || cwd,
	});
	cockpit.updateMetadata({
		version: PRODUCT_VERSION,
		modelName: runtime.session.model?.id ?? "Not configured",
		providerName: runtime.session.model?.provider ?? "",
	});

	// Sync live data from Edit Engine
	try {
		const txEngine = getTransactionalEditEngine(cwd);
		await cockpit.syncFromEditEngine(txEngine);
	} catch {
		// Non-blocking fallback
	}

	// Sync live data from Git workspace (fills real diff/branch when no active transaction)
	cockpit.syncFromWorkspaceGit(cwd, true);

	// Sync live data from Mente em Teia only if initialized for this workspace
	try {
		if (fs.existsSync(path.join(cwd, ".omsk", "teia.db"))) {
			const teiaStore = getMenteEmTeiaStore();
			cockpit.syncFromMenteEmTeia(teiaStore);
		}
	} catch {
		// Non-blocking fallback
	}

	const sub = parseSubcommand(parsed.args);
	const action = sub.verb || "view";

	switch (action) {
		case "cycle": {
			const next = cockpit.cycleDensity();
			persistSettingSafe(runtime.settings, "cockpit.density", next);
			runtime.ctx?.syncCockpit?.();
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alternada para ${next}:\n\n${rendered}`);
			return commandConsumed();
		}
		case "compact": {
			cockpit.setDensity("compact");
			persistSettingSafe(runtime.settings, "cockpit.density", "compact");
			runtime.ctx?.syncCockpit?.();
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Compact:\n\n${rendered}`);
			return commandConsumed();
		}
		case "standard": {
			cockpit.setDensity("standard");
			persistSettingSafe(runtime.settings, "cockpit.density", "standard");
			runtime.ctx?.syncCockpit?.();
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Standard:\n\n${rendered}`);
			return commandConsumed();
		}
		case "advanced": {
			cockpit.setDensity("advanced");
			persistSettingSafe(runtime.settings, "cockpit.density", "advanced");
			runtime.ctx?.syncCockpit?.();
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Advanced:\n\n${rendered}`);
			return commandConsumed();
		}
		case "density": {
			const mode = (sub.rest || "").trim().toLowerCase();
			if (mode === "auto" || mode === "compact" || mode === "standard" || mode === "advanced") {
				cockpit.setDensity(mode as CockpitDensityMode);
				persistSettingSafe(runtime.settings, "cockpit.density", mode);
				runtime.ctx?.syncCockpit?.();
				const rendered = cockpit.render(100).join("\n");
				await runtime.output(`✅ Densidade do Cockpit configurada para ${mode.toUpperCase()}:\n\n${rendered}`);
			} else {
				const current = cockpit.getConfig().density;
				await runtime.output(
					`ℹ️ Densidade atual: ${current}. Modos disponíveis: auto, compact, standard, advanced.\nUso: /cockpit density <mode>`,
				);
			}
			return commandConsumed();
		}
		case "sidebar": {
			const mode = (sub.rest || "").trim().toLowerCase();
			if (mode === "auto" || mode === "visible" || mode === "collapsed" || mode === "hidden") {
				cockpit.setSidebar(mode as CockpitSidebarMode);
				persistSettingSafe(runtime.settings, "cockpit.sidebar", mode);
				runtime.ctx?.syncCockpit?.();
				await runtime.output(`✅ Modo da barra lateral configurado para ${mode.toUpperCase()} com sucesso!`);
			} else {
				const current = cockpit.getConfig().sidebar;
				await runtime.output(
					`ℹ️ Barra lateral atual: ${current}. Modos disponíveis: auto, visible, collapsed, hidden.\nUso: /cockpit sidebar <mode>`,
				);
			}
			return commandConsumed();
		}
		case "layout": {
			const mode = (sub.rest || "").trim().toLowerCase();
			if (mode === "cockpit" || mode === "compact" || mode === "classic" || mode === "default") {
				persistSettingSafe(runtime.settings, "tui.layout", mode);
				runtime.ctx?.syncTuiLayout?.();
				await runtime.output(`✅ Layout padrão do terminal TUI configurado para: ${mode.toUpperCase()}`);
			} else {
				await runtime.output(
					`ℹ️ Layouts disponíveis: cockpit (padrão), compact, classic, default.\nUso: /cockpit layout <mode>`,
				);
			}
			return commandConsumed();
		}
		case "config": {
			const args = (sub.rest || "").trim().split(/\s+/).filter(Boolean);
			if (args.length >= 2) {
				const key = args[0] as keyof CockpitConfig;
				const rawVal = args.slice(1).join(" ");
				let parsedVal: unknown = rawVal;
				if (rawVal === "true") parsedVal = true;
				else if (rawVal === "false") parsedVal = false;
				else if (!Number.isNaN(Number(rawVal))) parsedVal = Number(rawVal);

				cockpit.setConfig({ [key]: parsedVal });
				persistSettingSafe(runtime.settings, `cockpit.${key}`, parsedVal);
				await runtime.output(`✅ Configuração do Cockpit atualizada: ${key} = ${String(parsedVal)}`);
			} else {
				const cfg = cockpit.getConfig();
				const lines = [
					"⚙️ Configurações Ativas do Deep Sea Cockpit:",
					`  • cockpit.density:          ${cfg.density}`,
					`  • cockpit.sidebar:          ${cfg.sidebar}`,
					`  • cockpit.eventStreamLines: ${cfg.eventStreamLines}`,
					`  • cockpit.showTips:         ${cfg.showTips}`,
					`  • cockpit.showMemoryGraph:  ${cfg.showMemoryGraph}`,
					`  • cockpit.showRecentFiles:  ${cfg.showRecentFiles}`,
					`  • cockpit.showProgress:     ${cfg.showProgress}`,
					`  • cockpit.showShortcuts:    ${cfg.showShortcuts}`,
					`  • cockpit.autoHeight:       ${cfg.autoHeight}`,
					"",
					"Para alterar: /cockpit config <chave> <valor>",
				];
				await runtime.output(lines.join("\n"));
			}
			return commandConsumed();
		}
		case "reset": {
			cockpit.setConfig(DEFAULT_COCKPIT_CONFIG);
			for (const [key, value] of Object.entries(DEFAULT_COCKPIT_CONFIG)) {
				persistSettingSafe(runtime.settings, `cockpit.${key}`, value);
			}
			await runtime.output("🔄 Configurações do Deep Sea Cockpit restauradas para os padrões com sucesso!");
			return commandConsumed();
		}
		case "sync": {
			const changes = cockpit.getChanges();
			const files = cockpit.getRecentFiles();
			const graph = cockpit.getMemoryGraph();
			await runtime.output(
				`🔄 Deep Sea Cockpit sincronizado com sucesso!\n` +
				`  • Alterações: +${changes.totalAdded} / -${changes.totalRemoved} linhas (${changes.modifiedCount} arquivos, ${changes.checkpointsCount} checkpoints)\n` +
				`  • Arquivos recentes rastreados: ${files.length}\n` +
				`  • Nós na Mente em Teia: ${graph.nodes.length} nós, ${graph.edges.length} arestas\n` +
				`  • Eventos registrados: ${cockpit.getRecentEvents().length}`,
			);
			return commandConsumed();
		}
		case "events": {
			const streamLines = cockpit.renderEventStream(100, 8);
			await runtime.output(streamLines.join("\n"));
			return commandConsumed();
		}
		case "help": {
			await runtime.output(formatCockpitHelp());
			return commandConsumed();
		}
		case "view":
		default: {
			const fullLines = cockpit.renderFullCockpit(120);
			await runtime.output(fullLines.join("\n"));
			return commandConsumed();
		}
	}
}

export async function handleDiffCommand(
	_parsed: ParsedSlashCommand,
	runtime: SlashCommandRuntime,
): Promise<SlashCommandResult> {
	const cwd = runtime.cwd;
	const cockpit = getDeepSeaCockpit();

	try {
		const txEngine = getTransactionalEditEngine(cwd);
		await cockpit.syncFromEditEngine(txEngine);
		cockpit.syncFromWorkspaceGit(cwd, true);
		const detailed = await txEngine.getDetailedDiff();
		const summary = detailed.length > 0 ? await txEngine.getChangesSummary() : cockpit.getChanges();
		const files =
			detailed.length > 0
				? detailed.map(file => `  • ${file.path} (+${file.linesAdded} / -${file.linesRemoved}) [${file.status}]`)
				: cockpit
					.getRecentFiles()
					.map(file => `  • ${file.path} (+${file.linesAdded} / -${file.linesRemoved}) [git]`);

		const lines: string[] = [
			"🔮 Live Diff & Changes Monitor:",
			`Total adicionado: +${summary.totalAdded} linhas`,
			`Total removido:   -${summary.totalRemoved} linhas`,
			`Arquivos modificados: ${summary.modifiedCount}`,
			`Checkpoints salvos:   ${summary.checkpointsCount}`,
			"",
		];

		if (files.length === 0) {
			lines.push("Nenhuma alteração pendente no workspace (workspace limpo).");
		} else {
			lines.push("Arquivos modificados:", ...files);
		}

		await runtime.output(lines.join("\n"));
		return commandConsumed();
	} catch (err) {
		await runtime.output(`Erro ao obter diff: ${err instanceof Error ? err.message : String(err)}`);
		return commandConsumed();
	}
}

export async function handleTasksCommand(
	_parsed: ParsedSlashCommand,
	runtime: SlashCommandRuntime,
): Promise<SlashCommandResult> {
	const cockpit = getDeepSeaCockpit();
	const mission = cockpit.getMission();
	const progressLines = cockpit.renderProgressPanel(60);

	const lines = [
		`🚀 [Ctrl+J] Tasks & Mission Progress:`,
		`Missão: [TASK-${mission.id}] ${mission.title}`,
		`Fase: ${mission.phase}`,
		`Progresso: ${mission.progressPercent}%`,
		"",
		...progressLines,
	];

	await runtime.output(lines.join("\n"));
	return commandConsumed();
}

export async function handleEventsCommand(
	_parsed: ParsedSlashCommand,
	runtime: SlashCommandRuntime,
): Promise<SlashCommandResult> {
	const cockpit = getDeepSeaCockpit();
	const streamLines = cockpit.renderEventStream(100, 10);
	await runtime.output(streamLines.join("\n"));
	return commandConsumed();
}

export const BUILTIN_COCKPIT_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [
	{
		name: "cockpit",
		aliases: ["deepsea", "cockpit-view", "dsh"],
		description: "Abre ou controla o Deep Sea Cockpit (dashboard TUI de engenharia)",
		subcommands: COCKPIT_SUBCOMMANDS,
		allowArgs: true,
		handle: handleCockpitCommand,
	},
	{
		name: "diff",
		description: "Exibe diff detalhado de arquivos modificados e checkpoints ([Ctrl+D])",
		allowArgs: false,
		handle: handleDiffCommand,
	},
	{
		name: "tasks",
		description: "Exibe progresso da missão e etapas da atividade ([Ctrl+J])",
		allowArgs: false,
		handle: handleTasksCommand,
	},
	{
		name: "events",
		description: "Exibe o fluxo de eventos em tempo real e proveniência ([Ctrl+L])",
		allowArgs: false,
		handle: handleEventsCommand,
	},
];
