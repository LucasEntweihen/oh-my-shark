import chalk from "@oh-my-pi/pi-utils/chalk";
import type { AgentProfile, AvatarDefinition } from "./types";

/**
 * Renders a stylized ASCII/ANSI representation of the Bible Strong Avatar
 * for the terminal, featuring geometric frame, eyes, color aura and agent details.
 */
export function renderTerminalAvatarCard(agent: AgentProfile, activeExpression = "neutral"): string {
	const avatar: AvatarDefinition = agent.avatar;
	const bodyColorHex = avatar.colors.body;
	const eyeColorHex = avatar.colors.eyes;
	const glowHex = avatar.colors.glow ?? bodyColorHex;

	const bodyChalk = chalk.hex(bodyColorHex);
	const eyeChalk = chalk.hex(eyeColorHex);
	const glowChalk = chalk.hex(glowHex);
	const titleChalk = chalk.bold.cyan;
	const mutedChalk = chalk.dim;
	const boldChalk = chalk.bold;

	// Visual shape representation based on Bible Strong Avatar surface type
	const surfaceType = avatar.body.primary.type;
	let topArch = "╭─────────────────╮";
	let bottomArch = "╰─────────────────╯";
	let faceFrame = "│";

	if (surfaceType === "cube") {
		topArch = "┌─────────────────┐";
		bottomArch = "└─────────────────┘";
	} else if (surfaceType === "diamond") {
		topArch = "▲─────────────────▲";
		bottomArch = "▼─────────────────▼";
		faceFrame = "◈";
	} else if (surfaceType === "capsule") {
		topArch = "╭───[CAPSULE]───╮";
		bottomArch = "╰───────────────╯";
	}

	// Expression-based eyes representation
	let leftEyeChar = "⬤";
	let rightEyeChar = "⬤";
	if (activeExpression === "thinking") {
		leftEyeChar = "◔";
		rightEyeChar = "◕";
	} else if (activeExpression === "skeptical") {
		leftEyeChar = "◉";
		rightEyeChar = "—";
	} else if (activeExpression === "alert") {
		leftEyeChar = "ʘ";
		rightEyeChar = "ʘ";
	} else if (activeExpression === "focused") {
		leftEyeChar = "■";
		rightEyeChar = "■";
	}

	const leftEyeRendered = eyeChalk.bold(leftEyeChar);
	const rightEyeRendered = eyeChalk.bold(rightEyeChar);
	const spacingSpaces = "     ";

	const lines = [
		"",
		bodyChalk(topArch) + "   " + titleChalk(`[AGENTE ATIVO: ${agent.name}]`),
		bodyChalk(faceFrame) + "                 " + bodyChalk(faceFrame) + "   " + glowChalk(`Role: ${agent.title}`),
		bodyChalk(faceFrame) +
			"     " +
			leftEyeRendered +
			spacingSpaces +
			rightEyeRendered +
			"     " +
			bodyChalk(faceFrame) +
			"   " +
			boldChalk(`Personalidade: ${agent.personality.tone}`),
		bodyChalk(faceFrame) +
			"        ‿        " +
			bodyChalk(faceFrame) +
			"   " +
			mutedChalk(`Traços: ${agent.personality.traits.join(", ")}`),
		bodyChalk(bottomArch) +
			"   " +
			mutedChalk(`Modelo: ${agent.models.primary.model} | Superfície: ${surfaceType} | Cor: ${bodyColorHex}`),
		agent.personality.catchphrase ? mutedChalk(`   "${agent.personality.catchphrase}"`) : "",
		"",
	];

	return lines.filter(l => l !== "").join("\n");
}
