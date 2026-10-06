import { describe, expect, it } from "bun:test";
import { BUILTIN_SLASH_COMMAND_DEFS, executeBuiltinSlashCommand } from "../../src/slash-commands/builtin-registry";
import type { TuiSlashCommandRuntime } from "../../src/slash-commands/types";
import type { InteractiveModeContext } from "../../src/modes/types";

describe("/taskmanager slash command", () => {
	it("registers /taskmanager in builtin slash commands", () => {
		const cmd = BUILTIN_SLASH_COMMAND_DEFS.find(c => c.name === "taskmanager");
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe("taskmanager");
		expect(cmd?.allowArgs).toBe(false);
		expect(cmd?.aliases).toContain("task-manager");
	});

	it("refuses invocation with arguments", async () => {
		const mockContext = {
			editor: { setText: () => {} },
			sessionManager: { getCwd: () => process.cwd() },
			showStatus: () => {},
			collabGuest: false,
		} as unknown as InteractiveModeContext;

		const executed = await executeBuiltinSlashCommand("/taskmanager extra args", {
			ctx: mockContext,
		} as TuiSlashCommandRuntime);

		expect(executed).toBe(false);
	});
});
