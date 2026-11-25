import { describe, expect, it } from "vitest";
import { contrastRatio, parseCssColor, type Rgba, toOklab } from "./color";
import { parseCustomThemeFile } from "./custom-themes";
import {
	customThemeFileFor,
	generateTheme,
	lowContrastComponents,
	surfacesFromAccent,
	type ThemeBase,
} from "./theme-generator";
import { THEMES, type ThemeName, type ThemeTokenKey, type ThemeTokens } from "./themes";

function builtin(name: ThemeName): ThemeBase {
	return { extends: name, scheme: THEMES[name].scheme, tokens: THEMES[name].tokens };
}

function color(tokens: ThemeTokens, key: ThemeTokenKey): Rgba {
	const value = parseCssColor(tokens[key]);
	if (!value) throw new Error(`${key} is not a color: ${tokens[key]}`);
	return value;
}

function contrast(tokens: ThemeTokens, fg: ThemeTokenKey, bg: ThemeTokenKey): number {
	return contrastRatio(color(tokens, fg), color(tokens, bg));
}

function hueDegrees(value: Rgba): number {
	const lab = toOklab(value);
	return ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
}

const READABLE_TEXT = ["--omsk-text", "--omsk-text-secondary", "--omsk-muted", "--omsk-dim"] as const;

describe("generateTheme", () => {
	it("saves no token changes for a theme left as it is", () => {
		for (const name of Object.keys(THEMES) as ThemeName[]) {
			const file = customThemeFileFor(generateTheme(builtin(name), {}), "Same", "");
			expect(file.tokens, name).toEqual({});
			expect(file.scheme, name).toBe(THEMES[name].scheme);
		}
	});

	it("turns the accent's family with it and leaves other blues alone", () => {
		const { tokens } = generateTheme(builtin("dark"), { accent: "#e06c75" });

		expect(tokens["--omsk-accent"]).toBe("#e06c75");
		// Same color, same alpha: the dim and glow variants are the accent at low opacity.
		expect(tokens["--omsk-accent-dim"]).toBe("rgba(224, 108, 117, 0.14)");
		expect(
			Math.abs(hueDegrees(color(tokens, "--omsk-md-link")) - hueDegrees(color(tokens, "--omsk-accent"))),
		).toBeLessThan(10);
		// accent-bright stays the lighter one.
		expect(toOklab(color(tokens, "--omsk-accent-bright")).l).toBeGreaterThan(
			toOklab(color(tokens, "--omsk-accent")).l,
		);
		// Syntax keywords and the info color are blue in Graphite too, but not part of the accent.
		expect(tokens["--omsk-syntax-keyword"]).toBe(THEMES.dark.tokens["--omsk-syntax-keyword"]);
		expect(tokens["--omsk-info"]).toBe(THEMES.dark.tokens["--omsk-info"]);
		expect(tokens["--omsk-input-focus-border"]).toBe(THEMES.dark.tokens["--omsk-input-focus-border"]);
	});

	it("turns the overlays tinted with the accent, not the plain white ones", () => {
		const accent = parseCssColor("#e5484d")!;
		const nord = generateTheme(builtin("nord"), { accent: "#e5484d" }).tokens;
		for (const key of ["--omsk-selected-bg", "--omsk-input-glow", "--omsk-streaming-highlight"] as const) {
			expect(Math.abs(hueDegrees(color(nord, key)) - hueDegrees(accent)), key).toBeLessThan(10);
			expect(color(nord, key).alpha, key).toBeCloseTo(color(THEMES.nord.tokens, key).alpha, 3);
		}
		const dark = generateTheme(builtin("dark"), { accent: "#e5484d" }).tokens;
		expect(dark["--omsk-selected-bg"]).toBe(THEMES.dark.tokens["--omsk-selected-bg"]);
	});

	it("builds a light background on a light theme and keeps its text readable", () => {
		const theme = generateTheme(builtin("dark"), { background: "#fdf6e3" });

		expect(theme.scheme).toBe("light");
		expect(THEMES[theme.extends].scheme).toBe("light");
		expect(theme.tokens["--omsk-bg-primary"]).toBe("#fdf6e3");
		for (const key of READABLE_TEXT)
			expect(contrast(theme.tokens, key, "--omsk-bg-primary"), key).toBeGreaterThan(4.5);
	});

	it("lifts derived text a picked background would make hard to read", () => {
		const { tokens } = generateTheme(builtin("dark"), { background: "#4a4a4a" });

		for (const key of READABLE_TEXT)
			expect(contrast(tokens, key, "--omsk-bg-primary"), key).toBeGreaterThanOrEqual(4.5);
		for (const key of THEME_SYNTAX) expect(contrast(tokens, key, "--omsk-code-bg"), key).toBeGreaterThanOrEqual(4.5);
	});

	it("keeps picked colors exactly and flags a pick that is hard to read on", () => {
		const picks = { text: "#fffbe6", sidebar: "#f0f0f0" };
		const { tokens } = generateTheme(builtin("dark"), picks);

		expect(tokens["--omsk-text"]).toBe("#fffbe6");
		expect(tokens["--omsk-sidebar-bg"]).toBe("#f0f0f0");
		expect([...lowContrastComponents(tokens, picks)]).toEqual(["sidebar"]);
		// White hover overlays would vanish on a light sidebar: they turn dark.
		expect(tokens["--omsk-sidebar-item-hover"]).toBe("rgba(0, 0, 0, 0.05)");
	});

	it("keeps the main background's text when a sidebar cannot share it", () => {
		const { tokens } = generateTheme(builtin("dark"), { sidebar: "#f0f0f0" });

		expect(tokens["--omsk-text"]).toBe(THEMES.dark.tokens["--omsk-text"]);
		expect(contrast(tokens, "--omsk-muted", "--omsk-bg-primary")).toBeGreaterThanOrEqual(4.5);
	});

	it("moves a title bar drawn in the sidebar color with the sidebar", () => {
		expect(THEMES.nord.tokens["--omsk-titlebar-bg"]).toBe(THEMES.nord.tokens["--omsk-sidebar-bg"]);
		const { tokens } = generateTheme(builtin("nord"), { sidebar: "#0b2f3a" });
		expect(tokens["--omsk-titlebar-bg"]).toBe("#0b2f3a");

		const own = generateTheme(builtin("nord"), { sidebar: "#0b2f3a", titlebar: "#202020" });
		expect(own.tokens["--omsk-titlebar-bg"]).toBe("#202020");
	});
});

