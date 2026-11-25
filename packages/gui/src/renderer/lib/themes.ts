/**
 * Named theme registry for the omp GUI.
 *
 * Every theme defines the exact same set of `--omsk-*` design tokens (see
 * THEME_TOKEN_KEYS — the canonical 119 keys shared with theme-dark.css and
 * theme-light.css). `dark` and `light` match those stylesheets; transcript
 * and ANSI aliases in global.css follow these tokens in every palette.
 * applyThemeByName() writes the full
 * token map as inline custom properties on <html> (beating the `:root`
 * stylesheet rules), keeps `data-theme` / the color-scheme meta in sync via
 * lib/theme's applyTheme(), and persists the selection under the
 * `themeName` pref (plus the legacy `theme` pref for backwards compat).
 * "system" is a special selection that resolves to dark or light via the OS
 * media query and stays stylesheet-driven.
 *
 * On top of the named themes sits the agent theme overlay (bottom of this
 * file): the coding-agent's `theme.dark` / `theme.light` settings name TUI
 * themes whose resolved colors are translated onto a subset of the same
 * tokens (see TRANSCRIPT_OVERLAY_VARS) and layered inline over the active GUI
 * theme, re-synced on config_update frames and data-theme flips.
 */

import type { RpcThemeColorsResult } from "../../shared/rpc-types";
import { applyManualColorOverrides, readColorOverrides } from "./color-overrides";
import { saveGuiPreference } from "./display-preferences";
import { acceptsActiveTabEvents, onActiveTabRouteSettled, onActiveTabRouteState } from "./tab-routing";
import {
	applyTheme,
	markCustomThemeTokens,
	readPrepaintThemeMode,
	resolveTheme,
	THEME_BACKGROUND_STORAGE_KEY,
	THEME_SCHEME_STORAGE_KEY,
} from "./theme";

