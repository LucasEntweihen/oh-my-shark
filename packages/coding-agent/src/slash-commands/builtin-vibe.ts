import * as path from "node:path";
import {
	checkFileSizes,
	evaluateHarness,
	getPromptContent,
	getToolContent,
	lookupPrompt,
	lookupTool,
	planWaves,
	scaffoldMissingManifestFiles,
	validateManifest,
	VIBE_PROMPT_CATALOG,
	VIBE_TOOL_CATALOG,
	type PlannedTask,
} from "@oh-my-pi/pi-vibe-toolkit";
import { commandConsumed, parseSubcommand } from "./helpers/parse";
import type {
	ParsedSlashCommand,
	SlashCommandResult,
	SlashCommandRuntime,
	SlashCommandSpec,
	TuiSlashCommandRuntime,
} from "./types";

export function formatVibeHelp(): string {
	return [
		"🦈 Vibe Coding Toolkit — Harness Engineering & Autonomia",
		"",
		"Subcomandos disponíveis:",
		"  /vibecoding status            Verifica conformidade do manifest (9 docs) e limite de 350 linhas",
		"  /vibecoding scaffold          Gera arquivos canônicos faltantes (PRODUCT.md, AGENTS.md, docs/*)",
		"  /vibecoding wave <tasks...>   Planeja ou valida ondas paralelas com arquivos disjuntos",
		"  /vibecoding check-350         Analisa arquivos que excedem o quality gate de 350 linhas",
		"  /vibecoding prompt <01..14>   Exibe ou injeta um dos 14 prompts de produção do toolkit",
		"  /vibecoding tool <01..22>     Consulta o catálogo e guia dos 22 tools do toolkit",
		"  /vibecoding validate          Executa suíte de avaliação de resiliência do harness",
		"  /vibecoding review            Prepara instruções de revisão diferencial e de segurança",
		"  /vibecoding sanitize          Guia de sanitização de projeto (dead code e deps órfãs)",
		"  /vibecoding burndown          Plano de burndown progressivo de warnings do linter",
		"  /vibecoding help              Exibe este menu de ajuda",
		"",
		"Atalhos diretos:",
		"  /wave <tasks...>              Atalho para planejar ondas paralelas",
		"  /sec-review [diff]            Atalho para revisão de segurança (Prompt 13)",
	].join("\n");
}

export function formatVibeStatus(cwd: string): string {
	const manifest = validateManifest(cwd);
	const fileSizes = checkFileSizes(cwd);

	const lines = [
		"📊 Status do Vibe Coding Toolkit no projeto:",
		`Diretório: ${cwd}`,
		"",
		`📁 Manifesto Canônico (9 Documentos Fundamentais):`,
		`  Conformidade: ${manifest.existingCount}/${manifest.totalExpected} arquivos presentes (${manifest.valid ? "✅ VÁLIDO" : "⚠️ INCOMPLETO"})`,
	];

	for (const f of manifest.files) {
		const icon = f.exists ? "  ✓" : "  ✗";
		const size = f.sizeBytes !== undefined ? ` (${f.sizeBytes} bytes)` : " (ausente)";
		lines.push(`${icon} ${f.file}${size}`);
	}

	lines.push("");
	lines.push("📏 Quality Gate: Limite Estrito de 350 Linhas de Código:");
	lines.push(`  Arquivos escaneados: ${fileSizes.totalFilesScanned}`);
	lines.push(`  Status: ${fileSizes.pass ? "✅ 100% CONFORME" : `⚠️ ${fileSizes.violatingFiles.length} arquivos violando limite`}`);

	if (fileSizes.violatingFiles.length > 0) {
		lines.push("  Maiores arquivos acima de 350 linhas:");
		for (const v of fileSizes.violatingFiles.slice(0, 5)) {
			lines.push(`    - ${v.relativePath}: ${v.lines} linhas (+${v.exceededBy})`);
		}
		if (fileSizes.violatingFiles.length > 5) {
			lines.push(`    ... e mais ${fileSizes.violatingFiles.length - 5} arquivos.`);
		}
		lines.push("  Dica: use '/vibecoding prompt 09' para o guia de refatoração de arquivos grandes.");
	}

	return lines.join("\n");
}

