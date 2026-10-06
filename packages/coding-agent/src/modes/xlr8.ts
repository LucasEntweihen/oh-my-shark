import xlr8Notice from "../prompts/system/xlr8-notice.md" with { type: "text" };
import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";
import { keywordInProse } from "./markdown-prose";

/**
 * "xlr8" and "/xlr8" keyword and command support for hyperspeed acceleration.
 *
 * Typing the standalone word (or /xlr8 slash command) in the input editor
 * paints it with a gray, blue, green, and white gradient ({@link highlightXlr8}).
 * Invoking it accelerates the line of reasoning, simplifies code, streamlines
 * the thought flow, and supports disconnecting from all agents to operate in basic mode.
 */

const XLR8_PROBE = /xlr8/;
const XLR8_HIGHLIGHT =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?xlr8(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/gu;
const XLR8_WORD =
	/(?<![\p{L}\p{N}_./\\-])(?<!::)(?:[/|\\])?xlr8(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;

/** Hidden system notice appended after a user message that mentions "xlr8" or "/xlr8". */
export const XLR8_NOTICE: string = xlr8Notice.trim();

export function containsXlr8(text: string): boolean {
	return keywordInProse(text, XLR8_WORD);
}

/** Check if invocation requests autonomous basic mode (disconnect from agents). */
export function isXlr8BasicMode(text: string): boolean {
	if (!containsXlr8(text)) return false;
	return /(?:^|\s)(?:--basic|basic|--solo|solo|--disconnect|disconnect)(?:\s|$)/i.test(text);
}

/**
 * Gray, blue, green, and white gradient-highlight every standalone "xlr8" or "/xlr8" in `text`.
 */
export const highlightXlr8: KeywordHighlighter = createGradientHighlighter({
	probe: XLR8_PROBE,
	highlight: XLR8_HIGHLIGHT,
	stops: 16,
	colors: ["#9E9E9E", "#2196F3", "#00E676", "#FFFFFF"],
});
