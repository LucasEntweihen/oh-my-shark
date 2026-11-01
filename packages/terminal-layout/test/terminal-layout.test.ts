import { describe, it, expect } from "bun:test";
import {
  TerminalLayoutEngine,
  ThemeEngine,
  PanelExtensionRegistry,
  type SharkPanelExtension,
} from "../src/index";

describe("Shark Modular TUI Layout Engine (Module 5 - Terminal Experience & Theming)", () => {
  it("Test 1: should allocate panel bounds and calculate column/row layout in wide terminal", () => {
    const engine = new TerminalLayoutEngine();
    engine.setPreset("command-center");

    const layout = engine.calculateLayout(120, 40);

    expect(layout.compactMode).toBe(false);
    expect(layout.totalColumns).toBe(120);
    expect(layout.totalRows).toBe(40);

    // Prompt at bottom (3 rows)
    expect(layout.panels.prompt.height).toBe(3);
    expect(layout.panels.prompt.y).toBe(37);
    expect(layout.panels.prompt.width).toBe(120);

    // Multi-panel columns
    expect(layout.panels.workspace.visible).toBe(true);
    expect(layout.panels.execution.visible).toBe(true);
    expect(layout.panels.intelligence.visible).toBe(true);

    const totalWidth =
      layout.panels.workspace.width +
      layout.panels.execution.width +
      layout.panels.intelligence.width;

    expect(totalWidth).toBe(120);
  });

  it("Test 2: should switch between layout presets (developer, research, minimal)", () => {
    const engine = new TerminalLayoutEngine();

    // Minimal preset: execution takes 100% of main area
    engine.setPreset("minimal");
    let layout = engine.calculateLayout(100, 30);
    expect(layout.panels.execution.width).toBe(100);
    expect(layout.panels.workspace.visible).toBe(false);

    // Developer preset: workspace + execution only
    engine.setPreset("developer");
    layout = engine.calculateLayout(100, 30);
    expect(layout.panels.workspace.visible).toBe(true);
    expect(layout.panels.execution.visible).toBe(true);
    expect(layout.panels.intelligence.visible).toBe(false);
    expect(layout.panels.workspace.width).toBe(25);
    expect(layout.panels.execution.width).toBe(75);

    // Research preset: workspace + execution + intelligence
    engine.setPreset("research");
    layout = engine.calculateLayout(100, 30);
    expect(layout.panels.intelligence.visible).toBe(true);
    expect(layout.panels.intelligence.width).toBe(40);
  });

  it("Test 3: should auto-collapse into compact mode when terminal width is below 80 columns", () => {
    const engine = new TerminalLayoutEngine();
    engine.setPreset("command-center");

    // Narrow terminal (e.g. 70 columns)
    const narrowLayout = engine.calculateLayout(70, 24);

    expect(narrowLayout.compactMode).toBe(true);
    expect(narrowLayout.panels.execution.width).toBe(70);
    expect(narrowLayout.panels.workspace.visible).toBe(false);
    expect(narrowLayout.panels.intelligence.visible).toBe(false);
  });

  it("Test 4: should resolve theme colors across truecolor, 256-color, and 16-color ANSI fallbacks", () => {
    const themes = new ThemeEngine();

    expect(themes.getTheme()).toBe("shark-ocean");

    // Truecolor resolution
    const hexPrimary = themes.resolveColor("primary", "truecolor");
    expect(hexPrimary).toBe("#00e5ff");

    // 256-color ANSI escape
    const ansi256 = themes.resolveColor("primary", "256");
    expect(ansi256).toBe("\x1b[38;5;45m");

    // 16-color ANSI escape
    const ansi16 = themes.resolveColor("primary", "16");
    expect(ansi16).toBe("\x1b[36m");

    // Switch theme to amber-terminal
    themes.setTheme("amber-terminal");
    expect(themes.resolveColor("primary", "truecolor")).toBe("#f59e0b");
  });

  it("Test 5: should register custom panel extensions and execute dynamic rendering", () => {
    const registry = new PanelExtensionRegistry();

    const customExtension: SharkPanelExtension = {
      id: "git-status-panel",
      title: "Git Status Live",
      defaultPosition: "left",
      render: (ctx) => [
        `=== Git Status (${ctx.width}x${ctx.height}) ===`,
        "On branch main",
        "Working tree clean",
      ],
    };

    registry.register(customExtension);
    expect(registry.get("git-status-panel")).toBeDefined();
    expect(registry.getAll().length).toBe(1);

    const renderedLines = registry.renderPanel("git-status-panel", { width: 30, height: 10 });
    expect(renderedLines.length).toBe(3);
    expect(renderedLines[0]).toContain("30x10");
    expect(renderedLines[1]).toBe("On branch main");

    registry.unregister("git-status-panel");
    expect(registry.get("git-status-panel")).toBeUndefined();
  });
});
