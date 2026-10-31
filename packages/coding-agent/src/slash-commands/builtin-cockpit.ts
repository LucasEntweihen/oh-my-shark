/**
 * Built-in Slash Commands for Deep Sea Cockpit, Live Diffs, Tasks, and Events in Oh My Shark (OMSK).
 * Implements /cockpit, /diff, /tasks, and /events slash commands with live runtime integration.
 */
import { PRODUCT_VERSION } from "@oh-my-pi/pi-utils";
import { getTransactionalEditEngine } from "../edit/transactional-engine";
import { getMenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import { getDeepSeaCockpit } from "../tui/deep-sea-command";
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
	{ name: "compact", description: "Switch Cockpit density to Compact (single line status)" },
	{ name: "standard", description: "Switch Cockpit density to Standard (cards & summary)" },
	{ name: "advanced", description: "Switch Cockpit density to Advanced (full event stream)" },
	{ name: "sync", description: "Synchronize Cockpit with live EditEngine, Mente em Teia, and LSP" },
	{ name: "events", description: "Display recent Live Event Stream & Provenance" },
	{ name: "help", description: "Show Deep Sea Cockpit command options" },
];

export function formatCockpitHelp(): string {
	return [
		"🦈 Deep Sea Cockpit — Terminal Engineering Mission Control",
		"",
		"Comandos disponíveis:",
		"  /cockpit [view]       Exibe o cockpit completo com header, sidebar, cards e painéis",
		"  /cockpit compact      Alterna para densidade compacta (linha única)",
		"  /cockpit standard     Alterna para densidade padrão (cards de missão e diffs)",
		"  /cockpit advanced     Alterna para densidade avançada (stream de eventos ao vivo)",
		"  /cockpit sync         Sincroniza com TransactionalEditEngine e Mente em Teia",
		"  /cockpit events       Exibe o fluxo recente de eventos e proveniência",
		"  /cockpit help         Exibe este menu de ajuda",
		"",
		"Atalhos de comando direto:",
		"  /diff                 Exibe o diff detalhado de arquivos modificados e checkpoints",
		"  /tasks                Exibe o progresso da missão ativa e etapas planejadas",
		"  /events               Exibe a linha do tempo de operações recentes do agente",
	].join("\n");
}

export async function handleCockpitCommand(
	parsed: ParsedSlashCommand,
	runtime: SlashCommandRuntime,
): Promise<SlashCommandResult> {
	const cwd = runtime.cwd;
	const cockpit = getDeepSeaCockpit({
		version: PRODUCT_VERSION,
		modelName: runtime.session.model?.id ?? "gemini-2.5-pro",
		providerName: runtime.session.model?.provider ?? "Google",
		workspaceName: cwd,
	});

	// Sync live data from Edit Engine
	try {
		const txEngine = getTransactionalEditEngine(cwd);
		await cockpit.syncFromEditEngine(txEngine);
	} catch {
		// Non-blocking fallback
	}

	// Sync live data from Mente em Teia
	try {
		const teiaStore = getMenteEmTeiaStore();
		cockpit.syncFromMenteEmTeia(teiaStore);
	} catch {
		// Non-blocking fallback
	}

	const sub = parseSubcommand(parsed.args);
	const action = sub.verb || "view";

	switch (action) {
		case "compact": {
			cockpit.setDensity("compact");
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Compact:\n\n${rendered}`);
			return commandConsumed();
		}
		case "standard": {
			cockpit.setDensity("standard");
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Standard:\n\n${rendered}`);
			return commandConsumed();
		}
		case "advanced": {
			cockpit.setDensity("advanced");
			const rendered = cockpit.render(100).join("\n");
			await runtime.output(`✅ Densidade do Cockpit alterada para Advanced:\n\n${rendered}`);
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
				`  • Eventos registrados: ${cockpit.getRecentEvents().length}`
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
		const summary = await txEngine.getChangesSummary();
		const detailed = await txEngine.getDetailedDiff();

		const lines: string[] = [
			"🔮 [Ctrl+D] Live Diff & Changes Monitor:",
			`Total adicionado: +${summary.totalAdded} linhas`,
			`Total removido:   -${summary.totalRemoved} linhas`,
			`Arquivos modificados: ${summary.modifiedCount}`,
			`Checkpoints salvos:   ${summary.checkpointsCount}`,
			"",
		];

		if (detailed.length === 0) {
			lines.push("Nenhuma alteração pendente no workspace (workspace limpo).");
		} else {
			lines.push("Arquivos modificados:");
			for (const file of detailed) {
				lines.push(`  • ${file.path} (+${file.linesAdded} / -${file.linesRemoved}) [${file.status}]`);
			}
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