/** Canonical token keys, in stylesheet order. Every theme defines all of them. */
export const THEME_TOKEN_KEYS = [
	"--omsk-accent",
	"--omsk-accent-bright",
	"--omsk-accent-dim",
	"--omsk-accent-glow",
	"--omsk-border",
	"--omsk-border-accent",
	"--omsk-border-muted",
	"--omsk-border-strong",
	"--omsk-success",
	"--omsk-success-dim",
	"--omsk-error",
	"--omsk-error-dim",
	"--omsk-warning",
	"--omsk-warning-dim",
	"--omsk-info",
	"--omsk-info-dim",
	"--omsk-text",
	"--omsk-text-secondary",
	"--omsk-bg-primary",
	"--omsk-bg-secondary",
	"--omsk-bg-tertiary",
	"--omsk-bg-elevated",
	"--omsk-selected-bg",
	"--omsk-user-msg-bg",
	"--omsk-user-msg-border",
	"--omsk-custom-msg-bg",
	"--omsk-code-bg",
	"--omsk-tool-pending-bg",
	"--omsk-tool-success-bg",
	"--omsk-tool-error-bg",
	"--omsk-tool-output",
	"--omsk-tool-rail-running",
	"--omsk-tool-rail-done",
	"--omsk-tool-rail-error",
	"--omsk-md-heading",
	"--omsk-md-link",
	"--omsk-md-link-url",
	"--omsk-md-code",
	"--omsk-md-code-block",
	"--omsk-md-code-block-border",
	"--omsk-md-quote",
	"--omsk-md-quote-border",
	"--omsk-md-hr",
	"--omsk-md-list-bullet",
	"--omsk-diff-added",
	"--omsk-diff-added-bg",
	"--omsk-diff-removed",
	"--omsk-diff-removed-bg",
	"--omsk-diff-context",
	"--omsk-syntax-comment",
	"--omsk-syntax-keyword",
	"--omsk-syntax-function",
	"--omsk-syntax-variable",
	"--omsk-syntax-string",
	"--omsk-syntax-number",
	"--omsk-syntax-type",
	"--omsk-syntax-operator",
	"--omsk-syntax-punctuation",
	"--omsk-thinking-off",
	"--omsk-thinking-minimal",
	"--omsk-thinking-low",
	"--omsk-thinking-medium",
	"--omsk-thinking-high",
	"--omsk-thinking-xhigh",
	"--omsk-status-bg",
	"--omsk-status-model",
	"--omsk-status-path",
	"--omsk-status-git-clean",
	"--omsk-status-git-dirty",
	"--omsk-status-context",
	"--omsk-status-spend",
	"--omsk-status-subagents",
	"--omsk-status-muted",
	"--omsk-status-dim",
	"--omsk-status-text",
	"--omsk-status-sep",
	"--omsk-muted",
	"--omsk-dim",
	"--omsk-link",
	"--omsk-custom-msg-label",
	"--omsk-input-bg",
	"--omsk-input-border",
	"--omsk-input-focus-border",
	"--omsk-input-glow",
	"--omsk-btn-primary-bg",
	"--omsk-btn-primary-text",
	"--omsk-btn-secondary-bg",
	"--omsk-btn-secondary-text",
	"--omsk-btn-danger-bg",
	"--omsk-btn-danger-text",
	"--omsk-badge-bg",
	"--omsk-badge-text",
	"--omsk-badge-accent",
	"--omsk-overlay-bg",
	"--omsk-modal-bg",
	"--omsk-modal-border",
	"--omsk-toast-bg",
	"--omsk-toast-text",
	"--omsk-toast-border",
	"--omsk-progress-bg",
	"--omsk-progress-fill",
	"--omsk-sidebar-bg",
	"--omsk-sidebar-item-hover",
	"--omsk-sidebar-item-active",
	"--omsk-selection-bg",
	"--omsk-selection-text",
	"--omsk-scrollbar-thumb",
	"--omsk-scrollbar-track",
	"--omsk-streaming-cursor",
	"--omsk-streaming-highlight",
	"--omsk-panel-bg",
	"--omsk-panel-border",
	"--omsk-panel-header",
	"--omsk-titlebar-bg",
	"--omsk-titlebar-text",
	"--omsk-shadow-sm",
	"--omsk-shadow-md",
	"--omsk-shadow-lg",
	"--omsk-shadow-glow",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
export type ThemeTokens = Record<ThemeTokenKey, string>;

export interface ThemeDefinition {
	/** Human-readable name shown in the picker. */
	label: string;
	/** One-line picker blurb. */
	description: string;
	/** Base color scheme — drives data-theme, the color-scheme meta, and native controls. */
	scheme: "dark" | "light";
	tokens: ThemeTokens;
}

const dark: ThemeDefinition = {
	label: "Graphite",
	description: "Neutral charcoal, soft silver text, and a quiet blue accent.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#5aa9ff",
		"--omsk-accent-bright": "#8cc4ff",
		"--omsk-accent-dim": "rgba(90, 169, 255, 0.14)",
		"--omsk-accent-glow": "rgba(90, 169, 255, 0.18)",
		"--omsk-border": "#333333",
		"--omsk-border-accent": "rgba(90, 169, 255, 0.5)",
		"--omsk-border-muted": "#2a2a2a",
		"--omsk-border-strong": "#4a4a4a",
		"--omsk-success": "#6fcf97",
		"--omsk-success-dim": "rgba(111, 207, 151, 0.1)",
		"--omsk-error": "#f38b82",
		"--omsk-error-dim": "rgba(243, 139, 130, 0.1)",
		"--omsk-warning": "#e8b75f",
		"--omsk-warning-dim": "rgba(232, 183, 95, 0.1)",
		"--omsk-info": "#7ab7f5",
		"--omsk-info-dim": "rgba(122, 183, 245, 0.1)",
		"--omsk-text": "#ececec",
		"--omsk-text-secondary": "#c5c5c5",
		"--omsk-bg-primary": "#1f1f1f",
		"--omsk-bg-secondary": "#262626",
		"--omsk-bg-tertiary": "#2c2c2c",
		"--omsk-bg-elevated": "#2a2a2a",
		"--omsk-selected-bg": "rgba(255, 255, 255, 0.07)",
		"--omsk-user-msg-bg": "#242a31",
		"--omsk-user-msg-border": "#2d3e52",
		"--omsk-custom-msg-bg": "#262626",
		"--omsk-code-bg": "#181818",
		"--omsk-tool-pending-bg": "#262626",
		"--omsk-tool-success-bg": "rgba(111, 207, 151, 0.04)",
		"--omsk-tool-error-bg": "rgba(243, 139, 130, 0.06)",
		"--omsk-tool-output": "#c5c5c5",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#6fcf97",
		"--omsk-tool-rail-error": "#f38b82",
		"--omsk-md-heading": "#f4f4f4",
		"--omsk-md-link": "#7ab7ff",
		"--omsk-md-link-url": "#a8a8a8",
		"--omsk-md-code": "#e6e6e6",
		"--omsk-md-code-block": "#e6e6e6",
		"--omsk-md-code-block-border": "#2e2e2e",
		"--omsk-md-quote": "#c5c5c5",
		"--omsk-md-quote-border": "#4a4a4a",
		"--omsk-md-hr": "#333333",
		"--omsk-md-list-bullet": "#9e9e9e",
		"--omsk-diff-added": "#7fd6a0",
		"--omsk-diff-added-bg": "rgba(111, 207, 151, 0.1)",
		"--omsk-diff-removed": "#f59a92",
		"--omsk-diff-removed-bg": "rgba(243, 139, 130, 0.1)",
		"--omsk-diff-context": "#a8a8a8",
		"--omsk-syntax-comment": "#8f959e",
		"--omsk-syntax-keyword": "#79b8ff",
		"--omsk-syntax-function": "#d2a8ff",
		"--omsk-syntax-variable": "#e6e6e6",
		"--omsk-syntax-string": "#a5d6a7",
		"--omsk-syntax-number": "#f2b880",
		"--omsk-syntax-type": "#7fd4d4",
		"--omsk-syntax-operator": "#c5c5c5",
		"--omsk-syntax-punctuation": "#a8a8a8",
		"--omsk-thinking-off": "#9b9b9b",
		"--omsk-thinking-minimal": "#a8a8a8",
		"--omsk-thinking-low": "#c5c5c5",
		"--omsk-thinking-medium": "#7ab7ff",
		"--omsk-thinking-high": "#8cc4ff",
		"--omsk-thinking-xhigh": "#ececec",
		"--omsk-status-bg": "#181818",
		"--omsk-status-model": "#c5c5c5",
		"--omsk-status-path": "#a8a8a8",
		"--omsk-status-git-clean": "#6fcf97",
		"--omsk-status-git-dirty": "#e8b75f",
		"--omsk-status-context": "#c5c5c5",
		"--omsk-status-spend": "#c5c5c5",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#a8a8a8",
		"--omsk-status-dim": "#9b9b9b",
		"--omsk-status-text": "#ececec",
		"--omsk-status-sep": "#333333",
		"--omsk-muted": "#a8a8a8",
		"--omsk-dim": "#9b9b9b",
		"--omsk-link": "#7ab7ff",
		"--omsk-custom-msg-label": "#7ab7ff",
		"--omsk-input-bg": "#262626",
		"--omsk-input-border": "#363636",
		"--omsk-input-focus-border": "#4d4d4d",
		"--omsk-input-glow": "rgba(255, 255, 255, 0.03)",
		"--omsk-btn-primary-bg": "#ececec",
		"--omsk-btn-primary-text": "#171717",
		"--omsk-btn-secondary-bg": "#2f2f2f",
		"--omsk-btn-secondary-text": "#ececec",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#171717",
		"--omsk-badge-bg": "#2f2f2f",
		"--omsk-badge-text": "#c5c5c5",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(0, 0, 0, 0.5)",
		"--omsk-modal-bg": "#252525",
		"--omsk-modal-border": "#363636",
		"--omsk-toast-bg": "#2a2a2a",
		"--omsk-toast-text": "#ececec",
		"--omsk-toast-border": "#363636",
		"--omsk-progress-bg": "#2f2f2f",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#181818",
		"--omsk-sidebar-item-hover": "rgba(255, 255, 255, 0.05)",
		"--omsk-sidebar-item-active": "rgba(255, 255, 255, 0.08)",
		"--omsk-selection-bg": "rgba(90, 169, 255, 0.28)",
		"--omsk-selection-text": "#ececec",
		"--omsk-scrollbar-thumb": "#454545",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-text)",
		"--omsk-streaming-highlight": "rgba(255, 255, 255, 0.03)",
		"--omsk-panel-bg": "#1b1b1b",
		"--omsk-panel-border": "#2a2a2a",
		"--omsk-panel-header": "#a8a8a8",
		"--omsk-titlebar-bg": "#1f1f1f",
		"--omsk-titlebar-text": "#ececec",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.24)",
		"--omsk-shadow-md": "0 8px 24px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-lg": "0 20px 56px rgba(0, 0, 0, 0.48)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const light: ThemeDefinition = {
	label: "Porcelain",
	description: "Clean porcelain, ink text, and a restrained blue accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#0b62c4",
		"--omsk-accent-bright": "#0a539f",
		"--omsk-accent-dim": "rgba(11, 98, 196, 0.08)",
		"--omsk-accent-glow": "rgba(11, 98, 196, 0.14)",
		"--omsk-border": "#e3e3e3",
		"--omsk-border-accent": "rgba(11, 98, 196, 0.45)",
		"--omsk-border-muted": "#ececec",
		"--omsk-border-strong": "#c9c9c9",
		"--omsk-success": "#1a7f45",
		"--omsk-success-dim": "rgba(26, 127, 69, 0.08)",
		"--omsk-error": "#c0392b",
		"--omsk-error-dim": "rgba(192, 57, 43, 0.07)",
		"--omsk-warning": "#8a5a00",
		"--omsk-warning-dim": "rgba(138, 90, 0, 0.08)",
		"--omsk-info": "#0b62c4",
		"--omsk-info-dim": "rgba(11, 98, 196, 0.07)",
		"--omsk-text": "#0d0d0d",
		"--omsk-text-secondary": "#404040",
		"--omsk-bg-primary": "#ffffff",
		"--omsk-bg-secondary": "#f7f7f7",
		"--omsk-bg-tertiary": "#efefef",
		"--omsk-bg-elevated": "#ffffff",
		"--omsk-selected-bg": "rgba(0, 0, 0, 0.05)",
		"--omsk-user-msg-bg": "#ebf2fa",
		"--omsk-user-msg-border": "#c7dbf1",
		"--omsk-custom-msg-bg": "#f7f7f7",
		"--omsk-code-bg": "#f7f7f7",
		"--omsk-tool-pending-bg": "#f7f7f7",
		"--omsk-tool-success-bg": "rgba(26, 127, 69, 0.04)",
		"--omsk-tool-error-bg": "rgba(192, 57, 43, 0.05)",
		"--omsk-tool-output": "#404040",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#1a7f45",
		"--omsk-tool-rail-error": "#c0392b",
		"--omsk-md-heading": "#0d0d0d",
		"--omsk-md-link": "#0b62c4",
		"--omsk-md-link-url": "#5c5c5c",
		"--omsk-md-code": "#1f1f1f",
		"--omsk-md-code-block": "#1f1f1f",
		"--omsk-md-code-block-border": "#e8e8e8",
		"--omsk-md-quote": "#404040",
		"--omsk-md-quote-border": "#c9c9c9",
		"--omsk-md-hr": "#e3e3e3",
		"--omsk-md-list-bullet": "#6b6b6b",
		"--omsk-diff-added": "#176b3a",
		"--omsk-diff-added-bg": "rgba(26, 127, 69, 0.08)",
		"--omsk-diff-removed": "#b0352a",
		"--omsk-diff-removed-bg": "rgba(192, 57, 43, 0.07)",
		"--omsk-diff-context": "#5c5c5c",
		"--omsk-syntax-comment": "#5f6670",
		"--omsk-syntax-keyword": "#cf222e",
		"--omsk-syntax-function": "#6639ba",
		"--omsk-syntax-variable": "#1f1f1f",
		"--omsk-syntax-string": "#0a3069",
		"--omsk-syntax-number": "#0550ae",
		"--omsk-syntax-type": "#953800",
		"--omsk-syntax-operator": "#404040",
		"--omsk-syntax-punctuation": "#5c5c5c",
		"--omsk-thinking-off": "#6b6b6b",
		"--omsk-thinking-minimal": "#5c5c5c",
		"--omsk-thinking-low": "#404040",
		"--omsk-thinking-medium": "#0b62c4",
		"--omsk-thinking-high": "#0a539f",
		"--omsk-thinking-xhigh": "#0d0d0d",
		"--omsk-status-bg": "#f9f9f9",
		"--omsk-status-model": "#404040",
		"--omsk-status-path": "#5c5c5c",
		"--omsk-status-git-clean": "#1a7f45",
		"--omsk-status-git-dirty": "#8a5a00",
		"--omsk-status-context": "#404040",
		"--omsk-status-spend": "#404040",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#5c5c5c",
		"--omsk-status-dim": "#6b6b6b",
		"--omsk-status-text": "#0d0d0d",
		"--omsk-status-sep": "#e3e3e3",
		"--omsk-muted": "#5c5c5c",
		"--omsk-dim": "#6b6b6b",
		"--omsk-link": "#0b62c4",
		"--omsk-custom-msg-label": "#0b62c4",
		"--omsk-input-bg": "#ffffff",
		"--omsk-input-border": "#dedede",
		"--omsk-input-focus-border": "#c2c2c2",
		"--omsk-input-glow": "rgba(0, 0, 0, 0.02)",
		"--omsk-btn-primary-bg": "#0d0d0d",
		"--omsk-btn-primary-text": "#ffffff",
		"--omsk-btn-secondary-bg": "#efefef",
		"--omsk-btn-secondary-text": "#0d0d0d",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#efefef",
		"--omsk-badge-text": "#404040",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(0, 0, 0, 0.22)",
		"--omsk-modal-bg": "#ffffff",
		"--omsk-modal-border": "#e3e3e3",
		"--omsk-toast-bg": "#ffffff",
		"--omsk-toast-text": "#0d0d0d",
		"--omsk-toast-border": "#e3e3e3",
		"--omsk-progress-bg": "#ececec",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#f9f9f9",
		"--omsk-sidebar-item-hover": "rgba(0, 0, 0, 0.04)",
		"--omsk-sidebar-item-active": "rgba(0, 0, 0, 0.065)",
		"--omsk-selection-bg": "rgba(11, 98, 196, 0.18)",
		"--omsk-selection-text": "#0d0d0d",
		"--omsk-scrollbar-thumb": "#cfcfcf",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-text)",
		"--omsk-streaming-highlight": "rgba(0, 0, 0, 0.02)",
		"--omsk-panel-bg": "#fbfbfb",
		"--omsk-panel-border": "#ececec",
		"--omsk-panel-header": "#5c5c5c",
		"--omsk-titlebar-bg": "#ffffff",
		"--omsk-titlebar-text": "#0d0d0d",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
		"--omsk-shadow-md": "0 6px 20px rgba(0, 0, 0, 0.08)",
		"--omsk-shadow-lg": "0 18px 50px rgba(0, 0, 0, 0.14)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const titanium: ThemeDefinition = {
	label: "Slate",
	description: "Soft slate surfaces and silver-blue details.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#accad6",
		"--omsk-accent-bright": "#c9e0e7",
		"--omsk-accent-dim": "rgba(172, 202, 214, 0.13)",
		"--omsk-accent-glow": "rgba(172, 202, 214, 0.16)",
		"--omsk-border": "#414b53",
		"--omsk-border-accent": "rgba(172, 202, 214, 0.52)",
		"--omsk-border-muted": "#343d45",
		"--omsk-border-strong": "#687680",
		"--omsk-success": "#9bc7ab",
		"--omsk-success-dim": "rgba(155, 199, 171, 0.08)",
		"--omsk-error": "#e6a09a",
		"--omsk-error-dim": "rgba(230, 160, 154, 0.08)",
		"--omsk-warning": "#d7bc88",
		"--omsk-warning-dim": "rgba(215, 188, 136, 0.08)",
		"--omsk-info": "#a2bfdc",
		"--omsk-info-dim": "rgba(162, 191, 220, 0.08)",
		"--omsk-text": "#edf0f1",
		"--omsk-text-secondary": "#c7cfd4",
		"--omsk-bg-primary": "#24282c",
		"--omsk-bg-secondary": "#2b3035",
		"--omsk-bg-tertiary": "#343b41",
		"--omsk-bg-elevated": "#383f46",
		"--omsk-selected-bg": "rgba(172, 202, 214, 0.12)",
		"--omsk-user-msg-bg": "#2f353a",
		"--omsk-user-msg-border": "#434d53",
		"--omsk-custom-msg-bg": "#2b3035",
		"--omsk-code-bg": "#2b3035",
		"--omsk-tool-pending-bg": "#2b3035",
		"--omsk-tool-success-bg": "rgba(155, 199, 171, 0.045)",
		"--omsk-tool-error-bg": "rgba(230, 160, 154, 0.065)",
		"--omsk-tool-output": "#c7cfd4",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#9bc7ab",
		"--omsk-tool-rail-error": "#e6a09a",
		"--omsk-md-heading": "#edf0f1",
		"--omsk-md-link": "#accad6",
		"--omsk-md-link-url": "#b4bfc6",
		"--omsk-md-code": "#deb0a1",
		"--omsk-md-code-block": "#edf0f1",
		"--omsk-md-code-block-border": "#414b53",
		"--omsk-md-quote": "#c7cfd4",
		"--omsk-md-quote-border": "#687680",
		"--omsk-md-hr": "#414b53",
		"--omsk-md-list-bullet": "#b4bfc6",
		"--omsk-diff-added": "#9bc7ab",
		"--omsk-diff-added-bg": "rgba(155, 199, 171, 0.09)",
		"--omsk-diff-removed": "#e6a09a",
		"--omsk-diff-removed-bg": "rgba(230, 160, 154, 0.09)",
		"--omsk-diff-context": "#b4bfc6",
		"--omsk-syntax-comment": "#a5b2bc",
		"--omsk-syntax-keyword": "#a3bedb",
		"--omsk-syntax-function": "#91c5bf",
		"--omsk-syntax-variable": "#edf0f1",
		"--omsk-syntax-string": "#d4ba91",
		"--omsk-syntax-number": "#deb0a1",
		"--omsk-syntax-type": "#b9cdb1",
		"--omsk-syntax-operator": "#c7cfd4",
		"--omsk-syntax-punctuation": "#b4bfc6",
		"--omsk-thinking-off": "#a5b2bc",
		"--omsk-thinking-minimal": "#b4bfc6",
		"--omsk-thinking-low": "#c7cfd4",
		"--omsk-thinking-medium": "#accad6",
		"--omsk-thinking-high": "#c9e0e7",
		"--omsk-thinking-xhigh": "#edf0f1",
		"--omsk-status-bg": "#1d2125",
		"--omsk-status-model": "#c7cfd4",
		"--omsk-status-path": "#b4bfc6",
		"--omsk-status-git-clean": "#9bc7ab",
		"--omsk-status-git-dirty": "#d7bc88",
		"--omsk-status-context": "#c7cfd4",
		"--omsk-status-spend": "#c7cfd4",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#b4bfc6",
		"--omsk-status-dim": "#a5b2bc",
		"--omsk-status-text": "#edf0f1",
		"--omsk-status-sep": "#414b53",
		"--omsk-muted": "#b4bfc6",
		"--omsk-dim": "#a5b2bc",
		"--omsk-link": "#accad6",
		"--omsk-custom-msg-label": "#accad6",
		"--omsk-input-bg": "#2b3035",
		"--omsk-input-border": "#414b53",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(172, 202, 214, 0.1)",
		"--omsk-btn-primary-bg": "#edf0f1",
		"--omsk-btn-primary-text": "#24282c",
		"--omsk-btn-secondary-bg": "#343b41",
		"--omsk-btn-secondary-text": "#edf0f1",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#24282c",
		"--omsk-badge-bg": "#343b41",
		"--omsk-badge-text": "#c7cfd4",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(8, 12, 16, 0.62)",
		"--omsk-modal-bg": "#383f46",
		"--omsk-modal-border": "#414b53",
		"--omsk-toast-bg": "#383f46",
		"--omsk-toast-text": "#edf0f1",
		"--omsk-toast-border": "#414b53",
		"--omsk-progress-bg": "#343b41",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#1d2125",
		"--omsk-sidebar-item-hover": "#343b41",
		"--omsk-sidebar-item-active": "rgba(172, 202, 214, 0.13)",
		"--omsk-selection-bg": "rgba(172, 202, 214, 0.25)",
		"--omsk-selection-text": "#edf0f1",
		"--omsk-scrollbar-thumb": "#687680",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(172, 202, 214, 0.04)",
		"--omsk-panel-bg": "#1d2125",
		"--omsk-panel-border": "#343d45",
		"--omsk-panel-header": "#b4bfc6",
		"--omsk-titlebar-bg": "#1d2125",
		"--omsk-titlebar-text": "#edf0f1",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.16)",
		"--omsk-shadow-md": "0 6px 18px rgba(0, 0, 0, 0.22)",
		"--omsk-shadow-lg": "0 16px 48px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const nord: ThemeDefinition = {
	label: "Deep Sea",
	description: "Deep petrol blue with a soft sea-glass accent.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#8bc4c5",
		"--omsk-accent-bright": "#b3dcdc",
		"--omsk-accent-dim": "rgba(139, 196, 197, 0.13)",
		"--omsk-accent-glow": "rgba(139, 196, 197, 0.16)",
		"--omsk-border": "#324c58",
		"--omsk-border-accent": "rgba(139, 196, 197, 0.52)",
		"--omsk-border-muted": "#263e49",
		"--omsk-border-strong": "#587984",
		"--omsk-success": "#9bc7ab",
		"--omsk-success-dim": "rgba(155, 199, 171, 0.08)",
		"--omsk-error": "#e6a09a",
		"--omsk-error-dim": "rgba(230, 160, 154, 0.08)",
		"--omsk-warning": "#d7bc88",
		"--omsk-warning-dim": "rgba(215, 188, 136, 0.08)",
		"--omsk-info": "#a2bfdc",
		"--omsk-info-dim": "rgba(162, 191, 220, 0.08)",
		"--omsk-text": "#e3edef",
		"--omsk-text-secondary": "#b7cbd2",
		"--omsk-bg-primary": "#14232b",
		"--omsk-bg-secondary": "#192c35",
		"--omsk-bg-tertiary": "#223a44",
		"--omsk-bg-elevated": "#29414c",
		"--omsk-selected-bg": "rgba(139, 196, 197, 0.12)",
		"--omsk-user-msg-bg": "#1e3037",
		"--omsk-user-msg-border": "#2f484e",
		"--omsk-custom-msg-bg": "#192c35",
		"--omsk-code-bg": "#192c35",
		"--omsk-tool-pending-bg": "#192c35",
		"--omsk-tool-success-bg": "rgba(155, 199, 171, 0.045)",
		"--omsk-tool-error-bg": "rgba(230, 160, 154, 0.065)",
		"--omsk-tool-output": "#b7cbd2",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#9bc7ab",
		"--omsk-tool-rail-error": "#e6a09a",
		"--omsk-md-heading": "#e3edef",
		"--omsk-md-link": "#8bc4c5",
		"--omsk-md-link-url": "#a5bec7",
		"--omsk-md-code": "#deb0a1",
		"--omsk-md-code-block": "#e3edef",
		"--omsk-md-code-block-border": "#324c58",
		"--omsk-md-quote": "#b7cbd2",
		"--omsk-md-quote-border": "#587984",
		"--omsk-md-hr": "#324c58",
		"--omsk-md-list-bullet": "#a5bec7",
		"--omsk-diff-added": "#9bc7ab",
		"--omsk-diff-added-bg": "rgba(155, 199, 171, 0.09)",
		"--omsk-diff-removed": "#e6a09a",
		"--omsk-diff-removed-bg": "rgba(230, 160, 154, 0.09)",
		"--omsk-diff-context": "#a5bec7",
		"--omsk-syntax-comment": "#98b2bf",
		"--omsk-syntax-keyword": "#a3bedb",
		"--omsk-syntax-function": "#91c5bf",
		"--omsk-syntax-variable": "#e3edef",
		"--omsk-syntax-string": "#d4ba91",
		"--omsk-syntax-number": "#deb0a1",
		"--omsk-syntax-type": "#b9cdb1",
		"--omsk-syntax-operator": "#b7cbd2",
		"--omsk-syntax-punctuation": "#a5bec7",
		"--omsk-thinking-off": "#98b2bf",
		"--omsk-thinking-minimal": "#a5bec7",
		"--omsk-thinking-low": "#b7cbd2",
		"--omsk-thinking-medium": "#8bc4c5",
		"--omsk-thinking-high": "#b3dcdc",
		"--omsk-thinking-xhigh": "#e3edef",
		"--omsk-status-bg": "#101d24",
		"--omsk-status-model": "#b7cbd2",
		"--omsk-status-path": "#a5bec7",
		"--omsk-status-git-clean": "#9bc7ab",
		"--omsk-status-git-dirty": "#d7bc88",
		"--omsk-status-context": "#b7cbd2",
		"--omsk-status-spend": "#b7cbd2",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#a5bec7",
		"--omsk-status-dim": "#98b2bf",
		"--omsk-status-text": "#e3edef",
		"--omsk-status-sep": "#324c58",
		"--omsk-muted": "#a5bec7",
		"--omsk-dim": "#98b2bf",
		"--omsk-link": "#8bc4c5",
		"--omsk-custom-msg-label": "#8bc4c5",
		"--omsk-input-bg": "#192c35",
		"--omsk-input-border": "#324c58",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(139, 196, 197, 0.1)",
		"--omsk-btn-primary-bg": "#e3edef",
		"--omsk-btn-primary-text": "#14232b",
		"--omsk-btn-secondary-bg": "#223a44",
		"--omsk-btn-secondary-text": "#e3edef",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#14232b",
		"--omsk-badge-bg": "#223a44",
		"--omsk-badge-text": "#b7cbd2",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(8, 12, 16, 0.62)",
		"--omsk-modal-bg": "#29414c",
		"--omsk-modal-border": "#324c58",
		"--omsk-toast-bg": "#29414c",
		"--omsk-toast-text": "#e3edef",
		"--omsk-toast-border": "#324c58",
		"--omsk-progress-bg": "#223a44",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#101d24",
		"--omsk-sidebar-item-hover": "#223a44",
		"--omsk-sidebar-item-active": "rgba(139, 196, 197, 0.13)",
		"--omsk-selection-bg": "rgba(139, 196, 197, 0.25)",
		"--omsk-selection-text": "#e3edef",
		"--omsk-scrollbar-thumb": "#587984",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(139, 196, 197, 0.04)",
		"--omsk-panel-bg": "#101d24",
		"--omsk-panel-border": "#263e49",
		"--omsk-panel-header": "#a5bec7",
		"--omsk-titlebar-bg": "#101d24",
		"--omsk-titlebar-text": "#e3edef",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.16)",
		"--omsk-shadow-md": "0 6px 18px rgba(0, 0, 0, 0.22)",
		"--omsk-shadow-lg": "0 16px 48px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const solarized: ThemeDefinition = {
	label: "Sand",
	description: "Pale sand, warm stone, and a muted ochre accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#825d2a",
		"--omsk-accent-bright": "#724c21",
		"--omsk-accent-dim": "rgba(134, 97, 45, 0.08)",
		"--omsk-accent-glow": "rgba(134, 97, 45, 0.16)",
		"--omsk-border": "#ded7ca",
		"--omsk-border-accent": "rgba(134, 97, 45, 0.52)",
		"--omsk-border-muted": "#e9e3d9",
		"--omsk-border-strong": "#b4a68e",
		"--omsk-success": "#326747",
		"--omsk-success-dim": "rgba(50, 103, 71, 0.08)",
		"--omsk-error": "#9f4545",
		"--omsk-error-dim": "rgba(159, 69, 69, 0.08)",
		"--omsk-warning": "#80601e",
		"--omsk-warning-dim": "rgba(128, 96, 30, 0.08)",
		"--omsk-info": "#315f83",
		"--omsk-info-dim": "rgba(49, 95, 131, 0.08)",
		"--omsk-text": "#302e29",
		"--omsk-text-secondary": "#5b574e",
		"--omsk-bg-primary": "#faf8f3",
		"--omsk-bg-secondary": "#f2efe7",
		"--omsk-bg-tertiary": "#e8e3d8",
		"--omsk-bg-elevated": "#fffdf9",
		"--omsk-selected-bg": "rgba(134, 97, 45, 0.09)",
		"--omsk-user-msg-bg": "#f0ece3",
		"--omsk-user-msg-border": "#ded5c5",
		"--omsk-custom-msg-bg": "#f2efe7",
		"--omsk-code-bg": "#f2efe7",
		"--omsk-tool-pending-bg": "#f2efe7",
		"--omsk-tool-success-bg": "rgba(50, 103, 71, 0.045)",
		"--omsk-tool-error-bg": "rgba(159, 69, 69, 0.065)",
		"--omsk-tool-output": "#5b574e",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#326747",
		"--omsk-tool-rail-error": "#9f4545",
		"--omsk-md-heading": "#302e29",
		"--omsk-md-link": "#825d2a",
		"--omsk-md-link-url": "#686052",
		"--omsk-md-code": "#944c42",
		"--omsk-md-code-block": "#302e29",
		"--omsk-md-code-block-border": "#ded7ca",
		"--omsk-md-quote": "#5b574e",
		"--omsk-md-quote-border": "#b4a68e",
		"--omsk-md-hr": "#ded7ca",
		"--omsk-md-list-bullet": "#686052",
		"--omsk-diff-added": "#326747",
		"--omsk-diff-added-bg": "rgba(50, 103, 71, 0.07)",
		"--omsk-diff-removed": "#9f4545",
		"--omsk-diff-removed-bg": "rgba(159, 69, 69, 0.07)",
		"--omsk-diff-context": "#686052",
		"--omsk-syntax-comment": "#6c6254",
		"--omsk-syntax-keyword": "#315f83",
		"--omsk-syntax-function": "#2b655f",
		"--omsk-syntax-variable": "#302e29",
		"--omsk-syntax-string": "#805c2e",
		"--omsk-syntax-number": "#944c42",
		"--omsk-syntax-type": "#516939",
		"--omsk-syntax-operator": "#5b574e",
		"--omsk-syntax-punctuation": "#686052",
		"--omsk-thinking-off": "#6c6254",
		"--omsk-thinking-minimal": "#686052",
		"--omsk-thinking-low": "#5b574e",
		"--omsk-thinking-medium": "#825d2a",
		"--omsk-thinking-high": "#724c21",
		"--omsk-thinking-xhigh": "#302e29",
		"--omsk-status-bg": "#f0ede5",
		"--omsk-status-model": "#5b574e",
		"--omsk-status-path": "#686052",
		"--omsk-status-git-clean": "#326747",
		"--omsk-status-git-dirty": "#80601e",
		"--omsk-status-context": "#5b574e",
		"--omsk-status-spend": "#5b574e",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#686052",
		"--omsk-status-dim": "#6c6254",
		"--omsk-status-text": "#302e29",
		"--omsk-status-sep": "#ded7ca",
		"--omsk-muted": "#686052",
		"--omsk-dim": "#6c6254",
		"--omsk-link": "#825d2a",
		"--omsk-custom-msg-label": "#825d2a",
		"--omsk-input-bg": "#fffdf9",
		"--omsk-input-border": "#ded7ca",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(134, 97, 45, 0.1)",
		"--omsk-btn-primary-bg": "#302e29",
		"--omsk-btn-primary-text": "#faf8f3",
		"--omsk-btn-secondary-bg": "#e8e3d8",
		"--omsk-btn-secondary-text": "#302e29",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#e8e3d8",
		"--omsk-badge-text": "#5b574e",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(20, 28, 32, 0.28)",
		"--omsk-modal-bg": "#fffdf9",
		"--omsk-modal-border": "#ded7ca",
		"--omsk-toast-bg": "#fffdf9",
		"--omsk-toast-text": "#302e29",
		"--omsk-toast-border": "#ded7ca",
		"--omsk-progress-bg": "#e8e3d8",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#f0ede5",
		"--omsk-sidebar-item-hover": "#e8e3d8",
		"--omsk-sidebar-item-active": "rgba(134, 97, 45, 0.1)",
		"--omsk-selection-bg": "rgba(134, 97, 45, 0.19)",
		"--omsk-selection-text": "#302e29",
		"--omsk-scrollbar-thumb": "#b4a68e",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(134, 97, 45, 0.04)",
		"--omsk-panel-bg": "#f0ede5",
		"--omsk-panel-border": "#e9e3d9",
		"--omsk-panel-header": "#686052",
		"--omsk-titlebar-bg": "#f0ede5",
		"--omsk-titlebar-text": "#302e29",
		"--omsk-shadow-sm": "0 1px 2px rgba(32, 40, 48, 0.035)",
		"--omsk-shadow-md": "0 6px 18px rgba(32, 40, 48, 0.07)",
		"--omsk-shadow-lg": "0 16px 48px rgba(32, 40, 48, 0.13)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const paper: ThemeDefinition = {
	label: "Ivory",
	description: "Warm ivory pages with a fine copper accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#94513e",
		"--omsk-accent-bright": "#7e4334",
		"--omsk-accent-dim": "rgba(148, 81, 62, 0.08)",
		"--omsk-accent-glow": "rgba(148, 81, 62, 0.16)",
		"--omsk-border": "#dfd7cc",
		"--omsk-border-accent": "rgba(148, 81, 62, 0.52)",
		"--omsk-border-muted": "#ece5db",
		"--omsk-border-strong": "#b6a594",
		"--omsk-success": "#326747",
		"--omsk-success-dim": "rgba(50, 103, 71, 0.08)",
		"--omsk-error": "#9f4545",
		"--omsk-error-dim": "rgba(159, 69, 69, 0.08)",
		"--omsk-warning": "#80601e",
		"--omsk-warning-dim": "rgba(128, 96, 30, 0.08)",
		"--omsk-info": "#315f83",
		"--omsk-info-dim": "rgba(49, 95, 131, 0.08)",
		"--omsk-text": "#302d29",
		"--omsk-text-secondary": "#5c554e",
		"--omsk-bg-primary": "#fdfbf7",
		"--omsk-bg-secondary": "#f5f1e9",
		"--omsk-bg-tertiary": "#eae4da",
		"--omsk-bg-elevated": "#fffefa",
		"--omsk-selected-bg": "rgba(148, 81, 62, 0.09)",
		"--omsk-user-msg-bg": "#f5ede8",
		"--omsk-user-msg-border": "#e5d4cd",
		"--omsk-custom-msg-bg": "#f5f1e9",
		"--omsk-code-bg": "#f5f1e9",
		"--omsk-tool-pending-bg": "#f5f1e9",
		"--omsk-tool-success-bg": "rgba(50, 103, 71, 0.045)",
		"--omsk-tool-error-bg": "rgba(159, 69, 69, 0.065)",
		"--omsk-tool-output": "#5c554e",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#326747",
		"--omsk-tool-rail-error": "#9f4545",
		"--omsk-md-heading": "#302d29",
		"--omsk-md-link": "#94513e",
		"--omsk-md-link-url": "#6a6057",
		"--omsk-md-code": "#944c42",
		"--omsk-md-code-block": "#302d29",
		"--omsk-md-code-block-border": "#dfd7cc",
		"--omsk-md-quote": "#5c554e",
		"--omsk-md-quote-border": "#b6a594",
		"--omsk-md-hr": "#dfd7cc",
		"--omsk-md-list-bullet": "#6a6057",
		"--omsk-diff-added": "#326747",
		"--omsk-diff-added-bg": "rgba(50, 103, 71, 0.07)",
		"--omsk-diff-removed": "#9f4545",
		"--omsk-diff-removed-bg": "rgba(159, 69, 69, 0.07)",
		"--omsk-diff-context": "#6a6057",
		"--omsk-syntax-comment": "#6f6459",
		"--omsk-syntax-keyword": "#315f83",
		"--omsk-syntax-function": "#2b655f",
		"--omsk-syntax-variable": "#302d29",
		"--omsk-syntax-string": "#805c2e",
		"--omsk-syntax-number": "#944c42",
		"--omsk-syntax-type": "#516939",
		"--omsk-syntax-operator": "#5c554e",
		"--omsk-syntax-punctuation": "#6a6057",
		"--omsk-thinking-off": "#6f6459",
		"--omsk-thinking-minimal": "#6a6057",
		"--omsk-thinking-low": "#5c554e",
		"--omsk-thinking-medium": "#94513e",
		"--omsk-thinking-high": "#7e4334",
		"--omsk-thinking-xhigh": "#302d29",
		"--omsk-status-bg": "#f3f0ea",
		"--omsk-status-model": "#5c554e",
		"--omsk-status-path": "#6a6057",
		"--omsk-status-git-clean": "#326747",
		"--omsk-status-git-dirty": "#80601e",
		"--omsk-status-context": "#5c554e",
		"--omsk-status-spend": "#5c554e",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#6a6057",
		"--omsk-status-dim": "#6f6459",
		"--omsk-status-text": "#302d29",
		"--omsk-status-sep": "#dfd7cc",
		"--omsk-muted": "#6a6057",
		"--omsk-dim": "#6f6459",
		"--omsk-link": "#94513e",
		"--omsk-custom-msg-label": "#94513e",
		"--omsk-input-bg": "#fffefa",
		"--omsk-input-border": "#dfd7cc",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(148, 81, 62, 0.1)",
		"--omsk-btn-primary-bg": "#302d29",
		"--omsk-btn-primary-text": "#fdfbf7",
		"--omsk-btn-secondary-bg": "#eae4da",
		"--omsk-btn-secondary-text": "#302d29",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#eae4da",
		"--omsk-badge-text": "#5c554e",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(20, 28, 32, 0.28)",
		"--omsk-modal-bg": "#fffefa",
		"--omsk-modal-border": "#dfd7cc",
		"--omsk-toast-bg": "#fffefa",
		"--omsk-toast-text": "#302d29",
		"--omsk-toast-border": "#dfd7cc",
		"--omsk-progress-bg": "#eae4da",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#f3f0ea",
		"--omsk-sidebar-item-hover": "#eae4da",
		"--omsk-sidebar-item-active": "rgba(148, 81, 62, 0.1)",
		"--omsk-selection-bg": "rgba(148, 81, 62, 0.19)",
		"--omsk-selection-text": "#302d29",
		"--omsk-scrollbar-thumb": "#b6a594",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(148, 81, 62, 0.04)",
		"--omsk-panel-bg": "#f3f0ea",
		"--omsk-panel-border": "#ece5db",
		"--omsk-panel-header": "#6a6057",
		"--omsk-titlebar-bg": "#f3f0ea",
		"--omsk-titlebar-text": "#302d29",
		"--omsk-shadow-sm": "0 1px 2px rgba(32, 40, 48, 0.035)",
		"--omsk-shadow-md": "0 6px 18px rgba(32, 40, 48, 0.07)",
		"--omsk-shadow-lg": "0 16px 48px rgba(32, 40, 48, 0.13)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const dawn: ThemeDefinition = {
	label: "Rose Quartz",
	description: "Almost-white rose, warm ink, and a dusty rose accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#8d5064",
		"--omsk-accent-bright": "#784455",
		"--omsk-accent-dim": "rgba(141, 80, 100, 0.08)",
		"--omsk-accent-glow": "rgba(141, 80, 100, 0.16)",
		"--omsk-border": "#e2d6da",
		"--omsk-border-accent": "rgba(141, 80, 100, 0.52)",
		"--omsk-border-muted": "#ede3e7",
		"--omsk-border-strong": "#bba1aa",
		"--omsk-success": "#326747",
		"--omsk-success-dim": "rgba(50, 103, 71, 0.08)",
		"--omsk-error": "#9f4545",
		"--omsk-error-dim": "rgba(159, 69, 69, 0.08)",
		"--omsk-warning": "#80601e",
		"--omsk-warning-dim": "rgba(128, 96, 30, 0.08)",
		"--omsk-info": "#315f83",
		"--omsk-info-dim": "rgba(49, 95, 131, 0.08)",
		"--omsk-text": "#342b2d",
		"--omsk-text-secondary": "#605257",
		"--omsk-bg-primary": "#fcf9f9",
		"--omsk-bg-secondary": "#f5eeee",
		"--omsk-bg-tertiary": "#ece1e2",
		"--omsk-bg-elevated": "#fffdfd",
		"--omsk-selected-bg": "rgba(141, 80, 100, 0.09)",
		"--omsk-user-msg-bg": "#f3ebed",
		"--omsk-user-msg-border": "#e3d2d7",
		"--omsk-custom-msg-bg": "#f5eeee",
		"--omsk-code-bg": "#f5eeee",
		"--omsk-tool-pending-bg": "#f5eeee",
		"--omsk-tool-success-bg": "rgba(50, 103, 71, 0.045)",
		"--omsk-tool-error-bg": "rgba(159, 69, 69, 0.065)",
		"--omsk-tool-output": "#605257",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#326747",
		"--omsk-tool-rail-error": "#9f4545",
		"--omsk-md-heading": "#342b2d",
		"--omsk-md-link": "#8d5064",
		"--omsk-md-link-url": "#6e5e64",
		"--omsk-md-code": "#944c42",
		"--omsk-md-code-block": "#342b2d",
		"--omsk-md-code-block-border": "#e2d6da",
		"--omsk-md-quote": "#605257",
		"--omsk-md-quote-border": "#bba1aa",
		"--omsk-md-hr": "#e2d6da",
		"--omsk-md-list-bullet": "#6e5e64",
		"--omsk-diff-added": "#326747",
		"--omsk-diff-added-bg": "rgba(50, 103, 71, 0.07)",
		"--omsk-diff-removed": "#9f4545",
		"--omsk-diff-removed-bg": "rgba(159, 69, 69, 0.07)",
		"--omsk-diff-context": "#6e5e64",
		"--omsk-syntax-comment": "#716067",
		"--omsk-syntax-keyword": "#315f83",
		"--omsk-syntax-function": "#2b655f",
		"--omsk-syntax-variable": "#342b2d",
		"--omsk-syntax-string": "#805c2e",
		"--omsk-syntax-number": "#944c42",
		"--omsk-syntax-type": "#516939",
		"--omsk-syntax-operator": "#605257",
		"--omsk-syntax-punctuation": "#6e5e64",
		"--omsk-thinking-off": "#716067",
		"--omsk-thinking-minimal": "#6e5e64",
		"--omsk-thinking-low": "#605257",
		"--omsk-thinking-medium": "#8d5064",
		"--omsk-thinking-high": "#784455",
		"--omsk-thinking-xhigh": "#342b2d",
		"--omsk-status-bg": "#f3eded",
		"--omsk-status-model": "#605257",
		"--omsk-status-path": "#6e5e64",
		"--omsk-status-git-clean": "#326747",
		"--omsk-status-git-dirty": "#80601e",
		"--omsk-status-context": "#605257",
		"--omsk-status-spend": "#605257",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#6e5e64",
		"--omsk-status-dim": "#716067",
		"--omsk-status-text": "#342b2d",
		"--omsk-status-sep": "#e2d6da",
		"--omsk-muted": "#6e5e64",
		"--omsk-dim": "#716067",
		"--omsk-link": "#8d5064",
		"--omsk-custom-msg-label": "#8d5064",
		"--omsk-input-bg": "#fffdfd",
		"--omsk-input-border": "#e2d6da",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(141, 80, 100, 0.1)",
		"--omsk-btn-primary-bg": "#342b2d",
		"--omsk-btn-primary-text": "#fcf9f9",
		"--omsk-btn-secondary-bg": "#ece1e2",
		"--omsk-btn-secondary-text": "#342b2d",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#ece1e2",
		"--omsk-badge-text": "#605257",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(20, 28, 32, 0.28)",
		"--omsk-modal-bg": "#fffdfd",
		"--omsk-modal-border": "#e2d6da",
		"--omsk-toast-bg": "#fffdfd",
		"--omsk-toast-text": "#342b2d",
		"--omsk-toast-border": "#e2d6da",
		"--omsk-progress-bg": "#ece1e2",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#f3eded",
		"--omsk-sidebar-item-hover": "#ece1e2",
		"--omsk-sidebar-item-active": "rgba(141, 80, 100, 0.1)",
		"--omsk-selection-bg": "rgba(141, 80, 100, 0.19)",
		"--omsk-selection-text": "#342b2d",
		"--omsk-scrollbar-thumb": "#bba1aa",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(141, 80, 100, 0.04)",
		"--omsk-panel-bg": "#f3eded",
		"--omsk-panel-border": "#ede3e7",
		"--omsk-panel-header": "#6e5e64",
		"--omsk-titlebar-bg": "#f3eded",
		"--omsk-titlebar-text": "#342b2d",
		"--omsk-shadow-sm": "0 1px 2px rgba(32, 40, 48, 0.035)",
		"--omsk-shadow-md": "0 6px 18px rgba(32, 40, 48, 0.07)",
		"--omsk-shadow-lg": "0 16px 48px rgba(32, 40, 48, 0.13)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const latte: ThemeDefinition = {
	label: "Espresso",
	description: "Roasted coffee surfaces and a soft caramel accent.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#d6b18a",
		"--omsk-accent-bright": "#e7caaa",
		"--omsk-accent-dim": "rgba(214, 177, 138, 0.13)",
		"--omsk-accent-glow": "rgba(214, 177, 138, 0.16)",
		"--omsk-border": "#4b4036",
		"--omsk-border-accent": "rgba(214, 177, 138, 0.52)",
		"--omsk-border-muted": "#3b332c",
		"--omsk-border-strong": "#7b6857",
		"--omsk-success": "#9bc7ab",
		"--omsk-success-dim": "rgba(155, 199, 171, 0.08)",
		"--omsk-error": "#e6a09a",
		"--omsk-error-dim": "rgba(230, 160, 154, 0.08)",
		"--omsk-warning": "#d7bc88",
		"--omsk-warning-dim": "rgba(215, 188, 136, 0.08)",
		"--omsk-info": "#a2bfdc",
		"--omsk-info-dim": "rgba(162, 191, 220, 0.08)",
		"--omsk-text": "#eee8e0",
		"--omsk-text-secondary": "#cec2b6",
		"--omsk-bg-primary": "#25211e",
		"--omsk-bg-secondary": "#2d2824",
		"--omsk-bg-tertiary": "#39312b",
		"--omsk-bg-elevated": "#3d352f",
		"--omsk-selected-bg": "rgba(214, 177, 138, 0.12)",
		"--omsk-user-msg-bg": "#332d27",
		"--omsk-user-msg-border": "#4d4237",
		"--omsk-custom-msg-bg": "#2d2824",
		"--omsk-code-bg": "#2d2824",
		"--omsk-tool-pending-bg": "#2d2824",
		"--omsk-tool-success-bg": "rgba(155, 199, 171, 0.045)",
		"--omsk-tool-error-bg": "rgba(230, 160, 154, 0.065)",
		"--omsk-tool-output": "#cec2b6",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#9bc7ab",
		"--omsk-tool-rail-error": "#e6a09a",
		"--omsk-md-heading": "#eee8e0",
		"--omsk-md-link": "#d6b18a",
		"--omsk-md-link-url": "#beafa1",
		"--omsk-md-code": "#deb0a1",
		"--omsk-md-code-block": "#eee8e0",
		"--omsk-md-code-block-border": "#4b4036",
		"--omsk-md-quote": "#cec2b6",
		"--omsk-md-quote-border": "#7b6857",
		"--omsk-md-hr": "#4b4036",
		"--omsk-md-list-bullet": "#beafa1",
		"--omsk-diff-added": "#9bc7ab",
		"--omsk-diff-added-bg": "rgba(155, 199, 171, 0.09)",
		"--omsk-diff-removed": "#e6a09a",
		"--omsk-diff-removed-bg": "rgba(230, 160, 154, 0.09)",
		"--omsk-diff-context": "#beafa1",
		"--omsk-syntax-comment": "#b3a496",
		"--omsk-syntax-keyword": "#a3bedb",
		"--omsk-syntax-function": "#91c5bf",
		"--omsk-syntax-variable": "#eee8e0",
		"--omsk-syntax-string": "#d4ba91",
		"--omsk-syntax-number": "#deb0a1",
		"--omsk-syntax-type": "#b9cdb1",
		"--omsk-syntax-operator": "#cec2b6",
		"--omsk-syntax-punctuation": "#beafa1",
		"--omsk-thinking-off": "#b3a496",
		"--omsk-thinking-minimal": "#beafa1",
		"--omsk-thinking-low": "#cec2b6",
		"--omsk-thinking-medium": "#d6b18a",
		"--omsk-thinking-high": "#e7caaa",
		"--omsk-thinking-xhigh": "#eee8e0",
		"--omsk-status-bg": "#1e1b18",
		"--omsk-status-model": "#cec2b6",
		"--omsk-status-path": "#beafa1",
		"--omsk-status-git-clean": "#9bc7ab",
		"--omsk-status-git-dirty": "#d7bc88",
		"--omsk-status-context": "#cec2b6",
		"--omsk-status-spend": "#cec2b6",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#beafa1",
		"--omsk-status-dim": "#b3a496",
		"--omsk-status-text": "#eee8e0",
		"--omsk-status-sep": "#4b4036",
		"--omsk-muted": "#beafa1",
		"--omsk-dim": "#b3a496",
		"--omsk-link": "#d6b18a",
		"--omsk-custom-msg-label": "#d6b18a",
		"--omsk-input-bg": "#2d2824",
		"--omsk-input-border": "#4b4036",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(214, 177, 138, 0.1)",
		"--omsk-btn-primary-bg": "#eee8e0",
		"--omsk-btn-primary-text": "#25211e",
		"--omsk-btn-secondary-bg": "#39312b",
		"--omsk-btn-secondary-text": "#eee8e0",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#25211e",
		"--omsk-badge-bg": "#39312b",
		"--omsk-badge-text": "#cec2b6",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(8, 12, 16, 0.62)",
		"--omsk-modal-bg": "#3d352f",
		"--omsk-modal-border": "#4b4036",
		"--omsk-toast-bg": "#3d352f",
		"--omsk-toast-text": "#eee8e0",
		"--omsk-toast-border": "#4b4036",
		"--omsk-progress-bg": "#39312b",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#1e1b18",
		"--omsk-sidebar-item-hover": "#39312b",
		"--omsk-sidebar-item-active": "rgba(214, 177, 138, 0.13)",
		"--omsk-selection-bg": "rgba(214, 177, 138, 0.25)",
		"--omsk-selection-text": "#eee8e0",
		"--omsk-scrollbar-thumb": "#7b6857",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(214, 177, 138, 0.04)",
		"--omsk-panel-bg": "#1e1b18",
		"--omsk-panel-border": "#3b332c",
		"--omsk-panel-header": "#beafa1",
		"--omsk-titlebar-bg": "#1e1b18",
		"--omsk-titlebar-text": "#eee8e0",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.16)",
		"--omsk-shadow-md": "0 6px 18px rgba(0, 0, 0, 0.22)",
		"--omsk-shadow-lg": "0 16px 48px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const gruvbox: ThemeDefinition = {
	label: "Ember",
	description: "Warm charcoal with a low, copper ember.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#dea28d",
		"--omsk-accent-bright": "#eac2b3",
		"--omsk-accent-dim": "rgba(222, 162, 141, 0.13)",
		"--omsk-accent-glow": "rgba(222, 162, 141, 0.16)",
		"--omsk-border": "#4c3d40",
		"--omsk-border-accent": "rgba(222, 162, 141, 0.52)",
		"--omsk-border-muted": "#3c3033",
		"--omsk-border-strong": "#7c5f64",
		"--omsk-success": "#9bc7ab",
		"--omsk-success-dim": "rgba(155, 199, 171, 0.08)",
		"--omsk-error": "#e6a09a",
		"--omsk-error-dim": "rgba(230, 160, 154, 0.08)",
		"--omsk-warning": "#d7bc88",
		"--omsk-warning-dim": "rgba(215, 188, 136, 0.08)",
		"--omsk-info": "#a2bfdc",
		"--omsk-info-dim": "rgba(162, 191, 220, 0.08)",
		"--omsk-text": "#f0e7e5",
		"--omsk-text-secondary": "#d0bfbd",
		"--omsk-bg-primary": "#241e20",
		"--omsk-bg-secondary": "#2c2527",
		"--omsk-bg-tertiary": "#392e30",
		"--omsk-bg-elevated": "#3e3235",
		"--omsk-selected-bg": "rgba(222, 162, 141, 0.12)",
		"--omsk-user-msg-bg": "#332929",
		"--omsk-user-msg-border": "#4e3c39",
		"--omsk-custom-msg-bg": "#2c2527",
		"--omsk-code-bg": "#2c2527",
		"--omsk-tool-pending-bg": "#2c2527",
		"--omsk-tool-success-bg": "rgba(155, 199, 171, 0.045)",
		"--omsk-tool-error-bg": "rgba(230, 160, 154, 0.065)",
		"--omsk-tool-output": "#d0bfbd",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#9bc7ab",
		"--omsk-tool-rail-error": "#e6a09a",
		"--omsk-md-heading": "#f0e7e5",
		"--omsk-md-link": "#dea28d",
		"--omsk-md-link-url": "#c0adaa",
		"--omsk-md-code": "#deb0a1",
		"--omsk-md-code-block": "#f0e7e5",
		"--omsk-md-code-block-border": "#4c3d40",
		"--omsk-md-quote": "#d0bfbd",
		"--omsk-md-quote-border": "#7c5f64",
		"--omsk-md-hr": "#4c3d40",
		"--omsk-md-list-bullet": "#c0adaa",
		"--omsk-diff-added": "#9bc7ab",
		"--omsk-diff-added-bg": "rgba(155, 199, 171, 0.09)",
		"--omsk-diff-removed": "#e6a09a",
		"--omsk-diff-removed-bg": "rgba(230, 160, 154, 0.09)",
		"--omsk-diff-context": "#c0adaa",
		"--omsk-syntax-comment": "#b9a39f",
		"--omsk-syntax-keyword": "#a3bedb",
		"--omsk-syntax-function": "#91c5bf",
		"--omsk-syntax-variable": "#f0e7e5",
		"--omsk-syntax-string": "#d4ba91",
		"--omsk-syntax-number": "#deb0a1",
		"--omsk-syntax-type": "#b9cdb1",
		"--omsk-syntax-operator": "#d0bfbd",
		"--omsk-syntax-punctuation": "#c0adaa",
		"--omsk-thinking-off": "#b9a39f",
		"--omsk-thinking-minimal": "#c0adaa",
		"--omsk-thinking-low": "#d0bfbd",
		"--omsk-thinking-medium": "#dea28d",
		"--omsk-thinking-high": "#eac2b3",
		"--omsk-thinking-xhigh": "#f0e7e5",
		"--omsk-status-bg": "#1c181a",
		"--omsk-status-model": "#d0bfbd",
		"--omsk-status-path": "#c0adaa",
		"--omsk-status-git-clean": "#9bc7ab",
		"--omsk-status-git-dirty": "#d7bc88",
		"--omsk-status-context": "#d0bfbd",
		"--omsk-status-spend": "#d0bfbd",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#c0adaa",
		"--omsk-status-dim": "#b9a39f",
		"--omsk-status-text": "#f0e7e5",
		"--omsk-status-sep": "#4c3d40",
		"--omsk-muted": "#c0adaa",
		"--omsk-dim": "#b9a39f",
		"--omsk-link": "#dea28d",
		"--omsk-custom-msg-label": "#dea28d",
		"--omsk-input-bg": "#2c2527",
		"--omsk-input-border": "#4c3d40",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(222, 162, 141, 0.1)",
		"--omsk-btn-primary-bg": "#f0e7e5",
		"--omsk-btn-primary-text": "#241e20",
		"--omsk-btn-secondary-bg": "#392e30",
		"--omsk-btn-secondary-text": "#f0e7e5",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#241e20",
		"--omsk-badge-bg": "#392e30",
		"--omsk-badge-text": "#d0bfbd",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(8, 12, 16, 0.62)",
		"--omsk-modal-bg": "#3e3235",
		"--omsk-modal-border": "#4c3d40",
		"--omsk-toast-bg": "#3e3235",
		"--omsk-toast-text": "#f0e7e5",
		"--omsk-toast-border": "#4c3d40",
		"--omsk-progress-bg": "#392e30",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#1c181a",
		"--omsk-sidebar-item-hover": "#392e30",
		"--omsk-sidebar-item-active": "rgba(222, 162, 141, 0.13)",
		"--omsk-selection-bg": "rgba(222, 162, 141, 0.25)",
		"--omsk-selection-text": "#f0e7e5",
		"--omsk-scrollbar-thumb": "#7c5f64",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(222, 162, 141, 0.04)",
		"--omsk-panel-bg": "#1c181a",
		"--omsk-panel-border": "#3c3033",
		"--omsk-panel-header": "#c0adaa",
		"--omsk-titlebar-bg": "#1c181a",
		"--omsk-titlebar-text": "#f0e7e5",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.16)",
		"--omsk-shadow-md": "0 6px 18px rgba(0, 0, 0, 0.22)",
		"--omsk-shadow-lg": "0 16px 48px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const frost: ThemeDefinition = {
	label: "Glacier",
	description: "Airy ice-white with a clear steel-blue accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#356987",
		"--omsk-accent-bright": "#2a5570",
		"--omsk-accent-dim": "rgba(53, 105, 135, 0.08)",
		"--omsk-accent-glow": "rgba(53, 105, 135, 0.16)",
		"--omsk-border": "#d2dfe5",
		"--omsk-border-accent": "rgba(53, 105, 135, 0.52)",
		"--omsk-border-muted": "#e0e9ed",
		"--omsk-border-strong": "#96aebc",
		"--omsk-success": "#326747",
		"--omsk-success-dim": "rgba(50, 103, 71, 0.08)",
		"--omsk-error": "#9f4545",
		"--omsk-error-dim": "rgba(159, 69, 69, 0.08)",
		"--omsk-warning": "#80601e",
		"--omsk-warning-dim": "rgba(128, 96, 30, 0.08)",
		"--omsk-info": "#315f83",
		"--omsk-info-dim": "rgba(49, 95, 131, 0.08)",
		"--omsk-text": "#26343c",
		"--omsk-text-secondary": "#4e606b",
		"--omsk-bg-primary": "#f7fafb",
		"--omsk-bg-secondary": "#eef4f6",
		"--omsk-bg-tertiary": "#e2eaee",
		"--omsk-bg-elevated": "#fcfeff",
		"--omsk-selected-bg": "rgba(53, 105, 135, 0.09)",
		"--omsk-user-msg-bg": "#e7eef2",
		"--omsk-user-msg-border": "#cbd9e1",
		"--omsk-custom-msg-bg": "#eef4f6",
		"--omsk-code-bg": "#eef4f6",
		"--omsk-tool-pending-bg": "#eef4f6",
		"--omsk-tool-success-bg": "rgba(50, 103, 71, 0.045)",
		"--omsk-tool-error-bg": "rgba(159, 69, 69, 0.065)",
		"--omsk-tool-output": "#4e606b",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#326747",
		"--omsk-tool-rail-error": "#9f4545",
		"--omsk-md-heading": "#26343c",
		"--omsk-md-link": "#356987",
		"--omsk-md-link-url": "#566872",
		"--omsk-md-code": "#944c42",
		"--omsk-md-code-block": "#26343c",
		"--omsk-md-code-block-border": "#d2dfe5",
		"--omsk-md-quote": "#4e606b",
		"--omsk-md-quote-border": "#96aebc",
		"--omsk-md-hr": "#d2dfe5",
		"--omsk-md-list-bullet": "#566872",
		"--omsk-diff-added": "#326747",
		"--omsk-diff-added-bg": "rgba(50, 103, 71, 0.07)",
		"--omsk-diff-removed": "#9f4545",
		"--omsk-diff-removed-bg": "rgba(159, 69, 69, 0.07)",
		"--omsk-diff-context": "#566872",
		"--omsk-syntax-comment": "#586a74",
		"--omsk-syntax-keyword": "#315f83",
		"--omsk-syntax-function": "#2b655f",
		"--omsk-syntax-variable": "#26343c",
		"--omsk-syntax-string": "#805c2e",
		"--omsk-syntax-number": "#944c42",
		"--omsk-syntax-type": "#516939",
		"--omsk-syntax-operator": "#4e606b",
		"--omsk-syntax-punctuation": "#566872",
		"--omsk-thinking-off": "#586a74",
		"--omsk-thinking-minimal": "#566872",
		"--omsk-thinking-low": "#4e606b",
		"--omsk-thinking-medium": "#356987",
		"--omsk-thinking-high": "#2a5570",
		"--omsk-thinking-xhigh": "#26343c",
		"--omsk-status-bg": "#edf2f4",
		"--omsk-status-model": "#4e606b",
		"--omsk-status-path": "#566872",
		"--omsk-status-git-clean": "#326747",
		"--omsk-status-git-dirty": "#80601e",
		"--omsk-status-context": "#4e606b",
		"--omsk-status-spend": "#4e606b",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#566872",
		"--omsk-status-dim": "#586a74",
		"--omsk-status-text": "#26343c",
		"--omsk-status-sep": "#d2dfe5",
		"--omsk-muted": "#566872",
		"--omsk-dim": "#586a74",
		"--omsk-link": "#356987",
		"--omsk-custom-msg-label": "#356987",
		"--omsk-input-bg": "#fcfeff",
		"--omsk-input-border": "#d2dfe5",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(53, 105, 135, 0.1)",
		"--omsk-btn-primary-bg": "#26343c",
		"--omsk-btn-primary-text": "#f7fafb",
		"--omsk-btn-secondary-bg": "#e2eaee",
		"--omsk-btn-secondary-text": "#26343c",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#e2eaee",
		"--omsk-badge-text": "#4e606b",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(20, 28, 32, 0.28)",
		"--omsk-modal-bg": "#fcfeff",
		"--omsk-modal-border": "#d2dfe5",
		"--omsk-toast-bg": "#fcfeff",
		"--omsk-toast-text": "#26343c",
		"--omsk-toast-border": "#d2dfe5",
		"--omsk-progress-bg": "#e2eaee",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#edf2f4",
		"--omsk-sidebar-item-hover": "#e2eaee",
		"--omsk-sidebar-item-active": "rgba(53, 105, 135, 0.1)",
		"--omsk-selection-bg": "rgba(53, 105, 135, 0.19)",
		"--omsk-selection-text": "#26343c",
		"--omsk-scrollbar-thumb": "#96aebc",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(53, 105, 135, 0.04)",
		"--omsk-panel-bg": "#edf2f4",
		"--omsk-panel-border": "#e0e9ed",
		"--omsk-panel-header": "#566872",
		"--omsk-titlebar-bg": "#edf2f4",
		"--omsk-titlebar-text": "#26343c",
		"--omsk-shadow-sm": "0 1px 2px rgba(32, 40, 48, 0.035)",
		"--omsk-shadow-md": "0 6px 18px rgba(32, 40, 48, 0.07)",
		"--omsk-shadow-lg": "0 16px 48px rgba(32, 40, 48, 0.13)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const matcha: ThemeDefinition = {
	label: "Sage",
	description: "Quiet chalk green and a natural sage accent.",
	scheme: "light",
	tokens: {
		"--omsk-accent": "#466d51",
		"--omsk-accent-bright": "#395941",
		"--omsk-accent-dim": "rgba(70, 109, 81, 0.08)",
		"--omsk-accent-glow": "rgba(70, 109, 81, 0.16)",
		"--omsk-border": "#d6dfd0",
		"--omsk-border-accent": "rgba(70, 109, 81, 0.52)",
		"--omsk-border-muted": "#e3eade",
		"--omsk-border-strong": "#a4b49a",
		"--omsk-success": "#326747",
		"--omsk-success-dim": "rgba(50, 103, 71, 0.08)",
		"--omsk-error": "#9f4545",
		"--omsk-error-dim": "rgba(159, 69, 69, 0.08)",
		"--omsk-warning": "#80601e",
		"--omsk-warning-dim": "rgba(128, 96, 30, 0.08)",
		"--omsk-info": "#315f83",
		"--omsk-info-dim": "rgba(49, 95, 131, 0.08)",
		"--omsk-text": "#2c352c",
		"--omsk-text-secondary": "#54614f",
		"--omsk-bg-primary": "#f8faf7",
		"--omsk-bg-secondary": "#f0f4ed",
		"--omsk-bg-tertiary": "#e3eadf",
		"--omsk-bg-elevated": "#fcfdfa",
		"--omsk-selected-bg": "rgba(70, 109, 81, 0.09)",
		"--omsk-user-msg-bg": "#eaefea",
		"--omsk-user-msg-border": "#d0dad2",
		"--omsk-custom-msg-bg": "#f0f4ed",
		"--omsk-code-bg": "#f0f4ed",
		"--omsk-tool-pending-bg": "#f0f4ed",
		"--omsk-tool-success-bg": "rgba(50, 103, 71, 0.045)",
		"--omsk-tool-error-bg": "rgba(159, 69, 69, 0.065)",
		"--omsk-tool-output": "#54614f",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#326747",
		"--omsk-tool-rail-error": "#9f4545",
		"--omsk-md-heading": "#2c352c",
		"--omsk-md-link": "#466d51",
		"--omsk-md-link-url": "#5e6958",
		"--omsk-md-code": "#944c42",
		"--omsk-md-code-block": "#2c352c",
		"--omsk-md-code-block-border": "#d6dfd0",
		"--omsk-md-quote": "#54614f",
		"--omsk-md-quote-border": "#a4b49a",
		"--omsk-md-hr": "#d6dfd0",
		"--omsk-md-list-bullet": "#5e6958",
		"--omsk-diff-added": "#326747",
		"--omsk-diff-added-bg": "rgba(50, 103, 71, 0.07)",
		"--omsk-diff-removed": "#9f4545",
		"--omsk-diff-removed-bg": "rgba(159, 69, 69, 0.07)",
		"--omsk-diff-context": "#5e6958",
		"--omsk-syntax-comment": "#5e6b58",
		"--omsk-syntax-keyword": "#315f83",
		"--omsk-syntax-function": "#2b655f",
		"--omsk-syntax-variable": "#2c352c",
		"--omsk-syntax-string": "#805c2e",
		"--omsk-syntax-number": "#944c42",
		"--omsk-syntax-type": "#516939",
		"--omsk-syntax-operator": "#54614f",
		"--omsk-syntax-punctuation": "#5e6958",
		"--omsk-thinking-off": "#5e6b58",
		"--omsk-thinking-minimal": "#5e6958",
		"--omsk-thinking-low": "#54614f",
		"--omsk-thinking-medium": "#466d51",
		"--omsk-thinking-high": "#395941",
		"--omsk-thinking-xhigh": "#2c352c",
		"--omsk-status-bg": "#eef2eb",
		"--omsk-status-model": "#54614f",
		"--omsk-status-path": "#5e6958",
		"--omsk-status-git-clean": "#326747",
		"--omsk-status-git-dirty": "#80601e",
		"--omsk-status-context": "#54614f",
		"--omsk-status-spend": "#54614f",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#5e6958",
		"--omsk-status-dim": "#5e6b58",
		"--omsk-status-text": "#2c352c",
		"--omsk-status-sep": "#d6dfd0",
		"--omsk-muted": "#5e6958",
		"--omsk-dim": "#5e6b58",
		"--omsk-link": "#466d51",
		"--omsk-custom-msg-label": "#466d51",
		"--omsk-input-bg": "#fcfdfa",
		"--omsk-input-border": "#d6dfd0",
		"--omsk-input-focus-border": "var(--omsk-accent)",
		"--omsk-input-glow": "rgba(70, 109, 81, 0.1)",
		"--omsk-btn-primary-bg": "#2c352c",
		"--omsk-btn-primary-text": "#f8faf7",
		"--omsk-btn-secondary-bg": "#e3eadf",
		"--omsk-btn-secondary-text": "#2c352c",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#ffffff",
		"--omsk-badge-bg": "#e3eadf",
		"--omsk-badge-text": "#54614f",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(20, 28, 32, 0.28)",
		"--omsk-modal-bg": "#fcfdfa",
		"--omsk-modal-border": "#d6dfd0",
		"--omsk-toast-bg": "#fcfdfa",
		"--omsk-toast-text": "#2c352c",
		"--omsk-toast-border": "#d6dfd0",
		"--omsk-progress-bg": "#e3eadf",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#eef2eb",
		"--omsk-sidebar-item-hover": "#e3eadf",
		"--omsk-sidebar-item-active": "rgba(70, 109, 81, 0.1)",
		"--omsk-selection-bg": "rgba(70, 109, 81, 0.19)",
		"--omsk-selection-text": "#2c352c",
		"--omsk-scrollbar-thumb": "#a4b49a",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(70, 109, 81, 0.04)",
		"--omsk-panel-bg": "#eef2eb",
		"--omsk-panel-border": "#e3eade",
		"--omsk-panel-header": "#5e6958",
		"--omsk-titlebar-bg": "#eef2eb",
		"--omsk-titlebar-text": "#2c352c",
		"--omsk-shadow-sm": "0 1px 2px rgba(32, 40, 48, 0.035)",
		"--omsk-shadow-md": "0 6px 18px rgba(32, 40, 48, 0.07)",
		"--omsk-shadow-lg": "0 16px 48px rgba(32, 40, 48, 0.13)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const rosePine: ThemeDefinition = {
	label: "Rosé Pine",
	description: "Muted violet night with rose, foam, and iris accents.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#c4a7e7",
		"--omsk-accent-bright": "#dccaf2",
		"--omsk-accent-dim": "rgba(196, 167, 231, 0.14)",
		"--omsk-accent-glow": "rgba(196, 167, 231, 0.18)",
		"--omsk-border": "#2f2c43",
		"--omsk-border-accent": "rgba(196, 167, 231, 0.5)",
		"--omsk-border-muted": "#26233a",
		"--omsk-border-strong": "#403d52",
		"--omsk-success": "#9ccfd8",
		"--omsk-success-dim": "rgba(156, 207, 216, 0.1)",
		"--omsk-error": "#eb6f92",
		"--omsk-error-dim": "rgba(235, 111, 146, 0.1)",
		"--omsk-warning": "#f6c177",
		"--omsk-warning-dim": "rgba(246, 193, 119, 0.1)",
		"--omsk-info": "#c4a7e7",
		"--omsk-info-dim": "rgba(196, 167, 231, 0.1)",
		"--omsk-text": "#e0def4",
		"--omsk-text-secondary": "#908caa",
		"--omsk-bg-primary": "#191724",
		"--omsk-bg-secondary": "#1f1d2e",
		"--omsk-bg-tertiary": "#26233a",
		"--omsk-bg-elevated": "#232136",
		"--omsk-selected-bg": "rgba(110, 106, 134, 0.16)",
		"--omsk-user-msg-bg": "#272334",
		"--omsk-user-msg-border": "#403851",
		"--omsk-custom-msg-bg": "#1f1d2e",
		"--omsk-code-bg": "#16141f",
		"--omsk-tool-pending-bg": "#1f1d2e",
		"--omsk-tool-success-bg": "rgba(156, 207, 216, 0.04)",
		"--omsk-tool-error-bg": "rgba(235, 111, 146, 0.06)",
		"--omsk-tool-output": "#908caa",
		"--omsk-tool-rail-running": "var(--omsk-accent)",
		"--omsk-tool-rail-done": "#9ccfd8",
		"--omsk-tool-rail-error": "#eb6f92",
		"--omsk-md-heading": "#ebbcba",
		"--omsk-md-link": "#9ccfd8",
		"--omsk-md-link-url": "#908caa",
		"--omsk-md-code": "#f6c177",
		"--omsk-md-code-block": "#e0def4",
		"--omsk-md-code-block-border": "#26233a",
		"--omsk-md-quote": "#908caa",
		"--omsk-md-quote-border": "#403d52",
		"--omsk-md-hr": "#26233a",
		"--omsk-md-list-bullet": "#c4a7e7",
		"--omsk-diff-added": "#9ccfd8",
		"--omsk-diff-added-bg": "rgba(156, 207, 216, 0.1)",
		"--omsk-diff-removed": "#eb6f92",
		"--omsk-diff-removed-bg": "rgba(235, 111, 146, 0.1)",
		"--omsk-diff-context": "#908caa",
		"--omsk-syntax-comment": "#817c9c",
		"--omsk-syntax-keyword": "#3e8fb0",
		"--omsk-syntax-function": "#ebbcba",
		"--omsk-syntax-variable": "#e0def4",
		"--omsk-syntax-string": "#f6c177",
		"--omsk-syntax-number": "#f6c177",
		"--omsk-syntax-type": "#9ccfd8",
		"--omsk-syntax-operator": "#908caa",
		"--omsk-syntax-punctuation": "#908caa",
		"--omsk-thinking-off": "#524f67",
		"--omsk-thinking-minimal": "#6e6a86",
		"--omsk-thinking-low": "#908caa",
		"--omsk-thinking-medium": "#9ccfd8",
		"--omsk-thinking-high": "#c4a7e7",
		"--omsk-thinking-xhigh": "#ebbcba",
		"--omsk-status-bg": "#1f1d2e",
		"--omsk-status-model": "#908caa",
		"--omsk-status-path": "#908caa",
		"--omsk-status-git-clean": "#9ccfd8",
		"--omsk-status-git-dirty": "#f6c177",
		"--omsk-status-context": "#908caa",
		"--omsk-status-spend": "#908caa",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#908caa",
		"--omsk-status-dim": "#817c9c",
		"--omsk-status-text": "#e0def4",
		"--omsk-status-sep": "#26233a",
		"--omsk-muted": "#908caa",
		"--omsk-dim": "#908caa",
		"--omsk-link": "#9ccfd8",
		"--omsk-custom-msg-label": "#ebbcba",
		"--omsk-input-bg": "#1f1d2e",
		"--omsk-input-border": "#2f2c43",
		"--omsk-input-focus-border": "#524f67",
		"--omsk-input-glow": "rgba(196, 167, 231, 0.06)",
		"--omsk-btn-primary-bg": "#ebbcba",
		"--omsk-btn-primary-text": "#191724",
		"--omsk-btn-secondary-bg": "#26233a",
		"--omsk-btn-secondary-text": "#e0def4",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#191724",
		"--omsk-badge-bg": "#26233a",
		"--omsk-badge-text": "#908caa",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(12, 11, 18, 0.6)",
		"--omsk-modal-bg": "#1f1d2e",
		"--omsk-modal-border": "#403d52",
		"--omsk-toast-bg": "#26233a",
		"--omsk-toast-text": "#e0def4",
		"--omsk-toast-border": "#403d52",
		"--omsk-progress-bg": "#26233a",
		"--omsk-progress-fill": "var(--omsk-accent)",
		"--omsk-sidebar-bg": "#1f1d2e",
		"--omsk-sidebar-item-hover": "rgba(110, 106, 134, 0.12)",
		"--omsk-sidebar-item-active": "rgba(196, 167, 231, 0.12)",
		"--omsk-selection-bg": "#403d52",
		"--omsk-selection-text": "#e0def4",
		"--omsk-scrollbar-thumb": "#403d52",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "var(--omsk-accent)",
		"--omsk-streaming-highlight": "rgba(196, 167, 231, 0.04)",
		"--omsk-panel-bg": "#1f1d2e",
		"--omsk-panel-border": "#26233a",
		"--omsk-panel-header": "#908caa",
		"--omsk-titlebar-bg": "#191724",
		"--omsk-titlebar-text": "#e0def4",
		"--omsk-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.24)",
		"--omsk-shadow-md": "0 8px 24px rgba(0, 0, 0, 0.32)",
		"--omsk-shadow-lg": "0 20px 56px rgba(0, 0, 0, 0.48)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const sharkOcean: ThemeDefinition = {
	label: "Shark Ocean",
	description: "OMSK void-obsidian depth with Telemetry Cyan, Shark Aqua, and OMSK Flame accents.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#38BDF8",
		"--omsk-accent-bright": "#00E5FF",
		"--omsk-accent-dim": "rgba(56, 189, 248, 0.14)",
		"--omsk-accent-glow": "rgba(0, 229, 255, 0.22)",
		"--omsk-border": "#1E293B",
		"--omsk-border-accent": "rgba(0, 229, 255, 0.52)",
		"--omsk-border-muted": "#161E2C",
		"--omsk-border-strong": "#334155",
		"--omsk-success": "#00E676",
		"--omsk-success-dim": "rgba(0, 230, 118, 0.12)",
		"--omsk-error": "#FF6B6B",
		"--omsk-error-dim": "rgba(255, 107, 107, 0.12)",
		"--omsk-warning": "#FF8A4C",
		"--omsk-warning-dim": "rgba(255, 85, 0, 0.14)",
		"--omsk-info": "#00E5FF",
		"--omsk-info-dim": "rgba(0, 229, 255, 0.12)",
		"--omsk-text": "#F1F5F9",
		"--omsk-text-secondary": "#CBD5E1",
		"--omsk-bg-primary": "#0A0C10",
		"--omsk-bg-secondary": "#12161F",
		"--omsk-bg-tertiary": "#181E2A",
		"--omsk-bg-elevated": "#12161F",
		"--omsk-selected-bg": "rgba(56, 189, 248, 0.14)",
		"--omsk-user-msg-bg": "#101926",
		"--omsk-user-msg-border": "#1E3A5F",
		"--omsk-custom-msg-bg": "#12161F",
		"--omsk-code-bg": "#06070A",
		"--omsk-tool-pending-bg": "#12161F",
		"--omsk-tool-success-bg": "rgba(0, 230, 118, 0.05)",
		"--omsk-tool-error-bg": "rgba(255, 107, 107, 0.07)",
		"--omsk-tool-output": "#CBD5E1",
		"--omsk-tool-rail-running": "var(--omsk-accent-bright)",
		"--omsk-tool-rail-done": "#00E676",
		"--omsk-tool-rail-error": "#FF6B6B",
		"--omsk-md-heading": "#F8FAFC",
		"--omsk-md-link": "#00E5FF",
		"--omsk-md-link-url": "#9FB0C7",
		"--omsk-md-code": "#38BDF8",
		"--omsk-md-code-block": "#F1F5F9",
		"--omsk-md-code-block-border": "#1E293B",
		"--omsk-md-quote": "#CBD5E1",
		"--omsk-md-quote-border": "#38BDF8",
		"--omsk-md-hr": "#1E293B",
		"--omsk-md-list-bullet": "#00E5FF",
		"--omsk-diff-added": "#00E676",
		"--omsk-diff-added-bg": "rgba(0, 230, 118, 0.12)",
		"--omsk-diff-removed": "#FF6B6B",
		"--omsk-diff-removed-bg": "rgba(255, 107, 107, 0.12)",
		"--omsk-diff-context": "#9FB0C7",
		"--omsk-syntax-comment": "#8B9BB2",
		"--omsk-syntax-keyword": "#38BDF8",
		"--omsk-syntax-function": "#A855F7",
		"--omsk-syntax-variable": "#F1F5F9",
		"--omsk-syntax-string": "#00E676",
		"--omsk-syntax-number": "#FF7029",
		"--omsk-syntax-type": "#00E5FF",
		"--omsk-syntax-operator": "#CBD5E1",
		"--omsk-syntax-punctuation": "#9FB0C7",
		"--omsk-thinking-off": "#8C9AB0",
		"--omsk-thinking-minimal": "#9FB0C7",
		"--omsk-thinking-low": "#CBD5E1",
		"--omsk-thinking-medium": "#38BDF8",
		"--omsk-thinking-high": "#00E5FF",
		"--omsk-thinking-xhigh": "#FF8A4C",
		"--omsk-status-bg": "#06070A",
		"--omsk-status-model": "#CBD5E1",
		"--omsk-status-path": "#9FB0C7",
		"--omsk-status-git-clean": "#00E676",
		"--omsk-status-git-dirty": "#FF8A4C",
		"--omsk-status-context": "#CBD5E1",
		"--omsk-status-spend": "#CBD5E1",
		"--omsk-status-subagents": "var(--omsk-accent-bright)",
		"--omsk-status-muted": "#9FB0C7",
		"--omsk-status-dim": "#8C9AB0",
		"--omsk-status-text": "#F1F5F9",
		"--omsk-status-sep": "#1E293B",
		"--omsk-muted": "#9FB0C7",
		"--omsk-dim": "#8C9AB0",
		"--omsk-link": "#00E5FF",
		"--omsk-custom-msg-label": "#00E5FF",
		"--omsk-input-bg": "#12161F",
		"--omsk-input-border": "#1E293B",
		"--omsk-input-focus-border": "#00E5FF",
		"--omsk-input-glow": "rgba(0, 229, 255, 0.14)",
		"--omsk-btn-primary-bg": "#00E5FF",
		"--omsk-btn-primary-text": "#06070A",
		"--omsk-btn-secondary-bg": "#181E2A",
		"--omsk-btn-secondary-text": "#F1F5F9",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#06070A",
		"--omsk-badge-bg": "#181E2A",
		"--omsk-badge-text": "#CBD5E1",
		"--omsk-badge-accent": "var(--omsk-accent-bright)",
		"--omsk-overlay-bg": "rgba(2, 4, 8, 0.72)",
		"--omsk-modal-bg": "#12161F",
		"--omsk-modal-border": "#1E293B",
		"--omsk-toast-bg": "#12161F",
		"--omsk-toast-text": "#F1F5F9",
		"--omsk-toast-border": "#1E293B",
		"--omsk-progress-bg": "#181E2A",
		"--omsk-progress-fill": "#00E5FF",
		"--omsk-sidebar-bg": "#06070A",
		"--omsk-sidebar-item-hover": "rgba(56, 189, 248, 0.08)",
		"--omsk-sidebar-item-active": "rgba(0, 229, 255, 0.14)",
		"--omsk-selection-bg": "rgba(56, 189, 248, 0.28)",
		"--omsk-selection-text": "#F8FAFC",
		"--omsk-scrollbar-thumb": "#334155",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "#00E5FF",
		"--omsk-streaming-highlight": "rgba(0, 229, 255, 0.05)",
		"--omsk-panel-bg": "#06070A",
		"--omsk-panel-border": "#161E2C",
		"--omsk-panel-header": "#9FB0C7",
		"--omsk-titlebar-bg": "#0A0C10",
		"--omsk-titlebar-text": "#F1F5F9",
		"--omsk-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.4)",
		"--omsk-shadow-md": "0 8px 24px rgba(0, 0, 0, 0.52)",
		"--omsk-shadow-lg": "0 20px 56px rgba(0, 0, 0, 0.68)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const deepAbyss: ThemeDefinition = {
	label: "Deep Abyss",
	description: "Ultra-deep pelagic night with bioluminescent cyan, flame orange, and emerald telemetry.",
	scheme: "dark",
	tokens: {
		"--omsk-accent": "#00E5FF",
		"--omsk-accent-bright": "#67E8F9",
		"--omsk-accent-dim": "rgba(0, 229, 255, 0.14)",
		"--omsk-accent-glow": "rgba(0, 229, 255, 0.24)",
		"--omsk-border": "#17253D",
		"--omsk-border-accent": "rgba(0, 229, 255, 0.55)",
		"--omsk-border-muted": "#101B2E",
		"--omsk-border-strong": "#274066",
		"--omsk-success": "#00E676",
		"--omsk-success-dim": "rgba(0, 230, 118, 0.12)",
		"--omsk-error": "#FF6B6B",
		"--omsk-error-dim": "rgba(255, 107, 107, 0.12)",
		"--omsk-warning": "#FF7029",
		"--omsk-warning-dim": "rgba(255, 85, 0, 0.14)",
		"--omsk-info": "#38BDF8",
		"--omsk-info-dim": "rgba(56, 189, 248, 0.12)",
		"--omsk-text": "#E6F4F8",
		"--omsk-text-secondary": "#B8D4E3",
		"--omsk-bg-primary": "#05080F",
		"--omsk-bg-secondary": "#0B111E",
		"--omsk-bg-tertiary": "#101A2D",
		"--omsk-bg-elevated": "#0E1626",
		"--omsk-selected-bg": "rgba(0, 229, 255, 0.14)",
		"--omsk-user-msg-bg": "#0B1526",
		"--omsk-user-msg-border": "#163052",
		"--omsk-custom-msg-bg": "#0B111E",
		"--omsk-code-bg": "#030508",
		"--omsk-tool-pending-bg": "#0B111E",
		"--omsk-tool-success-bg": "rgba(0, 230, 118, 0.05)",
		"--omsk-tool-error-bg": "rgba(255, 107, 107, 0.07)",
		"--omsk-tool-output": "#B8D4E3",
		"--omsk-tool-rail-running": "#00E5FF",
		"--omsk-tool-rail-done": "#00E676",
		"--omsk-tool-rail-error": "#FF6B6B",
		"--omsk-md-heading": "#F0FAFD",
		"--omsk-md-link": "#67E8F9",
		"--omsk-md-link-url": "#93B5C9",
		"--omsk-md-code": "#00E5FF",
		"--omsk-md-code-block": "#E6F4F8",
		"--omsk-md-code-block-border": "#17253D",
		"--omsk-md-quote": "#B8D4E3",
		"--omsk-md-quote-border": "#00E5FF",
		"--omsk-md-hr": "#17253D",
		"--omsk-md-list-bullet": "#38BDF8",
		"--omsk-diff-added": "#00E676",
		"--omsk-diff-added-bg": "rgba(0, 230, 118, 0.12)",
		"--omsk-diff-removed": "#FF6B6B",
		"--omsk-diff-removed-bg": "rgba(255, 107, 107, 0.12)",
		"--omsk-diff-context": "#93B5C9",
		"--omsk-syntax-comment": "#83A4BA",
		"--omsk-syntax-keyword": "#38BDF8",
		"--omsk-syntax-function": "#B47AFF",
		"--omsk-syntax-variable": "#E6F4F8",
		"--omsk-syntax-string": "#00E676",
		"--omsk-syntax-number": "#FF7029",
		"--omsk-syntax-type": "#00E5FF",
		"--omsk-syntax-operator": "#B8D4E3",
		"--omsk-syntax-punctuation": "#93B5C9",
		"--omsk-thinking-off": "#83A4BA",
		"--omsk-thinking-minimal": "#93B5C9",
		"--omsk-thinking-low": "#B8D4E3",
		"--omsk-thinking-medium": "#38BDF8",
		"--omsk-thinking-high": "#00E5FF",
		"--omsk-thinking-xhigh": "#FF7029",
		"--omsk-status-bg": "#030508",
		"--omsk-status-model": "#B8D4E3",
		"--omsk-status-path": "#93B5C9",
		"--omsk-status-git-clean": "#00E676",
		"--omsk-status-git-dirty": "#FF7029",
		"--omsk-status-context": "#B8D4E3",
		"--omsk-status-spend": "#B8D4E3",
		"--omsk-status-subagents": "var(--omsk-accent)",
		"--omsk-status-muted": "#93B5C9",
		"--omsk-status-dim": "#83A4BA",
		"--omsk-status-text": "#E6F4F8",
		"--omsk-status-sep": "#17253D",
		"--omsk-muted": "#93B5C9",
		"--omsk-dim": "#83A4BA",
		"--omsk-link": "#67E8F9",
		"--omsk-custom-msg-label": "#38BDF8",
		"--omsk-input-bg": "#0B111E",
		"--omsk-input-border": "#17253D",
		"--omsk-input-focus-border": "#00E5FF",
		"--omsk-input-glow": "rgba(0, 229, 255, 0.16)",
		"--omsk-btn-primary-bg": "#38BDF8",
		"--omsk-btn-primary-text": "#030508",
		"--omsk-btn-secondary-bg": "#101A2D",
		"--omsk-btn-secondary-text": "#E6F4F8",
		"--omsk-btn-danger-bg": "var(--omsk-error)",
		"--omsk-btn-danger-text": "#030508",
		"--omsk-badge-bg": "#101A2D",
		"--omsk-badge-text": "#B8D4E3",
		"--omsk-badge-accent": "var(--omsk-accent)",
		"--omsk-overlay-bg": "rgba(1, 3, 7, 0.76)",
		"--omsk-modal-bg": "#0E1626",
		"--omsk-modal-border": "#17253D",
		"--omsk-toast-bg": "#0E1626",
		"--omsk-toast-text": "#E6F4F8",
		"--omsk-toast-border": "#17253D",
		"--omsk-progress-bg": "#101A2D",
		"--omsk-progress-fill": "#00E5FF",
		"--omsk-sidebar-bg": "#030508",
		"--omsk-sidebar-item-hover": "rgba(0, 229, 255, 0.08)",
		"--omsk-sidebar-item-active": "rgba(0, 229, 255, 0.15)",
		"--omsk-selection-bg": "rgba(0, 229, 255, 0.25)",
		"--omsk-selection-text": "#F0FAFD",
		"--omsk-scrollbar-thumb": "#274066",
		"--omsk-scrollbar-track": "transparent",
		"--omsk-streaming-cursor": "#00E5FF",
		"--omsk-streaming-highlight": "rgba(0, 229, 255, 0.05)",
		"--omsk-panel-bg": "#030508",
		"--omsk-panel-border": "#101B2E",
		"--omsk-panel-header": "#93B5C9",
		"--omsk-titlebar-bg": "#05080F",
		"--omsk-titlebar-text": "#E6F4F8",
		"--omsk-shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.45)",
		"--omsk-shadow-md": "0 8px 24px rgba(0, 0, 0, 0.58)",
		"--omsk-shadow-lg": "0 20px 56px rgba(0, 0, 0, 0.74)",
		"--omsk-shadow-glow": "0 0 0 1px var(--omsk-border-accent)",
	},
};

