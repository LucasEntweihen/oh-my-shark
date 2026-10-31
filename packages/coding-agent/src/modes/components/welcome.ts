import {
	type Component,
	padding,
	replaceTabs,
	TERMINAL,
	truncateToWidth,
	visibleWidth,
	wrapTextWithAnsi,
} from "@oh-my-pi/pi-tui";
import { DISPLAY_NAME, PRODUCT_BYLINE } from "@oh-my-pi/pi-utils";
import { theme } from "../../modes/theme/theme";
import { getDeepSeaCockpit } from "../../tui/deep-sea-command";
import tipsText from "./tips.txt" with { type: "text" };

/** Tips embedded at build time, one per line; blanks dropped. */
const TIPS: readonly string[] = tipsText
	.split("\n")
	.map(line => line.trim())
	.filter(line => line.length > 0);

/**
 * Fixed number of session rows in the welcome box so its height stays stable
 * across recent-session updates.
 */
export const WELCOME_SESSION_SLOTS = 4;

/**
 * Fixed number of LSP-server rows, for the same reason. Overflow is sliced so
 * the box height is constant regardless of how many servers a project has.
 */
export const WELCOME_LSP_SLOTS = 4;

/** Trailing marker that flags a tip as a "what's new" callout. Stripped before
 *  wrapping (with any preceding whitespace) and replaced by {@link NEW_TAG_TEXT}
 *  painted as a shimmering rainbow. Non-global so `.test` stays stateless. */
const NEW_TIP_MARKER = /\s*\[NEW\]\s*$/;

/** Visible text rendered in place of {@link NEW_TIP_MARKER}. */
const NEW_TAG_TEXT = "NEW!";

/** Milliseconds for one full hue rotation of the rainbow "NEW!" tag. */
const NEW_GLOW_PERIOD_MS = 1500;

/** Selection weight for "[NEW]" tips; ordinary tips weigh 1, so a freshly added
 *  affordance surfaces this many times as often. */
const NEW_TIP_WEIGHT = 4;

/** Pick a tip from `tips`, biased toward "[NEW]" tips by {@link NEW_TIP_WEIGHT};
 *  `r` is a uniform sample in [0, 1). Returns "" when `tips` is empty.
 *  Exported for tests. */
export function pickWeightedTip(tips: readonly string[], r: number): string {
	if (tips.length === 0) return "";
	const weights = tips.map(tip => (NEW_TIP_MARKER.test(tip) ? NEW_TIP_WEIGHT : 1));
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	let acc = r * total;
	for (let i = 0; i < tips.length; i++) {
		acc -= weights[i] ?? 1;
		if (acc < 0) return tips[i] ?? "";
	}
	return tips[tips.length - 1] ?? "";
}

type ColorEncoding = "ansi-16m" | "ansi-256";

/** Paint each glyph of {@link NEW_TAG_TEXT} on a moving HSL rainbow. `phase`
 *  rotates the hue offset cyclically; successive renders with increasing phase
 *  shimmer, while a fixed phase yields a still rainbow. */
function renderNewTag(phase: number, encoding: ColorEncoding): string {
	const bold = "\x1b[1m";
	const reset = "\x1b[0m";
	const wrapped = ((phase % 1) + 1) % 1;
	const chars = [...NEW_TAG_TEXT];
	let out = bold;
	let prev = "";
	for (let i = 0; i < chars.length; i++) {
		const hue = Math.round(((i / chars.length + wrapped) % 1) * 360);
		const color = Bun.color(`hsl(${hue}, 95%, 60%)`, encoding) ?? "";
		if (color !== prev) {
			out += color;
			prev = color;
		}
		out += chars[i];
	}
	return out + reset;
}

export function renderWelcomeTip(tip: string, boxWidth: number, phase = 0): string[] {
	const label = "Tip: ";
	const labelWidth = visibleWidth(label);
	const bodyBudget = boxWidth - 1 - labelWidth; // 1 = leading indent
	if (bodyBudget < 8) return [];

	const isNew = NEW_TIP_MARKER.test(tip);
	const body = isNew ? tip.replace(NEW_TIP_MARKER, "") : tip;

	const wrappedBody = wrapTextWithAnsi(replaceTabs(body), bodyBudget);
	if (wrappedBody.length === 0) return [];

	const continuationIndent = padding(labelWidth);
	const styledLabel = theme.fg("customMessageLabel", label);

	const lines = wrappedBody.map((line, index) => {
		const styledBody = theme.fg("muted", line);
		const content = index === 0 ? `${styledLabel}${styledBody}` : `${continuationIndent}${styledBody}`;
		return ` ${theme.italic(content)}`;
	});

	if (isNew) {
		const encoding: ColorEncoding = TERMINAL.trueColor ? "ansi-16m" : "ansi-256";
		const tag = renderNewTag(phase, encoding);
		const tagWidth = 1 + visibleWidth(NEW_TAG_TEXT);
		const lastLine = lines[lines.length - 1];
		if (lastLine !== undefined && visibleWidth(lastLine) + tagWidth <= boxWidth) {
			lines[lines.length - 1] = `${lastLine} ${tag}`;
		} else {
			lines.push(` ${continuationIndent}${tag}`);
		}
	}

	return lines;
}

