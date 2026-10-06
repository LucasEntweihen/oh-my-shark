import fastthinkworkerzNotice from "../prompts/system/fastthinkworkerz-notice.md" with { type: "text" };
import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { keywordInProse } from "./markdown-prose";

/**
 * "fastthinkworkerz" keyword support for radical execution acceleration and low-latency delivery.
 *
 * Typing the standalone word in the input editor paints it with a yellow, gold, and white
 * gradient ({@link highlightFastthinkworkerz}); submitting a message that mentions it appends
 * a hidden {@link FASTTHINKWORKERZ_NOTICE} that instructs the model to minimize thinking depth,
 * streamline code, and maximize delivery velocity at all costs while preserving the agent flow.
 */

const FASTTHINKWORKERZ_PROBE = /fastthinkworkerz/;
const FASTTHINKWORKERZ_HIGHLIGHT =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?fastthinkworkerz(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/gu;
const FASTTHINKWORKERZ_WORD =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?fastthinkworkerz(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;

/** Hidden system notice appended after a user message that mentions "fastthinkworkerz". */
export const FASTTHINKWORKERZ_NOTICE: string = fastthinkworkerzNotice.trim();

export function containsFastthinkworkerz(text: string): boolean {
	return keywordInProse(text, FASTTHINKWORKERZ_WORD);
}

/**
 * Gradient-highlight standalone "fastthinkworkerz" in `text` with yellow,
 * gold, and white tones.
 */
export const highlightFastthinkworkerz: KeywordHighlighter = createGradientHighlighter({
	probe: FASTTHINKWORKERZ_PROBE,
	highlight: FASTTHINKWORKERZ_HIGHLIGHT,
	stops: 16,
	colors: ["#FFE600", "#FFD700", "#FFF8DC", "#FFFFFF"],
});
