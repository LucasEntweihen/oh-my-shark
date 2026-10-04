import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { magicKeywordRegex } from "./magic-keyword-boundary";
import { keywordInProse } from "./markdown-prose";

/**
 * 5-color palette specified by the user for /agent-sandbox:
 * Yellow (#FACC15), Blue (#3B82F6), Red (#EF4444), Pink (#EC4899), Gray (#9CA3AF)
 */
export const SANDBOX_GRADIENT_COLORS = [
	"#FACC15", // amarelo
	"#3B82F6", // azul
	"#EF4444", // vermelho
	"#EC4899", // rosa
	"#9CA3AF", // cinza
] as const;

function hexToRgb(hex: string): [number, number, number] {
	const c = Number.parseInt(hex.slice(1), 16);
	return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

function interpolateRgb(a: [number, number, number], b: [number, number, number], t: number): string {
	const r = Math.round(a[0] + (b[0] - a[0]) * t);
	const g = Math.round(a[1] + (b[1] - a[1]) * t);
	const bl = Math.round(a[2] + (b[2] - a[2]) * t);
	return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * Maps progress t ∈ [0, 1) through the 5-color stops smoothly.
 */
export function sampleSandboxColor(t: number): string {
	const colors = SANDBOX_GRADIENT_COLORS;
	const n = colors.length;
	const scaled = (((t % 1) + 1) % 1) * n;
	const i0 = Math.floor(scaled) % n;
	const i1 = (i0 + 1) % n;
	const fract = scaled - Math.floor(scaled);

	const rgb0 = hexToRgb(colors[i0]!);
	const rgb1 = hexToRgb(colors[i1]!);
	return interpolateRgb(rgb0, rgb1, fract);
}

const AGENT_SANDBOX_WORD = magicKeywordRegex("agent-sandbox");

export function containsAgentSandbox(text: string): boolean {
	return keywordInProse(text, AGENT_SANDBOX_WORD) || text.includes("/agent-sandbox");
}

/**
 * Animated 5-color gradient highlighter (amarelo, azul, vermelho, rosa, cinza)
 * for "/agent-sandbox" and "agent-sandbox" keyword in editor and terminal.
 */
export const highlightAgentSandbox: KeywordHighlighter = createGradientHighlighter({
	probe: /agent-sandbox/,
	highlight: /(?:\/)?agent-sandbox/g,
	stops: 20,
	color: t => sampleSandboxColor(t),
});

/**
 * Returns an animated-style rendered text with the 5-color gradient.
 */
export function paintSandboxText(text: string, phase = 0): string {
	let out = "";
	const n = text.length;
	for (let i = 0; i < n; i++) {
		const t = (i / n + phase) % 1;
		const col = sampleSandboxColor(t);
		const sgr = Bun.color(col, "ansi-16m") ?? "";
		out += `${sgr}${text[i]}`;
	}
	return `${out}\x1b[39m`;
}
