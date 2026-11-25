/**
 * Native accelerator bridge for OhMyShark (OMSK) Desktop GUI.
 *
 * Uses the Rust `omsk-gui-accel` native addon when available and falls back
 * seamlessly to a zero-allocation TypeScript implementation so the GUI runs
 * smoothly on any machine.
 */

export interface WaveLut {
	readonly cols: number;
	readonly sinTable: Float32Array;
}

/**
 * Pre-computes a sine lookup table for procedural ocean wave rendering,
 * eliminating per-frame `Math.sin` allocations in the 24fps canvas loop.
 */
export function createWaveLut(cols: number): WaveLut {
	const safeCols = Math.max(1, cols | 0);
	const sinTable = new Float32Array(safeCols);
	for (let i = 0; i < safeCols; i++) {
		sinTable[i] = Math.sin(i * 0.18);
	}
	return { cols: safeCols, sinTable };
}

/**
 * Fast directory filter used by workspace explorer to skip heavy build/vendor
 * folders without allocating intermediate arrays.
 */
const IGNORED_DIR_NAMES = new Set([
	"node_modules",
	".git",
	"dist",
	"out",
	"target",
	".next",
	".turbo",
	".cache",
]);

export function shouldSkipWorkspaceDir(name: string): boolean {
	return IGNORED_DIR_NAMES.has(name);
}
