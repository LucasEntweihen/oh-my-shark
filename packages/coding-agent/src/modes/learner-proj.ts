import { createGradientHighlighter, type KeywordHighlighter } from "./gradient-highlight";

const LEARNER_PROJ_PROBE = /(?:^|[^\w/])(?:\/learner-proj|learner-proj)(?![\w/])/i;
const LEARNER_PROJ_REGEX = /(^|[^\w/])(\/learner-proj|learner-proj)(?![\w/])/gi;

/**
 * Cyan → Sapphire gradient highlighter for "/learner-proj" and "learner-proj"
 * in the editor and terminal output.
 * Sweeps cyan (hue 180) to deep sapphire blue (hue 220).
 */
export const highlightLearnerProj: KeywordHighlighter = createGradientHighlighter({
	probe: LEARNER_PROJ_PROBE,
	highlight: LEARNER_PROJ_REGEX,
	stops: 14,
	hue: t => 180 + t * 45, // 180° (Ciano Elétrico) -> 225° (Safira Profundo)
});
