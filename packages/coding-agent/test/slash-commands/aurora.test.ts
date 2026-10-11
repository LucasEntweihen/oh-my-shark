import { describe, expect, it } from "bun:test";
import { BUILTIN_SLASH_COMMAND_DEFS } from "../../src/slash-commands/builtin-registry";

describe("/aurora and /gui slash command", () => {
	it("registers /aurora in builtin slash commands with aliases", () => {
		const cmd = BUILTIN_SLASH_COMMAND_DEFS.find((c: { name: string }) => c.name === "aurora");
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe("aurora");
		expect(cmd?.aliases).toContain("gui");
		expect(cmd?.aliases).toContain("app");
		expect(cmd?.aliases).toContain("desktop");
	});
});
