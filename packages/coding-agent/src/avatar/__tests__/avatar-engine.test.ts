import { describe, expect, it } from "bun:test";
import {
	DEFAULT_AGENT_PROFILES,
	computeGrokDots,
	expressionFromGrokIndex,
	renderAvatarDefinition,
	renderAvatarPose,
	renderTerminalAvatarCard,
	surfacePresets,
} from "../index";
import { initTheme } from "../../modes/theme/theme";
import { AgentSelectorComponent } from "../../modes/components/agent-selector";
import { BUILTIN_AGENT_SELECT_SLASH_COMMANDS } from "../../slash-commands/builtin-agent";

describe("Bible Strong Avatar Engine & Dots System", () => {
	it("renders 3D geometric definitions for all surfaces without errors", () => {
		for (const agent of DEFAULT_AGENT_PROFILES) {
			const scene = renderAvatarDefinition(agent.avatar);
			expect(scene.geometry.headPath.length).toBeGreaterThan(10);
			expect(scene.colors.body).toBe(agent.avatar.colors.body);
			expect(scene.colors.eyes).toBe(agent.avatar.colors.eyes);
		}
	});

	it("renders avatar pose for sphere, cube, capsule, and cylinder", () => {
		const geomSphere = renderAvatarPose(surfacePresets.sphere, DEFAULT_AGENT_PROFILES[0]!.avatar.expressions.neutral);
		expect(geomSphere.headPath).toContain("M");

		const geomCube = renderAvatarPose(surfacePresets.cube, DEFAULT_AGENT_PROFILES[1]!.avatar.expressions.neutral);
		expect(geomCube.headPath).toContain("M");
	});

	it("computes Grok dots rings with accurate point counts and spherical projection", () => {
		const expr = expressionFromGrokIndex(0);
		const dots = computeGrokDots(expr, 1, 0, 0, 24);
		expect(dots.left.length).toBe(24);
		expect(dots.right.length).toBe(24);
		// When head rotates to the right, right eye is strictly to the right of left eye
		expect(dots.centerRight[0]).toBeGreaterThan(dots.centerLeft[0]);

		// With zero head rotation, left eye is strictly negative and right eye is strictly positive
		const neutralExpr = { ...expr, headY: 0 };
		const neutralDots = computeGrokDots(neutralExpr, 1, 0, 0, 24);
		expect(neutralDots.centerLeft[0]).toBeLessThan(0);
		expect(neutralDots.centerRight[0]).toBeGreaterThan(0);
	});
	it("renders terminal avatar cards for all 5 team agents with correct metadata", () => {
		expect(DEFAULT_AGENT_PROFILES.length).toBe(5);
		for (const agent of DEFAULT_AGENT_PROFILES) {
			const card = renderTerminalAvatarCard(agent);
			expect(card).toContain(`@${agent.id}`);
			expect(card).toContain(agent.title);
		}
	});

	it("renders the interactive AgentSelectorComponent on TUI", async () => {
		await initTheme();
		let selectedAgentId = "";
		const selector = new AgentSelectorComponent(
			{
				onSelect: a => {
					selectedAgentId = a.id;
				},
				onCancel: () => {},
			},
			"theological-scholar",
		);

		const lines = selector.render(80);
		expect(lines.length).toBeGreaterThan(10);

		// Test direct number shortcut key
		selector.handleInput("3");
		expect(selectedAgentId).toBe("theological-scholar");
	});

	it("handles /agent slash command with arguments and default listing", async () => {
		const cmd = BUILTIN_AGENT_SELECT_SLASH_COMMANDS[0]!;
		expect(cmd.name).toBe("agent");
		expect(cmd.handle).toBeDefined();

		let outputText = "";
		const mockRuntime = {
			output: (msg: string): Promise<void> | void => {
				outputText = msg;
			},
		};
		await cmd.handle!(
			{ name: "agent", text: "/agent scholar", args: "scholar" },
			mockRuntime as unknown as Parameters<NonNullable<typeof cmd.handle>>[1],
		);
		expect(outputText).toContain("@theological-scholar");
		expect(outputText).toContain("Bible Strong Scholar");
	});
});