const bioluminescentReef: ThemeDefinition = {
	label: "Bioluminescent Reef",
	description: "Deep pelagic teal illuminated by electric mint and sea-foam bioluminescence.",
	scheme: "dark",
	tokens: {
		...sharkOcean.tokens,
		"--omsk-accent": "#2DD4BF",
		"--omsk-accent-bright": "#5EEAD4",
		"--omsk-accent-dim": "rgba(45, 212, 191, 0.14)",
		"--omsk-accent-glow": "rgba(94, 234, 212, 0.24)",
		"--omsk-border": "#133238",
		"--omsk-border-accent": "rgba(45, 212, 191, 0.54)",
		"--omsk-border-muted": "#0D2429",
		"--omsk-bg-primary": "#051216",
		"--omsk-bg-secondary": "#0A1D23",
		"--omsk-bg-tertiary": "#102A32",
		"--omsk-bg-elevated": "#0C2128",
		"--omsk-selected-bg": "rgba(45, 212, 191, 0.16)",
		"--omsk-user-msg-bg": "#0B242B",
		"--omsk-user-msg-border": "#154954",
		"--omsk-code-bg": "#030B0E",
		"--omsk-panel-bg": "#040E12",
		"--omsk-titlebar-bg": "#051216",
		"--omsk-status-bg": "#040E12",
	},
};

