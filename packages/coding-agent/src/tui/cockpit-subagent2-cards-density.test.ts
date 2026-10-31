import { describe, expect, it } from "bun:test";
import {
	DeepSeaCockpit,
	stripAnsi,
	visibleWidth,
} from "./deep-sea-command";

describe("Subagent 2: Cards & Density Engine", () => {
	it("TDD 2.1: should render Top Title Bar with task ID and active density highlighted", () => {
		const cockpit = new DeepSeaCockpit({
			density: "advanced",
			mission: {
				id: "042",
				title: "Refactor authentication flow",
				phase: "2",
				progressPercent: 68,
			},
		});

		const titleBarLines = cockpit.renderTopTitleBar(100);
		expect(titleBarLines.length).toBeGreaterThanOrEqual(1);

		const text = stripAnsi(titleBarLines.join("\n"));
		expect(text).toContain("Deep Sea Cockpit");
		expect(text).toContain("Task #042");
		expect(text).toContain("Compact");
		expect(text).toContain("Standard");
		expect(text).toContain("Advanced");
	});

	it("TDD 2.2: should render Mission card with title, phase, percentage, and horizontal progress bar", () => {
		const cockpit = new DeepSeaCockpit({
			mission: {
				id: "042",
				title: "Refactor authentication flow",
				phase: "2",
				progressPercent: 68,
			},
		});

		const cardLines = cockpit.renderMissionCard(35);
		const text = stripAnsi(cardLines.join("\n"));
		expect(text).toContain("Mission");
		expect(text).toContain("Refactor authentication flow");
		expect(text).toContain("Phase: 2");
		expect(text).toContain("Active (68%)");
		// Check horizontal progress bar existence
		expect(cardLines.some(l => l.includes("━") || l.includes("─") || l.includes("■"))).toBe(true);
	});

	it("TDD 2.3: should render Changes card with additions, deletions, files, and checkpoints", () => {
		const cockpit = new DeepSeaCockpit({
			changes: {
				totalAdded: 142,
				totalRemoved: 37,
				modifiedCount: 3,
				checkpointsCount: 1,
			},
		});

		const cardLines = cockpit.renderChangesCard(25);
		const text = stripAnsi(cardLines.join("\n"));
		expect(text).toContain("Changes");
		expect(text).toContain("+142 lines");
		expect(text).toContain("-37 lines");
		expect(text).toContain("3 files");
		expect(text).toContain("1 checkpoint");
	});

	it("TDD 2.4: should render Checks card with passed count and distinct zero-check message", () => {
		const cockpitPassed = new DeepSeaCockpit({
			passedChecks: 5,
			totalChecks: 5,
		});
		const passedLines = cockpitPassed.renderChecksCard(20);
		const passedText = stripAnsi(passedLines.join("\n"));
		expect(passedText).toContain("Checks");
		expect(passedText).toContain("5/5 passed");

		const cockpitZero = new DeepSeaCockpit({
			passedChecks: 0,
			totalChecks: 0,
		});
		const zeroLines = cockpitZero.renderChecksCard(20);
		const zeroText = stripAnsi(zeroLines.join("\n"));
		expect(zeroText).toContain("Checks");
		expect(zeroText).toContain("No checks executed");
	});

	it("TDD 2.5: should correctly adapt output between compact, standard, and advanced densities", () => {
		const cockpit = new DeepSeaCockpit({
			mission: {
				id: "042",
				title: "Refactor authentication flow",
				phase: "2",
				progressPercent: 68,
			},
			changes: {
				totalAdded: 142,
				totalRemoved: 37,
				modifiedCount: 3,
				checkpointsCount: 1,
			},
			passedChecks: 5,
			totalChecks: 5,
		});

		cockpit.setDensity("compact");
		const compactLines = cockpit.render(100);
		expect(compactLines.length).toBe(1);

		cockpit.setDensity("standard");
		const standardLines = cockpit.render(100);
		expect(standardLines.length).toBeGreaterThan(1);
		expect(standardLines.length).toBeLessThan(15);

		cockpit.setDensity("advanced");
		const advancedLines = cockpit.render(100);
		expect(advancedLines.length).toBeGreaterThan(standardLines.length);
	});
});
