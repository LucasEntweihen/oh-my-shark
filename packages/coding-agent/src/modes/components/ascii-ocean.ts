import { theme } from "../../modes/theme/theme";

const SHARK_NODES = 20;
const FRAME_MS = 80;
const GLYPHS = ":;t%SX8#@";
const FINS = "%tS:";
const OCEAN = [39, 45, 51, 87] as const;

type Shark = { x: number; y: number; speed: number; phase: number; size: number; depth: number };

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function hash(x: number, y: number, z: number): number {
	let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function colorFor(value: number): string {
	const index = clamp(Math.floor(value * OCEAN.length), 0, OCEAN.length - 1);
	return process.stdout.isTTY ? `\x1b[38;5;${OCEAN[index]}m` : "";
}

function renderShark(shark: Shark, width: number, height: number, tick: number): string[] {
	const rows = Array.from({ length: height }, () => Array.from({ length: width }, () => " "));
	const length = Math.max(18, Math.floor(30 * shark.size));
	const centerX = shark.x + Math.sin(tick * 0.07 + shark.phase) * 2;
	const centerY = shark.y + Math.sin(tick * 0.05 + shark.phase) * 1.4;
	for (let node = 0; node < SHARK_NODES; node++) {
		const s = node / (SHARK_NODES - 1);
		const x = centerX - s * length;
		const wave = Math.sin(tick * 0.2 + shark.phase - s * 5.2) * (0.4 + s * 2.4) * shark.size;
		const y = centerY + wave;
		const halfWidth = Math.max(0.7, (1 - Math.abs(s - 0.28) * 1.9) * 3.2 * shark.size);
		for (let across = -halfWidth; across <= halfWidth; across += 1) {
			const col = Math.round(x);
			const row = Math.round(y + across);
			if (row < 0 || row >= height || col < 0 || col >= width) continue;
			const shade = clamp(0.25 + (1 - Math.abs(across) / halfWidth) * 0.7 - shark.depth * 0.18, 0, 1);
			const key = hash(node, Math.round(across), Math.floor(tick / 2));
			const glyphs = key > 0.82 ? FINS : GLYPHS;
			rows[row]![col] = colorFor(shade) + glyphs[Math.floor(key * glyphs.length) % glyphs.length] + "\x1b[0m";
		}
	}
	const headX = Math.round(centerX);
	const finY = Math.round(centerY - 3 * shark.size);
	if (finY >= 0 && finY < height && headX >= 0 && headX < width) rows[finY]![headX] = colorFor(0.9) + "^\x1b[0m";
	return rows.map(row => row.join(""));
}

export class AsciiOceanComponent {
	#startedAt = performance.now();
	#timer: Timer | undefined;
	#requestRender: (() => void) | undefined;
	#paused = false;
	#cachedWidth = -1;
	#cachedHeight = -1;
	#cachedLines: readonly string[] = [];
	readonly #sharks: Shark[] = [
		{ x: 0, y: 0, speed: 0.18, phase: 0, size: 1, depth: 0.1 },
		{ x: 0, y: 0, speed: 0.12, phase: 2.2, size: 0.72, depth: 0.45 },
		{ x: 0, y: 0, speed: 0.09, phase: 4.1, size: 0.56, depth: 0.7 },
	];

	start(requestRender: () => void): void {
		this.#requestRender = requestRender;
		if (this.#timer || this.#paused) return;
		this.#timer = setInterval(() => this.#requestRender?.(), FRAME_MS);
	}

	pause(): void {
		this.#paused = true;
		clearInterval(this.#timer);
		this.#timer = undefined;
		this.#requestRender = undefined;
	}

	render(width: number, height: number): readonly string[] {
		const rows = Math.max(8, Math.min(22, height));
		const cols = Math.max(24, Math.min(96, width));
		if (this.#cachedWidth === cols && this.#cachedHeight === rows) return this.#cachedLines;
		const tick = this.#paused ? Math.floor(this.#startedAt / FRAME_MS) : Math.floor(performance.now() / FRAME_MS);
		const field = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));
		for (const shark of this.#sharks) {
			shark.x = ((tick * shark.speed * 2 + shark.phase * 18) % (cols + 44)) - 22;
			shark.y = rows * (0.18 + shark.depth * 0.64) + Math.sin(tick * 0.03 + shark.phase) * 2;
			const rendered = renderShark(shark, cols, rows, tick);
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const glyph = rendered[row]?.[col];
					if (glyph && glyph !== " ") field[row]![col] = glyph;
				}
			}
		}
		const lines = field.map(row => row.join(""));
		this.#cachedWidth = cols;
		this.#cachedHeight = rows;
		this.#cachedLines = lines;
		return lines;
	}
}

export const ASCII_OCEAN_SOURCE = "https://github.com/stackedlol/ascii-sharks";
