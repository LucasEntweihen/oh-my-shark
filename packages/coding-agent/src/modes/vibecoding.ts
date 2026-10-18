import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { keywordInProse } from "./markdown-prose";

/**
 * "vibe", "/vibe", "vibecoding", and "/vibecoding" keyword support.
 *
 * Typing the standalone word (or /vibe slash command) in the input editor
 * paints it with a vibrant sunset amber→violet gradient ({@link highlightVibecoding}).
 */

const VIBE_PROBE = /vibe/;
// Match standalone /vibe, \vibe, vibe, vibecoding, or /vibecoding with proper word boundaries
const VIBE_HIGHLIGHT =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?(?:vibecoding|vibe)(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/gu;
const VIBE_WORD =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?(?:vibecoding|vibe)(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;

export function containsVibecoding(text: string): boolean {
	return keywordInProse(text, VIBE_WORD);
}

/**
 * Sunset amber/gold → vibrant violet gradient-highlight every standalone "vibe" or "vibecoding" in `text`
 * for editor display. Sweeps hue 38→275.
 */
export const highlightVibecoding: KeywordHighlighter = createGradientHighlighter({
	probe: VIBE_PROBE,
	highlight: VIBE_HIGHLIGHT,
	stops: 14,
	hue: t => 38 + t * 237,
	saturation: 92,
	lightness: 60,
});
