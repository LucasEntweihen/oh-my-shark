import { theme } from "../../modes/theme/theme";

const FRAME_MS = 70;
const MIN_ROWS = 10;
const MAX_ROWS = 24;
const MIN_COLS = 32;
const MAX_COLS = 108;
const SHARK_NODES = 32;
const RESET = "\x1b[0m";
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const GLYPHS = ".,:;irsXA253hMHGS#9B&@";
const HIGHLIGHTS = ".'`^v*+";
const FIN_GLYPHS = "/\\^v<>";
const WAKE_GLYPHS = ".·:;";
const OCEAN = [23, 24, 25, 31, 37, 38, 45, 51, 87, 123] as const;

type Shark = {
	x: number;
	y: number;
	speed: number;
	phase: number;
	size: number;
	depth: number;
	kind: "classic" | "hammerhead" | "mako";
};

type Cell = { glyph: string; shade: number; priority: number };

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number): number {
	const t = clamp(value, 0, 1);
	return t * t * (3 - 2 * t);
}

function hash(x: number, y: number, z: number): number {
	let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function ansiSupported(): boolean {
	return Boolean(process.stdout.isTTY && process.env.NO_COLOR === undefined);
}

function colorFor(value: number): string {
	if (!ansiSupported()) return "";
	const index = clamp(Math.floor(value * OCEAN.length), 0, OCEAN.length - 1);
	return `\x1b[38;5;${OCEAN[index]}m`;
}

function paint(cell: Cell, glyph: string, shade: number, priority: number): void {
	if (priority >= cell.priority) {
		cell.glyph = colorFor(shade) + glyph + (ansiSupported() ? RESET : "");
		cell.shade = shade;
		cell.priority = priority;
	}
}

function addTexturedCell(grid: Cell[][], x: number, y: number, glyph: string, shade: number, priority: number): void {
	const row = grid[y];
	const cell = row?.[x];
	if (cell) paint(cell, glyph, shade, priority);
}

function bodyHalfWidth(kind: Shark["kind"], s: number): number {
	if (kind === "hammerhead") {
		if (s < 0.1) return 0.035 + smoothstep(s / 0.1) * 0.045;
		return 0.022 + 0.088 * Math.pow(1 - s, 1.15);
	}
	if (kind === "mako") {
		if (s < 0.2) return 0.025 + smoothstep(s / 0.2) * 0.064;
		return 0.018 + 0.088 * Math.pow(1 - s, 1.42);
	}
	if (s < 0.12) return smoothstep(s / 0.12) * 0.095;
	return 0.022 + 0.09 * Math.pow(1 - s, 1.22);
}

function renderShark(shark: Shark, width: number, height: number, tick: number, grid: Cell[][]): void {
	const length = Math.max(24, Math.floor(42 * shark.size));
	const centerX = shark.x + Math.sin(tick * 0.055 + shark.phase) * 1.7;
	const centerY = shark.y + Math.sin(tick * 0.043 + shark.phase) * 1.1;
	const wavePhase = tick * 0.32 + shark.phase;
	const bodyPriority = Math.round(40 - shark.depth * 12);

	for (let node = 0; node < SHARK_NODES; node++) {
		const s = node / (SHARK_NODES - 1);
		const x = centerX + s * length;
		const wave = Math.sin(wavePhase - s * 7.2) * (0.3 + s * 2.7) * shark.size;
		const y = centerY + wave;
		const half = Math.max(0.55, bodyHalfWidth(shark.kind, s) * length * 0.23);
		const maxAcross = Math.ceil(half);
		for (let across = -maxAcross; across <= maxAcross; across++) {
			const distance = Math.abs(across) / Math.max(half, 1);
			if (distance > 1) continue;
			const key = hash(node + Math.round(shark.phase * 11), across, Math.floor(tick / 2));
			const edge = distance > 0.78;
			const glyphs = edge ? HIGHLIGHTS : GLYPHS;
			const glyph = glyphs[Math.floor(key * glyphs.length) % glyphs.length] ?? ".";
			const shade = clamp(0.2 + (1 - distance) * 0.72 + Math.sin(wavePhase - s * 3) * 0.08 - shark.depth * 0.08, 0.05, 1);
			addTexturedCell(grid, Math.round(x), Math.round(y + across), glyph, shade, bodyPriority);
		}
	}

	const headX = Math.round(centerX);
	const headY = Math.round(centerY);
	const finScale = Math.max(1, Math.round(shark.size * 2));
	for (let dx = 0; dx <= finScale; dx++) {
		addTexturedCell(grid, headX - dx, headY - finScale + dx, FIN_GLYPHS[(dx + tick) % FIN_GLYPHS.length] ?? "^", 0.9, bodyPriority + 4);
		addTexturedCell(grid, headX - dx, headY + finScale - dx, FIN_GLYPHS[(dx + tick + 2) % FIN_GLYPHS.length] ?? "v", 0.84, bodyPriority + 4);
	}

	if (shark.kind === "hammerhead") {
		const span = Math.max(3, Math.round(length * 0.14));
		for (let dx = -span; dx <= span; dx++) {
			const notch = Math.abs(dx) < 2 ? 1 : 0;
			addTexturedCell(grid, headX + dx, headY - 1 + notch, dx === -span || dx === span ? "/" : "=", 0.95, bodyPriority + 8);
		}
	}

	const tailX = Math.round(centerX + length);
	const tailY = Math.round(centerY + Math.sin(wavePhase - 7.2) * (0.3 + 2.7) * shark.size);
	for (let arm = 0; arm <= Math.max(2, Math.round(4 * shark.size)); arm++) {
		addTexturedCell(grid, tailX + arm, tailY - arm, "<", 0.76, bodyPriority + 5);
		addTexturedCell(grid, tailX + arm, tailY + arm, ">", 0.7, bodyPriority + 5);
	}
	addTexturedCell(grid, headX - 1, headY - 1, "•", 1, bodyPriority + 10);
	addTexturedCell(grid, headX - 1, headY + 1, "·", 0.92, bodyPriority + 9);
}

function renderWake(sharks: readonly Shark[], width: number, height: number, tick: number, grid: Cell[][]): void {
	for (const shark of sharks) {
		const length = Math.max(24, Math.floor(42 * shark.size));
		for (let trail = 5; trail < length + 10; trail += 4) {
			const x = Math.round(shark.x + trail + Math.sin(tick * 0.12 + trail * 0.3 + shark.phase) * 1.2);
			const y = Math.round(shark.y + Math.cos(tick * 0.08 + trail * 0.2 + shark.phase) * 1.4);
			const glyph = WAKE_GLYPHS[(Math.floor(trail / 4) + tick) % WAKE_GLYPHS.length] ?? ".";
			addTexturedCell(grid, x, y, glyph, 0.22 + shark.size * 0.2, 2);
		}
	}
	void width;
	void height;
}

export class AsciiOceanComponent {
	#startedAt = performance.now();
	#timer: Timer | undefined;
	#requestRender: (() => void) | undefined;
	#paused = false;
	#cachedWidth = -1;
	#cachedHeight = -1;
	#cachedTick = -1;
	#cachedLines: readonly string[] = [];
	readonly #sharks: Shark[] = [
		{ x: 0, y: 0, speed: 0.26, phase: 0.0, size: 1.0, depth: 0.1, kind: "classic" },
		{ x: 0, y: 0, speed: 0.19, phase: 2.4, size: 0.74, depth: 0.42, kind: "hammerhead" },
		{ x: 0, y: 0, speed: 0.14, phase: 4.3, size: 0.58, depth: 0.72, kind: "mako" },
		{ x: 0, y: 0, speed: 0.11, phase: 5.5, size: 0.46, depth: 0.86, kind: "classic" },
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
		const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, height));
		const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, width));
		const tick = this.#paused ? Math.floor(this.#startedAt / FRAME_MS) : Math.floor(performance.now() / FRAME_MS);
		if (this.#cachedWidth === cols && this.#cachedHeight === rows && this.#cachedTick === tick) return this.#cachedLines;
		const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ glyph: " ", shade: 0, priority: 0 })));
		for (const shark of this.#sharks) {
			const span = cols + 56;
			shark.x = ((-tick * shark.speed * 2.1 + shark.phase * 19) % span + span) % span - 24;
			shark.y = rows * (0.18 + shark.depth * 0.62) + Math.sin(tick * 0.035 + shark.phase) * (1.5 + shark.size * 1.8);
		}
		renderWake(this.#sharks, cols, rows, tick, grid);
		for (const shark of this.#sharks) renderShark(shark, cols, rows, tick, grid);
		const lines = grid.map(row => row.map(cell => cell.glyph).join("").replace(ANSI_RE, ""));
		const coloredLines = ansiSupported() ? grid.map(row => row.map(cell => cell.glyph).join("")) : lines;
		this.#cachedWidth = cols;
		this.#cachedHeight = rows;
		this.#cachedTick = tick;
		this.#cachedLines = coloredLines;
		return coloredLines;
	}
}

export const ASCII_OCEAN_SOURCE = "https://github.com/stackedlol/ascii-sharks";