export interface RecentSession {
	name: string;
	timeAgo: string;
}

export interface LspServerInfo {
	name: string;
	status: "ready" | "error" | "connecting" | "available";
	fileTypes: string[];
}

/**
 * Premium welcome screen with a blue shark mark and responsive panel layout.
 */
export class WelcomeComponent implements Component {
	#animStart: number | null = null;
	#animTimer: Timer | null = null;
	#requestRender: (() => void) | null = null;
	#nagRoll: number | undefined;
	#tipRoll: number | undefined;
	#cachedWidth = -1;
	#cachedLines: string[] | undefined;

	constructor(
		private version: string,
		private modelName: string,
		private providerName: string,
		private recentSessions: RecentSession[] = [],
		private lspServers: LspServerInfo[] = [],
	) {}

	get tip(): string | undefined {
		this.#nagRoll ??= Math.random();
		this.#tipRoll ??= Math.random();
		if (theme.getSymbolPreset() === "unicode" && this.#nagRoll < 0.1) {
			return "Please use nerdfont 😭.";
		}
		return pickWeightedTip(TIPS, this.#tipRoll) || undefined;
	}

	invalidate(): void {
		this.#cachedWidth = -1;
		this.#cachedLines = undefined;
	}

	isTranscriptBlockFinalized(): boolean {
		return this.#animTimer == null;
	}

	playIntro(requestRender: () => void): void {
		this.#stopAnimation();
		this.#requestRender = requestRender;
		this.#animStart = performance.now();
		this.#requestRender();
		this.#animTimer = setInterval(() => {
			const elapsed = performance.now() - (this.#animStart ?? 0);
			if (elapsed >= INTRO_MS) {
				this.#stopAnimation();
			}
			this.#requestRender?.();
		}, INTRO_TICK_MS);
	}

	#stopAnimation(): void {
		if (this.#animTimer != null) {
			clearInterval(this.#animTimer);
			this.#animTimer = null;
		}
		this.#animStart = null;
		this.#requestRender = null;
		this.invalidate();
	}

