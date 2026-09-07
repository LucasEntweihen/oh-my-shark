import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { keywordInProse } from "./markdown-prose";

/**
 * "doomania" and "/doomania" keyword support.
 *
 * Typing the standalone word (or /doomania slash command) in the input editor
 * paints it with a green-family gradient ({@link highlightDoomania}).
 */

const DOOMANIA_PROBE = /doomania/;
// Match standalone /doomania, \doomania, or doomania with proper word boundaries
const DOOMANIA_HIGHLIGHT =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?doomania(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/gu;
const DOOMANIA_WORD =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?doomania(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;

export function containsDoomania(text: string): boolean {
	return keywordInProse(text, DOOMANIA_WORD);
}

/**
 * Green-family gradient-highlight every standalone "doomania" or "/doomania" in `text`
 * for editor display. Sweeps hue 105→160, i.e. vibrant lime/spring green through emerald green.
 */
export const highlightDoomania: KeywordHighlighter = createGradientHighlighter({
	probe: DOOMANIA_PROBE,
	highlight: DOOMANIA_HIGHLIGHT,
	stops: 14,
	hue: t => 105 + t * 55,
	saturation: 90,
	lightness: 60,
});
