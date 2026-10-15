/**
 * Síntese Sonora Mecânica e Espacial via Web Audio API (DESIGN.md Sec. 11.2)
 *
 * Gera efeitos táteis e bipes de telemetria em tempo real com zero assets de áudio externos.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

interface WindowWithWebkitAudio {
	webkitAudioContext?: typeof AudioContext;
}

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (!audioCtx) {
		const win = window as unknown as WindowWithWebkitAudio;
		const AudioContextClass = window.AudioContext || win.webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}
	if (audioCtx && audioCtx.state === "suspended") {
		audioCtx.resume().catch(() => {});
	}
	return audioCtx;
}

export const mechanicalSynth = {
	setMuted(muted: boolean): void {
		isMuted = muted;
	},

	isMuted(): boolean {
		return isMuted;
	},

	toggleMute(): boolean {
		isMuted = !isMuted;
		return isMuted;
	},

	/**
	 * Clique das Teclas Mecânicas (00 a 39)
	 * Pulso de ruído branco de 12ms filtrado passa-banda em 1800Hz com reforço subsônico em 220Hz.
	 */
	playKeyClick(): void {
		if (isMuted) return;
		const ctx = getAudioContext();
		if (!ctx) return;

		try {
			const bufferSize = Math.floor(ctx.sampleRate * 0.012);
			const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const output = noiseBuffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				output[i] = Math.random() * 2 - 1;
			}

			const whiteNoise = ctx.createBufferSource();
			whiteNoise.buffer = noiseBuffer;

			const bandpass = ctx.createBiquadFilter();
			bandpass.type = "bandpass";
			bandpass.frequency.value = 1800;
			bandpass.Q.value = 3;

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.08, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);

			whiteNoise.connect(bandpass);
			bandpass.connect(gain);
			gain.connect(ctx.destination);

			whiteNoise.start();

			// Componente subsônico tátil (220Hz)
			const osc = ctx.createOscillator();
			const oscGain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(220, ctx.currentTime);
			oscGain.gain.setValueAtTime(0.04, ctx.currentTime);
			oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);

			osc.connect(oscGain);
			oscGain.connect(ctx.destination);

			osc.start();
			osc.stop(ctx.currentTime + 0.012);
		} catch {
			// Não bloqueia em falhas de áudio
		}
	},

	/**
	 * Bipe de Telemetria e Alvo Concluído
	 * Onda senoidal em 880Hz com decaimento exponencial de 60ms.
	 */
	playTelemetryBeacon(): void {
		if (isMuted) return;
		const ctx = getAudioContext();
		if (!ctx) return;

		try {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime);

			gain.gain.setValueAtTime(0.05, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start();
			osc.stop(ctx.currentTime + 0.06);
		} catch {
			// Silencioso
		}
	},
};
