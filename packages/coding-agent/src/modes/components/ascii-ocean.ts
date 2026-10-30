import { visibleWidth } from "@oh-my-pi/pi-tui";

const RESET = "\x1b[0m";
const FRAME_MS = 90;
const PALETTE = [39, 45, 51, 75, 81, 87, 117, 123, 159, 195] as const;
const SHARK = [
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
	"⢠⣾⣿⣏⠉⠉⠉⠉⠉⠉⢡⣶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠻⢿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡄⠀",
	"⠈⣿⣿⣿⣿⦁⣽⣦⡀⠀⠀⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⢧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⠀⠀",
	"⠀⠘⢿⣿⣿⣿⣿⣿⣿⣦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⠇⠀⠀",
	"⠀⠀⠈⠻⣿⣿⣿⣿⡟⢿⠻⠛⠙≉⠋⠛⠳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⡟⠀⠀⠀",
	"⠀⠀⠀⠀⠈⠙⢿⡇⣠⣤⣶⣶⣾⡉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣰⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠾⢇⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⠃⠀⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠱⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠤⢤⣀⣀⣀⣀⣀⣀⣠⣤⣤⣤⣬⣭⣿⣿⠀⠀⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⢿⣿⣿⣿⣿⣿⣶⣤⣄⣀⣀⣠⣴⣾⣿⣿⣿⣷⣤⣀⡀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣾⣿⣿⣿⣿⡿⠿⠛⠛⠻⣿⣿⣿⣿⣇⠀⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣤⣤⣘⡛⠿⢿⡿⠟⠛⠉⠁⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣦⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⢿⣿⣿⣿⣿⣿⣶⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⡄⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⣿⣿⠿⠛⠉⠁⠀⠈⠉⠙⛛⛛⠻⠿⠿⠿⠿⠟⠛⠃⠀⠀⠀⠉⠉⠉⠛⛛⛛⠿⠿⠿⣶⣦⣄⡀⠀⠀⠀⠀⠀⠈⠙⠛⠂",
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠿⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀",
] as const;
const FISH = ["◈", "◇", "◆", "◉", "◌", "◍"] as const;
const BUBBLES = ["·", "∘", "○", "◦"] as const;
const CORAL = ["╱", "╲", "╳", "┼"] as const;

type Cell = { text: string; priority: number };
function ansi(value: number): string {
	if (!process.stdout.isTTY || process.env.NO_COLOR !== undefined) return "";
	return `\x1b[38;5;${PALETTE[value % PALETTE.length]}m`;
}
function paint(text: string, color: number): string { return `${ansi(color)}${text}${RESET}`; }
function hash(value: number): number { let x = Math.imul(value | 0, 1103515245) + 12345; x ^= x >>> 16; return (x >>> 0) / 4294967296; }
function visibleSlice(text: string, width: number): string { return visibleWidth(text) > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text; }

export class AsciiOceanComponent {
	#startedAt = performance.now();
	#timer: Timer | undefined;
	#requestRender: (() => void) | undefined;
	#paused = false;
	#cachedWidth = -1;
	#cachedHeight = -1;
	#cachedTick = -1;
	#cachedLines: readonly string[] = [];

	start(requestRender: () => void): void {
		this.#requestRender = requestRender;
		if (!this.#timer && !this.#paused) this.#timer = setInterval(() => this.#requestRender?.(), FRAME_MS);
	}
	pause(): void {
		this.#paused = true;
		clearInterval(this.#timer);
		this.#timer = undefined;
		this.#requestRender = undefined;
	}
	render(width: number, height: number): readonly string[] {
		const cols = Math.max(48, Math.min(118, width));
		const rows = Math.max(14, Math.min(18, height));
		const tick = this.#paused ? Math.floor(this.#startedAt / FRAME_MS) : Math.floor(performance.now() / FRAME_MS);
		if (this.#cachedWidth === cols && this.#cachedHeight === rows && this.#cachedTick === tick) return this.#cachedLines;
		const canvas = Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ text: " ", priority: 0 })));
		const sharkTop = Math.max(0, Math.floor((rows - SHARK.length) / 2));
		const sharkWidth = Math.max(...SHARK.map(line => visibleWidth(line)));
		const sharkLeft = Math.max(0, Math.floor((cols - Math.min(cols, sharkWidth)) / 2));
		for (let row = 0; row < SHARK.length && sharkTop + row < rows; row++) {
			const line = visibleSlice(SHARK[row] ?? "", cols);
			for (const [index, glyph] of [...line].entries()) {
				if (glyph === " ") continue;
				const cell = canvas[sharkTop + row]?.[sharkLeft + index];
				if (!cell || cell.priority > 5) continue;
				const colorIndex = Math.floor((row / SHARK.length) * PALETTE.length + (index + tick) / 18) % PALETTE.length;
				cell.text = paint(glyph, colorIndex);
				cell.priority = 6;
			}
		}
		for (let i = 0; i < 14; i++) {
			const x = Math.floor((hash(i + tick) * cols + cols) % cols);
			const y = Math.floor(hash(i * 7 + 3) * Math.max(1, rows - 3));
			const cell = canvas[y]?.[x];
			if (cell?.priority === 0) { cell.text = paint(FISH[i % FISH.length] ?? "◇", 3 + (i % 5)); cell.priority = 2; }
		}
		for (let i = 0; i < 10; i++) {
			const x = Math.floor(hash(i * 11 + 9) * cols);
			const y = (rows - 1 - ((tick + i * 5) % Math.max(1, rows - 2)) + rows) % rows;
			const cell = canvas[y]?.[x];
			if (cell?.priority === 0) { cell.text = paint(BUBBLES[(i + tick) % BUBBLES.length] ?? "·", 5 + (i % 3)); cell.priority = 1; }
		}
		for (let x = 0; x < cols; x += 9) {
			const y = rows - 1;
			const cell = canvas[y]?.[x];
			if (cell?.priority === 0) { cell.text = paint(CORAL[(x + tick) % CORAL.length] ?? "╱", 2 + (x % 4)); cell.priority = 1; }
		}
		const lines = canvas.map(line => line.map(cell => cell.text).join("").replace(/\x1b\[[0-9;]*m/g, ""));
		this.#cachedWidth = cols; this.#cachedHeight = rows; this.#cachedTick = tick;
		this.#cachedLines = process.stdout.isTTY && process.env.NO_COLOR === undefined ? canvas.map(line => line.map(cell => cell.text).join("")) : lines;
		return this.#cachedLines;
	}
}

export const ASCII_OCEAN_SOURCE = "https://github.com/stackedlol/ascii-sharks";