const crimsonTrench: ThemeDefinition = {
	label: "Crimson Trench",
	description: "Volcanic obsidian trench lit by coral-amber flare and deep ocean slate.",
	scheme: "dark",
	tokens: {
		...sharkOcean.tokens,
		"--omsk-accent": "#FB7185",
		"--omsk-accent-bright": "#FDA4AF",
		"--omsk-accent-dim": "rgba(251, 113, 133, 0.14)",
		"--omsk-accent-glow": "rgba(255, 85, 0, 0.24)",
		"--omsk-border": "#2E1C24",
		"--omsk-border-accent": "rgba(251, 113, 133, 0.5)",
		"--omsk-border-muted": "#21141A",
		"--omsk-bg-primary": "#0B070A",
		"--omsk-bg-secondary": "#150D12",
		"--omsk-bg-tertiary": "#1F141B",
		"--omsk-bg-elevated": "#180F14",
		"--omsk-selected-bg": "rgba(251, 113, 133, 0.14)",
		"--omsk-user-msg-bg": "#1A1016",
		"--omsk-user-msg-border": "#442230",
		"--omsk-code-bg": "#060406",
		"--omsk-panel-bg": "#080507",
		"--omsk-titlebar-bg": "#0B070A",
		"--omsk-status-bg": "#080507",
	},
};

