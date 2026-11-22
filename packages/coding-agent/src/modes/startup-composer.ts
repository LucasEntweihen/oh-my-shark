import type { Terminal } from "@oh-my-pi/pi-tui";
import type { Composer, ComposerPreferences, ComposerWelcomeUpdate } from "@oh-my-pi/pi-tui/prompt/composer";
import type * as ComposerRuntime from "@oh-my-pi/pi-tui/prompt/composer";
import {
	type ComposerCache,
	type ComposerThemePreferences,
	sharedComposerCache,
} from "@oh-my-pi/pi-tui/prompt/composer-cache";
import { setMagicKeywords } from "@oh-my-pi/pi-tui/prompt/magic-keywords";
import type { LspServerInfo, RecentSession } from "@oh-my-pi/pi-tui/prompt/welcome";
import { initThemeSync } from "@oh-my-pi/pi-tui/theme";
import { logger } from "@oh-my-pi/pi-utils";
import { registerWelcomeCockpitRenderer } from "../tui/deep-sea-command";
import { MAGIC_KEYWORDS } from "./magic-keywords";

/** Inputs available at the CLI prepaint boundary before command modules load. */
export interface PrepaintComposerOptions {
	readonly terminal?: Terminal;
	readonly exit?: (code: number) => void;
	readonly now?: () => number;
	readonly version?: string;
	readonly cwd?: string;
	readonly preferences?: Partial<ComposerPreferences>;
	readonly theme?: ComposerThemePreferences;
	readonly recentSessions?: () => Promise<RecentSession[]>;
	readonly cache?: boolean;
}

/** Final settings pushed into the live composer after Settings and the theme resolve. */
export interface PrepaintComposerPreferences extends ComposerPreferences {
	readonly theme: ComposerThemePreferences;
}

interface PendingComposer {
	readonly composer: Composer;
	readonly cwd: string;
	/** Speculation store to refresh; `undefined` when caching is off or unavailable. */
	readonly cache: ComposerCache | undefined;
	recentSessions?: Promise<RecentSession[] | undefined>;
}

let pendingComposer: PendingComposer | undefined;

/** Ownership token that transfers one already-started Composer to InteractiveMode. */
export class ComposerLease {
	readonly composer: Composer;
	readonly recentSessions?: Promise<RecentSession[] | undefined>;
	#adopted = false;

	constructor(composer: Composer, recentSessions?: Promise<RecentSession[] | undefined>) {
		this.composer = composer;
		this.recentSessions = recentSessions;
	}

	/** Transfer terminal ownership exactly once. */
	adopt(): void {
		if (this.#adopted) return;
		// Safety net: startup paths that never applied resolved settings must
		// still hand InteractiveMode a raw-input terminal.
		this.composer.enableInput();
		this.composer.transfer();
		this.#adopted = true;
	}

	/** Stop an unadopted composer when startup exits before InteractiveMode. */
	dispose(): void {
		if (!this.#adopted) this.composer.stop();
	}
}

/** Start the canonical Composer with speculative cached state. */
export function beginStartupComposer(options: PrepaintComposerOptions = {}): void {
	if (pendingComposer) throw new Error("A prepaint composer is already active");
	registerWelcomeCockpitRenderer();
	// Headless launches share the lease helpers, but never need the editor graph.
	const { Composer, COMPOSER_DEFAULTS }: typeof ComposerRuntime = require("@oh-my-pi/pi-tui/prompt/composer.js");
	const cwd = options.cwd ?? process.cwd();
	const cache = options.cache === false ? undefined : sharedComposerCache();
	const cached = cache ? cache.read(cwd) : { preferences: undefined, theme: undefined, status: undefined };
	const theme = { ...cached.theme, ...options.theme };
	initThemeSync(theme.symbolPreset, theme.colorBlindMode, theme.darkTheme, theme.lightTheme);
	setMagicKeywords(MAGIC_KEYWORDS);
	const preferences: ComposerPreferences = {
		...COMPOSER_DEFAULTS,
		...cached.preferences,
		...options.preferences,
		tuiLayout:
			options.preferences?.tuiLayout ?? cached.preferences?.tuiLayout ?? COMPOSER_DEFAULTS.tuiLayout ?? "cockpit",
	};
	const welcome: ComposerWelcomeUpdate = {
		version: options.version ?? "",
		layoutMode: preferences.tuiLayout,
	};
	const composer = new Composer({
		terminal: options.terminal,
		exit: options.exit,
		now: options.now,
		preferences,
		welcome,
		status: cached.status,
	});
	try {
		composer.start({ clearScrollback: true, deferInput: true });
	} catch (error) {
		try {
			composer.stop();
		} catch {}
		throw error;
	}
	const pending: PendingComposer = { composer, cwd, cache };
	pendingComposer = pending;
	if (options.recentSessions) {
		pending.recentSessions = options
			.recentSessions()
			.then(sessions => {
				if (pendingComposer === pending) {
					pending.composer.updateWelcome({ recentSessions: sessions });
				}
				return sessions;
			})
			.catch(error => {
				logger.debug("composer recent sessions load failed", { error });
				return undefined;
			});
	}
}

/** Push discovered project LSP servers into the prepaint Composer welcome banner. */
export function setStartupComposerLspServers(servers: readonly LspServerInfo[]): void {
	pendingComposer?.composer.updateWelcome({ lspServers: servers });
}

/** Take the live prepaint composer away from the module-level startup owner. */
export function takeStartupComposerLease(): ComposerLease | undefined {
	const pending = pendingComposer;
	pendingComposer = undefined;
	return pending ? new ComposerLease(pending.composer, pending.recentSessions) : undefined;
}

/** Stop and forget any prepaint composer that never reached InteractiveMode. */
export function stopPendingStartupComposer(): void {
	pendingComposer?.composer.stop();
	pendingComposer = undefined;
}

/** Apply final settings to the pending Composer and cache them for the next first frame. */
export function applyStartupComposerPreferences(update: PrepaintComposerPreferences): void {
	const pending = pendingComposer;
	if (!pending) return;
	const preferences: ComposerPreferences = {
		quiet: update.quiet,
		composerShape: update.composerShape,
		showHardwareCursor: update.showHardwareCursor,
		maxInlineImages: update.maxInlineImages,
		resizeScrollback: update.resizeScrollback,
		completeScrollback: update.completeScrollback,
		imeSafeCursor: update.imeSafeCursor,
		autocompleteMaxVisible: update.autocompleteMaxVisible,
		spellingTypoDetection: update.spellingTypoDetection,
		spellingAutocomplete: update.spellingAutocomplete,
		spellingAutocorrect: update.spellingAutocorrect,
		tuiLayout: update.tuiLayout ?? "cockpit",
	};
	pending.composer.setPreferences(preferences);
	// Settings resolved means the module graph is loaded and the event loop is
	// responsive again: take raw-input ownership now. The kernel echoed (and
	// buffered) everything typed during the load; the editor replays it here.
	pending.composer.enableInput();
	pending.cache?.writeUi(pending.cwd, preferences, update.theme);
}
