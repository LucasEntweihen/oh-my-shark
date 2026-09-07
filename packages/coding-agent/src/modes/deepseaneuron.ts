import deepseaneuronNotice from "../prompts/system/deepseaneuron-notice.md" with { type: "text" };
import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { keywordInProse } from "./markdown-prose";

/**
 * "deepseaneuron" keyword support for dynamic token optimization & rationalization.
 *
 * Typing the standalone word in the input editor paints it with a light-blue to
 * dark-blue/purple gradient ({@link highlightDeepseaneuron}); submitting a message
 * that mentions it appends a hidden {@link DEEPSEANEURON_NOTICE} that instructs the
 * model to maximize token efficiency without degrading result quality.
 */

const DEEPSEANEURON_PROBE = /deepseaneuron/;
const DEEPSEANEURON_HIGHLIGHT =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?deepseaneuron(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/gu;
const DEEPSEANEURON_WORD =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?deepseaneuron(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;

/** Hidden system notice appended after a user message that mentions "deepseaneuron". */
export const DEEPSEANEURON_NOTICE: string = deepseaneuronNotice.trim();

export function containsDeepseaneuron(text: string): boolean {
	return keywordInProse(text, DEEPSEANEURON_WORD);
}

/**
 * Gradient-highlight standalone "deepseaneuron" in `text` with light-blue to
 * dark-blue (almost purple) tones. Sweeps hue 190→280 (cyan/light blue → deep blue → purple).
 */
export const highlightDeepseaneuron: KeywordHighlighter = createGradientHighlighter({
	probe: DEEPSEANEURON_PROBE,
	highlight: DEEPSEANEURON_HIGHLIGHT,
	stops: 14,
	hue: t => 190 + t * 90,
	saturation: 90,
	lightness: 60,
});
