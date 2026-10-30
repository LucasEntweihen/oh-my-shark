import { describe, expect, it } from "bun:test";
import { DeepSeaCockpit } from "./deep-sea-command";

describe("DeepSeaCockpit", () => {
	it("should render compact view within width constraints", () => {
		const cockpit = new DeepSeaCockpit({
			density: "compact",
			workspaceName: "alpha-proj",
			mission: {
				id: "TASK-042",
				title: "Implement Transactional Engine",
				phase: "Phase 2 · Active",
				progressPercent: 50,
			},
			changes: {
				totalAdded: 120,
				totalRemoved: 15,
				modifiedCount: 3,
				checkpointsCount: 1,
			},
			passedChecks: 5,
			totalChecks: 5,
		});

		const lines = cockpit.render(100);
		expect(lines.length).toBe(1);
		expect(lines[0]).toContain("COCKPIT");
		expect(lines[0]).toContain("TASK-042");
	});

	it("should render standard multi-line cockpit with mission, changes, and checks", () => {
		const cockpit = new DeepSeaCockpit({
			density: "standard",
			changes: {
				totalAdded: 45,
				totalRemoved: 10,
				modifiedCount: 2,
				checkpointsCount: 1,
			},
			passedChecks: 4,
			totalChecks: 5,
		});

		const lines = cockpit.render(80);
		expect(lines.length).toBeGreaterThanOrEqual(5);
		const fullText = lines.join("\n");
		expect(fullText).toContain("DEEP SEA COMMAND");
		expect(fullText).toContain("CHANGES");
		expect(fullText).toContain("CHECKS");
	});

	it("should render advanced cockpit with live event stream", () => {
		const cockpit = new DeepSeaCockpit({
			density: "advanced",
		});
		cockpit.pushEvent({
			timestamp: "14:02:00",
			type: "checkpoint",
			label: "Checkpoint ckpt_001 created",
			detail: "Rollback available",
		});

		const lines = cockpit.render(90);
		const fullText = lines.join("\n");
		expect(fullText).toContain("LIVE EVENT STREAM");
		expect(fullText).toContain("ckpt_001");
	});
});
