import { describe, expect, it } from "bun:test";
import { visibleWidth, truncateToWidth } from "@oh-my-pi/pi-tui";
import { padToWidth } from "../packages/coding-agent/src/tui/utils";
import {
	DeepSeaCockpit,
	type CockpitEventItem,
} from "../packages/coding-agent/src/tui/deep-sea-command";
import {
	SHARK_LOGO,
	REST_FRAME,
	SHARK_WIDTH,
} from "../packages/coding-agent/src/modes/components/shark-logo";
describe("Subagent 2 TDD: Deep Sea Cockpit TUI Reactive System", () => {
	it("initializes cockpit with default metrics and status", () => {
		const cockpit = new DeepSeaCockpit();
		expect(cockpit).toBeDefined();

		const rendered = cockpit.render(100);
		expect(Array.isArray(rendered)).toBe(true);
		expect(rendered.length).toBeGreaterThan(0);
		const fullText = rendered.join("\n");
		expect(fullText).toContain("DEEP SEA COMMAND");
	});

	it("supports reactive event bus via emitEvent and onEvent listener", () => {
		const cockpit = new DeepSeaCockpit();
		const eventsReceived: CockpitEventItem[] = [];

		const unsubscribe = cockpit.onEvent((ev) => {
			eventsReceived.push(ev);
		});

		cockpit.emitEvent({
			timestamp: "12:00:01",
			label: "Checkpoint mission",
			type: "checkpoint",
			status: "active",
		});

		cockpit.emitEvent({
			timestamp: "12:00:02",
			label: "Security audit",
			type: "test",
			status: "passed",
		});

		expect(eventsReceived.length).toBe(2);
		expect(eventsReceived[0].type).toBe("checkpoint");
		expect(eventsReceived[0].status).toBe("active");
		expect(eventsReceived[1].type).toBe("test");
		expect(eventsReceived[1].status).toBe("passed");

		unsubscribe();

		cockpit.emitEvent({
			timestamp: "12:00:03",
			label: "Post unsubscribe",
			type: "tool",
		});

		expect(eventsReceived.length).toBe(2);
	});

	it("adapts layout across multiple density modes cleanly", () => {
		const cockpit = new DeepSeaCockpit();

		cockpit.setDensity("compact");
		expect(cockpit.getDensity()).toBe("compact");
		const compact = cockpit.render(80);
		expect(Array.isArray(compact)).toBe(true);

		cockpit.setDensity("standard");
		expect(cockpit.getDensity()).toBe("standard");
		const standard = cockpit.render(100);
		expect(Array.isArray(standard)).toBe(true);

		cockpit.setDensity("advanced");
		expect(cockpit.getDensity()).toBe("advanced");
		const advanced = cockpit.render(120);
		expect(Array.isArray(advanced)).toBe(true);
		expect(advanced.length).toBeGreaterThanOrEqual(compact.length);
	});

	it("enforces ANSI-safe visible width, truncation, and padding invariants", () => {
		const plain = "OhMyShark";
		expect(visibleWidth(plain)).toBe(9);

		const colored = "\u001b[36mOhMyShark\u001b[0m";
		expect(visibleWidth(colored)).toBe(9);

		const truncated = truncateToWidth(plain, 5);
		expect(visibleWidth(truncated)).toBeLessThanOrEqual(5);

		const padded = padToWidth(plain, 15);
		expect(visibleWidth(padded)).toBe(15);
	});

	it("safely handles terminal narrow bounds down to 20 columns without crashing", () => {
		const cockpit = new DeepSeaCockpit();

		const narrowRender = cockpit.render(25);
		expect(Array.isArray(narrowRender)).toBe(true);
		expect(narrowRender.length).toBeGreaterThan(0);

		const ultraNarrow = cockpit.render(20);
		expect(Array.isArray(ultraNarrow)).toBe(true);
		expect(ultraNarrow.length).toBeGreaterThan(0);
	});

	it("verifies canonical ASCII shark logo rendering with cyan-blue gradient stops", () => {
		expect(SHARK_LOGO.length).toBe(17); // 17-line canonical stackedlol/ascii-sharks
		expect(SHARK_WIDTH).toBeGreaterThanOrEqual(50);

		expect(REST_FRAME.length).toBe(17);
		const combinedLogo = SHARK_LOGO.join("\n");
		expect(combinedLogo).toContain("XSSS8SSX%XX8#");
		expect(REST_FRAME[0]).toContain("\u001b[38;2;");
	});
});
