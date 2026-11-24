import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playSound, readSoundEffectsPref, setSoundEffectsPref } from "./sound-effects";

describe("sound-effects synthesizer", () => {
	afterEach(() => {
		setSoundEffectsPref(true);
		vi.unstubAllGlobals();
	});

	beforeEach(() => {
		setSoundEffectsPref(true);
	});

	it("safely no-ops when AudioContext is unavailable", () => {
		vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem: () => {} } });
		expect(() => playSound("click")).not.toThrow();
		expect(() => playSound("send")).not.toThrow();
		expect(() => playSound("complete")).not.toThrow();
	});

	it("triggers Web Audio oscillators when enabled and stays silent when muted", () => {
		const start = vi.fn();
		const stop = vi.fn();
		const connect = vi.fn();
		const setValueAtTime = vi.fn();
		const linearRampToValueAtTime = vi.fn();
		const exponentialRampToValueAtTime = vi.fn();
		class MockAudioContext {
			currentTime = 1;
			state = "running";
			destination = {};
			resume = vi.fn(async () => {});
			createOscillator = () => ({
				type: "sine",
				frequency: { setValueAtTime, exponentialRampToValueAtTime },
				connect,
				start,
				stop,
			});
			createGain = () => ({
				gain: { setValueAtTime, linearRampToValueAtTime, exponentialRampToValueAtTime },
				connect,
			});
		}

		const storage = new Map<string, string>();
		vi.stubGlobal("window", {
			AudioContext: MockAudioContext,
			localStorage: {
				getItem: (k: string) => storage.get(k) ?? null,
				setItem: (k: string, v: string) => void storage.set(k, v),
			},
		});

		playSound("complete");
		expect(start).toHaveBeenCalledTimes(2);

		setSoundEffectsPref(false);
		expect(readSoundEffectsPref()).toBe(false);
		playSound("send");
		expect(start).toHaveBeenCalledTimes(2);
	});
});
