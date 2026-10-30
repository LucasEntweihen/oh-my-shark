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

const TIPS: readonly string[] = tipsText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
export const WELCOME_SESSION_SLOTS = 4;
export const WELCOME_LSP_SLOTS = 4;
const NEW_TIP_MARKER = /\s*\[NEW\]\s*$/;
const NEW_TAG_TEXT = "NEW!";
const NEW_TIP_WEIGHT = 4;

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
export function pickWeightedTip(tips: readonly string[], r: number): string {
	if (tips.length === 0) return "";
	const weights = tips.map(tip => NEW_TIP_MARKER.test(tip) ? NEW_TIP_WEIGHT : 1);
	let cursor = clamp(r, 0, 0.999999) * weights.reduce((sum, weight) => sum + weight, 0);
	for (let i = 0; i < tips.length; i++) { cursor -= weights[i] ?? 0; if (cursor < 0) return tips[i] ?? ""; }
	return tips[tips.length - 1] ?? "";
}

function renderNewTag(phase: number): string {
	return [...NEW_TAG_TEXT].map((char, index) => `\x1b[38;5;${45 + Math.round(((phase * 360 + index * 42) % 360) / 360 * 42)}m${char}\x1b[0m`).join("");
}
export function renderWelcomeTip(tip: string, boxWidth: number, phase = 0): string[] {
	const clean = tip.replace(NEW_TIP_MARKER, "");
	return wrapTextWithAnsi(`${clean}${NEW_TIP_MARKER.test(tip) ? ` ${renderNewTag(phase)}` : ""}`, Math.max(1, boxWidth));
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
	constructor(private version: string, private modelName = "", private providerName = "", private recentSessions: RecentSession[] = [], private lspServers: LspServerInfo[] = []) {}
	playIntro(requestRender: () => void): void { this.#ocean.start(requestRender); this.#stopAnimation(); this.#requestRender = requestRender; this.#animStart = performance.now(); this.#animTimer = setInterval(requestRender, 33); }
	stopIntro(): void { this.#ocean.pause(); this.#stopAnimation(); }
	pauseOcean(): void { this.#ocean.pause(); this.invalidate(); }
	private #stopAnimation(): void { if (this.#animTimer) clearInterval(this.#animTimer); this.#animTimer = null; this.#animStart = null; }
	setVersion(version: string): void { this.version = version; this.invalidate(); }
	setModel(modelName: string, providerName: string): void { this.modelName = modelName; this.providerName = providerName; this.invalidate(); }
	setRecentSessions(sessions: RecentSession[]): void { this.recentSessions = sessions; this.invalidate(); }
	setLspServers(servers: LspServerInfo[]): void { this.lspServers = servers; this.invalidate(); }
	isTranscriptBlockFinalized(): boolean { return this.#animTimer === null; }
	invalidate(): void { this.#cachedWidth = -1; this.#cachedLines = undefined; this.#requestRender?.(); }
	render(width: number): string[] {
		const innerWidth = Math.max(34, Math.min(112, width));
		if (this.#cachedWidth === innerWidth && this.#cachedLines) return this.#cachedLines;
		const ocean = this.#ocean.render(innerWidth, 20);
		const lines = ["", ...ocean.map(line => this.#centerText(line, innerWidth)), "", this.#centerText(theme.bold("What’s on your mind?"), innerWidth), this.#centerText(theme.fg("muted", `${DISPLAY_NAME} ${this.version} · ${PRODUCT_BYLINE}`), innerWidth), ""];
		this.#cachedWidth = innerWidth; this.#cachedLines = lines; return lines;
	}
	private #centerText(text: string, width: number): string { const visible = visibleWidth(text); if (visible >= width) return truncateToWidth(text, width); return `${" ".repeat(Math.floor((width - visible) / 2))}${text}`; }
}

export const SHARK_LOGO = [
	"⠠⠀⢀⠀⡀⠀⠀⠄⠀⢀⠀⠄⠀⢀⠀⠄⠀⢀⠀⠄⠀⢀⠀⠄⠀⢀⠀⠀⡀⢀⠀⠀⡀⢀⠀⠀⠠⠀⠀⡀⠠⠀⢀⠀⠠⠀⢀⠀⠀⠄⠀⡀⠀⡀⠀⡀⠠⠀⠀",
	"⠄⠁⠠⠀⠀⡁⠠⠐⠈⠀⠠⠀⠂⠄⠠⠀⠂⠄⠈⠀⠄⠀⢈⠀⠄⠀⢈⠀⠄⠂⠁⠀⠄⠀⠂⠀⠐⠈⠀⢠⡬⣶⢿⡗⠀⡀⠐⠀⠄⠐⠀",
	"⡀⠁⢀⠈⠀⡐⠀⠐⠀⡁⠐⠀⠂⡀⠐⠀⠂⡀⠐⢀⠀⡁⠐⠀⠂⡀⢈⠀⡀⠁⡀⠀⠂⠁⢀⠂⠀⠂⠁⠈⢰⡎⢝⡎⠐⣀⣾⡿⡹⣬⡏⠀",
	"⡀⠃⢀⠘⠀⡀⢀⠃⡀⠀⢀⠃⡀⢀⠀⠃⡀⢀⠘⠀⡀⢀⠀⠃⡀⢀⠀⠀⠀⠃⢀⠀⡘⢀⠀⠀⠄⠀⣸⣤⠀⢘⠛⢀⡼⣿⢧⣟⣛⣟⠀⠀",
	"⠄⠠⠀⠄⠠⠀⠠⠀⠌⠀⢀⠀⠂⡀⠁⠀⠂⠠⠐⠀⠄⠐⠀⠄⠂⠠⠈⢀⣶⣷⣷⠀⢀⡠⢈⣠⣞⢟⢿⣴⣶⠒⣾⢫⣖⡽⢮⡿⠁⠀",
	"⡁⠄⠐⢀⠀⡁⢀⠂⠀⠂⢈⠀⠂⠀⠨⠗⡀⠁⡀⠀⠂⡀⠌⠀⠂⢀⠀⣲⣿⣣⠿⣿⡚⣿⠫⣿⠟⣭⢏⣟⡶⣙⣟⣎⡹⣎⡾⣳⡇⠀",
	"⠄⡀⠠⠀⠄⠠⠀⢀⠂⣁⣀⠀⠄⠁⠠⢀⢠⡎⡹⡃⢀⠀⠠⢐⣬⣴⣾⢟⣜⢮⡭⣟⡭⢾⣖⢯⣋⡞⣯⢯⣕⢧⢟⢫⣽⣹⡜⡿⢷⣆⠀",
	"⡀⠄⠐⠈⠀⠂⠁⡀⠠⠇⠟⠀⣠⣈⠀⠄⠀⡁⠋⣁⣀⣴⣞⡯⣹⣾⢷⡺⠎⡷⣏⡿⣌⠿⡼⢟⣞⢯⢗⣷⠚⡯⣫⡖⠉⠉⠛⠿⢭⣽⣿⣢⠀",
	"⠄⡀⠠⠁⠠⠁⣠⠠⢔⣀⠠⠱⣿⡽⣻⢶⣲⣴⣴⡿⢫⣏⡯⡲⢿⡻⣞⣯⢷⢹⣇⡳⡮⢟⣹⡺⡼⣉⣞⡮⣫⡾⠴⠋⠀",
	"⠀⡀⠰⠀⠆⢰⣏⠀⠸⠹⡆⠀⢿⣾⢸⣷⡿⣷⢷⣾⢿⢶⡶⢿⣹⣰⢷⡾⢏⢷⢿⣱⣷⡶⠷⠹⣱⢏⡾⣰⠇⠀⠀⠀",
	"⡁⠀⢀⠂⠀⠂⠣⣬⡑⠞⠀⢄⣨⡿⢯⣫⠷⣟⢎⡳⣎⢧⣛⢶⡳⣯⡞⡵⢪⢯⢒⡯⣖⡽⢏⣿⢱⢟⡼⠉⠀⠀",
	"⠄⡀⠠⠁⠠⠁⣠⠠⢔⣀⠠⠱⣿⡽⣻⢶⣲⣴⣴⡿⢫⣏⡯⡲⢿⡻⣞⣯⢷⢹⣇⡳⡮⢟⣹⡺⡼⣉⣞⡮⣫⡾⠴⠋⠀",
	"⡁⠀⢀⠂⠀⠂⡀⢹⣄⠻⢯⣶⢩⢏⣛⢟⡳⡞⣽⠽⡾⡵⢾⣵⣏⡳⣽⣿⣿⠓⠉⣰⠏⠁⠀⣀⣀⠄⠰⣭⡷⠀",
	"⡄⠁⢠⠀⡌⠀⢠⠀⠘⢣⣤⡄⠈⠉⠉⠚⠓⠛⣬⣿⣴⢻⡜⣶⣭⡟⠀⠀⢩⣴⠛⠀⠀⠈⣴⠁⠘⢳⠀⠀",
	"⠀⠄⠠⠀⠀⠌⠀⠠⠀⠀⠈⠉⠍⠒⠒⠲⠶⠶⠤⠴⠤⠤⠭⠭⠥⠤⠴⠞⠋⠁⠀⡀⠌⠀⠧⢼⡔⠟⠀",
] as const;
export const SHARK_WORDMARK = DISPLAY_NAME;
export const gradientLogo = (lines: readonly string[]): string[] => [...lines];
export const gradientEscape = (): string => "";
export interface ShineConfig { pos?: number; strength?: number }
