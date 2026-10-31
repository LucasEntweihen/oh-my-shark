import { describe, expect, it } from "bun:test";
import {
	DeepSeaCockpit,
	type CockpitEventItem,
	stripAnsi,
} from "./deep-sea-command";

describe("Subagent 3: Live Event Stream & Provenance Engine", () => {
	it("TDD 3.1: should render live event stream header with waveform icon", () => {
		const cockpit = new DeepSeaCockpit();
		const streamLines = cockpit.renderEventStream(100);
		expect(streamLines.length).toBeGreaterThanOrEqual(1);

		const text = stripAnsi(streamLines.join("\n"));
		expect(text).toContain("LIVE EVENT STREAM & PROVENANCE");
	});

	it("TDD 3.2: should format events with timestamp, badge, label, and detail correctly", () => {
		const cockpit = new DeepSeaCockpit();
		cockpit.pushEvent({
			timestamp: "14:25:10",
			type: "checkpoint",
			label: "Checkpoint ckpt_042 created",
			detail: "Rollback available",
		});
		cockpit.pushEvent({
			timestamp: "14:25:14",
			type: "edit",
			label: "Updated auth.service.ts",
			detail: "Refactored validation logic",
		});
		cockpit.pushEvent({
			timestamp: "14:25:17",
			type: "test",
			label: "Authentication tests",
			detail: "12 assertions passed",
		});

		const streamLines = cockpit.renderEventStream(100);
		const text = stripAnsi(streamLines.join("\n"));
		expect(text).toContain("14:25:10");
		expect(text).toContain("CKPT");
		expect(text).toContain("ckpt_042");
		expect(text).toContain("Rollback available");

		expect(text).toContain("14:25:14");
		expect(text).toContain("EDIT");
		expect(text).toContain("auth.service.ts");

		expect(text).toContain("14:25:17");
		expect(text).toContain("TEST");
		expect(text).toContain("12 assertions passed");
	});

	it("TDD 3.3: should notify event listeners via EventBus on emitEvent", () => {
		const cockpit = new DeepSeaCockpit();
		const received: CockpitEventItem[] = [];

		const unsubscribe = cockpit.onEvent((ev) => {
			received.push(ev);
		});

		cockpit.emitEvent({
			type: "tool",
			label: "Tool: run_tests",
			detail: "Execution completed",
		});

		expect(received.length).toBe(1);
		expect(received[0].label).toBe("Tool: run_tests");
		expect(received[0].detail).toBe("Execution completed");

		unsubscribe();
		cockpit.emitEvent({
			type: "tool",
			label: "Tool: other",
		});
		expect(received.length).toBe(1);
	});

	it("TDD 3.4: should maintain a bounded circular buffer without memory leakage", () => {
		const cockpit = new DeepSeaCockpit();
		for (let i = 0; i < 50; i++) {
			cockpit.pushEvent({
				timestamp: `10:00:${i < 10 ? "0" + i : i}`,
				type: "edit",
				label: `File ${i}`,
			});
		}

		const events = cockpit.getRecentEvents();
		expect(events.length).toBeLessThanOrEqual(32);
		expect(events[0].label).toBe("File 49");
	});

	it("TDD 3.5: should display empty stream message when no events exist", () => {
		const cockpit = new DeepSeaCockpit({ recentEvents: [] });
		const streamLines = cockpit.renderEventStream(100);
		const text = stripAnsi(streamLines.join("\n"));
		expect(text).toContain("No events recorded yet");
	});
});