const midnightObsidian: ThemeDefinition = {
	label: "Midnight Obsidian",
	description: "Carbon obsidian dark workspace with electric ultraviolet and aqua highlights.",
	scheme: "dark",
	tokens: {
		...sharkOcean.tokens,
		"--omsk-accent": "#A855F7",
		"--omsk-accent-bright": "#C084FC",
		"--omsk-accent-dim": "rgba(168, 85, 247, 0.15)",
		"--omsk-accent-glow": "rgba(168, 85, 247, 0.26)",
		"--omsk-border": "#242038",
		"--omsk-border-accent": "rgba(192, 132, 252, 0.52)",
		"--omsk-border-muted": "#191628",
		"--omsk-bg-primary": "#07070D",
		"--omsk-bg-secondary": "#100F1B",
		"--omsk-bg-tertiary": "#171526",
		"--omsk-bg-elevated": "#121120",
		"--omsk-selected-bg": "rgba(168, 85, 247, 0.16)",
		"--omsk-user-msg-bg": "#141224",
		"--omsk-user-msg-border": "#302854",
		"--omsk-code-bg": "#040408",
		"--omsk-panel-bg": "#05050A",
		"--omsk-titlebar-bg": "#07070D",
		"--omsk-status-bg": "#05050A",
	},
};

