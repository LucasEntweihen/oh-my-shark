import * as fs from "node:fs/promises";
import * as path from "node:path";
import { isEnoent, logger } from "@oh-my-pi/pi-utils";
import { DEFAULT_AGENT_PROFILES } from "../avatar/presets";
import type { AgentProfile } from "../avatar/types";

export const HIDDEN_AGENTS_DIR = ".omp-agents";
export const AGENTS_SUBDIR = "agents";

/**
 * Returns the hidden directory where agents are stored within the current project.
 */
export function getProjectAgentsDir(cwd = process.cwd()): string {
	return path.join(cwd, HIDDEN_AGENTS_DIR);
}

/**
 * Ensures the hidden agents directory exists.
 */
export async function ensureAgentsDir(cwd = process.cwd()): Promise<string> {
	const dir = path.join(getProjectAgentsDir(cwd), AGENTS_SUBDIR);
	try {
		await fs.mkdir(dir, { recursive: true });
	} catch (err) {
		logger.error("Failed to create hidden agents directory", { dir, err });
	}
	return dir;
}

/**
 * Loads all agent profiles from the hidden directory.
 * If empty, seeds with the default Bible Strong agent profiles.
 */
export async function loadAgentProfiles(cwd = process.cwd()): Promise<AgentProfile[]> {
	const dir = await ensureAgentsDir(cwd);
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const jsonFiles = entries.filter(e => e.isFile() && e.name.endsWith(".json"));

		if (jsonFiles.length === 0) {
			// Seed default profiles
			for (const profile of DEFAULT_AGENT_PROFILES) {
				await saveAgentProfile(profile, cwd);
			}
			return DEFAULT_AGENT_PROFILES;
		}

		const profiles: AgentProfile[] = [];
		for (const file of jsonFiles) {
			const filePath = path.join(dir, file.name);
			try {
				const content = await Bun.file(filePath).json();
				if (content && typeof content === "object" && "id" in content) {
					const agent = content as AgentProfile;
					if (!agent.avatar.fullBody) {
						const defaultPreset = DEFAULT_AGENT_PROFILES.find(d => d.id === agent.id);
						if (defaultPreset?.avatar.fullBody) {
							agent.avatar.fullBody = defaultPreset.avatar.fullBody;
						}
					}
					profiles.push(agent);
				}
			} catch (err) {
				logger.warn("Failed to parse agent profile file", { filePath, err });
			}
		}

		return profiles.length > 0 ? profiles : DEFAULT_AGENT_PROFILES;
	} catch (err) {
		if (isEnoent(err)) return DEFAULT_AGENT_PROFILES;
		logger.error("Error reading agent profiles", { dir, err });
		return DEFAULT_AGENT_PROFILES;
	}
}

/**
 * Saves a single agent profile into the hidden directory.
 */
export async function saveAgentProfile(profile: AgentProfile, cwd = process.cwd()): Promise<void> {
	const dir = await ensureAgentsDir(cwd);
	const filePath = path.join(dir, `${profile.id}.json`);
	profile.updatedAt = new Date().toISOString();
	await Bun.write(filePath, JSON.stringify(profile, null, 2));
}

/**
 * Deletes an agent profile.
 */
export async function deleteAgentProfile(id: string, cwd = process.cwd()): Promise<boolean> {
	const dir = await ensureAgentsDir(cwd);
	const filePath = path.join(dir, `${id}.json`);
	try {
		await fs.unlink(filePath);
		return true;
	} catch (err) {
		if (isEnoent(err)) return false;
		throw err;
	}
}

/**
 * Generates comprehensive markdown content for AGENTS.md explaining how each agent
 * behaves, works, thinks and collaborates with others.
 */
