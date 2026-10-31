import { describe, expect, it } from "bun:test";
import {
	DeepSeaCockpit,
	stripAnsi,
} from "./deep-sea-command";

describe("Subagent 5: Runtime Status, Layout & System Integration Engine", () => {
	it("TDD 5.1: should render bottom status bar with agent state, steps, progress bar, and shortcuts", () => {
		const cockpit = new DeepSeaCockpit({
			agentStatus: "Working...",
			completedSteps: 3,
			totalSteps: 4,
			progressPercent: 75,
		});

		const statusLines = cockpit.renderBottomStatus(120);
		expect(statusLines.length).toBeGreaterThanOrEqual(1);

		const text = stripAnsi(statusLines.join("\n"));
		expect(text).toContain("Agent: Working...");
		expect(text).toContain("3/4 steps completed");
		expect(text).toContain("Ctrl+C to cancel");
		expect(text).toContain("help");
	});

	it("TDD 5.2: should update agent status dynamically across various operational states", () => {
		const cockpit = new DeepSeaCockpit();

		cockpit.setAgentStatus("Thinking", 1, 4);
		let text = stripAnsi(cockpit.renderBottomStatus(100).join("\n"));
		expect(text).toContain("Agent: Thinking");
		expect(text).toContain("1/4 steps completed");

		cockpit.setAgentStatus("Editing", 2, 4);
		text = stripAnsi(cockpit.renderBottomStatus(100).join("\n"));
		expect(text).toContain("Agent: Editing");

		cockpit.setAgentStatus("Completed", 4, 4);
		text = stripAnsi(cockpit.renderBottomStatus(100).join("\n"));
		expect(text).toContain("Agent: Completed");
	});

	it("TDD 5.3: should sync changes and recent files from TransactionalEditEngine mock", async () => {
		const cockpit = new DeepSeaCockpit();
		const mockEngine = {
			async getChangesSummary() {
				return {
					totalAdded: 142,
					totalRemoved: 37,
					modifiedCount: 3,
					checkpointsCount: 1,
				};
			},
			async getDetailedDiff() {
				return [
					{ path: "auth.service.ts", status: "modified" as const, linesAdded: 42, linesRemoved: 12 },
					{ path: "auth.controller.ts", status: "modified" as const, linesAdded: 28, linesRemoved: 8 },
				];
			},
		};

		await cockpit.syncFromEditEngine(mockEngine);
		const changes = cockpit.getChanges();
		expect(changes.totalAdded).toBe(142);
		expect(changes.totalRemoved).toBe(37);

		const files = cockpit.getRecentFiles();
		expect(files.length).toBe(2);
		expect(files[0].path).toBe("auth.service.ts");
		expect(files[0].linesAdded).toBe(42);
	});

	it("TDD 5.4: should sync knowledge nodes and relations from MenteEmTeiaStore mock", async () => {
		const cockpit = new DeepSeaCockpit();
		const mockStore = {
			exportGraphSnapshot() {
				return {
					nodes: [
						{ id: "1", name: "auth.service.ts", kind: "file" as const, createdAt: 1, updatedAt: 1 },
						{ id: "2", name: "AuthFlow", kind: "symbol" as const, createdAt: 1, updatedAt: 1 },
					],
					edges: [
						{ id: "e1", sourceId: "1", targetId: "2", relation: "defines" as const, confidence: 1, createdAt: 1 },
					],
				};
			},
		};

		cockpit.syncFromMenteEmTeia(mockStore);
		const graph = cockpit.getMemoryGraph();
		expect(graph.nodes.length).toBe(2);
		expect(graph.nodes[0].label).toBe("auth.service.ts");
		expect(graph.edges.length).toBe(1);
	});

	it("TDD 5.5: should render complete full cockpit with header, sidebar, main cards, stream, lower panels, and status", () => {
		const cockpit = new DeepSeaCockpit({
			density: "advanced",
			version: "0.0.45",
			modelName: "gemini-2.5-pro",
			providerName: "Google",
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
			agentStatus: "Working...",
			completedSteps: 3,
			totalSteps: 4,
		});

		const fullLines = cockpit.renderFullCockpit(120, 35);
		expect(fullLines.length).toBeGreaterThanOrEqual(15);

		const fullText = stripAnsi(fullLines.join("\n"));
		expect(fullText).toContain("Oh My Shark");
		expect(fullText).toContain("Deep Sea Cockpit");
		expect(fullText).toContain("OMSK");
		expect(fullText).toContain("Mission");
		expect(fullText).toContain("Changes");
		expect(fullText).toContain("Checks");
		expect(fullText).toContain("LIVE EVENT STREAM & PROVENANCE");
		expect(fullText).toContain("Agent: Working...");
	});
});
