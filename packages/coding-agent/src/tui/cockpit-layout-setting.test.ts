import { beforeAll, describe, expect, it } from "bun:test";
import { BUILTIN_COMPOSER_SHAPES, SETTINGS_SCHEMA } from "../config/settings-schema";
import { WelcomeComponent } from "../modes/components/welcome";
import { SHARK_LOGO } from "../modes/components/shark-logo";
import { initTheme } from "../modes/theme/theme";
import { DeepSeaCockpit, stripAnsi } from "./deep-sea-command";
import { BUILTIN_EDITOR_BORDER_STYLES } from "@oh-my-pi/pi-tui";

describe("TUI Cockpit Layout as Standard Configuration", () => {
	beforeAll(async () => {
		await initTheme(false);
	});

	it("should have tui.layout defined in settings schema with default, cockpit, and compact", () => {
		const setting = SETTINGS_SCHEMA["tui.layout"];
		expect(setting).toBeDefined();
		expect(setting.type).toBe("enum");
		expect(setting.default).toBe("cockpit");
		expect(setting.values).toContain("default");
		expect(setting.values).toContain("cockpit");
		expect(setting.values).toContain("compact");
	});

	it("should have cockpit registered as a built-in composer shape option", () => {
		const cockpitShape = BUILTIN_COMPOSER_SHAPES.find(s => s.value === "cockpit");
		expect(cockpitShape).toBeDefined();
		expect(cockpitShape?.label).toContain("Cockpit");

		expect(BUILTIN_EDITOR_BORDER_STYLES).toContain("cockpit");
	});

	it("should render authentic SHARK_LOGO in DeepSeaCockpit sidebar and full cockpit", () => {
		const cockpit = new DeepSeaCockpit({
			version: "0.0.50",
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

	it("should render Deep Sea Cockpit with authentic shark when WelcomeComponent has layoutMode=cockpit", () => {
		const welcome = new WelcomeComponent(
			"0.0.50",
			"gemini-2.5-pro",
			"Google",
			[{ name: "test-session", timeAgo: "1h ago" }],
			[{ name: "tsserver", status: "ready", fileTypes: ["ts"] }],
			"cockpit",
		);

		expect(welcome.getLayoutMode()).toBe("cockpit");

		const rendered = welcome.render(120);
		expect(rendered.length).toBeGreaterThanOrEqual(15);

		const renderedText = stripAnsi(rendered.join("\n"));
		expect(renderedText).toContain("Deep Sea Cockpit");
		expect(renderedText).toContain(";;t");
		expect(renderedText).toContain("OMSK");
		expect(renderedText).toContain("Mission");
	});

	it("should allow dynamic switching of layoutMode on WelcomeComponent", () => {
		const welcome = new WelcomeComponent(
			"0.0.50",
			"gemini-2.5-pro",
			"Google",
			[],
			[],
			"default",
		);

		expect(welcome.getLayoutMode()).toBe("default");
		const defaultText = stripAnsi(welcome.render(100).join("\n"));
		expect(defaultText).toContain("Welcome back!");

		welcome.setLayoutMode("compact");
		expect(welcome.getLayoutMode()).toBe("compact");
		const compactText = stripAnsi(welcome.render(100).join("\n"));
		expect(compactText).toContain("COCKPIT");

		welcome.setLayoutMode("cockpit");
		expect(welcome.getLayoutMode()).toBe("cockpit");
		const cockpitText = stripAnsi(welcome.render(120).join("\n"));
		expect(cockpitText).toContain("Deep Sea Cockpit");
		expect(cockpitText).toContain(";;t");
	});

	it("should have all cockpit.* settings properly defined in settings schema", () => {
		const density = SETTINGS_SCHEMA["cockpit.density"];
		expect(density).toBeDefined();
		expect(density.type).toBe("enum");
		expect(density.default).toBe("auto");
		expect(density.values).toContain("auto");
		expect(density.values).toContain("advanced");

		const sidebar = SETTINGS_SCHEMA["cockpit.sidebar"];
		expect(sidebar).toBeDefined();
		expect(sidebar.type).toBe("enum");
		expect(sidebar.default).toBe("auto");
		expect(sidebar.values).toContain("hidden");
		expect(sidebar.values).toContain("visible");

		const stream = SETTINGS_SCHEMA["cockpit.eventStreamLines"];
		expect(stream).toBeDefined();
		expect(stream.type).toBe("number");
		expect(stream.default).toBe(4);

		expect(SETTINGS_SCHEMA["cockpit.showTips"]).toBeDefined();
		expect(SETTINGS_SCHEMA["cockpit.showMemoryGraph"]).toBeDefined();
		expect(SETTINGS_SCHEMA["cockpit.showRecentFiles"]).toBeDefined();
		expect(SETTINGS_SCHEMA["cockpit.showProgress"]).toBeDefined();
		expect(SETTINGS_SCHEMA["cockpit.showShortcuts"]).toBeDefined();
		expect(SETTINGS_SCHEMA["cockpit.autoHeight"]).toBeDefined();
	});

	it("should default WelcomeComponent layoutMode to cockpit when omitted", () => {
		const welcome = new WelcomeComponent("0.0.50", "gemini-2.5-pro", "Google");
		expect(welcome.getLayoutMode()).toBe("cockpit");
		const rendered = stripAnsi(welcome.render(120).join("\n"));
		expect(rendered).toContain("Deep Sea Cockpit");
		expect(rendered).toContain(";;t");
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
