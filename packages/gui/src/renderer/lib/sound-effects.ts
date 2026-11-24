/**
 * Lightweight Web Audio synthesizer for tactile UI & underwater ocean cues.
 * Uses pure OscillatorNode waveforms with soft envelopes — zero audio asset
 * downloads and safe no-ops in headless/test environments without AudioContext.
 */

export type SoundEffectKind = "click" | "tab" | "send" | "complete" | "error";

const SOUND_STORAGE_KEY = "omsk.soundEffects";

let sharedCtx: AudioContext | null = null;
let cachedEnabled: boolean | null = null;

function resolveAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	const AudioCtor =
		window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!AudioCtor) return null;
	if (!sharedCtx) {
		try {
			sharedCtx = new AudioCtor();
		} catch {
			return null;
		}
	}
	if (sharedCtx.state === "suspended") {
		void sharedCtx.resume().catch(() => {});
	}
	return sharedCtx;
}

export function readSoundEffectsPref(): boolean {
	if (cachedEnabled !== null) return cachedEnabled;
	if (typeof window === "undefined") return true;
	try {
		const raw = window.localStorage?.getItem(SOUND_STORAGE_KEY);
		cachedEnabled = raw === null ? true : raw !== "false";
		return cachedEnabled;
	} catch {
		return true;
	}
}

export function setSoundEffectsPref(enabled: boolean): void {
	cachedEnabled = enabled;
	if (typeof window === "undefined") return;
	try {
		window.localStorage?.setItem(SOUND_STORAGE_KEY, String(enabled));
	} catch {
		// Ignore storage errors in restricted contexts.
	}
}

/** Play a subtle synthesized underwater/glass sound cue when enabled. */
export function playSound(kind: SoundEffectKind): void {
	if (!readSoundEffectsPref()) return;
	const ctx = resolveAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;
	try {
		if (kind === "click") {
			scheduleTone(ctx, { type: "sine", startFreq: 740, endFreq: 420, duration: 0.045, gain: 0.035, startAt: now });
		} else if (kind === "tab") {
			scheduleTone(ctx, { type: "sine", startFreq: 520, endFreq: 690, duration: 0.06, gain: 0.04, startAt: now });
		} else if (kind === "send") {
			// Rising underwater bubble pop
			scheduleTone(ctx, { type: "sine", startFreq: 340, endFreq: 880, duration: 0.095, gain: 0.055, startAt: now });
		} else if (kind === "complete") {
			// Soft oceanic two-note sonar chime
			scheduleTone(ctx, {
				type: "sine",
				startFreq: 587.33,
				endFreq: 587.33,
				duration: 0.14,
				gain: 0.045,
				startAt: now,
			});
			scheduleTone(ctx, {
				type: "sine",
				startFreq: 880,
				endFreq: 880,
				duration: 0.2,
				gain: 0.045,
				startAt: now + 0.09,
			});
		} else if (kind === "error") {
			scheduleTone(ctx, {
				type: "triangle",
				startFreq: 240,
				endFreq: 135,
				duration: 0.15,
				gain: 0.05,
				startAt: now,
			});
		}
	} catch {
		// Ignore Web Audio scheduling errors in restricted renderers.
	}
}

function scheduleTone(
	ctx: AudioContext,
	opts: {
		type: OscillatorType;
		startFreq: number;
		endFreq: number;
		duration: number;
		gain: number;
		startAt: number;
	},
): void {
	const osc = ctx.createOscillator();
	const env = ctx.createGain();
	osc.type = opts.type;
	osc.frequency.setValueAtTime(opts.startFreq, opts.startAt);
	if (opts.endFreq !== opts.startFreq) {
		osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.endFreq), opts.startAt + opts.duration);
	}
	env.gain.setValueAtTime(0.0001, opts.startAt);
	env.gain.linearRampToValueAtTime(opts.gain, opts.startAt + 0.01);
	env.gain.exponentialRampToValueAtTime(0.0001, opts.startAt + opts.duration);
	osc.connect(env);
	env.connect(ctx.destination);
	osc.start(opts.startAt);
	osc.stop(opts.startAt + opts.duration + 0.015);
}
