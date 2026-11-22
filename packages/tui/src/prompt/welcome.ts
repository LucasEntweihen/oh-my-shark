import { APP_NAME, DISPLAY_NAME, PRODUCT_BYLINE } from "@oh-my-pi/pi-utils/dirs";
import type { TspSpan } from "@oh-my-pi/pi-wire";
import { formatDoubleTap, formatKeyHint, formatKeyHints, type KeyName } from "../app-keybindings";
import { editorKey } from "../chrome/keybinding-hints";
import { renderProgressBar } from "../components/progress-bar";
import { getKeybindings, type Keybinding } from "../keybindings";
import { card, col, keyed, node, row, span, text } from "../native/describe";
import type { DescribeContext, NativeChild, NativeNode } from "../native/node";
import { compactText, plainText } from "../native/spans";
import { isNativeRendering } from "../native/state";
import { isHyperlinkEnabled, urlHyperlink, urlLinkSpan } from "../render/hyperlink";
import { TERMINAL } from "../terminal-capabilities";
import { theme } from "../theme/theme";
import type { Component } from "../tui";
import { padding, replaceTabs, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "../utils";
import tipsText from "./tips.txt" with { type: "text" };

/** ASCII shark from stackedlol/ascii-sharks, shared by the welcome, setup, and cockpit surfaces. */
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

/** Compatibility alias for setup and TUI surfaces importing `PI_LOGO`. */
export const PI_LOGO = SHARK_LOGO;

const PRODUCT_WORDS = DISPLAY_NAME.match(/^(oh)(my)(.+)$/i)?.slice(1) ?? [DISPLAY_NAME];
export const SHARK_WORDMARK = PRODUCT_WORDS.map(word => {
	const titleCase = word.charAt(0).toUpperCase() + word.slice(1);
	return [...titleCase].join(" ");
}).join("   ");

export const SHARK_WIDTH = Math.max(...SHARK_LOGO.map(line => visibleWidth(line)));

/** Multi-stop ocean-blue palette for the diagonal gradient. */
export const GRADIENT_STOPS: ReadonlyArray<readonly [number, number, number]> = [
	[11, 98, 196],
	[57, 167, 255],
	[143, 230, 255],
];

/** 256-color blue ramp fallback when truecolor isn't available. */
export const GRADIENT_RAMP_256 = [25, 27, 33, 39, 45, 51, 87, 123];

/** Half-width of the shine highlight band, expressed in gradient-t units. */
export const SHINE_HALF_WIDTH = 0.18;

export interface ShineConfig {
	/** Overall opacity of the shine overlay, in [0, 1]. */
	strength: number;
	/** Center of the shine band along the diagonal, in [0, 1]. */
	pos: number;
}

/**
 * Resolve the gradient SGR foreground escape for a normalized position `t`
 * (0..1) along the diagonal, compositing the optional sliding shine highlight.
 */
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

/** Apply the multi-stop diagonal ocean gradient across multi-line art. */
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

/** Total length of the intro animation. */
export const INTRO_MS = 3000;
/** Render cadence during the intro (~30fps). */
export const INTRO_TICK_MS = 33;
/** Number of full gradient rotations the sweep performs before settling. */
export const INTRO_SWEEPS = 2.5;
/** Number of times the shine highlight crosses the diagonal across the intro. */
export const INTRO_SHINE_TRAVERSALS = 3;

export function introLogoFrame(progress: number): string[] {
	const eased = 1 - (1 - progress) ** 3;
	const phase = ((((1 - eased) * INTRO_SWEEPS) % 1) + 1) % 1;
	const shinePos = (((progress * INTRO_SHINE_TRAVERSALS) % 1) + 1) % 1;
	const shineStrength = (1 - eased) ** 1.5;
	return gradientLogo(SHARK_LOGO, phase, { strength: shineStrength, pos: shinePos });
}

export const REST_FRAME = gradientLogo(SHARK_LOGO, 0);

/** Supported OMSK welcome layout modes. */
export type WelcomeLayoutMode = "cockpit" | "default" | "compact" | "classic";

/** Recent session entry shown in the OMSK welcome and cockpit surfaces. */
export interface RecentSession {
	name: string;
	timeAgo: string;
}

/** LSP server status item shown in the OMSK welcome and cockpit surfaces. */
export interface LspServerInfo {
	name: string;
	status: "ready" | "error" | "connecting" | "available";
	fileTypes: string[];
}

/** Fixed number of session rows in the classic welcome box so its height stays stable. */
export const WELCOME_SESSION_SLOTS = 4;

/** Fixed number of LSP-server rows, for the same reason. */
export const WELCOME_LSP_SLOTS = 4;

/** Inputs forwarded by {@link WelcomeComponent} into the registered Deep Sea Cockpit renderer. */
export interface WelcomeCockpitRenderInput {
	readonly version: string;
	readonly modelName: string;
	readonly providerName: string;
	readonly recentSessions: readonly RecentSession[];
	readonly lspServers: readonly LspServerInfo[];
	readonly layoutMode: "cockpit" | "compact";
	readonly termWidth: number;
	readonly termHeight?: number;
}

/** Callback installed by `@oh-my-pi/pi-coding-agent` to render the Deep Sea Cockpit dashboard. */
export type WelcomeCockpitRenderer = (input: WelcomeCockpitRenderInput) => readonly string[];

let welcomeCockpitRenderer: WelcomeCockpitRenderer | undefined;

/** Register (or clear with `undefined`) the OMSK Deep Sea Cockpit renderer used by {@link WelcomeComponent}. */
export function setWelcomeCockpitRenderer(renderer: WelcomeCockpitRenderer | undefined): void {
	welcomeCockpitRenderer = renderer;
}

/** Leading marker for a tip that pitches Tern: dropped on live TSP surfaces. */
const NO_TERN_TIP_MARKER = /^\[NO-TERN\]\s*/;

/** tips.txt lines embedded at build time; blanks dropped. */
const TIP_LINES: readonly string[] = tipsText
	.split("\n")
	.map(line => line.trim())
	.filter(line => line.length > 0);

/** Tips for the classic renderer: every tip, {@link NO_TERN_TIP_MARKER} stripped. */
const TIPS: readonly string[] = TIP_LINES.map(line => line.replace(NO_TERN_TIP_MARKER, ""));

/** Tips for a live TSP surface: those marked {@link NO_TERN_TIP_MARKER} dropped. */
const TSP_TIPS: readonly string[] = TIP_LINES.filter(line => !NO_TERN_TIP_MARKER.test(line));

/** Trailing marker that flags a tip as a "what's new" callout. */
const NEW_TIP_MARKER = /\s*\[NEW\]\s*$/;

/** Visible text rendered in place of {@link NEW_TIP_MARKER}. */
const NEW_TAG_TEXT = "NEW!";

/** Milliseconds for one full hue rotation of the rainbow "NEW!" tag. */
const NEW_GLOW_PERIOD_MS = 1500;

/** Selection weight for "[NEW]" tips. */
const NEW_TIP_WEIGHT = 4;

/** Pick a tip from `tips`, biased toward "[NEW]" tips by {@link NEW_TIP_WEIGHT}. */
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

const TIP_KEY_PLACEHOLDER = /\{(key|keys|tap|action):([^}]+)\}/g;

