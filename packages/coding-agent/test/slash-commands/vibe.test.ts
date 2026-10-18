import { describe, expect, it } from "bun:test";
import { BUILTIN_SLASH_COMMAND_DEFS, executeBuiltinSlashCommand } from "../../src/slash-commands/builtin-registry";
import type { TuiSlashCommandRuntime } from "../../src/slash-commands/types";
import type { InteractiveModeContext } from "../../src/modes/types";

describe("/vibecoding slash command suite", () => {
	it("registers /vibecoding, /wave, and /sec-review in builtin slash commands", () => {
		const vibeCmd = BUILTIN_SLASH_COMMAND_DEFS.find(c => c.name === "vibecoding");
		expect(vibeCmd).toBeDefined();
		expect(vibeCmd?.name).toBe("vibecoding");
		expect(vibeCmd?.allowArgs).toBe(true);
		expect(vibeCmd?.aliases).toContain("vibe-toolkit");
		expect(vibeCmd?.aliases).toContain("toolkit");

		const waveCmd = BUILTIN_SLASH_COMMAND_DEFS.find(c => c.name === "wave");
		expect(waveCmd).toBeDefined();
		expect(waveCmd?.aliases).toContain("waves");

		const secCmd = BUILTIN_SLASH_COMMAND_DEFS.find(c => c.name === "sec-review");
		expect(secCmd).toBeDefined();
	});

	it("has all expected subcommands registered for /vibecoding", () => {
		const vibeCmd = BUILTIN_SLASH_COMMAND_DEFS.find(c => c.name === "vibecoding");
		const subNames = vibeCmd?.subcommands?.map(s => s.name) ?? [];
		expect(subNames).toContain("status");
		expect(subNames).toContain("scaffold");
		expect(subNames).toContain("wave");
		expect(subNames).toContain("check-350");
		expect(subNames).toContain("prompt");
		expect(subNames).toContain("tool");
		expect(subNames).toContain("validate");
		expect(subNames).toContain("review");
		expect(subNames).toContain("help");
	});

	it("executes /vibecoding help and displays menu", async () => {
		let capturedStatus = "";
		const mockContext = {
			editor: { setText: () => {} },
			sessionManager: { getCwd: () => process.cwd() },
			showStatus: (text: string) => {
				capturedStatus = text;
			},
			collabGuest: false,
		} as unknown as InteractiveModeContext;

		const executed = await executeBuiltinSlashCommand("/vibecoding help", {
			ctx: mockContext,
		} as TuiSlashCommandRuntime);

		expect(executed).toBe(true);
		expect(capturedStatus).toContain("Vibe Coding Toolkit");
		expect(capturedStatus).toContain("/vibecoding status");
		expect(capturedStatus).toContain("/vibecoding wave");
	});

	it("executes /vibecoding prompt 05 and returns prompt content", async () => {
		let capturedStatus = "";
		const mockContext = {
			editor: { setText: () => {} },
			sessionManager: { getCwd: () => process.cwd() },
			showStatus: (text: string) => {
				capturedStatus = text;
			},
			collabGuest: false,
		} as unknown as InteractiveModeContext;

		const executed = await executeBuiltinSlashCommand("/vibecoding prompt 05", {
			ctx: mockContext,
		} as TuiSlashCommandRuntime);

		expect(executed).toBe(true);
		expect(capturedStatus).toContain("Parallel Wave Dispatch");
	});

	it("executes /wave shortcut and plans waves cleanly", async () => {
		let capturedStatus = "";
		const mockContext = {
			editor: { setText: () => {} },
			sessionManager: { getCwd: () => process.cwd() },
			showStatus: (text: string) => {
				capturedStatus = text;
			},
			collabGuest: false,
		} as unknown as InteractiveModeContext;

		const taskJson = JSON.stringify([
			{ id: "A", title: "Task A", files: ["a.ts"], dependsOn: [] },
			{ id: "B", title: "Task B", files: ["b.ts"], dependsOn: [] },
		]);

		const executed = await executeBuiltinSlashCommand(`/wave ${taskJson}`, {
			ctx: mockContext,
		} as TuiSlashCommandRuntime);

		expect(executed).toBe(true);
		expect(capturedStatus).toContain("Plano de Ondas Paralelas Gerado");
		expect(capturedStatus).toContain("ONDA 1");
	});

	it("executes /sec-review and returns security review prompt", async () => {
		let capturedStatus = "";
		const mockContext = {
			editor: { setText: () => {} },
			sessionManager: { getCwd: () => process.cwd() },
			showStatus: (text: string) => {
				capturedStatus = text;
			},
			collabGuest: false,
		} as unknown as InteractiveModeContext;

		const executed = await executeBuiltinSlashCommand("/sec-review", {
			ctx: mockContext,
		} as TuiSlashCommandRuntime);

		expect(executed).toBe(true);
		expect(capturedStatus).toContain("Security review");
	});
});
