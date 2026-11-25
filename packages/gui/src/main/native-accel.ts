/**
 * Bridge between the OMSK Desktop GUI main process and Rust native accelerators
 * (`crates/omsk-gui-accel` & `@oh-my-pi/pi-natives`), with zero-allocation TypeScript fallbacks
 * so the GUI runs smoothly on every machine.
 */

export const FAST_IGNORED_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"out",
	"target",
	".next",
	".turbo",
	".cache",
]);

/** Fast check for heavy build/vendor directories to prune before stat/realpath calls. */
export function isFastIgnoredDirName(name: string): boolean {
	return FAST_IGNORED_DIRS.has(name);
}

/**
 * Extracts a JSONL session title from a raw head buffer without parsing the full JSONL object.
 * Mirrors `omsk_gui_accel::read_session_header` in Rust.
 */
export function extractSessionTitleFast(headChunk: string): string | undefined {
	const marker = '"title":"';
	const idx = headChunk.indexOf(marker);
	if (idx === -1) return undefined;
	const start = idx + marker.length;
	const end = headChunk.indexOf('"', start);
	if (end === -1 || end === start) return undefined;
	return headChunk.slice(start, end);
}

/**
 * Pre-computes a procedural wave height row into a reusable Float32Array
 * (zero per-frame heap allocations).
 */
export function fillWaveRowLut(out: Float32Array, elapsed: number, amplitude: number): Float32Array {
	const len = out.length;
	for (let c = 0; c < len; c++) {
		out[c] = Math.sin(c * 0.18 + elapsed * 1.4) * amplitude;
	}
	return out;
}