const MODIFIER_NAMES: Record<string, true | undefined> = {
	ctrl: true,
	shift: true,
	alt: true,
	super: true,
};

function isKeyName(key: string): key is KeyName {
	const parts = key.split("+");
	return parts.every((part, i) => part.length > 0 && (i === parts.length - 1 || MODIFIER_NAMES[part] === true));
}

function isKeybinding(action: string): action is Keybinding {
	return action in getKeybindings().getResolvedBindings();
}

function expandTipKeys(tip: string): string {
	return tip.replace(TIP_KEY_PLACEHOLDER, (placeholder, kind: string, value: string) => {
		if (kind === "action") return isKeybinding(value) ? editorKey(value) : placeholder;
		const keys = value.split(",");
		if (!keys.every(isKeyName)) return placeholder;
		if (kind === "keys") return formatKeyHints(keys);
		const [key] = keys;
		if (key === undefined) return placeholder;
		return kind === "tap" ? formatDoubleTap(key) : formatKeyHint(key);
	});
}

const TIP_LINK = /\[([^\]]+)\]\(([^\s)]+)\)/g;

function linkTipText(tip: string): string {
	const linkable = isHyperlinkEnabled();
	return tip.replace(TIP_LINK, (_link, label: string, url: string) =>
		linkable ? urlHyperlink(url, theme.underline(label)) : `${label} (${url})`,
	);
}