export function compileAgentsMarkdown(profiles: AgentProfile[]): string {
	const lines: string[] = [
		"# Regras e Diretrizes dos Agentes (AGENTS.md)",
		"",
		"Este documento define a arquitetura, personalidade, cadeia de comando e regras de colaboração da equipe de agentes do projeto.",
		"",
		"## 1. Roster da Equipe de Agentes",
		"",
	];

	for (const p of profiles) {
		lines.push(`### 🤖 ${p.name} (\`@${p.id}\`)`);
		lines.push(`- **Título / Papel:** ${p.title} (${p.structure.role})`);
		lines.push(`- **Categoria:** \`${p.structure.category}\``);
		const fb = p.avatar.fullBody;
		const avatarDetails = [
			`Modelo Raiz \`Bodiless Bot (${p.avatar.rootModel ?? "basic"})\``,
			`Superfície \`${p.avatar.body.primary.type}\``,
			`Cor Primária \`${p.avatar.colors.body}\``,
			`Olhos \`${p.avatar.colors.eyes}\``,
			fb?.style ? `Estilo \`${fb.style}\`` : null,
			fb?.clothing ? `Vestimenta \`${fb.clothing}\`` : null,
			fb?.posture ? `Postura \`${fb.posture}\`` : null,
		]
			.filter(Boolean)
			.join(", ");
		lines.push(`- **Avatar Bible Strong:** ${avatarDetails}`);
		lines.push(`- **Tom e Personalidade:** ${p.personality.tone}`);
		lines.push(`- **Traços Marcantes:** ${p.personality.traits.join(", ")}`);
		if (p.personality.catchphrase) {
			lines.push(`- **Lema:** *"${p.personality.catchphrase}"*`);
		}
		lines.push(
			`- **Modelo Primário:** \`${p.models.primary.model}\` (Thinking: \`${p.models.primary.thinkingLevel ?? "default"}\`)`,
		);
		if (p.fallbacks.models.length > 0) {
			lines.push(`- **Fallbacks:** ${p.fallbacks.models.join(" → ")} (Estratégia: \`${p.fallbacks.strategy}\`)`);
		}
		lines.push(`- **Funções / Tools Autorizadas:** \`${p.functions.join("`, `")}\``);
		lines.push("");
		lines.push("#### Diretrizes de Pensamento e Comportamento:");
		for (const rule of p.personality.behaviorRules) {
			lines.push(`- ${rule}`);
		}
		lines.push("");
		lines.push("#### Prompt de Sistema:");
		lines.push("```text");
		lines.push(p.systemPrompt.trim());
		lines.push("```");
		lines.push("");
	}

	lines.push("## 2. Protocolo de Delegação e Orquestração");
	lines.push("");
	lines.push(
		"1. **Roteamento de Entrada:** Toda mensagem inicial do usuário no terminal é avaliada pelo roteador. Tarefas arquiteturais vão para o orquestrador; código estrito para especialistas; auditorias para críticos/segurança.",
	);
	lines.push(
		"2. **Invocação Direta:** O usuário pode direcionar explicitamente usando `@id` no início do prompt (ex: `@security-sentinel auditar endpoints`).",
	);
	lines.push("3. **Handoff e Comunicação Inter-Agentes:**");
	lines.push(
		"   - Quando um agente precisa de trabalho de outro, ele formula um contrato de entrada e saída explícito.",
	);
	lines.push("   - O agente receptor valida as pré-condições antes de executar.");
	lines.push("   - Falhas ativam a cadeia de contingência configurada nos fallbacks.");
	lines.push("");

	return lines.join("\n");
}

/**
 * Writes or updates the AGENTS.md in the project root.
 */
export async function writeProjectAgentsMarkdown(profiles: AgentProfile[], cwd = process.cwd()): Promise<string> {
	const markdown = compileAgentsMarkdown(profiles);
	const targetPath = path.join(cwd, "AGENTS.md");
	await Bun.write(targetPath, markdown);
	return targetPath;
}

/**
 * Reads the current AGENTS.md from the project root if it exists.
 */
export async function readProjectAgentsMarkdown(cwd = process.cwd()): Promise<string | null> {
	const targetPath = path.join(cwd, "AGENTS.md");
	try {
		return await Bun.file(targetPath).text();
	} catch (err) {
		if (isEnoent(err)) return null;
		throw err;
	}
}
