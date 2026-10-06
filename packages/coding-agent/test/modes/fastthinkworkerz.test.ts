import { beforeAll, describe, expect, it } from "bun:test";
import {
	containsFastthinkworkerz,
	FASTTHINKWORKERZ_NOTICE,
	highlightFastthinkworkerz,
} from "@oh-my-pi/pi-coding-agent/modes/fastthinkworkerz";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("fastthinkworkerz keyword detection", () => {
	it("matches the lowercase trigger word delimited by whitespace or string edges", () => {
		expect(containsFastthinkworkerz("fastthinkworkerz")).toBe(true);
		expect(containsFastthinkworkerz("please fastthinkworkerz this prompt")).toBe(true);
		expect(containsFastthinkworkerz("/fastthinkworkerz")).toBe(true);
		expect(containsFastthinkworkerz("\\fastthinkworkerz")).toBe(true);
	});

	it("matches the lowercase trigger word beside punctuation and quotes", () => {
		for (const text of [
			"fastthinkworkerz.",
			'say "fastthinkworkerz" now',
			"accelerate with fastthinkworkerz!",
			"run /fastthinkworkerz now",
		]) {
			expect(containsFastthinkworkerz(text)).toBe(true);
		}
	});

	it("ignores non-standalone words and path-embedded forms", () => {
		expect(containsFastthinkworkerz("fastthinkworkerzs")).toBe(false);
		expect(containsFastthinkworkerz("src/modes/fastthinkworkerz.ts")).toBe(false);
	});
});

describe("fastthinkworkerz notice", () => {
	it("contains speed acceleration, thinking depth reduction, and agent flow directives", () => {
		expect(FASTTHINKWORKERZ_NOTICE).toContain("Radical Delivery Velocity");
		expect(FASTTHINKWORKERZ_NOTICE).toContain("Low Thinking Depth");
		expect(FASTTHINKWORKERZ_NOTICE).toContain("Agent Flow Acceleration");
		expect(FASTTHINKWORKERZ_NOTICE).toContain("FASTTHINKWORKERZ");
	});
});

describe("fastthinkworkerz keyword highlighting", () => {
	it("decorates the keyword with zero-width escapes, preserving visible text", () => {
		const input = "please fastthinkworkerz this";
		const decorated = highlightFastthinkworkerz(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