function tipSpans(tip: string): TspSpan[] {
	const spans: TspSpan[] = [];
	let cursor = 0;
	for (const match of tip.matchAll(TIP_LINK)) {
		const [link, label, url] = match;
		if (match.index > cursor) spans.push(span(plainText(tip.slice(cursor, match.index))));
		spans.push(urlLinkSpan(url, label));
		cursor = match.index + link.length;
	}
	if (cursor < tip.length) spans.push(span(plainText(tip.slice(cursor))));
	return spans;
}

/** Render a welcome tip as wrapped lines of at most `width` columns. */
export function renderWelcomeTip(tip: string, width: number, phase = 0): string[] {
	const label = "Tip: ";
	if (width - visibleWidth(label) < 8) return [];

	const isNew = NEW_TIP_MARKER.test(tip);
	const body = linkTipText(expandTipKeys(isNew ? tip.replace(NEW_TIP_MARKER, "") : tip));

	const wrapped = wrapTextWithAnsi(replaceTabs(`${label}${body}`), width).map(line => line.trimEnd());
	if (wrapped.length === 0) return [];

	const styledLabel = theme.fg("customMessageLabel", label);
	const lines = wrapped.map((line, index) =>
		theme.italic(
			index === 0 && line.startsWith(label)
				? `${styledLabel}${theme.fg("muted", line.slice(label.length))}`
				: theme.fg("muted", line),
		),
	);

	if (isNew) {
		const encoding: ColorEncoding = TERMINAL.trueColor ? "ansi-16m" : "ansi-256";
		const tag = renderNewTag(phase, encoding);
		const tagWidth = 1 + visibleWidth(NEW_TAG_TEXT);
		const lastLine = lines[lines.length - 1];
		if (lastLine !== undefined && visibleWidth(lastLine) + tagWidth <= width) {
			lines[lines.length - 1] = `${lastLine} ${tag}`;
		} else {
			lines.push(tag);
		}
	}

	return lines;
}

/**
 * Background self-update activity shown after the welcome banner's version label.
 */
export type VersionUpdate =
	| { phase: "updating"; version: string; fraction?: number }
	| { phase: "ready"; version: string }
	| { phase: "failed"; version: string };

const UPDATE_BAR_WIDTH = 10;
const TIP_MIN_COLUMNS = 50;

function updatePercent(fraction: number): string {
	return `${Math.floor(Math.min(1, Math.max(0, fraction)) * 100)}%`;
}

function updateTone(update: VersionUpdate): "accent" | "success" | "warning" {
	return update.phase === "ready" ? "success" : update.phase === "failed" ? "warning" : "accent";
}

function versionUpdateLabels(update: VersionUpdate): string[] {
	const head = theme.fg(updateTone(update), `→ v${update.version}`);
	let detail: string;
	let compact = head;
	if (update.phase === "updating") {
		if (update.fraction === undefined) {
			detail = theme.fg("muted", "updating…");
		} else {
			const percent = theme.fg("accent", updatePercent(update.fraction));
			const bar = renderProgressBar(update.fraction, UPDATE_BAR_WIDTH, {
				style: {
					filled: theme.progress.filled,
					empty: theme.progress.empty,
					styleFilled: cells => theme.fg("accent", cells),
					styleEmpty: cells => theme.fg("dim", cells),
				},
			});
			detail = `${bar} ${percent}`;
			compact = `${head} ${percent}`;
		}
	} else if (update.phase === "ready") {
		detail = theme.fg("success", `${theme.status.success} next launch`);
	} else {
		detail = theme.fg("warning", `${theme.status.warning} update failed`);
	}
	return [`${head} ${detail}`, compact];
}

function versionUpdateSpans(update: VersionUpdate): TspSpan[] {
	const tone = updateTone(update);
	const head = span(` → v${update.version}`, `${tone} mono`);
	if (update.phase === "ready") return [head, span(" next launch", tone)];
	if (update.phase === "failed") return [head, span(" update failed", tone)];
	if (update.fraction === undefined) return [head, span(" updating…", "muted")];
	return [head, span(` ${updatePercent(update.fraction)}`, `${tone} mono`)];
}

/**
 * The OMSK session welcome surface: Deep Sea Cockpit dashboard (`layoutMode: "cockpit"` / `"compact"`)
 * with responsive ASCII shark sidebar, or the classic OMSK framed Shark box (`"default"` / `"classic"`).
 */
