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
import { AsciiOceanComponent } from "./ascii-ocean";
import { theme } from "../../modes/theme/theme";
import tipsText from "./tips.txt" with { type: "text" };

/** Tips embedded at build time, one per line; blanks dropped. */
const TIPS: readonly string[] = tipsText
	.split("\n")
	.map(line => line.trim())
	.filter(line => line.length > 0);

export const WELCOME_SESSION_SLOTS = 4;
export const WELCOME_LSP_SLOTS = 4;
const NEW_TIP_MARKER = /\s*\[NEW\]\s*$/;
const NEW_TAG_TEXT = "NEW!";
const NEW_GLOW_PERIOD_MS = 1500;
const NEW_TIP_WEIGHT = 4;

export function pickWeightedTip(tips: readonly string[], r: number): string {
	if (tips.length === 0) return "";
	const weights = tips.map(tip => NEW_TIP_MARKER.test(tip) ? NEW_TIP_WEIGHT : 1);
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	let cursor = clamp(r, 0, 0.999999) * total;
	for (let i = 0; i < tips.length; i++) {
		cursor -= weights[i] ?? 0;
		if (cursor < 0) return tips[i] ?? "";
	}
	return tips[tips.length - 1] ?? "";
}

type ColorEncoding = "ansi-16m" | "ansi-256";

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function renderNewTag(phase: number, encoding: ColorEncoding): string {
	return [...NEW_TAG_TEXT].map((char, index) => {
		const hue = ((phase * 360 + index * 42) % 360 + 360) % 360;
		if (encoding === "ansi-256") {
			const color = 45 + Math.round((hue / 360) * 42);
			return `\x1b[38;5;${color}m${char}\x1b[0m`;
		}
		const angle = (hue / 60) % 6;
		const x = Math.round(255 * (1 - Math.abs((angle % 2) - 1)));
		const channels = angle < 1 ? [255, x, 0] : angle < 2 ? [x, 255, 0] : angle < 3 ? [0, 255, x] : angle < 4 ? [0, x, 255] : angle < 5 ? [x, 0, 255] : [255, 0, x];
		return `\x1b[38;2;${channels.join(";")}m${char}\x1b[0m`;
	}).join("");
}

export function renderWelcomeTip(tip: string, boxWidth: number, phase = 0): string[] {
	const clean = tip.replace(NEW_TIP_MARKER, "");
	const tag = NEW_TIP_MARKER.test(tip) ? ` ${renderNewTag(phase, "ansi-256")}` : "";
	return wrapTextWithAnsi(`${clean}${tag}`, Math.max(1, boxWidth));
}

export interface RecentSession { id: string; title: string; updatedAt: number }
export interface LspServerInfo { name: string; status: "ready" | "connecting" | "unavailable" }

export class WelcomeComponent implements Component {
	#animStart: number | null = null;
	#animTimer: Timer | null = null;
	#requestRender: (() => void) | null = null;
	#cachedWidth = -1;
	#cachedLines: string[] | undefined;
	readonly #ocean = new AsciiOceanComponent();

	constructor(
		private version: string,
		private modelName = "",
		private providerName = "",
		private recentSessions: RecentSession[] = [],
		private lspServers: LspServerInfo[] = [],
	) {}

	playIntro(requestRender: () => void): void {
		this.#ocean.start(requestRender);
		this.#stopAnimation();
		this.#requestRender = requestRender;
		this.#animStart = performance.now();
		this.#animTimer = setInterval(requestRender, 33);
	}

	stopIntro(): void {
		this.#ocean.pause();
		this.#stopAnimation();
	}

	pauseOcean(): void {
		this.#ocean.pause();
		this.invalidate();
	}

	private #stopAnimation(): void {
		if (this.#animTimer) clearInterval(this.#animTimer);
		this.#animTimer = null;
		this.#animStart = null;
	}

	invalidate(): void {
		this.#cachedWidth = -1;
		this.#cachedLines = undefined;
		this.#requestRender?.();
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

	render(width: number): string[] {
		const innerWidth = Math.max(24, Math.min(108, width));
		if (this.#cachedWidth === innerWidth && this.#cachedLines) return this.#cachedLines;
		const oceanLines = this.#ocean.render(innerWidth, 20);
		const centeredOcean = oceanLines.map(line => this.#centerText(line, innerWidth));
		const lines = [
			"",
			...centeredOcean,
			"",
			this.#centerText(theme.bold("What’s on your mind?"), innerWidth),
			this.#centerText(theme.fg("muted", `${DISPLAY_NAME} ${this.version} · ${PRODUCT_BYLINE}`), innerWidth),
			"",
		];
		this.#cachedWidth = innerWidth;
		this.#cachedLines = lines;
		return lines;
	}

	private #centerText(text: string, width: number): string {
		const visible = visibleWidth(text);
		if (visible >= width) return truncateToWidth(text, width);
		return `${" ".repeat(Math.floor((width - visible) / 2))}${text}`;
	}
}

export const SHARK_LOGO = [
	"                            ;'",
	"                             %%'",
	"                              .t;.               .oooo",
	"                               S;:S%              %8S8.",
	"                                ;:tt%t '..        XX%%S",
	"t'                            ''XSSS8SSX%XX8#.    %XSX%",
	" :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.",
	"  ::%'       ''8XXXSSt%Stttttt%8@%%@%8@8%Sttt%%%%SSSSS%tt.",
	"  'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t",
	" .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.",
	"  %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.",
	" .%t                            ;%%%#@@##@@@.     SXS%%",
	" t.                            .%;%%%.            %%XXS",
	"                              '%t:t              .SXSS'",
	"                             '::.                ooooo",
	"                            .S'",
	"                            .",
] as const;

const PRODUCT_WORDS = DISPLAY_NAME.match(/^(oh)(my)(.+)$/i)?.slice(1) ?? [DISPLAY_NAME];
export const SHARK_WORDMARK = PRODUCT_WORDS.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("   ");
export const gradientLogo = (lines: readonly string[]): string[] => [...lines];
export const gradientEscape = (): string => "";
export interface ShineConfig { pos?: number; strength?: number }