const THEME_SYNTAX = Object.keys(THEMES.dark.tokens).filter(key => key.startsWith("--omsk-syntax-")) as ThemeTokenKey[];

describe("surfacesFromAccent", () => {
	it("tints readable surfaces with the accent's hue, and a gray accent gives gray ones", () => {
		for (const scheme of ["dark", "light"] as const) {
			const picks = surfacesFromAccent("#2f9e74", scheme);
			const { tokens } = generateTheme(builtin(scheme), { accent: "#2f9e74", ...picks });
			expect(contrast(tokens, "--omsk-text", "--omsk-bg-primary"), scheme).toBeGreaterThan(7);
			expect(contrast(tokens, "--omsk-text", "--omsk-sidebar-bg"), scheme).toBeGreaterThan(7);
			expect(
				Math.abs(hueDegrees(color(tokens, "--omsk-bg-primary")) - hueDegrees(parseCssColor("#2f9e74")!)),
			).toBeLessThan(15);
		}
		const gray = surfacesFromAccent("#888888", "dark");
		const bg = parseCssColor(gray.background!)!;
		expect(bg.r).toBeCloseTo(bg.g, 2);
		expect(bg.g).toBeCloseTo(bg.b, 2);
	});
});

describe("customThemeFileFor", () => {
	it("writes a file that reads back as the same theme", () => {
		const theme = generateTheme(builtin("nord"), { background: "#f4efe6", accent: "#b4552d", border: "#d8cbb8" });
		const file = customThemeFileFor(theme, "  Clay  ", "  Warm paper  ");

		expect(file).toMatchObject({ name: "Clay", description: "Warm paper", extends: theme.extends, scheme: "light" });
		const entry = parseCustomThemeFile({ id: "clay", fileName: "clay.json", data: JSON.parse(JSON.stringify(file)) });
		expect(entry.skipped).toEqual([]);
		expect(entry.extends).toBe(theme.extends);
		expect(entry.theme?.scheme).toBe("light");
		expect(entry.theme?.tokens).toEqual(theme.tokens);
	});
});
