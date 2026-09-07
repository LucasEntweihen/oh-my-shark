import { beforeAll, describe, expect, it } from "bun:test";
import {
	containsDeepseaneuron,
	DEEPSEANEURON_NOTICE,
	highlightDeepseaneuron,
} from "@oh-my-pi/pi-coding-agent/modes/deepseaneuron";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("deepseaneuron keyword detection", () => {
	it("matches the lowercase trigger word delimited by whitespace or a string edge", () => {
		expect(containsDeepseaneuron("deepseaneuron")).toBe(true);
		expect(containsDeepseaneuron("please deepseaneuron this prompt")).toBe(true);
		expect(containsDeepseaneuron("\\deepseaneuron")).toBe(true);
	});

	it("matches the lowercase trigger word beside prose punctuation and quotes", () => {
		for (const text of ["deepseaneuron.", 'say "deepseaneuron" now', "optimize with deepseaneuron!"]) {
			expect(containsDeepseaneuron(text)).toBe(true);
		}
	});

	it("ignores non-standalone words and path-embedded forms", () => {
		expect(containsDeepseaneuron("deepseaneurons")).toBe(false);
		expect(containsDeepseaneuron("src/modes/deepseaneuron.ts")).toBe(false);
	});
});

describe("deepseaneuron notice", () => {
	it("contains token optimization and rationalization directives", () => {
		expect(DEEPSEANEURON_NOTICE).toContain("Token Optimization & Rationalization");
		expect(DEEPSEANEURON_NOTICE).toContain("DEEPSEANEURON");
	});
});

describe("deepseaneuron keyword highlighting", () => {
	it("decorates the keyword with zero-width escapes, preserving visible text", () => {
		const input = "please deepseaneuron this";
		const decorated = highlightDeepseaneuron(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