export function handleVibeCommandText(cwd: string, args: string): string {
	const { verb, rest } = parseSubcommand(args);

	switch (verb) {
		case "":
		case "status":
		case "info":
			return formatVibeStatus(cwd);

		case "help":
			return formatVibeHelp();

		case "scaffold":
		case "init": {
			const overwrite = rest.includes("--overwrite");
			const projectName = path.basename(cwd);
			const { created, skipped } = scaffoldMissingManifestFiles(cwd, { projectName, overwrite });
			const lines = ["🛠️ Vibe Toolkit Scaffold:"];
			if (created.length > 0) {
				lines.push("Arquivos criados:");
				for (const c of created) lines.push(`  + ${c}`);
			}
			if (skipped.length > 0) {
				lines.push(`Arquivos já existentes preservados (${skipped.length}):`);
				for (const s of skipped) lines.push(`  ~ ${s}`);
				lines.push("(Passe '--overwrite' para sobrescrever arquivos existentes)");
			}
			return lines.join("\n");
		}

		case "check-350":
		case "filesize": {
			const res = checkFileSizes(cwd);
			if (res.pass) {
				return `✅ Quality Gate 350-Linhas: Todos os ${res.totalFilesScanned} arquivos estão dentro do limite!`;
			}
			const lines = [
				`⚠️ Quality Gate 350-Linhas: ${res.violatingFiles.length} arquivos ultrapassam ${res.maxLinesAllowed} linhas:`,
				"",
			];
			for (const v of res.violatingFiles) {
				lines.push(`  - ${v.relativePath.padEnd(45)} ${v.lines} linhas (+${v.exceededBy})`);
			}
			lines.push("\nRecomendação: Decompor responsabilidades em submódulos conforme Prompt 09.");
			return lines.join("\n");
		}

		case "validate": {
			const report = evaluateHarness(cwd);
			const lines = [
				`🧪 Avaliação de Resiliência do Harness [${report.timestamp}]:`,
				`Status Geral: ${report.passed ? "✅ APROVADO" : "⚠️ REQUER ATENÇÃO"}`,
				`Testes: ${report.summary.passedChecks}/${report.summary.totalChecks} aprovados (${report.summary.totalDurationMs}ms)`,
				"",
			];
			for (const c of report.checks) {
				const mark = c.passed ? "✓" : "✗";
				lines.push(`  ${mark} [${c.name}] (${c.durationMs}ms): ${c.details}`);
			}
			return lines.join("\n");
		}

		case "prompt":
		case "p": {
			if (!rest) {
				const lines = ["📚 Catálogo de Prompts do Vibe Coding Toolkit (14 Prompts Disponíveis):", ""];
				for (const p of VIBE_PROMPT_CATALOG) {
					lines.push(`  [${p.id}] ${p.title} (${p.category})`);
					lines.push(`      Quando usar: ${p.whenToUse}`);
				}
				lines.push("\nUse '/vibecoding prompt <id>' para ver o conteúdo completo de um prompt.");
				return lines.join("\n");
			}
			const content = getPromptContent(rest);
			if (!content) {
				return `Erro: Prompt '${rest}' não encontrado. Use '/vibecoding prompt' para ver a lista de 01 a 14.`;
			}
			const meta = lookupPrompt(rest);
			return `📄 Vibe Prompt [${meta?.id}] - ${meta?.title}:\n\n${content}`;
		}

		case "tool":
		case "t": {
			if (!rest) {
				const lines = ["🔧 Catálogo de Tools e Guias do Vibe Coding Toolkit (22 Tools):", ""];
				for (const t of VIBE_TOOL_CATALOG) {
					lines.push(`  [${t.id}] ${t.title} [Escopo: ${t.scope}]`);
					lines.push(`      Finalidade: ${t.purpose}`);
				}
				lines.push("\nUse '/vibecoding tool <id>' para ver a documentação de um tool.");
				return lines.join("\n");
			}
			const content = getToolContent(rest);
			if (!content) {
				return `Erro: Tool '${rest}' não encontrado. Use '/vibecoding tool' para ver a lista de 01 a 22.`;
			}
			const meta = lookupTool(rest);
			return `🛠️ Vibe Tool Guide [${meta?.id}] - ${meta?.title} (Escopo: ${meta?.scope}):\n\n${content}`;
		}

		case "review": {
			const prompt13 = getPromptContent("13");
			return prompt13 ?? "Execute revisão de segurança e verificação diferencial de contratos.";
		}

		case "sanitize": {
			const prompt01 = getPromptContent("01");
			return prompt01 ?? "Execute sanitização de código morto e dependências órfãs.";
		}

		case "burndown": {
			const prompt02 = getPromptContent("02");
			return prompt02 ?? "Execute burndown progressivo de advertências de lint e tipagem.";
		}

		case "wave": {
			if (!rest) {
				return [
					"🌊 Vibe Wave Dispatcher — Orquestração de Ondas Paralelas:",
					"Para planejar ondas paralelas seguras, forneça tarefas com 'Files:' e 'Depends-on:'.",
					"",
					"Exemplo:",
					"/wave [{\"id\":\"T1\",\"title\":\"Auth\",\"files\":[\"src/auth.ts\"],\"dependsOn\":[]},{\"id\":\"T2\",\"title\":\"User\",\"files\":[\"src/user.ts\"],\"dependsOn\":[]}]",
					"",
					"Regras do Toolkit:",
					"1. Arquivos estritamente disjuntos em cada onda.",
					"2. Grafo de dependências acíclico.",
					"3. Subagentes NUNCA executam commit diretamente.",
					"4. Orquestrador central serializa os commits após cada onda.",
				].join("\n");
			}

			// Try to parse JSON array of PlannedTask
			try {
				const parsed = JSON.parse(rest);
				if (Array.isArray(parsed)) {
					const tasks: PlannedTask[] = parsed.map((item, idx) => ({
						id: String(item.id || `T${idx + 1}`),
						title: String(item.title || item.name || `Task ${idx + 1}`),
						files: Array.isArray(item.files) ? item.files : [],
						dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn : [],
						resources: Array.isArray(item.resources) ? item.resources : [],
					}));

					const waveResult = planWaves(tasks);
					const lines = [
						`🌊 Plano de Ondas Paralelas Gerado (${waveResult.totalTasks} tarefas, ${waveResult.totalWaves} ondas):`,
						"",
					];

					if (!waveResult.valid) {
						lines.push("⚠️ AVISO: Plano inválido ou com conflitos:");
						for (const c of waveResult.conflicts) {
							lines.push(`  - [Conflito]: ${c.reason}`);
						}
						lines.push("");
					}

					for (const wave of waveResult.waves) {
						lines.push(`🌊 ONDA ${wave.waveNumber} (Execução Concorrente Segura):`);
						for (const t of wave.tasks) {
							lines.push(`  • [${t.id}] ${t.title}`);
							lines.push(`    Arquivos: ${t.files.join(", ") || "(nenhum - modo serial)"}`);
							if (t.dependsOn.length > 0) {
								lines.push(`    Depende de: ${t.dependsOn.join(", ")}`);
							}
						}
						lines.push(`  Arquivos disjuntos na onda: ${wave.disjointFiles.join(", ")}`);
						lines.push("  Commit: Serializado pelo orquestrador ao final da onda.\n");
					}

					return lines.join("\n");
				}
			} catch {
				// Not JSON, return wave dispatch prompt instructions
			}

			const prompt05 = getPromptContent("05");
			return prompt05 ?? "Instruções de despacho em ondas paralelas ativas.";
		}

		default:
			return `Subcomando desconhecido: '${verb}'. Digite '/vibecoding help' para ver comandos disponíveis.`;
	}
}

