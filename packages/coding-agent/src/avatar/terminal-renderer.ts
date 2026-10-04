import chalk from "@oh-my-pi/pi-utils/chalk";
import type { AgentProfile, AvatarDefinition } from "./types";

/**
 * Strong references catalog for Bible Strong Scholar and related agents.
 */
export const AGENT_STRONG_REFERENCES: Record<string, string> = {
	"shark-lead": "H5057 (Nagid - Líder Soberano) · G2233 (Hegeomai - Governar com visão)",
	"code-architect": "H2796 (Charash - Artífice Mestre) · G753 (Architekton - Sábio Construtor)",
	"theological-scholar": "H2450 (Chakam - Sábio Erudito) · G3056 (Logos - Palavra Revelada)",
	"security-sentinel": "H8104 (Shamar - Vigiar Fielmente) · G1127 (Gregoreo - Vigilância Constante)",
	"deep-sea-sage": "H8415 (Tehom - Abismo Profundo) · G899 (Bathos - Profundidade Insondável)",
};

export const AGENT_CONTEXT_RECOMMENDATIONS: Record<string, string> = {
	"shark-lead": "Planejamento arquitetural, divisão de tarefas, orquestração de subagentes e visão holística.",
	"code-architect":
		"Implementação técnica, refatorações, TypeScript estrito, Bun APIs nativas e zero abstrações inúteis.",
	"theological-scholar":
		"Análise de textos sagrados, números de Strong (H####/G####), etimologia e raízes originais hebraicas/gregas.",
	"security-sentinel":
		"Auditoria de segurança, testes de penetração, sanitização de inputs, validação de permissões e edge cases.",
	"deep-sea-sage":
		"Síntese conceitual, heurísticas de longo prazo, filosofia de software e resolução de impasses abstratos.",
};

/**
 * Builds an authentic Grok Dots eye representation in terminal ANSI text.
 */
export function buildTerminalDotsFace(
	surfaceType: string,
	expressionKey = "neutral",
	bodyColorHex: string,
	eyeColorHex: string,
): string[] {
	const bodyChalk = chalk.hex(bodyColorHex);
	const eyeChalk = chalk.hex(eyeColorHex);

	// Shape-specific outer boundary
	let topRim = "╭─────────────────╮";
	let midRim = "│";
	let botRim = "╰─────────────────╯";

	if (surfaceType === "cube") {
		topRim = "┌─────────────────┐";
		midRim = "│";
		botRim = "└─────────────────┘";
	} else if (surfaceType === "diamond") {
		topRim = "▲─────────────────▲";
		midRim = "◈";
		botRim = "▼─────────────────▼";
	} else if (surfaceType === "capsule") {
		topRim = "╭───[CAPSULE]───╮";
		midRim = "│";
		botRim = "╰───────────────╯";
	} else if (surfaceType === "cylinder") {
		topRim = "⌠─────────────────⌡";
		midRim = "│";
		botRim = "⌡─────────────────⌠";
	}

	// Expressions in Grok dots style
	let leftEye = "●●";
	let rightEye = "●●";
	let eyeRow2 = "●●";
	let eyeRow2R = "●●";
	let mouth = "      ‿      ";

	if (expressionKey === "thinking") {
		leftEye = "··";
		rightEye = "●●";
		eyeRow2 = "●●";
		eyeRow2R = "··";
		mouth = "      ~      ";
	} else if (expressionKey === "alert") {
		leftEye = "◉◉";
		rightEye = "◉◉";
		eyeRow2 = "◉◉";
		eyeRow2R = "◉◉";
		mouth = "      ○      ";
	} else if (expressionKey === "curious") {
		leftEye = "●·";
		rightEye = "·●";
		eyeRow2 = "·●";
		eyeRow2R = "●·";
		mouth = "     ╰─╯     ";
	} else if (expressionKey === "skeptical") {
		leftEye = "━━";
		rightEye = "●●";
		eyeRow2 = "  ";
		eyeRow2R = "●●";
		mouth = "      ─      ";
	}

	return [
		bodyChalk(topRim),
		`${bodyChalk(midRim)}                 ${bodyChalk(midRim)}`,
		`${bodyChalk(midRim)}   ${eyeChalk(leftEye)}     ${eyeChalk(rightEye)}   ${bodyChalk(midRim)}`,
		`${bodyChalk(midRim)}   ${eyeChalk(eyeRow2)}     ${eyeChalk(eyeRow2R)}   ${bodyChalk(midRim)}`,
		`${bodyChalk(midRim)}  ${bodyChalk(mouth)}  ${bodyChalk(midRim)}`,
		bodyChalk(botRim),
	];
}

/**
 * Renders a full stylized terminal card for an agent with Bible Strong & Grok Dots style.
 */
export function renderTerminalAvatarCard(agent: AgentProfile, activeExpression = "neutral"): string {
	const avatar: AvatarDefinition = agent.avatar;
	const bodyColorHex = avatar.colors.body;
	const eyeColorHex = avatar.colors.eyes;
	const glowHex = avatar.colors.glow ?? bodyColorHex;

	const glowChalk = chalk.hex(glowHex);
	const titleChalk = chalk.bold.cyan;
	const mutedChalk = chalk.dim;
	const goldChalk = chalk.hex("#D4AF37");

	const surfaceType = avatar.body.primary.type;
	const faceLines = buildTerminalDotsFace(surfaceType, activeExpression, bodyColorHex, eyeColorHex);

	const strongRef = AGENT_STRONG_REFERENCES[agent.id];
	const contextHint = AGENT_CONTEXT_RECOMMENDATIONS[agent.id] ?? agent.description;

	const rightCol = [
		titleChalk(`[AGENTE: ${agent.name}]`) + chalk.gray(` (@${agent.id})`),
		glowChalk(`Papel: ${agent.title}`) + chalk.dim(` · Superfície: ${surfaceType.toUpperCase()}`),
		chalk.white(`Personalidade: ${agent.personality.tone}`),
		mutedChalk(`Traços: ${agent.personality.traits.join(", ")}`),
		strongRef ? goldChalk(`Strong: ${strongRef}`) : mutedChalk(`Modelo: ${agent.models.primary.model}`),
		chalk.green(`Contexto ideal: `) + chalk.white(contextHint),
	];

	const combinedLines: string[] = [""];
	for (let i = 0; i < Math.max(faceLines.length, rightCol.length); i++) {
		const left = faceLines[i] ?? "                     ";
		const right = rightCol[i] ?? "";
		combinedLines.push(`${left}   ${right}`);
	}

	if (agent.personality.catchphrase) {
		combinedLines.push(mutedChalk(`   "${agent.personality.catchphrase}"`));
	}
	combinedLines.push("");

	return combinedLines.join("\n");
}
