import { beforeAll, describe, expect, it } from "bun:test";
import { containsDoomania, highlightDoomania } from "@oh-my-pi/pi-coding-agent/modes/doomania";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("doomania keyword detection", () => {
	it("matches the lowercase trigger word delimited by whitespace or a string edge", () => {
		expect(containsDoomania("doomania")).toBe(true);
		expect(containsDoomania("/doomania")).toBe(true);
		expect(containsDoomania("please /doomania this task")).toBe(true);
		expect(containsDoomania("run doomania")).toBe(true);
	});

	it("matches the lowercase trigger word beside prose punctuation and quotes", () => {
		for (const text of ["do it. doomania.", "please /doomania, then report", 'say "/doomania" now']) {
			expect(containsDoomania(text)).toBe(true);
		}
	});

	it("ignores path-embedded forms and non-standalone words", () => {
		expect(containsDoomania("src/modes/doomania.ts")).toBe(false);
		expect(containsDoomania("doomanias")).toBe(false);
		expect(containsDoomania("nothing to see here")).toBe(false);
	});
});

describe("doomania keyword highlighting", () => {
	it("decorates the keyword with zero-width escapes, preserving visible text", () => {
		const input = "please /doomania this";
		const decorated = highlightDoomania(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});

	it("decorates punctuation-adjacent prose while preserving visible text", () => {
		const input = 'please "/doomania," then continue';
		const decorated = highlightDoomania(input);
		expect(decorated).not.toBe(input);
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