export class WelcomeComponent implements Component {
	#versionUpdate: VersionUpdate | null = null;
	#animStart: number | null = null;
	#animTimer: Timer | null = null;
	#requestRender: (() => void) | null = null;
	#tipRoll: number | undefined;
	#cachedWidth = -1;
	#cachedLines: string[] | undefined;
	#native: { tip: string | undefined; node: NativeNode } | undefined;

	constructor(
		private version: string,
		private modelName = "Unknown",
		private providerName = "Unknown",
		private recentSessions: readonly RecentSession[] = [],
		private lspServers: readonly LspServerInfo[] = [],
		private layoutMode: WelcomeLayoutMode = "cockpit",
	) {}

	setLayoutMode(mode: WelcomeLayoutMode): void {
		if (this.layoutMode !== mode) {
			this.layoutMode = mode;
			this.invalidate();
		}
	}

	getLayoutMode(): WelcomeLayoutMode {
		return this.layoutMode;
	}

	get tip(): string | undefined {
		this.#tipRoll ??= Math.random();
		return pickWeightedTip(isNativeRendering() ? TSP_TIPS : TIPS, this.#tipRoll) || undefined;
	}

	invalidate(): void {
		this.#cachedWidth = -1;
		this.#cachedLines = undefined;
		this.#native = undefined;
	}

	describe(_cx: DescribeContext): NativeNode {
		const tip = this.tip;
		if (this.#native && this.#native.tip === tip) return this.#native.node;
		const body: NativeChild[] = [lockupNode(this.version, this.#versionUpdate)];
		if (tip) {
			const isNew = NEW_TIP_MARKER.test(tip);
			const tipText = compactText(tipSpans(expandTipKeys(isNew ? tip.replace(NEW_TIP_MARKER, "") : tip)));
			const tipRow: NativeChild[] = [
				node("icon", { name: "lightbulb", role: "omp.welcome.tip-icon" }),
				text(tipText, { wrap: "word", role: "omp.welcome.tip-text" }),
			];
			if (isNew) tipRow.push(node("shimmer", { text: "New", role: "omp.welcome.new" }));
			body.push(node("row", { gap: "sm", align: "start", role: "omp.welcome.tip" }, tipRow, "tip"));
		}
		const described = card({ role: "omp.welcome" }, body);
		this.#native = { tip, node: described };
		return described;
	}

	/** The intro keeps the welcome block mutable; settling lets it retire to history. */
	isTranscriptBlockFinalized(): boolean {
		return this.#animTimer == null;
	}

	/** Play the one-shot shark gradient sweep before settling on the resting frame. */
	playIntro(requestRender: () => void): void {
		this.#stopAnimation();
		if (
			isNativeRendering() ||
			((this.layoutMode === "cockpit" || this.layoutMode === "compact") && welcomeCockpitRenderer)
		) {
			requestRender();
			return;
		}
		this.#requestRender = requestRender;
		this.#animStart = performance.now();
		this.#requestRender();
		this.#animTimer = setInterval(() => {
			const elapsed = performance.now() - (this.#animStart ?? 0);
			const render = this.#requestRender;
			if (elapsed >= INTRO_MS) {
				this.#stopAnimation();
			}
			render?.();
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

	setRecentSessions(sessions: readonly RecentSession[]): void {
		this.recentSessions = sessions;
		this.invalidate();
	}

	setLspServers(servers: readonly LspServerInfo[]): void {
		this.lspServers = servers;
		this.invalidate();
	}

	setVersionUpdate(update: VersionUpdate | null): void {
		this.#versionUpdate = update;
		this.invalidate();
	}

	render(termWidth: number): readonly string[] {
		if ((this.layoutMode === "cockpit" || this.layoutMode === "compact") && welcomeCockpitRenderer) {
			try {
				const termHeight = typeof process !== "undefined" && process.stdout?.rows ? process.stdout.rows : undefined;
				const rendered = [
					...welcomeCockpitRenderer({
						version: this.version,
						modelName: this.modelName,
						providerName: this.providerName,
						recentSessions: this.recentSessions,
						lspServers: this.lspServers,
						layoutMode: this.layoutMode,
						termWidth,
						termHeight,
					}),
				];
				if (this.#versionUpdate) {
					const room = Math.max(0, termWidth - 2);
					const label = versionUpdateLabels(this.#versionUpdate).find(form => visibleWidth(form) <= room);
					if (label) rendered.push(` ${label}`);
				}
				return rendered;
			} catch {
				// Fallback to the framed Shark banner when cockpit rendering is unavailable.
			}
		}

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

		const includeCockpitTelemetry = this.layoutMode !== "classic";
		const panelLines = [
			...(includeCockpitTelemetry
				? [
						` ${theme.bold(theme.fg("accent", "Deep Sea Cockpit"))}`,
						` ${theme.fg("success", "✔")} ${theme.fg("muted", "Transactional Engine & Checkpoints")}`,
						` ${theme.fg("success", "✔")} ${theme.fg("muted", "Mente em Teia SQLite Knowledge")}`,
						` ${theme.fg("success", "✔")} ${theme.fg("muted", "Deterministic Tool Router")}`,
						separator,
					]
				: []),
			` ${theme.bold(theme.fg("accent", "Tips"))}`,
			` ${theme.fg("dim", "#")}${theme.fg("muted", " for prompt actions")}`,
			` ${theme.fg("dim", "/")}${theme.fg("muted", " for commands")}`,
			` ${theme.fg("dim", "!")}${theme.fg("muted", " to run bash")}`,
			` ${theme.fg("dim", "$")}${theme.fg("muted", " to run python")}`,
			...(includeCockpitTelemetry
				? [
						separator,
						` ${theme.bold(theme.fg("accent", "LSP Servers"))}`,
						...lspLines,
						separator,
						` ${theme.bold(theme.fg("accent", "Recent sessions"))}`,
						...sessionLines,
					]
				: [separator, ` ${theme.bold(theme.fg("accent", "Recent sessions"))}`, ...sessionLines]),
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

		if (this.#versionUpdate) {
			const room = Math.max(0, termWidth - 2);
			const label = versionUpdateLabels(this.#versionUpdate).find(form => visibleWidth(form) <= room);
			if (label) lines.push(` ${label}`);
		}

		if (termWidth >= TIP_MIN_COLUMNS) {
			lines.push(...this.#renderTip(boxWidth));
		}

		return lines.map(line => truncateToWidth(line, Math.max(0, termWidth)));
	}

	#renderTip(boxWidth: number): string[] {
		const tip = this.tip;
		if (!tip) return [];
		const phase = NEW_TIP_MARKER.test(tip) ? performance.now() / NEW_GLOW_PERIOD_MS : 0;
		return renderWelcomeTip(tip, Math.max(12, boxWidth - 2), phase).map(line => ` ${line}`);
	}

	#centerText(value: string, width: number): string {
		const visLen = visibleWidth(value);
		if (visLen >= width) {
			return truncateToWidth(value, width);
		}
		const leftPad = Math.floor((width - visLen) / 2);
		const rightPad = width - visLen - leftPad;
		return padding(leftPad) + value + padding(rightPad);
	}

	#fitToWidth(value: string, width: number): string {
		const visLen = visibleWidth(value);
		if (visLen >= width) {
			return truncateToWidth(value, width);
		}
		return value + padding(width - visLen);
	}

	#currentLogoFrame(): readonly string[] {
		if (this.#animStart == null) return REST_FRAME;
		const elapsed = performance.now() - this.#animStart;
		if (elapsed >= INTRO_MS) return REST_FRAME;
		return introLogoFrame(elapsed / INTRO_MS);
	}
}

/**
 * OMSK native lockup (`omp.welcome.lockup`, keyed `lockup`) for TSP surfaces.
 */
export function lockupNode(version: string, update: VersionUpdate | null = null): NativeNode {
	const art = (spans: readonly TspSpan[], role: string): NativeNode =>
		keyed(text(spans, { wrap: "none", role }), role);
	return keyed(
		row(
			[
				node("image", { builtin: "omp", alt: APP_NAME, w: 128, role: "omp.welcome.logo" }, undefined, "logo"),
				keyed(
					col(
						[
							art([span(DISPLAY_NAME, "strong")], "omp.welcome.wordmark"),
							art(
								[span(`v${version}`, "dim mono"), ...(update ? versionUpdateSpans(update) : [])],
								"omp.welcome.version",
							),
						],
						{ role: "omp.welcome.mark" },
					),
					"mark",
				),
			],
			{ align: "center", gap: "md", role: "omp.welcome.lockup" },
		),
		"lockup",
	);
}
