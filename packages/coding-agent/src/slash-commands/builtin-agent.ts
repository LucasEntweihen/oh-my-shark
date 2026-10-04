import { AGENT_CONTEXT_RECOMMENDATIONS, DEFAULT_AGENT_PROFILES, renderTerminalAvatarCard } from "../avatar";
import { commandConsumed, usage } from "./helpers/parse";
import type { SlashCommandSpec } from "./types";

export const BUILTIN_AGENT_SELECT_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [
	{
		name: "agent",
		aliases: ["agente", "select-agent", "agents-menu"],
		icon: "agents",
		description: "Abre o menu interativo para selecionar manualmente o agente conforme o contexto",
		acpDescription: "Select an active agent manually based on context",
		allowArgs: true,
		getTuiAutocompleteDescription: () => "Selecionar agente manualmente (Bible Strong Avatars & Context)",
		handle: async (command, runtime) => {
			const arg = command.args?.trim().toLowerCase();
			if (!arg) {
				const lines = [
					"=== Equipe de Agentes Oh My Shark (Bible Strong) ===",
					"",
					...DEFAULT_AGENT_PROFILES.map((agent, index) => {
						const hint = AGENT_CONTEXT_RECOMMENDATIONS[agent.id] ?? agent.description;
						return `${index + 1}. @${agent.id} — ${agent.title}\n   Contexto ideal: ${hint}\n`;
					}),
					"Dica: No terminal interativo, use /agent para abrir o menu visual com prévia de avatares.",
				];
				await runtime.output(lines.join("\n"));
				return commandConsumed();
			}

			const matched = DEFAULT_AGENT_PROFILES.find(
				a => a.id.toLowerCase() === arg || a.id.toLowerCase().includes(arg) || a.name.toLowerCase().includes(arg),
			);

			if (!matched) {
				return usage(
					`Agente '${arg}' não encontrado. Agentes disponíveis: ${DEFAULT_AGENT_PROFILES.map(a => `@${a.id}`).join(", ")}`,
					runtime,
				);
			}

			const card = renderTerminalAvatarCard(matched);
			await runtime.output(card);
			return commandConsumed();
		},
		handleTui: async (command, runtime) => {
			const arg = command.args?.trim().toLowerCase();
			if (!arg) {
				runtime.ctx.showAgentSelector();
				return;
			}

			const matched = DEFAULT_AGENT_PROFILES.find(
				a => a.id.toLowerCase() === arg || a.id.toLowerCase().includes(arg) || a.name.toLowerCase().includes(arg),
			);

			if (!matched) {
				runtime.ctx.showError(`Agente '${arg}' não encontrado. Use /agent para abrir o menu de seleção.`);
				return;
			}

			// Prefix agent mention in editor
			const currentText = runtime.ctx.editor.getText().trim();
			if (!currentText.startsWith(`@${matched.id}`)) {
				const newText = currentText.length > 0 ? `@${matched.id} ${currentText}` : `@${matched.id} `;
				runtime.ctx.editor.setText(newText);
			}

			const card = renderTerminalAvatarCard(matched);
			runtime.ctx.showStatus(card, { dim: false });
			runtime.ctx.statusLine.invalidate();
			runtime.ctx.ui.requestRender();
		},
	},
];
