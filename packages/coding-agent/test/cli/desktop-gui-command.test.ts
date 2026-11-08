import { describe, expect, it } from "bun:test";
import { commands, LAUNCH_FLAG_COMMANDS } from "../../src/cli-commands";
import Desktop from "../../src/commands/desktop";
import type { CliConfig } from "@oh-my-pi/pi-utils/cli";

const TEST_CONFIG: CliConfig = {
	bin: "omsk",
	version: "0.0.48",
	commands: new Map(),
};

describe("omsk desktop command", () => {
	it("registers desktop command in top-level cli command table", () => {
		const desktopEntry = commands.find(c => c.name === "desktop");
		expect(desktopEntry).toBeDefined();
		expect(desktopEntry?.help?.description).toContain("OhMyShark Desktop");
	});

	it("registers desktop in LAUNCH_FLAG_COMMANDS to preserve launch flags", () => {
		expect(LAUNCH_FLAG_COMMANDS.desktop).toBe(true);
	});

	it("instantiates Desktop command class cleanly", () => {
		const desktopCmd = new Desktop([], TEST_CONFIG);
		expect(desktopCmd).toBeInstanceOf(Desktop);
	});
});
