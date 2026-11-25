/**
 * Small status pill with semantic color variants and optional dot indicator.
 */

import type { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "muted";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
	default: "border-(--omsk-border-muted) bg-transparent text-(--omsk-text)",
	success: "border-[color-mix(in_srgb,var(--omsk-success)_35%,transparent)] bg-transparent text-(--omsk-success)",
	warning: "border-[color-mix(in_srgb,var(--omsk-warning)_35%,transparent)] bg-transparent text-(--omsk-warning)",
	error: "border-[color-mix(in_srgb,var(--omsk-error)_35%,transparent)] bg-transparent text-(--omsk-error)",
	info: "border-[color-mix(in_srgb,var(--omsk-link)_35%,transparent)] bg-transparent text-(--omsk-link)",
	muted: "border-transparent bg-transparent text-(--omsk-dim)",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
	default: "bg-(--omsk-muted)",
	success: "bg-(--omsk-success)",
	warning: "bg-(--omsk-warning)",
	error: "bg-(--omsk-error)",
	info: "bg-(--omsk-link)",
	muted: "bg-(--omsk-dim)",
};

/** A pulsing dot is the live signal, which takes its color from `currentColor`. */
const PULSE_TEXT_CLASSES: Record<BadgeVariant, string> = {
	default: "text-(--omsk-muted)",
	success: "text-(--omsk-success)",
	warning: "text-(--omsk-warning)",
	error: "text-(--omsk-error)",
	info: "text-(--omsk-link)",
	muted: "text-(--omsk-dim)",
};

export interface BadgeProps {
	variant?: BadgeVariant;
	/** Show a small colored dot before the label. */
	dot?: boolean;
	/** Pulse the dot (e.g. live/running states). */
	pulse?: boolean;
	className?: string;
	children: ReactNode;
}

export function Badge({ variant = "default", dot, pulse, className, children }: BadgeProps) {
	return (
		<span
			className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-px text-omsk-xs font-medium leading-4 tracking-wide whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className ?? ""}`.trim()}
		>
			{dot && (
				<span aria-hidden className="relative flex size-1.5">
					<span
						className={
							pulse
								? `omsk-signal-light omsk-signal-light--active ${PULSE_TEXT_CLASSES[variant]}`
								: `relative inline-flex size-1.5 rounded-full ${DOT_CLASSES[variant]}`
						}
					/>
				</span>
			)}
			{children}
		</span>
	);
}
