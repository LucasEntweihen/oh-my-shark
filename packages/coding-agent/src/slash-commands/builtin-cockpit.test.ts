import { describe, expect, it } from "bun:test";
import {
	BUILTIN_COCKPIT_SLASH_COMMANDS,
	formatCockpitHelp,
	handleCockpitCommand,
	handleDiffCommand,
	handleEventsCommand,
	handleTasksCommand,
} from "./builtin-cockpit";
import type { ParsedSlashCommand, SlashCommandRuntime } from "./types";

function createMockRuntime(outputFn: (text: string) => void): SlashCommandRuntime {
	return {
		cwd: process.cwd(),
		session: {
			model: { id: "gemini-2.5-pro", provider: "Google" },
		} as unknown as SlashCommandRuntime["session"],
		sessionManager: {} as unknown as SlashCommandRuntime["sessionManager"],
		settings: {} as unknown as SlashCommandRuntime["settings"],
		output: (text: string) => outputFn(text),
		refreshCommands: () => {},
		reloadPlugins: async () => {},
	};
}

describe("Builtin Cockpit Slash Commands", () => {
	it("TDD C.1: should register /cockpit, /diff, /tasks, and /events commands in specification", () => {
		const names = BUILTIN_COCKPIT_SLASH_COMMANDS.map(c => c.name);
		expect(names).toContain("cockpit");
		expect(names).toContain("diff");
		expect(names).toContain("tasks");
		expect(names).toContain("events");

		const cockpitCmd = BUILTIN_COCKPIT_SLASH_COMMANDS.find(c => c.name === "cockpit")!;
		expect(cockpitCmd.aliases).toContain("deepsea");
		expect(cockpitCmd.aliases).toContain("dsh");
		expect(cockpitCmd.subcommands?.length).toBeGreaterThanOrEqual(5);
	});

	it("TDD C.2: should render full cockpit view on /cockpit and format help", async () => {
		let outputText = "";
		const runtime = createMockRuntime((text) => {
			outputText = text;
		});

		const cmd: ParsedSlashCommand = { name: "cockpit", args: "view", text: "/cockpit view" };
		const res = await handleCockpitCommand(cmd, runtime);
		expect(res).toEqual({ consumed: true });
		expect(outputText).toContain("Deep Sea Cockpit");
		expect(outputText).toContain("Oh My Shark");

		const helpText = formatCockpitHelp();
		expect(helpText).toContain("/cockpit");
		expect(helpText).toContain("/diff");
		expect(helpText).toContain("/tasks");
		expect(helpText).toContain("/events");
	});

	it("TDD C.3: should toggle density to compact, standard, and advanced", async () => {
		let outputText = "";
		const runtime = createMockRuntime((text) => {
			outputText = text;
		});

		await handleCockpitCommand({ name: "cockpit", args: "compact", text: "/cockpit compact" }, runtime);
		expect(outputText).toContain("Densidade do Cockpit alterada para Compact");
		expect(outputText).toContain("OMSK");

		await handleCockpitCommand({ name: "cockpit", args: "standard", text: "/cockpit standard" }, runtime);
		expect(outputText).toContain("Densidade do Cockpit alterada para Standard");

		await handleCockpitCommand({ name: "cockpit", args: "advanced", text: "/cockpit advanced" }, runtime);
		expect(outputText).toContain("Densidade do Cockpit alterada para Advanced");
		expect(outputText).toContain("LIVE EVENT STREAM");
	});

	it("TDD C.4: should sync live metrics and execute /diff reporting changes", async () => {
		let outputText = "";
		const runtime = createMockRuntime((text) => {
			outputText = text;
		});

		await handleCockpitCommand({ name: "cockpit", args: "sync", text: "/cockpit sync" }, runtime);
		expect(outputText).toContain("Deep Sea Cockpit sincronizado com sucesso");
		expect(outputText).toContain("Alterações");
		expect(outputText).toContain("Mente em Teia");

		await handleDiffCommand({ name: "diff", args: "", text: "/diff" }, runtime);
		expect(outputText).toContain("[Ctrl+D] Live Diff & Changes Monitor");
		expect(outputText).toContain("Total adicionado:");
		expect(outputText).toContain("Total removido:");
	});

	it("TDD C.5: should execute /tasks and /events reporting active mission and event stream", async () => {
		let outputText = "";
		const runtime = createMockRuntime((text) => {
			outputText = text;
		});

		await handleTasksCommand({ name: "tasks", args: "", text: "/tasks" }, runtime);
		expect(outputText).toContain("[Ctrl+J] Tasks & Mission Progress");
		expect(outputText).toContain("Missão:");
		expect(outputText).toContain("Fase:");

		await handleEventsCommand({ name: "events", args: "", text: "/events" }, runtime);
		expect(outputText).toContain("LIVE EVENT STREAM & PROVENANCE");
	});

	it("TDD C.6: should handle configuration subcommands: density, sidebar, config, layout, reset", async () => {
		let outputText = "";
		const settingsMap = new Map<string, unknown>();
		const runtime = createMockRuntime((text) => {
			outputText = text;
		});
		runtime.settings = {
			set: (key: string, val: unknown) => {
				settingsMap.set(key, val);
			},
			get: (key: string) => settingsMap.get(key),
		} as unknown as SlashCommandRuntime["settings"];

		// /cockpit density auto
		await handleCockpitCommand({ name: "cockpit", args: "density auto", text: "/cockpit density auto" }, runtime);
		expect(outputText).toContain("AUTO");
		expect(settingsMap.get("cockpit.density")).toBe("auto");

		// /cockpit sidebar hidden
		await handleCockpitCommand({ name: "cockpit", args: "sidebar hidden", text: "/cockpit sidebar hidden" }, runtime);
		expect(outputText).toContain("HIDDEN");
		expect(settingsMap.get("cockpit.sidebar")).toBe("hidden");

		// /cockpit layout cockpit
		await handleCockpitCommand({ name: "cockpit", args: "layout cockpit", text: "/cockpit layout cockpit" }, runtime);
		expect(outputText).toContain("COCKPIT");
		expect(settingsMap.get("tui.layout")).toBe("cockpit");

		// /cockpit config (view all)
		await handleCockpitCommand({ name: "cockpit", args: "config", text: "/cockpit config" }, runtime);
		expect(outputText).toContain("cockpit.density");
		expect(outputText).toContain("cockpit.sidebar");

		// /cockpit config showTips false
		await handleCockpitCommand({ name: "cockpit", args: "config showTips false", text: "/cockpit config showTips false" }, runtime);
		expect(outputText).toContain("showTips = false");
		expect(settingsMap.get("cockpit.showTips")).toBe(false);

		// /cockpit reset
		await handleCockpitCommand({ name: "cockpit", args: "reset", text: "/cockpit reset" }, runtime);
		expect(outputText).toContain("restauradas para os padrões");
	});
});
