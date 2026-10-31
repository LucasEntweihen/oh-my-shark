import { describe, expect, it } from "bun:test";
import { DeepSeaCockpit, stripAnsi, visibleWidth } from "./deep-sea-command";

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

	// --- 5+ NEW TDD SPECIFIC TESTS ---

	it("TDD 1: should support reactive EventBus subscriptions and emissions", () => {
		const cockpit = new DeepSeaCockpit();
		const received: string[] = [];

		const unsubscribe = cockpit.onEvent((ev) => {
			received.push(`${ev.type}:${ev.label}`);
		});

		cockpit.emitEvent({
			type: "edit",
			label: "Updated authentication.ts",
			detail: "+12 -3 lines",
		});

		cockpit.emitEvent({
			type: "test",
			label: "Unit tests suite",
			detail: "15 assertions passed",
		});

		expect(received.length).toBe(2);
		expect(received[0]).toBe("edit:Updated authentication.ts");
		expect(received[1]).toBe("test:Unit tests suite");

		// Unsubscribe should cease notifications
		unsubscribe();
		cockpit.emitEvent({
			type: "checkpoint",
			label: "Checkpoint created",
		});
		expect(received.length).toBe(2);
	});

	it("TDD 2: should track mission lifecycle, subtasks, elapsed time, and completion", () => {
		const cockpit = new DeepSeaCockpit();
		cockpit.startMission("TASK-999", "Build Deep Sea Engine", "Phase 1: Architecture");

		const mission1 = cockpit.getMission();
		expect(mission1.id).toBe("TASK-999");
		expect(mission1.status).toBe("active");
		expect(mission1.progressPercent).toBe(0);

		cockpit.updateMissionProgress(65, "Implementing SQLite WAL", "Phase 2: Database");
		const mission2 = cockpit.getMission();
		expect(mission2.progressPercent).toBe(65);
		expect(mission2.activeSubtask).toBe("Implementing SQLite WAL");
		expect(mission2.phase).toBe("Phase 2: Database");

		cockpit.completeMission("completed");
		const mission3 = cockpit.getMission();
		expect(mission3.status).toBe("completed");
		expect(mission3.progressPercent).toBe(100);
		expect(cockpit.getMissionElapsedSeconds()).toBeGreaterThanOrEqual(0);
	});

	it("TDD 3: should register, list, and trigger keyboard shortcut actions", () => {
		const cockpit = new DeepSeaCockpit();
		let commandPaletteTriggered = false;
		let diffViewerTriggered = false;

		cockpit.registerShortcut("Ctrl+P", "Open Palette", () => {
			commandPaletteTriggered = true;
		});

		cockpit.registerShortcut("Ctrl+D", "Open Diff", () => {
			diffViewerTriggered = true;
		});

		const shortcuts = cockpit.listShortcuts();
		expect(shortcuts.some((s) => s.key === "Ctrl+P")).toBe(true);
		expect(shortcuts.some((s) => s.key === "Ctrl+D")).toBe(true);

		const triggered1 = cockpit.triggerShortcut("Ctrl+P");
		expect(triggered1).toBe(true);
		expect(commandPaletteTriggered).toBe(true);

		const triggered2 = cockpit.triggerShortcut("Ctrl+D");
		expect(triggered2).toBe(true);
		expect(diffViewerTriggered).toBe(true);

		const triggeredUnknown = cockpit.triggerShortcut("Ctrl+Z");
		expect(triggeredUnknown).toBe(false);
	});

	it("TDD 4: should render safely in ultra-narrow terminals (20-30 columns) without ANSI leaks", () => {
		const cockpit = new DeepSeaCockpit({
			density: "compact",
			mission: {
				id: "T-01",
				title: "Extremely Long Task Name Exceeding Narrow Terminal Width",
				phase: "Active",
				progressPercent: 75,
			},
			changes: {
				totalAdded: 10,
				totalRemoved: 2,
				modifiedCount: 1,
				checkpointsCount: 1,
			},
		});

		// Test narrow widths 20, 25, 30
		for (const w of [20, 25, 30]) {
			const lines = cockpit.render(w);
			expect(lines.length).toBe(1);
			const line = lines[0];
			expect(visibleWidth(line)).toBeLessThanOrEqual(w);
			// Must not contain raw unclosed escape sequence
			expect(stripAnsi(line)).not.toContain("\x1b[");
		}
	});

	it("TDD 5: should synchronize changes from TransactionalEditEngine summary", async () => {
		const cockpit = new DeepSeaCockpit();

		const mockEngine = {
			async getChangesSummary() {
				return {
					totalAdded: 350,
					totalRemoved: 42,
					modifiedCount: 7,
					checkpointsCount: 3,
					lastCheckpointId: "ckpt_alpha_99",
				};
			},
		};

		await cockpit.syncFromEditEngine(mockEngine);

		const changes = cockpit.getChanges();
		expect(changes.totalAdded).toBe(350);
		expect(changes.totalRemoved).toBe(42);
		expect(changes.modifiedCount).toBe(7);
		expect(changes.checkpointsCount).toBe(3);
		expect(changes.lastCheckpointId).toBe("ckpt_alpha_99");
	});

	it("TDD 6: should record checks and automatically publish test events to the event stream", () => {
		const cockpit = new DeepSeaCockpit();
		cockpit.recordCheck("Compiler TypeScript Check", true);
		cockpit.recordCheck("Security Audit Check", true);
		cockpit.recordCheck("Integration Smoke Check", false);

		const lines = cockpit.render(80);
		const fullText = lines.join("\n");
		expect(fullText).toContain("2/3 passing");

		const events = cockpit.getRecentEvents();
		expect(events.length).toBe(3);
		expect(events[0].type).toBe("test");
		expect(events[0].detail).toBe("FAILED");
		expect(events[1].detail).toBe("PASSED");
	});
});