export const VIBE_SLASH_COMMAND: SlashCommandSpec = {
	name: "vibecoding",
	aliases: ["vibe-toolkit", "toolkit", "vibe-kit"],
	description: "Vibe Coding Toolkit: wave dispatching, quality gates, manifest status, prompts, tools and evaluation",
	allowArgs: true,
	subcommands: [
		{ name: "status", description: "Show manifest compliance, 350-line gate status, and toolkit health" },
		{ name: "scaffold", description: "Scaffold missing canonical files (PRODUCT.md, AGENTS.md, docs/*)", usage: "[--overwrite]" },
		{ name: "wave", description: "Validate or plan tasks into safe parallel execution waves", usage: "<tasks-json-or-text>" },
		{ name: "check-350", description: "Scan files exceeding the strict 350-line quality gate" },
		{ name: "prompt", description: "Display or query one of the 14 toolkit prompts", usage: "<01..14|name>" },
		{ name: "tool", description: "Display documentation for one of the 22 tools", usage: "<01..22|name>" },
		{ name: "validate", description: "Run complete harness validation suite" },
		{ name: "review", description: "Differential security and code review prompt" },
		{ name: "sanitize", description: "Project sanitation prompt (dead code and orphan deps)" },
		{ name: "burndown", description: "Progressive linter warnings burndown prompt" },
		{ name: "help", description: "Show Vibe Coding Toolkit guide and commands overview" },
	],
	handle: async (command: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, command.args);
		await runtime.output(outputText);
		return commandConsumed();
	},
	handleTui: async (command: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.ctx.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, command.args);
		runtime.ctx.showStatus(outputText);
		return commandConsumed();
	},
};

export const WAVE_SLASH_COMMAND: SlashCommandSpec = {
	name: "wave",
	aliases: ["waves", "wave-dispatch"],
	description: "Plan or validate safe parallel task waves (disjoint files, serialized commits)",
	allowArgs: true,
	inlineHint: "<tasks-json-or-text>",
	handle: async (command: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, `wave ${command.args}`);
		await runtime.output(outputText);
		return commandConsumed();
	},
	handleTui: async (command: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.ctx.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, `wave ${command.args}`);
		runtime.ctx.showStatus(outputText);
		return commandConsumed();
	},
};

export const SEC_REVIEW_SLASH_COMMAND: SlashCommandSpec = {
	name: "sec-review",
	aliases: ["security-review"],
	description: "Execute differential security review following Vibe Coding Toolkit Prompt 13",
	allowArgs: true,
	inlineHint: "[diff-range]",
	handle: async (_command: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, "review");
		await runtime.output(outputText);
		return commandConsumed();
	},
	handleTui: async (_command: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
		const cwd = runtime.ctx.sessionManager.getCwd();
		const outputText = handleVibeCommandText(cwd, "review");
		runtime.ctx.showStatus(outputText);
		return commandConsumed();
	},
};

export const BUILTIN_VIBE_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [
	VIBE_SLASH_COMMAND,
	WAVE_SLASH_COMMAND,
	SEC_REVIEW_SLASH_COMMAND,
];
