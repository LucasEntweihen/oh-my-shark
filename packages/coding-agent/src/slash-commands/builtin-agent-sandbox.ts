import { paintSandboxText } from "../modes/agent-sandbox";
import { startAgentSandboxServer } from "../sandbox/server";
import { openPath } from "../utils/open";
import { commandConsumed, usage } from "./helpers/parse";
import type { SlashCommandSpec } from "./types";

export const BUILTIN_AGENT_SANDBOX_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [
	{
		name: "agent-sandbox",
		aliases: ["agents-sandbox", "sandbox"],
		icon: "agents",
		description: "Abre automaticamente o estúdio web para criação de agentes com Bible Strong Avatar",
		acpDescription: "Open Agent Sandbox Web Studio in browser",
		allowArgs: true,
		getTuiAutocompleteDescription: () => paintSandboxText("Agent Sandbox Studio (Bible Strong Avatars & AGENTS.md)"),
		handle: async (_command, runtime) => {
			try {
				const server = await startAgentSandboxServer(process.cwd());
				openPath(server.url);

				const title = paintSandboxText("🦈 [Oh My Shark] Agent Sandbox Studio Ativado!");
				const urlLine = paintSandboxText(`🌐 Interface Web aberta automaticamente: ${server.url}`);
				const hintLine = paintSandboxText("📁 Agentes armazenados de forma oculta em: .omp-agents/");
				const agentsMdHint = paintSandboxText(
					"📄 Configure os agentes e gere o AGENTS.md diretamente na interface web.",
				);

				await runtime.output([title, urlLine, hintLine, agentsMdHint].join("\n"));
				return commandConsumed();
			} catch (err) {
				return usage(
					`Falha ao iniciar o Agent Sandbox: ${err instanceof Error ? err.message : String(err)}`,
					runtime,
				);
			}
		},
		handleTui: async (_command, runtime) => {
			try {
				const server = await startAgentSandboxServer(process.cwd());
				openPath(server.url);

				const title = paintSandboxText("🦈 [Oh My Shark] Agent Sandbox Studio Ativado!");
				const urlLine = paintSandboxText(`🌐 Interface aberta no navegador: ${server.url}`);
				const hintLine = paintSandboxText(
					"📁 Armazenamento oculto em: .omp-agents/ · Gerador de AGENTS.md pronto.",
				);

				runtime.ctx.showStatus([title, urlLine, hintLine].join("\n"), { dim: false });
				runtime.ctx.editor.setText("");
			} catch (err) {
				runtime.ctx.showError(`Erro ao abrir Agent Sandbox: ${err instanceof Error ? err.message : String(err)}`);
			}
		},
	},
];