	retargetIntro(requestRender: () => void): boolean {
		if (this.#animTimer == null) return false;
		this.#requestRender = requestRender;
		return true;
	}

	stopIntro(): void {
		this.#stopAnimation();
	}

	setVersion(version: string): void {
		this.version = version;
		this.invalidate();
	}

	setModel(modelName: string, providerName: string): void {
		this.modelName = modelName;
		this.providerName = providerName;
		this.invalidate();
	}

	setRecentSessions(sessions: RecentSession[]): void {
		this.recentSessions = sessions;
		this.invalidate();
	}

	setLspServers(servers: LspServerInfo[]): void {
		this.lspServers = servers;
		this.invalidate();
	}

	render(termWidth: number): readonly string[] {
		const animating = this.#animStart != null;
		if (!animating && this.#cachedLines && this.#cachedWidth === termWidth) {
			return this.#cachedLines;
		}
		const lines = this.#renderLines(termWidth);
		if (animating) {
			this.#cachedLines = undefined;
			this.#cachedWidth = -1;
		} else {
			this.#cachedLines = lines;
			this.#cachedWidth = termWidth;
		}
		return lines;
	}

	#renderLines(termWidth: number): string[] {
		const maxWidth = 120;
		const boxWidth = Math.min(maxWidth, Math.max(0, termWidth - 2));
		if (boxWidth < 4) return [];

		const innerWidth = boxWidth - 2;
		const minPanelWidth = 32;
		const showFullLogo = innerWidth >= SHARK_WIDTH + minPanelWidth + 1;
		const showSideBySide = showFullLogo || innerWidth >= 48;
		const leftCol = showFullLogo
			? SHARK_WIDTH
			: showSideBySide
				? Math.min(24, Math.max(14, Math.floor(innerWidth * 0.3)))
				: innerWidth;
		const rightCol = showSideBySide ? innerWidth - leftCol - 1 : innerWidth;
		const panelWidth = showSideBySide ? rightCol : innerWidth;
		const logoColored = this.#currentLogoFrame();

		const brandLines = showFullLogo
			? [
					this.#centerText(theme.bold("Welcome back!"), leftCol),
					...logoColored.map(line => this.#centerText(line, leftCol)),
					this.#centerText(theme.fg("muted", this.modelName), leftCol),
					this.#centerText(theme.fg("borderMuted", this.providerName), leftCol),
				]
			: showSideBySide
				? [
						"",
						this.#centerText(theme.bold("Welcome back!"), leftCol),
						this.#centerText(theme.bold(SHARK_WORDMARK), leftCol),
						this.#centerText(theme.fg("muted", this.modelName), leftCol),
						this.#centerText(theme.fg("borderMuted", this.providerName), leftCol),
						"",
					]
				: ["", this.#centerText(theme.bold(SHARK_WORDMARK), innerWidth), ""];

		const separatorWidth = Math.max(0, panelWidth - 2);
		const separator = ` ${theme.fg("dim", theme.boxRound.horizontal.repeat(separatorWidth))}`;

		const sessionLines: string[] = [];
		if (this.recentSessions.length === 0) {
			sessionLines.push(` ${theme.fg("dim", "No recent sessions")}`);
		} else {
			const bulletPrefix = ` ${theme.md.bullet} `;
			const prefixWidth = visibleWidth(bulletPrefix);
			for (const session of this.recentSessions.slice(0, WELCOME_SESSION_SLOTS)) {
				const timeSuffixRaw = ` (${session.timeAgo})`;
				const timeWidth = visibleWidth(timeSuffixRaw);
				const nameBudget = Math.max(1, panelWidth - prefixWidth - timeWidth);
				const name =
					visibleWidth(session.name) > nameBudget ? truncateToWidth(session.name, nameBudget) : session.name;
				sessionLines.push(
					`${theme.fg("dim", bulletPrefix)}${theme.fg("muted", name)}${theme.fg("dim", timeSuffixRaw)}`,
				);
			}
		}
		while (sessionLines.length < WELCOME_SESSION_SLOTS) sessionLines.push("");

		const lspLines: string[] = [];
		if (this.lspServers.length === 0) {
			lspLines.push(` ${theme.fg("dim", "No LSP servers")}`);
		} else {
			for (const server of this.lspServers.slice(0, WELCOME_LSP_SLOTS)) {
				const icon =
					server.status === "ready"
						? theme.styledSymbol("status.enabled", "success")
						: server.status === "available"
							? theme.styledSymbol("status.enabled", "dim")
							: server.status === "connecting"
								? theme.styledSymbol("status.pending", "muted")
								: theme.styledSymbol("status.error", "error");
				const exts = server.fileTypes.slice(0, 3).join(" ");
				lspLines.push(` ${icon} ${theme.fg("muted", server.name)} ${theme.fg("dim", exts)}`);
			}
		}
		while (lspLines.length < WELCOME_LSP_SLOTS) lspLines.push("");

		let cockpitStatus = "Transactional Engine & Checkpoints";
		try {
			const cockpit = getDeepSeaCockpit();
			const mission = cockpit.getMission();
			if (mission.id && mission.id !== "MISSION-01") {
				cockpitStatus = `[${mission.id}] ${mission.phase}`;
			}
		} catch {
			// Non-blocking fallback
		}

		const panelLines = [
			` ${theme.bold(theme.fg("accent", "Deep Sea Cockpit"))}`,
			` ${theme.fg("success", "✔")} ${theme.fg("muted", cockpitStatus)}`,
			` ${theme.fg("success", "✔")} ${theme.fg("muted", "Mente em Teia SQLite Knowledge")}`,
			` ${theme.fg("success", "✔")} ${theme.fg("muted", "Deterministic Tool Router")}`,
			separator,
			` ${theme.bold(theme.fg("accent", "Tips"))}`,
			` ${theme.fg("dim", "#")}${theme.fg("muted", " for prompt actions")}`,
			` ${theme.fg("dim", "/")}${theme.fg("muted", " for commands")}`,
			` ${theme.fg("dim", "!")}${theme.fg("muted", " to run bash")}`,
			` ${theme.fg("dim", "$")}${theme.fg("muted", " to run python")}`,
			separator,
			` ${theme.bold(theme.fg("accent", "LSP Servers"))}`,
			...lspLines,
			separator,
			` ${theme.bold(theme.fg("accent", "Recent sessions"))}`,
			...sessionLines,
			"",
		];

		const hChar = theme.boxRound.horizontal;
		const h = theme.fg("dim", hChar);
		const v = theme.fg("dim", theme.boxRound.vertical);
		const tl = theme.fg("dim", theme.boxRound.topLeft);
		const tr = theme.fg("dim", theme.boxRound.topRight);
		const bl = theme.fg("dim", theme.boxRound.bottomLeft);
		const br = theme.fg("dim", theme.boxRound.bottomRight);
		const lines: string[] = [];

		const title = `${DISPLAY_NAME} v${this.version} · ${PRODUCT_BYLINE}`;
		const titleDecorated = ` ${title} `;
		const titlePrefixRaw = hChar.repeat(3);
		const titleStyled = theme.fg("dim", titlePrefixRaw) + theme.fg("muted", titleDecorated);
		const titleVisLen = visibleWidth(titlePrefixRaw) + visibleWidth(titleDecorated);
		const titleSpace = boxWidth - 2;
		if (titleVisLen >= titleSpace) {
			lines.push(tl + truncateToWidth(titleStyled, titleSpace) + tr);
		} else {
			lines.push(tl + titleStyled + theme.fg("dim", hChar.repeat(titleSpace - titleVisLen)) + tr);
		}

		if (showSideBySide) {
			const maxRows = Math.max(brandLines.length, panelLines.length);
			for (let i = 0; i < maxRows; i++) {
				lines.push(
					v +
						this.#fitToWidth(brandLines[i] ?? "", leftCol) +
						v +
						this.#fitToWidth(panelLines[i] ?? "", rightCol) +
						v,
				);
			}
		} else {
			for (const line of [...brandLines, ...panelLines]) {
				lines.push(v + this.#fitToWidth(line, innerWidth) + v);
			}
		}

		if (showSideBySide) {
			lines.push(bl + h.repeat(leftCol) + theme.fg("dim", theme.boxRound.teeUp) + h.repeat(rightCol) + br);
		} else {
			lines.push(bl + h.repeat(innerWidth) + br);
		}
		lines.push(...this.#renderTip(boxWidth));

		return lines.map(line => truncateToWidth(line, Math.max(0, termWidth)));
	}

	#renderTip(boxWidth: number): string[] {
		const tip = this.tip;
		if (!tip) return [];
		const phase = NEW_TIP_MARKER.test(tip) ? performance.now() / NEW_GLOW_PERIOD_MS : 0;
		return renderWelcomeTip(tip, boxWidth, phase);
	}

	#centerText(text: string, width: number): string {
		const visLen = visibleWidth(text);
		if (visLen >= width) {
			return truncateToWidth(text, width);
		}
		const leftPad = Math.floor((width - visLen) / 2);
		const rightPad = width - visLen - leftPad;
		return padding(leftPad) + text + padding(rightPad);
	}

	#fitToWidth(str: string, width: number): string {
		const visLen = visibleWidth(str);
		if (visLen > width) {
			const ellipsis = "…";
			const ellipsisWidth = visibleWidth(ellipsis);
			const maxWidth = Math.max(0, width - ellipsisWidth);
			let truncated = "";
			let currentWidth = 0;
			let inEscape = false;
			for (const char of str) {
				if (char === "\x1b") inEscape = true;
				if (inEscape) {
					truncated += char;
					if (char === "m") inEscape = false;
				} else if (currentWidth < maxWidth) {
					truncated += char;
					if (currentWidth < maxWidth) {
						truncated += char;
						currentWidth++;
					}
				}
			}
			return `${truncated}${ellipsis}`;
		}
		return str + padding(width - visLen);
	}

	#currentLogoFrame(): readonly string[] {
		if (this.#animStart == null) return REST_FRAME;
		const elapsed = performance.now() - this.#animStart;
		if (elapsed >= INTRO_MS) return REST_FRAME;
		return introLogoFrame(elapsed / INTRO_MS);
	}
}

/** ASCII shark from stackedlol/ascii-sharks, shared by the welcome and setup surfaces. */
export const SHARK_LOGO = [
	"                            ;'",
	"                             %%'",
	"                              .t;.               .oooo",
	"                               S;:S%              %8S8.",
	"                                ;:tt%t '..        XX%%S",
	"t'                            ''XSSS8SSX%XX8#.    %XSX%",
	" :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.",
	"  ::%'       ''8XXXSSt%Stttttt%t8@%%@%8@8%Sttt%%%%SSSSS%tt.",
	"  'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t",
	" .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.",
	"  %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.",
	" .%t                            ;%%%#@@##@@@.     SXS%%",
	" t.                            .%;%%%.            %%XXS",
	"                              '%t:t              .SXSS'",
	"                             '::'.                ooooo",
	"                            .S'",
	"                            .",
] as const;

const PRODUCT_WORDS = DISPLAY_NAME.match(/^(oh)(my)(.+)$/i)?.slice(1) ?? [DISPLAY_NAME];
export const SHARK_WORDMARK = PRODUCT_WORDS.map(word => {
	const titleCase = word.charAt(0).toUpperCase() + word.slice(1);
	return [...titleCase].join(" ");
}).join("   ");
const SHARK_WIDTH = Math.max(...SHARK_LOGO.map(line => visibleWidth(line)));

/** Multi-stop blue palette for the diagonal gradient. */
const GRADIENT_STOPS: ReadonlyArray<readonly [number, number, number]> = [
	[11, 98, 196],
	[57, 167, 255],
	[143, 230, 255],
];

/** 256-color blue ramp fallback when truecolor isn't available. */
const GRADIENT_RAMP_256 = [25, 27, 33, 39, 45, 51, 87, 123];

/** Half-width of the shine highlight band, expressed in gradient-t units. */
const SHINE_HALF_WIDTH = 0.18;

export interface ShineConfig {
	strength: number;
	pos: number;
}

export function gradientEscape(t: number, shine?: ShineConfig): string {
	const shineStrength = shine && shine.strength > 0 ? shine.strength : 0;
	const shinePos = shine ? shine.pos : 0;
	if (TERMINAL.trueColor) {
		const stops = GRADIENT_STOPS;
		const seg = t * (stops.length - 1);
		const i = Math.min(stops.length - 2, Math.floor(seg));
		const f = seg - i;
		const a = stops[i];
		const b = stops[i + 1];
		let r = a[0] + (b[0] - a[0]) * f;
		let g = a[1] + (b[1] - a[1]) * f;
		let bl = a[2] + (b[2] - a[2]) * f;
		if (shineStrength > 0) {
			const dist = Math.abs(t - shinePos);
			const intensity = Math.max(0, 1 - dist / SHINE_HALF_WIDTH) * shineStrength;
			if (intensity > 0) {
				r += (255 - r) * intensity;
				g += (255 - g) * intensity;
				bl += (255 - bl) * intensity;
			}
		}
		return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(bl)}m`;
	}
	const ramp = GRADIENT_RAMP_256;
	let idx = Math.min(ramp.length - 1, Math.max(0, Math.floor(t * (ramp.length - 1) + 0.5)));
	if (shineStrength > 0) {
		const dist = Math.abs(t - shinePos);
		const intensity = Math.max(0, 1 - dist / SHINE_HALF_WIDTH) * shineStrength;
		if (intensity > 0.5) idx = ramp.length - 1;
	}
	return `\x1b[38;5;${ramp[idx]}m`;
}

export function gradientLogo(lines: readonly string[], phase = 0, shine?: ShineConfig): string[] {
	const reset = "\x1b[0m";
	const rows = lines.length;
	const cols = Math.max(...lines.map(l => l.length));
	const xSpan = Math.max(1, cols - 1);
	const ySpan = Math.max(1, rows - 1);
	const normalizedPhase = ((phase % 1) + 1) % 1;
	return lines.map((line, y) => {
		let result = "";
		for (let x = 0; x < line.length; x++) {
			const char = line[x];
			if (char === " ") {
				result += char;
				continue;
			}
			const base = (x / xSpan + y / ySpan) / 2;
			const t = normalizedPhase === 0 ? base : (base + normalizedPhase) % 1;
			result += gradientEscape(t, shine) + char + reset;
		}
		return result;
	});
}

const INTRO_MS = 3000;
const INTRO_TICK_MS = 33;
const INTRO_SWEEPS = 2.5;
const INTRO_SHINE_TRAVERSALS = 3;

function introLogoFrame(progress: number): string[] {
	const eased = 1 - (1 - progress) ** 3;
	const phase = ((((1 - eased) * INTRO_SWEEPS) % 1) + 1) % 1;
	const shinePos = (((progress * INTRO_SHINE_TRAVERSALS) % 1) + 1) % 1;
	const shineStrength = (1 - eased) ** 1.5;
	return gradientLogo(SHARK_LOGO, phase, { strength: shineStrength, pos: shinePos });
}

const REST_FRAME = gradientLogo(SHARK_LOGO, 0);
