import { beforeAll, describe, expect, it } from "bun:test";
import {
	containsXlr8,
	highlightXlr8,
	isXlr8BasicMode,
	XLR8_NOTICE,
} from "@oh-my-pi/pi-coding-agent/modes/xlr8";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";

beforeAll(() => {
	initTheme();
});

describe("xlr8 keyword detection", () => {
	it("matches the lowercase trigger word delimited by whitespace or string edges", () => {
		expect(containsXlr8("xlr8")).toBe(true);
		expect(containsXlr8("/xlr8")).toBe(true);
		expect(containsXlr8("\\xlr8")).toBe(true);
		expect(containsXlr8("please /xlr8 this task")).toBe(true);
	});

	it("matches the lowercase trigger word beside punctuation and quotes", () => {
		for (const text of [
			"/xlr8.",
			'say "/xlr8" now',
			"accelerate with xlr8!",
			"/xlr8: now",
		]) {
			expect(containsXlr8(text)).toBe(true);
		}
	});

	it("ignores non-standalone words and path-embedded forms", () => {
		expect(containsXlr8("xlr88")).toBe(false);
		expect(containsXlr8("src/modes/xlr8.ts")).toBe(false);
	});
});

describe("xlr8 basic mode detection", () => {
	it("detects basic / solo disconnect flags", () => {
		expect(isXlr8BasicMode("/xlr8 --basic")).toBe(true);
		expect(isXlr8BasicMode("/xlr8 basic run task")).toBe(true);
		expect(isXlr8BasicMode("xlr8 --solo solve this")).toBe(true);
		expect(isXlr8BasicMode("/xlr8 --disconnect solve this")).toBe(true);
	});

	it("returns false when basic mode flags are absent", () => {
		expect(isXlr8BasicMode("/xlr8 solve this")).toBe(false);
		expect(isXlr8BasicMode("xlr8")).toBe(false);
	});
});

describe("xlr8 notice", () => {
	it("contains cognitive acceleration, code simplification, basic mode, and in-flight acceleration", () => {
		expect(XLR8_NOTICE).toContain("Hyperspeed Cognitive Stream");
		expect(XLR8_NOTICE).toContain("Code and Solution Simplification");
		expect(XLR8_NOTICE).toContain("Autonomous Basic Mode");
		expect(XLR8_NOTICE).toContain("In-Flight Acceleration");
		expect(XLR8_NOTICE).toContain("XLR8 MAXIMUM VELOCITY");
	});
});

describe("xlr8 keyword highlighting", () => {
	it("decorates the keyword with zero-width escapes, preserving visible text", () => {
		const input = "please /xlr8 this";
		const decorated = highlightXlr8(input);
		expect(decorated).not.toBe(input);
		expect(decorated).toContain("\x1b");
		expect(Bun.stripANSI(decorated)).toBe(input);
	});
});
