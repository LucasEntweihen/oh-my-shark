import { theme } from "../../modes/theme/theme";

const FRAME_MS = 75;
const MIN_ROWS = 10;
const MAX_ROWS = 20;
const MIN_COLS = 34;
const MAX_COLS = 112;
const RESET = "\x1b[0m";
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const BRAILLE = ["⠠", "⠄", "⠂", "⠐", "⠈", "⠁", "⠃", "⠉", "⠋", "⠙", "⠚", "⠒", "⠓", "⠲", "⠴", "⠦", "⠧", "⠷", "⠾", "⠿"] as const;
const FISH = ["◈", "◇", "◆", "◉", "◌", "◍"] as const;
const CORAL = ["╱", "╲", "╳", "╱", "╲", "┼"] as const;
const BUBBLES = ["·", "∘", "○", "◦"] as const;
const SEA_COLORS = [39, 45, 51, 75, 81, 87, 117, 123, 159, 195] as const;

type Shark = { x: number; y: number; speed: number; phase: number; size: number; depth: number; kind: "classic" | "hammerhead" | "mako" };
type Cell = { glyph: string; color: number; priority: number };

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function hash(x: number, y: number, z: number): number {
	let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function ansiSupported(): boolean { return Boolean(process.stdout.isTTY && process.env.NO_COLOR === undefined); }
function color(value: number): string { return ansiSupported() ? `\x1b[38;5;${SEA_COLORS[clamp(Math.floor(value), 0, SEA_COLORS.length - 1)]}m` : ""; }
function put(grid: Cell[][], x: number, y: number, glyph: string, colorIndex: number, priority: number): void {
	const cell = grid[y]?.[x];
	if (!cell || priority < cell.priority) return;
	cell.glyph = color(colorIndex) + glyph + (ansiSupported() ? RESET : "");
	cell.color = colorIndex;
	cell.priority = priority;
}
function wave(value: number, phase: number, amplitude: number): number { return Math.sin(value * 0.31 + phase) * amplitude + Math.sin(value * 0.13 + phase * 0.7) * amplitude * 0.35; }
function sharkGlyph(shark: Shark, segment: number, tick: number): string {
	const phase = tick * 0.3 + shark.phase - segment * 0.52;
	const texture = Math.floor((Math.sin(phase) + 1) * 9);
	return BRAILLE[clamp(texture + Math.floor(shark.depth * 3), 0, BRAILLE.length - 1)] ?? "⠠";
}
function renderShark(shark: Shark, cols: number, rows: number, tick: number, grid: Cell[][]): void {
	const length = Math.max(24, Math.floor(45 * shark.size));
	const headX = Math.round(shark.x);
	const headY = Math.round(shark.y + wave(tick, shark.phase, 1.4));
	const priority = 50 - Math.round(shark.depth * 12);
	for (let segment = 0; segment < length; segment++) {
		const s = segment / length;
		const x = headX + segment;
		const body = shark.kind === "hammerhead" && s < 0.18 ? 2.2 : shark.kind === "mako" ? 1.5 + (1 - s) * 2.1 : 1.6 + (1 - s) * 3.5;
		const y = headY + Math.round(wave(segment, tick * 0.055 + shark.phase, 0.25 + s * 2.2));
		for (let dy = -Math.ceil(body); dy <= Math.ceil(body); dy++) {
			if (Math.abs(dy) > body + 0.4) continue;
			const glyph = dy === 0 ? sharkGlyph(shark, segment, tick) : BRAILLE[(segment + dy + tick) % BRAILLE.length] ?? "⠄";
			put(grid, x, y + dy, glyph, clamp(Math.floor(2 + (1 - s) * 7 - shark.depth * 2), 0, 9), priority);
		}
	}
	for (let fin = 0; fin < Math.max(3, Math.round(shark.size * 5)); fin++) {
		put(grid, headX - fin, headY - fin, fin % 2 ? "╱" : "╲", 8, priority + 5);
		put(grid, headX - fin, headY + fin, fin % 2 ? "╲" : "╱", 7, priority + 5);
	}
	if (shark.kind === "hammerhead") {
		const span = Math.max(4, Math.round(length * 0.12));
		for (let dx = -span; dx <= span; dx++) put(grid, headX + dx, headY - 1, dx % 3 === 0 ? "╳" : "━", 9, priority + 9);
	}
	put(grid, headX - 1, headY - 1, "●", 9, priority + 12);
	put(grid, headX + length + 1, headY - 2, "◢", 6, priority + 7);
	put(grid, headX + length + 1, headY + 2, "◣", 5, priority + 7);
	void cols;
	void rows;
}
function renderSeabed(cols: number, rows: number, tick: number, grid: Cell[][]): void {
	const floor = rows - 2;
	for (let x = 0; x < cols; x++) {
		const y = floor + Math.round(Math.sin(x * 0.21 + tick * 0.02) * 0.7);
		put(grid, x, y, x % 3 === 0 ? "╱" : x % 3 === 1 ? "╲" : "·", 1, 3);
		if (x % 7 === 0) {
			put(grid, x, y - 1, "╱", 2, 3);
			put(grid, x + 1, y - 2, "╲", 2, 3);
		}
	}
}
function renderCoral(cols: number, rows: number, tick: number, grid: Cell[][]): void {
	for (let base = 3; base < cols; base += 17) {
		const height = 2 + ((base + tick) % 4);
		for (let branch = 0; branch < height; branch++) {
			const y = rows - 3 - branch;
			put(grid, base + Math.round(Math.sin(branch + tick * 0.04)), y, CORAL[(branch + base) % CORAL.length] ?? "╱", 3 + branch % 3, 4);
		}
	}
}
function renderBubbles(cols: number, rows: number, tick: number, grid: Cell[][]): void {
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(hash(i, 4, 9) * cols);
		const y = ((rows - 3 - Math.floor(tick * (0.08 + (i % 3) * 0.02) + i * 5)) % (rows + 4) + rows + 4) % (rows + 4) - 2;
		put(grid, x, y, BUBBLES[(i + tick) % BUBBLES.length] ?? "·", 4 + (i % 4), 2);
	}
}
function renderFish(cols: number, rows: number, tick: number, grid: Cell[][]): void {
	for (let i = 0; i < 18; i++) {
		const x = ((Math.floor(hash(i, 2, 1) * cols) - Math.floor(tick * (0.12 + (i % 4) * 0.025)) + cols * 3) % cols);
		const y = clamp(Math.floor(hash(i, 6, 3) * (rows - 5)) + 2 + Math.round(Math.sin(tick * 0.08 + i) * 1.2), 1, rows - 4);
		put(grid, x, y, FISH[i % FISH.length] ?? "◇", 3 + (i % 5), 5);
	}
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
		{ x: 0, y: 0, speed: 0.24, phase: 0.0, size: 1, depth: 0.1, kind: "classic" },
		{ x: 0, y: 0, speed: 0.18, phase: 2.2, size: 0.73, depth: 0.4, kind: "hammerhead" },
		{ x: 0, y: 0, speed: 0.13, phase: 4.5, size: 0.56, depth: 0.7, kind: "mako" },
	];
	start(requestRender: () => void): void { this.#requestRender = requestRender; if (!this.#timer && !this.#paused) this.#timer = setInterval(() => this.#requestRender?.(), FRAME_MS); }
	pause(): void { this.#paused = true; clearInterval(this.#timer); this.#timer = undefined; this.#requestRender = undefined; }
	render(width: number, height: number): readonly string[] {
		const rows = clamp(height, MIN_ROWS, MAX_ROWS);
		const cols = clamp(width, MIN_COLS, MAX_COLS);
		const tick = this.#paused ? Math.floor(this.#startedAt / FRAME_MS) : Math.floor(performance.now() / FRAME_MS);
		if (this.#cachedWidth === cols && this.#cachedHeight === rows && this.#cachedTick === tick) return this.#cachedLines;
		const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ glyph: " ", color: 0, priority: 0 })));
		renderSeabed(cols, rows, tick, grid);
		renderCoral(cols, rows, tick, grid);
		renderFish(cols, rows, tick, grid);
		renderBubbles(cols, rows, tick, grid);
		for (const shark of this.#sharks) {
			const span = cols + 58;
			shark.x = ((-tick * shark.speed * 2 + shark.phase * 17) % span + span) % span - 28;
			shark.y = rows * (0.15 + shark.depth * 0.58);
			renderShark(shark, cols, rows, tick, grid);
		}
		const plain = grid.map(row => row.map(cell => cell.glyph).join("").replace(ANSI_RE, ""));
		const lines = ansiSupported() ? grid.map(row => row.map(cell => cell.glyph).join("")) : plain;
		this.#cachedWidth = cols; this.#cachedHeight = rows; this.#cachedTick = tick; this.#cachedLines = lines;
		return lines;
	}
}

export const ASCII_OCEAN_SOURCE = "https://github.com/stackedlol/ascii-sharks";