// Selection IDs remain stable so existing preferences survive the redesign.
export const THEMES = {
	sharkOcean,
	deepAbyss,
	bioluminescentReef,
	crimsonTrench,
	midnightObsidian,
	dark,
	titanium,
	nord,
	latte,
	gruvbox,
	rosePine,
	light,
	paper,
	solarized,
	dawn,
	frost,
	matcha,
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeName = keyof typeof THEMES;

/** A theme file in the custom themes folder, by file name without `.json`. */
export type CustomThemeSelection = `custom:${string}`;

/** A picker selection: a named theme, a custom theme file, or "system" to follow the OS. */
export type ThemeSelection = ThemeName | CustomThemeSelection | "system";

export function isCustomThemeSelection(value: string): value is CustomThemeSelection {
	return value.startsWith("custom:") && value.length > "custom:".length;
}

export function isThemeSelection(value: unknown): value is ThemeSelection {
	return (
		typeof value === "string" && (value === "system" || Object.hasOwn(THEMES, value) || isCustomThemeSelection(value))
	);
}

/** Custom themes read from disk, already checked and filled from their base theme. */
const customThemes = new Map<CustomThemeSelection, ThemeDefinition>();
/** Whether the theme files have been read once; until then a custom selection waits for them. */
let customThemesLoaded = false;
/** The selection on screen; a custom one is re-applied when its file changes. */
let shownSelection: ThemeSelection | null = null;

export function customTheme(selection: CustomThemeSelection): ThemeDefinition | undefined {
	return customThemes.get(selection);
}

/**
 * Replaces the custom theme set. A custom theme on screen follows its file:
 * an edit shows at once, and a removed or broken file falls back to the
 * built-in theme of the last scheme until it comes back.
 */
export function setCustomThemes(themes: ReadonlyMap<CustomThemeSelection, ThemeDefinition>): void {
	customThemes.clear();
	for (const [selection, theme] of themes) customThemes.set(selection, theme);
	customThemesLoaded = true;
	if (shownSelection && isCustomThemeSelection(shownSelection)) {
		const theme = showSelection(shownSelection);
		// The file is what is on screen now: the next launch paints it first.
		if (theme && customThemes.has(shownSelection)) rememberForPrepaint(theme);
	}
}

/**
 * The theme actually shown for a selection: "system" resolves via the OS, and
 * a custom theme that is not loaded (yet) shows the built-in theme of the
 * scheme it last painted.
 */
export function resolveThemeSelection(selection: ThemeSelection): ThemeDefinition {
	if (selection === "system") return THEMES[resolveTheme("system")];
	if (isCustomThemeSelection(selection)) {
		return customThemes.get(selection) ?? THEMES[resolveTheme(readPrepaintThemeMode())];
	}
	return THEMES[selection];
}

/**
 * Inline tokens most recently written by applyThemeByName for a named theme;
 * null while the "system" selection is stylesheet-driven. The agent theme
 * overlay (bottom of this file) restores these when an override goes away.
 */
let baseThemeTokens: ThemeTokens | null = null;
let themeSelectionVersion = 0;

export function getThemeSelectionVersion(): number {
	return themeSelectionVersion;
}

/**
 * Applies a theme selection live: flips `data-theme` + the color-scheme meta
 * to the theme's base scheme, then writes every token inline on <html>.
 * "system" stays purely stylesheet-driven (dark/light resolve per the OS
 * media query, and lib/theme's watcher re-applies on OS changes). Persists
 * the selection under the `themeName` pref and mirrors the base scheme (or
 * "system") into the legacy `theme` pref so older boot paths stay coherent.
 * Pass `{ persist: false }` for ephemeral previews (settings-window theme
 * browsing) so the user's stored selection is left untouched.
 */
export function applyThemeByName(
	selection: ThemeSelection,
	opts: { persist?: boolean; remember?: boolean } = {},
): void {
	themeSelectionVersion++;
	const { persist = true, remember = persist } = opts;
	const theme = showSelection(selection);
	if (persist) void saveGuiPreference("themeName", selection, () => {});
	// A custom theme whose file is still being read is saved once it shows (setCustomThemes).
	if (theme === undefined) return;
	if (persist) void saveGuiPreference("theme", theme ? theme.scheme : "system", () => {});
	if (remember) rememberForPrepaint(theme);
}

/**
 * Keeps the scheme and background of the theme on screen for the pre-paint
 * script, which paints them before the theme loads, so a colored theme does
 * not open on the plain dark or light canvas.
 */
function rememberForPrepaint(theme: ThemeDefinition | null): void {
	try {
		localStorage.setItem(THEME_SCHEME_STORAGE_KEY, theme ? theme.scheme : "system");
		const background = theme ? resolveTokenColor(theme, "--omsk-bg-primary") : "";
		if (background) localStorage.setItem(THEME_BACKGROUND_STORAGE_KEY, background);
		else localStorage.removeItem(THEME_BACKGROUND_STORAGE_KEY);
	} catch {
		// localStorage unavailable — the async path still applies the theme.
	}
}

/**
 * Writes a selection's tokens on <html>; returns the theme shown, null for
 * "system", or undefined for a custom theme whose file has not been read yet.
 */
function showSelection(selection: ThemeSelection): ThemeDefinition | null | undefined {
	shownSelection = selection;
	// The pre-paint canvas stays until the files are read, instead of a
	// built-in theme flashing first; setCustomThemes then shows the theme.
	if (isCustomThemeSelection(selection) && !customThemesLoaded) return undefined;
	let theme: ThemeDefinition | null = null;
	if (selection !== "system") {
		theme = resolveThemeSelection(selection);
		applyTheme(theme.scheme);
		document.documentElement.setAttribute("data-theme-name", selection);
		const style = document.documentElement.style;
		for (const key of THEME_TOKEN_KEYS) style.setProperty(key, theme.tokens[key]);
		baseThemeTokens = theme.tokens;
		markCustomThemeTokens(theme.scheme);
	} else {
		baseThemeTokens = null;
		document.documentElement.removeAttribute("data-theme-name");
		applyTheme("system");
	}
	writeOverlay();
	applyManualColorOverrides(readColorOverrides());
	return theme;
}

/**
 * Reads the persisted selection: the `themeName` pref first, then the legacy
 * `theme` pref (dark/light/system written by older builds and the settings
 * window), falling back to "sharkOcean" — the dark-first default.
 */
export async function getPersistedThemeSelection(prefs?: Readonly<Record<string, unknown>>): Promise<ThemeSelection> {
	if (prefs) {
		if (isThemeSelection(prefs.themeName)) return prefs.themeName;
		return isThemeSelection(prefs.theme) ? prefs.theme : "sharkOcean";
	}
	try {
		const named = await window.omp.prefs.get("themeName");
		if (isThemeSelection(named)) return named;
		const legacy = await window.omp.prefs.get("theme");
		if (isThemeSelection(legacy)) return legacy;
	} catch {
		// prefs IPC unavailable (tests, storybook) — use the default.
	}
	return "sharkOcean";
}

/**
 * Resolves one level of `var(--omsk-…)` indirection for swatch previews.
 * Values that are not a bare var() reference are returned unchanged.
 */
export function resolveTokenColor(theme: ThemeDefinition, key: ThemeTokenKey): string {
	const value = theme.tokens[key];
	const match = /^var\((--omsk-[a-z-]+)\)$/.exec(value);
	if (!match) return value;
	return theme.tokens[match[1] as ThemeTokenKey] ?? value;
}

// ============================================================================
// Agent theme overlay (theme.dark / theme.light)
// ============================================================================

/**
 * TUI theme token → GUI `--omsk-*` custom property. Only tokens with an exact
 * counterpart on both sides are mapped; everything else stays owned by the
 * active GUI named theme. TUI tokens deliberately left unmapped (no verified
 * GUI semantic — do not approximate):
 * - thinkingText, toolTitle, userMessageText, customMessageText: the GUI has
 *   no dedicated foreground tokens for these surfaces.
 * - thinkingMax: the GUI thinking ramp ends at --omsk-thinking-xhigh.
 * - bashMode, pythonMode: TUI REPL prompt-mode accents with no GUI counterpart.
 * - statusLineStaged / statusLineDirty / statusLineUntracked /
 *   statusLineOutput / statusLineCost: TUI status-line counters the GUI
 *   footer does not tokenize.
 * - "link": an undeclared colors key some theme files carry; it is not part
 *   of the TUI theme schema (ThemeColor), so its role is unverifiable.
 *   mdLink already covers --omsk-md-link.
 */
/**
 * TUI theme overlay may retint transcript internals only. Chrome tokens
 * (accent, sidebar, titlebar, buttons, inputs, status-line) stay with the
 * named GUI theme so the app identity cannot be swapped by sidecar themes.
 */
export const TRANSCRIPT_OVERLAY_VARS: Record<string, ThemeTokenKey> = {
	userMessageBg: "--omsk-user-msg-bg",
	customMessageBg: "--omsk-custom-msg-bg",
	customMessageLabel: "--omsk-custom-msg-label",
	toolPendingBg: "--omsk-tool-pending-bg",
	toolSuccessBg: "--omsk-tool-success-bg",
	toolErrorBg: "--omsk-tool-error-bg",
	toolOutput: "--omsk-tool-output",
	mdHeading: "--omsk-md-heading",
	mdLink: "--omsk-md-link",
	mdLinkUrl: "--omsk-md-link-url",
	mdCode: "--omsk-md-code",
	mdCodeBlock: "--omsk-md-code-block",
	mdCodeBlockBorder: "--omsk-md-code-block-border",
	mdQuote: "--omsk-md-quote",
	mdQuoteBorder: "--omsk-md-quote-border",
	mdHr: "--omsk-md-hr",
	mdListBullet: "--omsk-md-list-bullet",
	toolDiffAdded: "--omsk-diff-added",
	toolDiffRemoved: "--omsk-diff-removed",
	toolDiffContext: "--omsk-diff-context",
	syntaxComment: "--omsk-syntax-comment",
	syntaxKeyword: "--omsk-syntax-keyword",
	syntaxFunction: "--omsk-syntax-function",
	syntaxVariable: "--omsk-syntax-variable",
	syntaxString: "--omsk-syntax-string",
	syntaxNumber: "--omsk-syntax-number",
	syntaxType: "--omsk-syntax-type",
	syntaxOperator: "--omsk-syntax-operator",
	syntaxPunctuation: "--omsk-syntax-punctuation",
	thinkingOff: "--omsk-thinking-off",
	thinkingMinimal: "--omsk-thinking-minimal",
	thinkingLow: "--omsk-thinking-low",
	thinkingMedium: "--omsk-thinking-medium",
	thinkingHigh: "--omsk-thinking-high",
	thinkingXhigh: "--omsk-thinking-xhigh",
};

const CHROME_OVERLAY_BLOCKLIST = new Set<ThemeTokenKey>([
	"--omsk-accent",
	"--omsk-sidebar-bg",
	"--omsk-titlebar-bg",
	"--omsk-btn-primary-bg",
]);

const AGENT_THEME_SETTING_PATHS = ["theme.dark", "theme.light"] as const;

/** Agent theme names keyed by GUI base scheme; null until the first settings sync lands. */
let agentThemeNames: { dark: string; light: string } | null = null;
/** CSS vars currently driven by the overlay (null = overlay inactive). */
let agentOverrides: Partial<Record<ThemeTokenKey, string>> | null = null;
/**
 * scheme:name of the last applied overlay. Combined with an intactness probe
 * so same-value data-theme refires (font-size changes, boot) skip re-fetching.
 */
let lastOverlaySignature: string | null = null;
/** Monotonic id — a slow get_theme_colors response must never clobber a newer overlay. */
let agentThemeRequestId = 0;
let agentThemeSettingsRequestId = 0;

/**
 * Fetches one agent theme's resolved colors from the sidecar and maps them
 * onto GUI tokens. Returns null when the theme can't be resolved (unknown
 * name, sidecar down) so callers fall back to the plain named theme.
 */
async function fetchAgentThemeOverrides(name: string): Promise<Partial<Record<ThemeTokenKey, string>> | null> {
	let colors: Record<string, string> | undefined;
	try {
		const res = await window.omp.rpc.getThemeColors(name);
		if (!res.success) return null;
		colors = (res.data as RpcThemeColorsResult | undefined)?.colors;
	} catch {
		return null;
	}
	if (!colors || typeof colors !== "object") return null;
	const overrides: Partial<Record<ThemeTokenKey, string>> = {};
	for (const [token, cssVar] of Object.entries(TRANSCRIPT_OVERLAY_VARS)) {
		if (CHROME_OVERLAY_BLOCKLIST.has(cssVar)) continue;
		const value = colors[token];
		if (typeof value === "string" && value !== "") overrides[cssVar] = value;
	}
	return overrides;
}

/** Currently applied plugin overlay (gui.theme tokens); null when inactive. */
let pluginOverrides: Partial<Record<ThemeTokenKey, string>> | null = null;
/** Combined inline vars last written by the overlay writer. */
let lastWrittenOverlay: Partial<Record<ThemeTokenKey, string>> | null = null;

/**
 * Single overlay writer: merges the plugin layer UNDER the agent layer
 * (agent wins on conflicts) and reconciles inline custom properties against
 * the previous write — vars no longer covered are restored to the named
 * theme's inline tokens (or dropped back to the stylesheet while the
 * "system" selection is stylesheet-driven).
 */
function writeOverlay(): void {
	const merged: Partial<Record<ThemeTokenKey, string>> | null =
		agentOverrides || pluginOverrides ? { ...pluginOverrides, ...agentOverrides } : null;
	const style = document.documentElement.style;
	if (lastWrittenOverlay) {
		for (const key of Object.keys(lastWrittenOverlay) as ThemeTokenKey[]) {
			if (merged && key in merged) continue;
			const base = baseThemeTokens?.[key];
			if (base !== undefined) style.setProperty(key, base);
			else style.removeProperty(key);
		}
	}
	if (merged) {
		for (const [key, value] of Object.entries(merged)) {
			if (typeof value === "string") style.setProperty(key, value);
		}
	}
	lastWrittenOverlay = merged;
}

function applyAgentOverrides(next: Partial<Record<ThemeTokenKey, string>> | null): void {
	agentOverrides = next;
	writeOverlay();
}

/**
 * True while every var of the combined overlay is still present inline WITH
 * the value this module last wrote. applyTheme() rewrites every inline token
 * with the new base theme's values on any named-theme switch — including
 * same-scheme switches that leave `lastOverlaySignature` untouched — so a
 * presence-only probe missed the wipe and the overlay stayed lost.
 */
function overlayIntact(): boolean {
	if (!lastWrittenOverlay) return true;
	const style = document.documentElement.style;
	for (const [key, expected] of Object.entries(lastWrittenOverlay) as [ThemeTokenKey, string][]) {
		if (style.getPropertyValue(key).trim() !== expected.trim()) return false;
	}
	return true;
}

// ============================================================================
// Plugin theme overlay (manifest gui.theme tokens)
// ============================================================================

/**
 * Accepted gui.theme value shapes, anchored at both ends so trailing garbage
 * is rejected rather than truncated: hex (#rgb/#rgba/#rrggbb/#rrggbbaa only —
 * 5/7-digit runs are invalid CSS), functional colors with one level of paren
 * nesting (rgb()/hsl()/oklch()/…/color-mix(in oklch, oklch(…), …)), or a
 * var() reference to an existing --omsk-* token. Named colors (red, …) are
 * deliberately excluded — the shapes above are the auditable surface.
 */
const PLUGIN_THEME_VALUE_RE =
	/^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix|color)\((?:[^()]|\([^()]*\))*\)|var\(--[a-zA-Z0-9-]+\))$/;

