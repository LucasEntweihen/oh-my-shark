import { describe, expect, it } from "bun:test";
import {
	DeepSeaCockpit,
	type MemoryGraphData,
	type RecentFileItem,
	stripAnsi,
} from "./deep-sea-command";

describe("Subagent 4: Lower Panels & Shortcuts Engine", () => {
	it("TDD 4.1: should render horizontal shortcut bar and dispatch actions", () => {
		const cockpit = new DeepSeaCockpit();
		let triggered = false;
		cockpit.registerShortcut("Ctrl+D", "Diff", () => {
			triggered = true;
		});

		const barLines = cockpit.renderShortcutBar(100);
		expect(barLines.length).toBeGreaterThanOrEqual(1);

		const text = stripAnsi(barLines.join("\n"));
		expect(text).toContain("[Ctrl+P] Commands");
		expect(text).toContain("[Ctrl+J] Tasks");
		expect(text).toContain("[Ctrl+D] Diff");
		expect(text).toContain("[Ctrl+L] Events");

		cockpit.triggerShortcut("Ctrl+D");
		expect(triggered).toBe(true);
	});

	it("TDD 4.2: should render Progress & Activity panel with circular gauge and step list", () => {
		const cockpit = new DeepSeaCockpit({
			mission: {
				id: "042",
				title: "Refactor auth",
				phase: "2",
				progressPercent: 68,
			},
			activitySteps: [
				{ label: "Analyze code", status: "completed" },
				{ label: "Apply changes", status: "completed" },
				{ label: "Run tests...", status: "active" },
				{ label: "Finalize", status: "pending" },
			],
		});

		const panelLines = cockpit.renderProgressPanel(35);
		const text = stripAnsi(panelLines.join("\n"));
		expect(text).toContain("Progress & Activity");
		expect(text).toContain("68%");
		expect(text).toContain("Analyze code");
		expect(text).toContain("Apply changes");
		expect(text).toContain("Run tests...");
		expect(text).toContain("Finalize");
	});

	it("TDD 4.3: should render Memory Graph panel with node and edge structure", () => {
		const memoryGraph: MemoryGraphData = {
			nodes: [
				{ id: "1", label: "auth.service.ts", kind: "file" },
				{ id: "2", label: "AuthFlow", kind: "symbol" },
				{ id: "3", label: "Tests", kind: "test" },
				{ id: "4", label: "Security", kind: "decision" },
				{ id: "5", label: "Decision: Use JWT", kind: "decision" },
			],
			edges: [
				{ source: "1", target: "2" },
				{ source: "3", target: "2" },
				{ source: "4", target: "2" },
				{ source: "5", target: "2" },
			],
		};

		const cockpit = new DeepSeaCockpit({
			memoryGraph,
		});

		const panelLines = cockpit.renderMemoryGraphPanel(35);
		const text = stripAnsi(panelLines.join("\n"));
		expect(text).toContain("Memory Graph");
		expect(text).toContain("AuthFlow");
		expect(text).toContain("auth.service.ts");
		expect(text).toContain("Decision:");
	});

	it("TDD 4.4: should render Recent Files panel with diff additions and removals", () => {
		const recentFiles: RecentFileItem[] = [
			{ path: "auth.service.ts", linesAdded: 42, linesRemoved: 12 },
			{ path: "auth.controller.ts", linesAdded: 28, linesRemoved: 8 },
			{ path: "auth.spec.ts", linesAdded: 72, linesRemoved: 17 },
		];

		const cockpit = new DeepSeaCockpit({
			recentFiles,
		});

		const panelLines = cockpit.renderRecentFilesPanel(35);
		const text = stripAnsi(panelLines.join("\n"));
		expect(text).toContain("Recent Files");
		expect(text).toContain("auth.service.ts");
		expect(text).toContain("+42 -12");
		expect(text).toContain("auth.controller.ts");
		expect(text).toContain("+28 -8");
		expect(text).toContain("auth.spec.ts");
		expect(text).toContain("+72 -17");
	});

	it("TDD 4.5: should render lower three panels side-by-side with balanced column layout", () => {
		const cockpit = new DeepSeaCockpit();
		const rowLines = cockpit.renderLowerPanelsRow(110);
		expect(rowLines.length).toBeGreaterThanOrEqual(4);

		const text = stripAnsi(rowLines.join("\n"));
		expect(text).toContain("Progress & Activity");
		expect(text).toContain("Memory Graph");
		expect(text).toContain("Recent Files");
	});
});
