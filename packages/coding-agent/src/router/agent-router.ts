import { renderTerminalAvatarCard } from "../avatar/terminal-renderer";
import type { AgentProfile } from "../avatar/types";
import { loadAgentProfiles } from "../sandbox/agents-storage";

export interface AgentRoutingResult {
	agent: AgentProfile;
	expression: string;
	cardOutput: string;
	augmentedPrompt: string;
}

/**
 * Classifies and routes the user's task to the most appropriate agent in the project,
 * generating the explicit avatar card and system directives.
 */
export async function routeUserPrompt(text: string, cwd = process.cwd()): Promise<AgentRoutingResult> {
	const profiles = await loadAgentProfiles(cwd);
	const lower = text.toLowerCase();

	// 1. Direct invocation via @id
	let selectedAgent = profiles.find(
		p => lower.includes(`@${p.id.toLowerCase()}`) || lower.includes(`@${p.name.toLowerCase()}`),
	);

	// 2. Semantic and keyword classification
	if (!selectedAgent) {
		const securityScore = countMatches(lower, [
			"seguran",
			"vulnerab",
			"cve",
			"auth",
			"inject",
			"leak",
			"audit",
			"permiss",
			"token",
			"secret",
			"owasp",
			"sanitiz",
			"ataque",
			"firewall",
			"hacker",
		]);
		const theologyScore = countMatches(lower, [
			"bíblia",
			"biblia",
			"teolog",
			"grego",
			"hebraico",
			"aramaico",
			"strong",
			"exegese",
			"hermenêutica",
			"hermeneutica",
			"sagrado",
			"versículo",
			"versiculo",
			"logos",
			"ágape",
			"agape",
			"papiro",
		]);
		const codeScore = countMatches(lower, [
			"código",
			"codigo",
			"typescript",
			"javascript",
			"bun",
			"função",
			"funcao",
			"bug",
			"refator",
			"classe",
			"type",
			"interface",
			"test",
			"lint",
			"build",
			"api",
			"backend",
			"frontend",
			"css",
			"html",
		]);

		if (securityScore > 0 && securityScore >= theologyScore && securityScore >= codeScore) {
			selectedAgent = profiles.find(p => p.id === "security-sentinel" || p.structure.category === "critic");
		} else if (theologyScore > 0 && theologyScore >= codeScore) {
			selectedAgent = profiles.find(p => p.id === "theological-scholar" || p.structure.category === "scholar");
		} else if (codeScore > 0) {
			selectedAgent = profiles.find(p => p.id === "code-architect" || p.structure.category === "specialist");
		} else {
			// Default to orchestrator / lead
			selectedAgent =
				profiles.find(p => p.id === "shark-lead" || p.structure.category === "orchestrator") ?? profiles[0];
		}
	}

	if (!selectedAgent && profiles.length > 0) {
		selectedAgent = profiles[0]!;
	}

	const agent = selectedAgent!;

	// Determine avatar expression based on task tone
	let expression = "neutral";
	if (
		lower.includes("erro") ||
		lower.includes("bug") ||
		lower.includes("perigo") ||
		lower.includes("alerta") ||
		lower.includes("cuidado")
	) {
		expression = "alert";
	} else if (
		lower.includes("por que") ||
		lower.includes("como") ||
		lower.includes("analis") ||
		lower.includes("pens")
	) {
		expression = "thinking";
	} else if (
		lower.includes("duvido") ||
		lower.includes("tem certeza") ||
		lower.includes("suspeit") ||
		lower.includes("cético")
	) {
		expression = "skeptical";
	} else if (lower.includes("implementar") || lower.includes("criar") || lower.includes("escrever")) {
		expression = "focused";
	}

	// Render the explicit terminal avatar card
	const avatarCard = renderTerminalAvatarCard(agent, expression);

	const routingBanner = [
		`\x1b[38;2;0;240;255m╔══════════════════════════════════════════════════════════════════════════════╗\x1b[39m`,
		`\x1b[38;2;0;240;255m║\x1b[39m 🎯 \x1b[1m\x1b[38;2;250;204;21m[ROTEADOR DE AGENTES]\x1b[39m\x1b[22m Tarefa direcionada para: \x1b[1m\x1b[38;2;0;240;255m@${agent.id}\x1b[39m\x1b[22m (${agent.name})`,
		`\x1b[38;2;0;240;255m║\x1b[39m 🎭 \x1b[1mPapel:\x1b[22m ${agent.title} | \x1b[1mTom:\x1b[22m ${agent.personality.tone}`,
		agent.personality.catchphrase
			? `\x1b[38;2;0;240;255m║\x1b[39m 💬 \x1b[3m"${agent.personality.catchphrase}"\x1b[23m`
			: "",
		`\x1b[38;2;0;240;255m║\x1b[39m 🧠 \x1b[1mModelo:\x1b[22m ${agent.models.primary.model} | \x1b[1mTools:\x1b[22m [${agent.functions.join(", ")}]`,
		`\x1b[38;2;0;240;255m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[39m`,
	]
		.filter(Boolean)
		.join("\n");

	const cardOutput = `${avatarCard}\n${routingBanner}\n`;

	// Clean out @handle from text if present
	const cleanedText = text.replace(new RegExp(`@${agent.id}\\b`, "gi"), "").trim();

	// Augment prompt with agent instructions and persona rules
	const rulesText = agent.personality.behaviorRules.map(r => `- ${r}`).join("\n");
	const augmentedPrompt = `<agent-directive id="${agent.id}" role="${agent.structure.role}">
You are acting as **${agent.name}** (${agent.title}).
Personality & Tone: ${agent.personality.tone}.
Style: ${agent.personality.style}.
Behavioral Rules:
${rulesText}

System Instructions:
${agent.systemPrompt}
</agent-directive>

${cleanedText}`;

	return {
		agent,
		expression,
		cardOutput,
		augmentedPrompt,
	};
}

function countMatches(text: string, terms: string[]): number {
	let count = 0;
	for (const term of terms) {
		if (text.includes(term)) count++;
	}
	return count;
}
