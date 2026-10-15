import type { ThemeJson } from "./schema";

/**
 * Converte valores HSL (matiz [0-360], saturação [0-100], luminosidade [0-100]) para hexadecimal.
 */
function hslToHex(h: number, s: number, l: number): string {
	const normH = ((h % 360) + 360) % 360;
	const normS = Math.max(0, Math.min(100, s)) / 100;
	const normL = Math.max(0, Math.min(100, l)) / 100;

	const c = (1 - Math.abs(2 * normL - 1)) * normS;
	const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
	const m = normL - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (0 <= normH && normH < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= normH && normH < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= normH && normH < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= normH && normH < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= normH && normH < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= normH && normH < 360) {
		r = c;
		g = 0;
		b = x;
	}

	const toHex = (n: number) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Constrói um padrão de cores genérico válido e harmônico baseado em matiz e luminosidade.
 */
function createGenericTheme(name: string, hue: number, mode: "dark" | "light"): ThemeJson {
	const isDark = mode === "dark";
	const accent = hslToHex(hue, 85, isDark ? 65 : 40);
	const border = hslToHex(hue, 35, isDark ? 28 : 72);
	const borderAccent = accent;
	const borderMuted = hslToHex(hue, 20, isDark ? 18 : 84);
	const success = hslToHex(142, 60, isDark ? 65 : 38);
	const error = hslToHex(0, 75, isDark ? 65 : 45);
	const warning = hslToHex(45, 85, isDark ? 60 : 42);
	const muted = hslToHex(hue, 15, isDark ? 55 : 45);
	const dim = hslToHex(hue, 12, isDark ? 40 : 60);
	const text = isDark ? "#e8e8e8" : "#1a1a1a";
	const thinkingText = muted;
	const selectedBg = hslToHex(hue, 30, isDark ? 18 : 88);
	const userMsgBg = hslToHex(hue, 25, isDark ? 14 : 93);
	const customMsgBg = hslToHex((hue + 40) % 360, 25, isDark ? 15 : 92);
	const customMsgLabel = hslToHex((hue + 40) % 360, 70, isDark ? 70 : 40);
	const toolPendingBg = hslToHex(hue, 20, isDark ? 13 : 94);
	const toolSuccessBg = hslToHex(142, 20, isDark ? 12 : 94);
	const toolErrorBg = hslToHex(0, 25, isDark ? 15 : 93);

	const pageBg = hslToHex(hue, 18, isDark ? 8 : 98);
	const cardBg = hslToHex(hue, 15, isDark ? 11 : 95);
	const infoBg = hslToHex(hue, 20, isDark ? 14 : 92);

	return {
		name,
		colors: {
			accent,
			border,
			borderAccent,
			borderMuted,
			success,
			error,
			warning,
			muted,
			dim,
			text,
			thinkingText,
			selectedBg,
			userMessageBg: userMsgBg,
			userMessageText: text,
			customMessageBg: customMsgBg,
			customMessageText: text,
			customMessageLabel: customMsgLabel,
			toolPendingBg,
			toolSuccessBg,
			toolErrorBg,
			toolTitle: text,
			toolOutput: muted,
			mdHeading: accent,
			mdLink: hslToHex((hue + 180) % 360, 80, isDark ? 68 : 42),
			mdLinkUrl: dim,
			mdCode: hslToHex((hue + 60) % 360, 75, isDark ? 75 : 35),
			mdCodeBlock: hslToHex(hue, 15, isDark ? 88 : 18),
			mdCodeBlockBorder: borderMuted,
			mdQuote: muted,
			mdQuoteBorder: borderMuted,
			mdHr: borderMuted,
			mdListBullet: accent,
			toolDiffAdded: success,
			toolDiffRemoved: error,
			toolDiffContext: muted,
			syntaxComment: dim,
			syntaxKeyword: hslToHex((hue + 270) % 360, 75, isDark ? 70 : 42),
			syntaxFunction: hslToHex((hue + 30) % 360, 80, isDark ? 68 : 40),
			syntaxVariable: hslToHex((hue + 150) % 360, 70, isDark ? 72 : 38),
			syntaxString: hslToHex((hue + 90) % 360, 65, isDark ? 70 : 36),
			syntaxNumber: hslToHex(35, 80, isDark ? 68 : 42),
			syntaxType: hslToHex((hue + 210) % 360, 70, isDark ? 72 : 40),
			syntaxOperator: hslToHex(hue, 20, isDark ? 85 : 25),
			syntaxPunctuation: hslToHex(hue, 15, isDark ? 75 : 35),
			thinkingOff: borderMuted,
			thinkingMinimal: dim,
			thinkingLow: border,
			thinkingMedium: hslToHex((hue + 180) % 360, 60, isDark ? 55 : 45),
			thinkingHigh: accent,
			thinkingXhigh: hslToHex((hue + 45) % 360, 85, isDark ? 75 : 45),
			bashMode: accent,
			pythonMode: warning,
			statusLineBg: pageBg,
			statusLineSep: isDark ? 240 : 248,
			statusLineModel: hslToHex((hue + 60) % 360, 75, isDark ? 75 : 35),
			statusLinePath: hslToHex((hue + 180) % 360, 70, isDark ? 70 : 40),
			statusLineGitClean: success,
			statusLineGitDirty: warning,
			statusLineContext: hslToHex((hue + 270) % 360, 70, isDark ? 70 : 40),
			statusLineSpend: border,
			statusLineStaged: 141,
			statusLineDirty: 179,
			statusLineUntracked: 183,
			statusLineOutput: 213,
			statusLineCost: 213,
			statusLineSubagents: accent,
		},
		export: {
			pageBg,
			cardBg,
			infoBg,
		},
	};
}

/**
 * 100 padrões de cores genéricos integrados (50 temas dark e 50 temas light distribuídos pelo espectro 360°).
 */
export const genericThemes: Record<string, ThemeJson> = (() => {
	const themes: Record<string, ThemeJson> = {};
	const countPerMode = 50;

	for (let i = 1; i <= countPerMode; i++) {
		const pad = String(i).padStart(2, "0");
		const hue = Math.round(((i - 1) * 360) / countPerMode);

		const darkName = `dark-spectrum-${pad}`;
		themes[darkName] = createGenericTheme(darkName, hue, "dark");

		const lightName = `light-spectrum-${pad}`;
		themes[lightName] = createGenericTheme(lightName, hue, "light");
	}

	return themes;
})();
