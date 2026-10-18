import { beforeAll, describe, expect, it } from "bun:test";
import { containsVibecoding, highlightVibecoding } from "@oh-my-pi/pi-coding-agent/modes/vibecoding";
import { hasMagicKeyword, highlightMagicKeywords } from "@oh-my-pi/pi-coding-agent/modes/magic-keywords";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("vibecoding keyword detection", () => {
	it("matches standalone trigger words 'vibe', '/vibe', 'vibecoding', '/vibecoding'", () => {
		expect(containsVibecoding("vibe")).toBe(true);
		expect(containsVibecoding("/vibe")).toBe(true);
		expect(containsVibecoding("vibecoding")).toBe(true);
		expect(containsVibecoding("/vibecoding")).toBe(true);
		expect(containsVibecoding("please /vibe this project")).toBe(true);
		expect(containsVibecoding("enable vibecoding now")).toBe(true);
	});

	it("matches when adjacent to punctuation", () => {
		for (const text of ["vibe.", "let's do /vibe, ok?", 'say "vibecoding"!']) {
			expect(containsVibecoding(text)).toBe(true);
		}
	});

	it("ignores path-embedded forms and non-standalone words", () => {
		expect(containsVibecoding("src/modes/vibe.ts")).toBe(false);
		expect(containsVibecoding("vibes")).toBe(false);
		expect(containsVibecoding("vibecodings")).toBe(false);
		expect(containsVibecoding("completely unrelated sentence")).toBe(false);
	});

	it("registers in hasMagicKeyword aggregator", () => {
		expect(hasMagicKeyword("start vibe mode")).toBe(true);
		expect(hasMagicKeyword("run /vibecoding today")).toBe(true);
		expect(hasMagicKeyword("normal prompt")).toBe(false);
	});
});

describe("vibecoding keyword highlighting", () => {
	it("decorates standalone keyword with ANSI SGR gradient escapes", () => {
		const input = "start vibecoding today";
		const decorated = highlightVibecoding(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});

	it("runs through highlightMagicKeywords pipeline cleanly", () => {
		const input = "start /vibe now";
		const decorated = highlightMagicKeywords(input);
		expect(decorated).not.toBe(input);
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
