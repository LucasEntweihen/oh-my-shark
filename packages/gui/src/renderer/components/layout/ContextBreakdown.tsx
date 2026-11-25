import type { CSSProperties } from "react";
import type { ContextSegment, ContextSegmentKey, ContextUsageView } from "../../lib/context-usage";
import { cx, formatTokens } from "../../lib/format";
import { useT } from "../../lib/i18n";

const SEGMENT_STYLE: Record<ContextSegmentKey, CSSProperties> = {
	messages: { backgroundColor: "var(--omsk-accent)" },
	systemTools: { backgroundColor: "var(--omsk-warning)" },
	systemPrompt: { backgroundColor: "var(--omsk-syntax-function)" },
	// No single theme token stays apart from both amber tools and purple prompt
	// in every theme; this pink does.
	systemContext: { backgroundColor: "color-mix(in srgb, var(--omsk-error) 60%, var(--omsk-syntax-function))" },
	// Between the prompt's purple and the skills' green, so the three read as related but apart.
	instructionFiles: { backgroundColor: "color-mix(in srgb, var(--omsk-success) 50%, var(--omsk-syntax-function))" },
	skills: { backgroundColor: "var(--omsk-success)" },
	autocompact: { backgroundColor: "var(--omsk-dim)", opacity: 0.5 },
	free: { backgroundColor: "var(--omsk-progress-bg)", boxShadow: "inset 0 0 0 1px var(--omsk-border-strong)" },
};

/** One decimal like the TUI's grid legend; a sliver still reads as present. */
function formatShare(tokens: number, window: number): string {
	const percent = (tokens / window) * 100;
	return percent > 0 && percent < 0.1 ? "<0.1%" : `${percent.toFixed(1)}%`;
}

export interface ContextBreakdownProps {
	view: ContextUsageView;
	/** Empty while the report loads: the bar then shows the bare reading. */
	segments: ContextSegment[];
	/** Prefix token counts with `~` where the host estimates rather than measures. */
	approximate?: boolean;
	barHeight?: number;
	className?: string;
}

/**
 * The context window as one stacked bar and a legend of what fills it: each
 * category's swatch, tokens and share of the window. Without a known window
 * there is nothing to divide by, so the bar and every percentage drop out and
 * the legend lists bare token counts.
 */
export function ContextBreakdown({ view, segments, approximate, barHeight = 6, className }: ContextBreakdownProps) {
	const t = useT();
	const { capacityKnown, contextWindow, percent, remainingTokens, usedTokens } = view;
	const tokens = (value: number) => (approximate && value > 0 ? `~${formatTokens(value)}` : formatTokens(value));
	const filled = segments.filter(segment => segment.key !== "free");

	return (
		<div className={cx("min-w-0", className)}>
			{capacityKnown && (
				<div
					aria-label={t("contextUsage.progress", { percent: Math.round(percent) })}
					aria-valuemax={100}
					aria-valuemin={0}
					aria-valuenow={Math.round(percent)}
					aria-valuetext={`${formatTokens(usedTokens)} ${t("contextUsage.used")}, ${formatTokens(remainingTokens)} ${t("contextUsage.remaining")}`}
					className="flex overflow-hidden rounded-full bg-[var(--omsk-progress-bg)]"
					role="progressbar"
					style={{ height: barHeight }}
				>
					{filled.length > 0 ? (
						filled.map(segment => (
							<span
								aria-hidden="true"
								className="h-full shrink-0"
								key={segment.key}
								style={{
									...SEGMENT_STYLE[segment.key],
									width: `${Math.min(100, (segment.tokens / contextWindow) * 100)}%`,
								}}
							/>
						))
					) : (
						<span
							aria-hidden="true"
							className="h-full bg-[var(--omsk-status-context)]"
							style={{ width: `${percent}%` }}
						/>
					)}
				</div>
			)}
			{segments.length > 0 && (
				<ul className={cx("space-y-2", capacityKnown && "mt-3")}>
					{segments.map(segment => (
						<li className="flex items-center gap-2.5 text-omsk-md" key={segment.key}>
							<span
								aria-hidden="true"
								className="size-2.5 shrink-0 rounded-[3px]"
								style={SEGMENT_STYLE[segment.key]}
							/>
							<span
								className={cx(
									"min-w-0 flex-1 truncate",
									segment.key === "autocompact" || segment.key === "free"
										? "text-[var(--omsk-dim)]"
										: "text-[var(--omsk-muted)]",
								)}
							>
								{t(`contextReport.cat.${segment.key}`)}
							</span>
							<span className="shrink-0 font-mono tabular-nums text-[var(--omsk-text)]">
								{tokens(segment.tokens)}
							</span>
							{capacityKnown && (
								<span className="w-12 shrink-0 text-end font-mono tabular-nums text-[var(--omsk-dim)]">
									{formatShare(segment.tokens, contextWindow)}
								</span>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
