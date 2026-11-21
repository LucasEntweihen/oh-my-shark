import { createTheme, getAvailableThemes, getBuiltinThemes, loadThemeJson } from "@oh-my-pi/pi-tui/theme/loader";
import { validateThemeJson } from "@oh-my-pi/pi-tui/theme/schema-validation";
import { describe, expect, it } from "bun:test";
import { genericThemes } from "../src/modes/theme/generic";

describe("100 Generic Color Patterns for OMSK CLI", () => {
	it("provides exactly 100 generic themes (50 dark and 50 light)", () => {
		const keys = Object.keys(genericThemes);
		expect(keys.length).toBe(100);

		const darkThemes = keys.filter(k => k.startsWith("dark-spectrum-"));
		const lightThemes = keys.filter(k => k.startsWith("light-spectrum-"));

		expect(darkThemes.length).toBe(50);
		expect(lightThemes.length).toBe(50);
	});

	it("validates every generic theme against validateThemeJson", () => {
		for (const [name, themeDef] of Object.entries(genericThemes)) {
			const res = validateThemeJson(themeDef);
			expect(res.name).toBe(name);
			expect(res.colors.accent).toBeTruthy();
			expect(res.colors.syntaxKeyword).toBeTruthy();
			expect(res.colors.syntaxFunction).toBeTruthy();
		}
	});

	it("registers all 100 generic themes in getBuiltinThemes and getAvailableThemes", async () => {
		const builtin = getBuiltinThemes();
		const available = await getAvailableThemes();

		for (const name of Object.keys(genericThemes)) {
			expect(builtin[name]).toBeDefined();
			expect(available).toContain(name);
		}
	});

	it("loads and instantiates a Theme instance without runtime errors", async () => {
		const sampleDark = await loadThemeJson("dark-spectrum-25");
		const sampleLight = await loadThemeJson("light-spectrum-42");

		expect(sampleDark.name).toBe("dark-spectrum-25");
		expect(sampleLight.name).toBe("light-spectrum-42");

		const themeInstanceDark = createTheme(sampleDark);
		const themeInstanceLight = createTheme(sampleLight);

		expect(themeInstanceDark.fg("accent", "test")).toBeTruthy();
		expect(themeInstanceLight.fg("accent", "test")).toBeTruthy();
	});
});
