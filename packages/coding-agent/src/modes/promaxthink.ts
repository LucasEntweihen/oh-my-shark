import promaxthinkNotice from "../prompts/system/promaxthink-notice.md" with { type: "text" };
import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { magicKeywordRegex } from "./magic-keyword-boundary";
import { keywordInProse } from "./markdown-prose";

/**
 * "promaxthink" keyword support, mirroring ultrathink's affordance with a
 * heavier contract.
 *
 * Typing the standalone word in the input editor paints it with a red-family
 * gradient ({@link highlightPromaxthink}), visually distinct from ultrathink's
 * full-spectrum rainbow; submitting a message that mentions it appends a
 * hidden {@link PROMAXTHINK_NOTICE} that both requests maximum reasoning
 * effort (like ultrathink) AND requires an adversarial self-verification pass
 * before the answer is presented (which ultrathink does not require). Matching
 * is prose-delimited and case-sensitive (lowercase only), so "promaxthinking",
 * "Promaxthink", or "promaxthink.ts" never trigger either behavior.
 */

// Detection: lowercase keyword flanked by prose punctuation, whitespace, or a string edge.
const PROMAXTHINK_WORD = magicKeywordRegex("promaxthink");

/** Hidden system notice appended after a user message that mentions "promaxthink". */
export const PROMAXTHINK_NOTICE: string = promaxthinkNotice.trim();

/**
 * Whether `text` contains the standalone keyword "promaxthink" (lowercase,
 * prose-delimited) in prose - never inside a code block, inline code span,
 * or XML/HTML section.
 */
export function containsPromaxthink(text: string): boolean {
	return keywordInProse(text, PROMAXTHINK_WORD);
}

/**
 * Red-family gradient-highlight every standalone "promaxthink" in `text` for
 * editor display. Sweeps hue 330→380 (wrapping at 360), i.e. rose/magenta-red
 * through pure red to orange-red - every stop stays a shade of red, unlike
 * ultrathink's full red→violet rainbow sweep.
 */
export const highlightPromaxthink: KeywordHighlighter = createGradientHighlighter({
	probe: /promaxthink/,
	highlight: magicKeywordRegex("promaxthink", "g"),
	stops: 14,
	hue: t => (330 + t * 50) % 360,
});
