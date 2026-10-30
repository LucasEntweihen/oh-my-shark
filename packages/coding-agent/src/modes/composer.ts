import { Component, Container, Spacer, type TerminalFrameProvider, TUI, visibleWidth } from "@oh-my-pi/pi-tui";
import { CustomEditor } from "./components/custom-editor";
import { type AnimationFrame, TranscriptContainer } from "./components/transcript-container";
import { type LspServerInfo, type RecentSession, WelcomeComponent } from "./components/welcome";
import { getEditorTheme, initThemeSync, theme } from "./theme/theme";

export interface ComposerStartOptions { clearScrollback?: boolean; deferInput?: boolean; playWelcomeIntro?: boolean }
export interface ComposerPreferences { quiet: boolean; showHardwareCursor: boolean; maxInlineImages: number; resizeScrollback: boolean; imeSafeCursor: boolean; autocompleteMaxVisible: number; spellingTypoDetection: boolean; spellingAutocomplete: boolean; spellingAutocorrect: boolean; composerShape: string }
export interface ComposerWelcomeUpdate { version?: string; modelName?: string; providerName?: string; recentSessions?: RecentSession[]; lspServers?: LspServerInfo[] }

export class Composer implements TerminalFrameProvider {
	#welcome: WelcomeComponent | undefined;
	#started = false;
	#stopped = false;
	#header = new Container();
	#statusHost = new Container();
	#bootstrapInputGap = new Spacer(1);
	#runtimeChildren: readonly Component[] = [];
	#runtimeMounted = false;
	#headerRetired = false;
	#retiredHeaderRows: string[] | undefined;
	#requestRender = (): void => this.ui.requestRender();
	constructor(readonly ui: TUI, readonly editor: CustomEditor, private #version = "", private #modelName = "", private #providerName = "", private #recentSessions: RecentSession[] = [], private #lspServers: LspServerInfo[] = [], private #preferences: ComposerPreferences = { quiet: false, showHardwareCursor: false, maxInlineImages: 0, resizeScrollback: true, imeSafeCursor: false, autocompleteMaxVisible: 8, spellingTypoDetection: false, spellingAutocomplete: false, spellingAutocorrect: false, composerShape: "default" }) {}
	get welcome(): WelcomeComponent | undefined { return this.#welcome; }
	get started(): boolean { return this.#started && !this.#stopped; }
	start(options: ComposerStartOptions = {}): void { if (this.#started || this.#stopped) return; this.#started = true; this.ui.start({ clearScrollback: options.clearScrollback === true, deferInput: options.deferInput === true }); this.playWelcomeIntro(); }
	enableInput(): void { if (!this.#stopped) this.ui.enableInput(); }
	setPreferences(update: Partial<ComposerPreferences>): void { if (this.#stopped) return; this.#preferences = { ...this.#preferences, ...update }; if (this.#preferences.quiet) { this.#welcome?.stopIntro(); this.#welcome = undefined; } else { this.#ensureWelcome(); this.#welcome?.invalidate(); } this.#rebuildHeader(); this.ui.requestRender(); }
	updateWelcome(update: ComposerWelcomeUpdate): void { if (this.#stopped) return; if (update.version !== undefined) this.#version = update.version; if (update.modelName !== undefined) this.#modelName = update.modelName; if (update.providerName !== undefined) this.#providerName = update.providerName; if (update.recentSessions !== undefined) this.#recentSessions = update.recentSessions; if (update.lspServers !== undefined) this.#lspServers = update.lspServers; this.#ensureWelcome(); this.#welcome?.setVersion(this.#version); this.#welcome?.setModel(this.#modelName, this.#providerName); this.#welcome?.setRecentSessions(this.#recentSessions); this.#welcome?.setLspServers(this.#lspServers); this.ui.requestRender(); }
	setHeaderExtras(before: readonly Component[], after: readonly Component[]): void { this.#header.clear(); for (const child of before) this.#header.addChild(child); if (this.#welcome) this.#header.addChild(this.#welcome); for (const child of after) this.#header.addChild(child); }
	setRuntimeChildren(children: readonly Component[]): void { if (this.#stopped) return; this.#runtimeChildren = children; this.#runtimeMounted = true; this.ui.requestRender(); }
	playWelcomeIntro(): void { this.#ensureWelcome(); this.#welcome?.stopIntro(); this.#welcome?.invalidate(); }
	transfer(): void { if (!this.started) throw new Error("Composer is not available for transfer"); }
	stop(): void { this.#stopped = true; this.#welcome?.stopIntro(); this.ui.stop(); }
	render(width: number): readonly string[] { const header = this.#headerRetired ? (this.#retiredHeaderRows ?? []) : this.#header.render(width); return [...header, ...this.#runtimeChildren.flatMap(child => child.render(width))]; }
	#ensureWelcome(): void { if (this.#preferences.quiet) return; if (!this.#welcome) this.#welcome = new WelcomeComponent(this.#version, this.#modelName, this.#providerName, this.#recentSessions, this.#lspServers); }
	#rebuildHeader(): void { this.#ensureWelcome(); this.#header.clear(); if (this.#welcome) this.#header.addChild(this.#welcome); }
}
