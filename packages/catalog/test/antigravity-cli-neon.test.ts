import { expect, it } from "bun:test";
import { buildModel } from "@oh-my-pi/pi-catalog/build";
import { Effort } from "@oh-my-pi/pi-catalog/effort";
import { getBundledModel } from "@oh-my-pi/pi-catalog/models";

it("antigravity-cli Gemini 4 Neon offers only agy's thought levels, defaulting to high", () => {
	// agy rejects a `thought_level` its roster omits ("Thinking level 'minimal' is not offered"),
	// and Neon opens at `high` rather than the `medium` its siblings default to.
	const model = buildModel({
		id: "gemini-4-neon",
		name: "Gemini 4 Neon",
		api: "antigravity-acp",
		provider: "antigravity-cli",
		baseUrl: "https://antigravity.google",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1_048_576,
		maxTokens: 262_144,
	});

	expect(model.thinking?.efforts).toEqual([Effort.Low, Effort.Medium, Effort.High, Effort.XHigh]);
	expect(model.thinking?.defaultLevel).toBe(Effort.High);
});

it("google-antigravity bundles full-capacity Gemini 4 Carbon, Hydrogen, and Neon entries", () => {
	const carbon = getBundledModel("google-antigravity", "gemini-4-carbon");
	expect(carbon?.contextWindow).toBe(1_048_576);
	expect(carbon?.maxTokens).toBe(262_144);
	expect(carbon?.thinking?.efforts).toEqual([Effort.Low, Effort.Medium, Effort.High]);

	const hydrogen = getBundledModel("google-antigravity", "gemini-4-hydrogen");
	expect(hydrogen?.contextWindow).toBe(1_048_576);
	expect(hydrogen?.maxTokens).toBe(262_144);
	expect(hydrogen?.thinking?.efforts).toEqual([Effort.Low, Effort.Medium, Effort.High, Effort.XHigh]);
	expect(hydrogen?.thinking?.effortRouting?.[Effort.XHigh]).toBe("gemini-4-hydrogen-xhigh");

	const neon = getBundledModel("google-antigravity", "gemini-4-neon");
	expect(neon?.contextWindow).toBe(1_048_576);
	expect(neon?.maxTokens).toBe(262_144);
	expect(neon?.thinking?.efforts).toEqual([Effort.Low, Effort.Medium, Effort.High, Effort.XHigh]);
	expect(neon?.thinking?.effortRouting?.[Effort.XHigh]).toBe("gemini-4-neon-xhigh");
});
