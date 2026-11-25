import { parseHTML } from "linkedom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyManualColorOverrides, clearColorOverrides, saveColorOverrides } from "./color-overrides";
import { readPrepaintThemeMode } from "./theme";
import { applyThemeByName, getPersistedThemeSelection, THEMES } from "./themes";

describe("dark-first themes and manual color customizer", () => {
	const { document } = parseHTML("<html><head></head><body></body></html>");
	const storage = new Map<string, string>();

	beforeEach(() => {
		vi.stubGlobal("document", document);
		vi.stubGlobal("window", {
			localStorage: {
				getItem: (k: string) => storage.get(k) ?? null,
				setItem: (k: string, v: string) => void storage.set(k, v),
				removeItem: (k: string) => void storage.delete(k),
			},
		});
		vi.stubGlobal("localStorage", {
			getItem: (k: string) => storage.get(k) ?? null,
			setItem: (k: string, v: string) => void storage.set(k, v),
			removeItem: (k: string) => void storage.delete(k),
		});
	});

	afterEach(() => {
		clearColorOverrides();
		storage.clear();
		vi.unstubAllGlobals();
	});

	it("defaults to dark sharkOcean theme and includes curated dark ocean presets", async () => {
		expect(readPrepaintThemeMode()).toBe("dark");
		expect(await getPersistedThemeSelection({})).toBe("sharkOcean");
		expect(THEMES.bioluminescentReef.scheme).toBe("dark");
		expect(THEMES.crimsonTrench.scheme).toBe("dark");
		expect(THEMES.midnightObsidian.scheme).toBe("dark");
	});

	it("applies manual color overrides on top of presets and clears cleanly on reset", () => {
		applyThemeByName("sharkOcean", { persist: false });
		saveColorOverrides({
			accent: "#ff5500",
			oceanTop: "#091828",
			sharkColor: "#00e5ff",
			glassBlur: 12,
		});

		const style = document.documentElement.style;
		expect(style.getPropertyValue("--omsk-accent")).toBe("#ff5500");
		expect(style.getPropertyValue("--omsk-ocean-top")).toBe("#091828");
		expect(style.getPropertyValue("--omsk-shark-color")).toBe("#00e5ff");
		expect(style.getPropertyValue("--omsk-glass-blur")).toBe("12px");

		applyManualColorOverrides({});
		expect(style.getPropertyValue("--omsk-ocean-top")).toBe("");
		expect(style.getPropertyValue("--omsk-accent")).toBe("");
	});
});
