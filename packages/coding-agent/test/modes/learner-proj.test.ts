import { beforeAll, describe, expect, it } from "bun:test";
import { highlightLearnerProj } from "@oh-my-pi/pi-coding-agent/modes/learner-proj";
import { highlightMagicKeywords } from "@oh-my-pi/pi-coding-agent/modes/magic-keywords";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("/learner-proj gradient highlighting", () => {
	it("paints /learner-proj with cyan to sapphire gradient", () => {
		const input = "execute /learner-proj on this codebase";
		const decorated = highlightLearnerProj(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});

	it("integrates into highlightMagicKeywords", () => {
		const input = "run /learner-proj please";
		const decorated = highlightMagicKeywords(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