function isColorValue(value: string): boolean {
	return PLUGIN_THEME_VALUE_RE.test(value) && (typeof CSS === "undefined" || CSS.supports("color", value));
}

/**
 * Shadows are offsets, blur lengths and colors (`0 6px 18px rgba(…)`, `none`):
 * word characters, numbers, commas and color functions only, so a value can
 * never fetch a `url()`.
 */
const SHADOW_VALUE_RE = /^[\w\s.,%#()-]+$/;

/**
 * Whether a custom theme may set `key` to `value`: the color shapes plugin
 * themes accept, plus `transparent`, and box shadows for the shadow tokens.
 */
export function isThemeTokenValue(key: ThemeTokenKey, value: string): boolean {
	if (key.startsWith("--omsk-shadow-")) {
		return (
			SHADOW_VALUE_RE.test(value) &&
			!/url\(/i.test(value) &&
			(typeof CSS === "undefined" || CSS.supports("box-shadow", value))
		);
	}
	return value === "transparent" || isColorValue(value);
}

export interface ValidatedPluginTheme {
	tokens: Partial<Record<ThemeTokenKey, string>>;
	rejected: string[];
}

/**
 * Validates one plugin's gui.theme token map against the transcript overlay
 * allowlist (chrome stays host-owned by construction — the overlay map has no
 * chrome entries) and a CSS color-value shape. Unknown keys and non-color
 * values are rejected individually so one bad token cannot sink the theme.
 */
export function validatePluginThemeTokens(tokens: Record<string, unknown>): ValidatedPluginTheme {
	const validated: ValidatedPluginTheme = { tokens: {}, rejected: [] };
	for (const [key, value] of Object.entries(tokens)) {
		const cssVar = TRANSCRIPT_OVERLAY_VARS[key];
		if (cssVar === undefined || CHROME_OVERLAY_BLOCKLIST.has(cssVar)) {
			validated.rejected.push(key);
			continue;
		}
		const trimmed = typeof value === "string" ? value.trim() : "";
		if (!isColorValue(trimmed)) {
			validated.rejected.push(key);
			continue;
		}
		validated.tokens[cssVar] = trimmed;
	}
	return validated;
}

/**
 * Layers validated plugin theme tokens under the agent overlay and rewrites
 * the combined inline vars. null clears the plugin layer. Returns the
 * rejected key names so callers can surface them.
 */
export function applyPluginThemeOverlay(tokens: Record<string, unknown> | null): string[] {
	if (!tokens) {
		pluginOverrides = null;
		writeOverlay();
		return [];
	}
	const { tokens: validated, rejected } = validatePluginThemeTokens(tokens);
	pluginOverrides = Object.keys(validated).length > 0 ? validated : null;
	writeOverlay();
	return rejected;
}

/**
 * Fetches gui.theme tokens from every enabled plugin and applies their
 * merge. Called at App boot, after activation restarts, and on route
 * changes; plugin changes that skip the restart pick the new state up on
 * the next refresh. Generation-guarded: a slower older response must never
 * overwrite a newer enabled-plugin set.
 */
let pluginThemeRequestId = 0;

export function clearPluginThemes(): void {
	pluginThemeRequestId++;
	applyPluginThemeOverlay(null);
}

export async function refreshPluginThemes(): Promise<void> {
	if (!acceptsActiveTabEvents()) return;
	const requestId = ++pluginThemeRequestId;
	let merged: Record<string, string> | null = null;
	try {
		const res = await window.omp.rpc.getGuiThemes();
		if (requestId !== pluginThemeRequestId) return;
		if (res.success) {
			const data = res.data as { themes?: Array<{ tokens: Record<string, string> }> } | undefined;
			for (const theme of data?.themes ?? []) {
				merged = Object.assign(merged ?? {}, theme.tokens);
			}
		} else {
			// Backend refused (sidecar starting, transient read error): keep the
			// currently applied overlay instead of clearing every plugin color.
			return;
		}
	} catch {
		return; // sidecar down — keep whatever is already applied
	}
	if (requestId !== pluginThemeRequestId || !acceptsActiveTabEvents()) return;
	applyPluginThemeOverlay(merged);
}

/**
 * Resolves which agent theme (if any) applies to the current GUI base scheme
 * and re-layers it. No-ops until data-theme exists — the App boot effects set
 * it synchronously and the MutationObserver re-fires once they do.
 */
async function refreshAgentThemeOverrides(): Promise<void> {
	if (!acceptsActiveTabEvents()) return;
	const attr = document.documentElement.getAttribute("data-theme");
	if (attr !== "dark" && attr !== "light") return;
	const name = agentThemeNames?.[attr] ?? "";
	if (name === "") {
		agentThemeRequestId++;
		lastOverlaySignature = null;
		applyAgentOverrides(null);
		return;
	}
	const signature = `${attr}:${name}`;
	if (signature === lastOverlaySignature && overlayIntact()) return;
	const requestId = ++agentThemeRequestId;
	const overrides = await fetchAgentThemeOverrides(name);
	if (requestId !== agentThemeRequestId || !acceptsActiveTabEvents()) return;
	lastOverlaySignature = overrides ? signature : null;
	applyAgentOverrides(overrides);
}

/** Reads theme.dark / theme.light from the agent and forces a re-layer. */
async function syncAgentThemeSettings(): Promise<void> {
	if (!acceptsActiveTabEvents()) return;
	const requestId = ++agentThemeSettingsRequestId;
	try {
		const res = await window.omp.rpc.getSettings([...AGENT_THEME_SETTING_PATHS]);
		if (requestId !== agentThemeSettingsRequestId || !acceptsActiveTabEvents()) return;
		const values = res.success ? (res.data as { values?: Record<string, unknown> } | undefined)?.values : undefined;
		const dark = values?.["theme.dark"];
		const light = values?.["theme.light"];
		agentThemeNames = {
			dark: typeof dark === "string" ? dark : "",
			light: typeof light === "string" ? light : "",
		};
	} catch {
		if (requestId !== agentThemeSettingsRequestId || !acceptsActiveTabEvents()) return;
		agentThemeNames = null;
	}
	lastOverlaySignature = null;
	await refreshAgentThemeOverrides();
}

/**
 * Starts layering the agent's theme.dark / theme.light TUI themes on top of
 * the active GUI theme: the theme matching the GUI's current base scheme
 * (theme.dark while data-theme is dark, theme.light while light) is resolved
 * into inline CSS var overrides over the GUI named theme, re-applied on every
 * config_update frame and on every GUI theme/scheme change (observed via
 * data-theme). Unset or unresolvable agent themes leave the GUI named theme
 * untouched. Call once at App boot; the returned teardown restores the base.
 */
export function initAgentThemeSync(): () => void {
	void syncAgentThemeSettings();
	const unsubscribe = window.omp.events.onConfigUpdate(() => {
		if (acceptsActiveTabEvents()) void syncAgentThemeSettings();
	});
	const unsubscribeRoute = onActiveTabRouteSettled(() => void syncAgentThemeSettings());
	const resetOverlay = () => {
		agentThemeRequestId++;
		agentThemeSettingsRequestId++;
		agentThemeNames = null;
		lastOverlaySignature = null;
		applyAgentOverrides(null);
	};
	const unsubscribeRouting = onActiveTabRouteState(ready => {
		if (!ready) resetOverlay();
	});
	const observer = new MutationObserver(() => {
		void refreshAgentThemeOverrides();
	});
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
	return () => {
		unsubscribe();
		unsubscribeRoute();
		unsubscribeRouting();
		observer.disconnect();
		resetOverlay();
	};
}
