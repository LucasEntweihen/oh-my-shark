import { beforeAll, describe, expect, it } from "bun:test";
import { BUILTIN_EDITOR_BORDER_STYLES } from "@oh-my-pi/pi-tui";
import { BUILTIN_COMPOSER_SHAPES } from "@oh-my-pi/pi-tui/overlays/composer-shape-registry";
import { initTheme } from "@oh-my-pi/pi-tui/theme";
import "../config/all-settings";
import { lookup as lookupSetting } from "../config/registry";
import { SHARK_LOGO } from "../modes/components/shark-logo";
import { DeepSeaCockpit, stripAnsi } from "./deep-sea-command";

describe("TUI Cockpit Layout as Standard Configuration", () => {
	beforeAll(async () => {
		await initTheme(false);
	});

	it("should have tui.layout defined in settings registry with default, cockpit, and compact", () => {
		const setting = lookupSetting("tui.layout");
		expect(setting).toBeDefined();
		expect(setting?.type).toBe("enum");
		expect(setting?.default).toBe("cockpit");
		expect(setting?.enumValues).toContain("default");
		expect(setting?.enumValues).toContain("cockpit");
		expect(setting?.enumValues).toContain("compact");
	});

	it("should have cockpit registered as a built-in composer shape option", () => {
		const cockpitShape = BUILTIN_COMPOSER_SHAPES.find(s => s.value === "cockpit");
		expect(cockpitShape).toBeDefined();
		expect(cockpitShape?.label).toContain("Cockpit");

		expect(BUILTIN_EDITOR_BORDER_STYLES).toContain("cockpit");
	});

	it("should render authentic SHARK_LOGO in DeepSeaCockpit sidebar and full cockpit", () => {
		const cockpit = new DeepSeaCockpit({
			version: "0.0.52",
			modelName: "gemini-2.5-pro",
			providerName: "Google",
		});

		expect(SHARK_LOGO.length).toBe(17);

		// Render wide sidebar (>= 58 chars)
		const sidebar = cockpit.renderSidebar(60, 30);
		const sidebarText = stripAnsi(sidebar.join("\n"));

		// Must include signature ASCII characters from the real SHARK_LOGO (stackedlol/ascii-sharks)
		expect(sidebarText).toContain(";;t");
		expect(sidebarText).toContain("XSSS8SSX%XX8#");
		expect(sidebarText).toContain("OMSK");

		// Render full cockpit
		const fullCockpit = cockpit.renderFullCockpit(120, 35);
		const fullText = stripAnsi(fullCockpit.join("\n"));
		expect(fullText).toContain("Deep Sea Cockpit");
		expect(fullText).toContain(";;t");
		expect(fullText).toContain("OMSK");
		expect(fullText).toContain("Mission");
	});

	it("should support dynamic density switching on DeepSeaCockpit", () => {
		const cockpit = new DeepSeaCockpit({
			version: "0.0.52",
			modelName: "gemini-2.5-pro",
			providerName: "Google",
		});

		cockpit.setDensity("compact");
		expect(cockpit.getDensity()).toBe("compact");
		const compactText = stripAnsi(cockpit.render(100).join("\n"));
		expect(compactText).toContain("OMSK");

		cockpit.setDensity("standard");
		expect(cockpit.getDensity()).toBe("standard");

		cockpit.setDensity("advanced");
		expect(cockpit.getDensity()).toBe("advanced");
		const advancedText = stripAnsi(cockpit.render(120).join("\n"));
		expect(advancedText).toContain("Deep Sea Cockpit");
	});

	it("should have all cockpit.* settings properly defined in settings registry", () => {
		const density = lookupSetting("cockpit.density");
		expect(density).toBeDefined();
		expect(density?.type).toBe("enum");
		expect(density?.default).toBe("auto");
		expect(density?.enumValues).toContain("auto");
		expect(density?.enumValues).toContain("advanced");

		const sidebar = lookupSetting("cockpit.sidebar");
		expect(sidebar).toBeDefined();
		expect(sidebar?.type).toBe("enum");
		expect(sidebar?.default).toBe("auto");
		expect(sidebar?.enumValues).toContain("hidden");
		expect(sidebar?.enumValues).toContain("visible");

		const stream = lookupSetting("cockpit.eventStreamLines");
		expect(stream).toBeDefined();
		expect(stream?.type).toBe("number");
		expect(stream?.default).toBe(4);

		expect(lookupSetting("cockpit.showTips")).toBeDefined();
		expect(lookupSetting("cockpit.showMemoryGraph")).toBeDefined();
		expect(lookupSetting("cockpit.showRecentFiles")).toBeDefined();
		expect(lookupSetting("cockpit.showProgress")).toBeDefined();
		expect(lookupSetting("cockpit.showShortcuts")).toBeDefined();
		expect(lookupSetting("cockpit.autoHeight")).toBeDefined();
	});

	it("should adapt responsively across multiple width breakpoints without crashing", () => {
		const cockpit = new DeepSeaCockpit();

		// Ultra-narrow (30 cols)
		const ultraNarrow = cockpit.renderFullCockpit(30);
		expect(ultraNarrow.length).toBeGreaterThan(0);
		for (const line of ultraNarrow) {
			expect(stripAnsi(line).length).toBeLessThanOrEqual(30);
		}

		// Narrow (60 cols) - stacked cards
		const narrow = cockpit.renderFullCockpit(60);
		expect(narrow.length).toBeGreaterThan(0);
		const narrowText = stripAnsi(narrow.join("\n"));
		expect(narrowText).toContain("Mission");
		expect(narrowText).toContain("Changes");

		// Mid (90 cols) - responsive 2-column lower panels
		const mid = cockpit.renderFullCockpit(90);
		expect(mid.length).toBeGreaterThan(0);
		const midText = stripAnsi(mid.join("\n"));
		expect(midText).toContain("Deep Sea Cockpit");

		// Wide (120 cols) - full authentic ASCII shark and 3 columns
		const wide = cockpit.renderFullCockpit(120);
		expect(wide.length).toBeGreaterThan(0);
		const wideText = stripAnsi(wide.join("\n"));
		expect(wideText).toContain(";;t");
		expect(wideText).toContain("Progress & Activity");
	});

	it("should support sidebar configuration modes: hidden, visible, collapsed, auto", () => {
		const cockpit = new DeepSeaCockpit();

		// Hidden sidebar maximizes space for cards
		cockpit.setSidebar("hidden");
		const hiddenLines = cockpit.renderFullCockpit(120);
		const hiddenText = stripAnsi(hiddenLines.join("\n"));
		expect(hiddenText).toContain("Deep Sea Cockpit");
		// Should not have the left sidebar divider column
		expect(cockpit.resolveSidebarWidth(120).show).toBe(false);

		// Collapsed sidebar
		cockpit.setSidebar("collapsed");
		expect(cockpit.resolveSidebarWidth(120).width).toBe(20);

		// Visible sidebar
		cockpit.setSidebar("visible");
		expect(cockpit.resolveSidebarWidth(120).show).toBe(true);

		// Auto sidebar
		cockpit.setSidebar("auto");
		expect(cockpit.resolveSidebarWidth(50).show).toBe(false);
		expect(cockpit.resolveSidebarWidth(120).show).toBe(true);
	});

	it("should adapt to constrained terminal height gracefully (autoHeight)", () => {
		const cockpit = new DeepSeaCockpit();
		cockpit.setAutoHeight(true);

		// Short terminal (22 rows)
		const shortLines = cockpit.renderFullCockpit(120, 22);
		expect(shortLines.length).toBeLessThan(35);

		// Tall terminal (50 rows)
		const tallLines = cockpit.renderFullCockpit(120, 50);
		expect(tallLines.length).toBeGreaterThanOrEqual(shortLines.length);
	});
});
