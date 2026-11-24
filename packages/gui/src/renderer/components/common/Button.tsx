/**
 * Button primitive: primary / secondary / ghost / danger variants,
 * three sizes, icon slots, loading state.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { playSound } from "../../lib/sound-effects";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/** Subtle top-edge highlight derived from the variant's own text token. */
const innerHighlight = (textToken: string) =>
	`shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(${textToken})_22%,transparent),var(--omp-shadow-sm)]`;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	primary: `border-transparent bg-gradient-to-b from-(--omp-accent-bright) to-(--omp-accent) text-(--omp-bg-primary) font-semibold ${innerHighlight("--omp-text")} hover:brightness-110 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_6px_18px_-5px_var(--omp-accent-glow)] active:brightness-95 disabled:hover:brightness-100`,
	secondary:
		"border-(--omp-border) bg-(--omp-btn-secondary-bg) text-(--omp-btn-secondary-text) shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),var(--omp-shadow-sm)] backdrop-blur-sm hover:border-(--omp-border-accent)/45 hover:bg-(--omp-selected-bg) hover:text-(--omp-text) active:brightness-[0.96]",
	ghost: "border-transparent bg-transparent text-(--omp-muted) hover:border-(--omp-border-muted) hover:bg-(--omp-selected-bg) hover:text-(--omp-text)",
	danger: `border-transparent bg-(--omp-btn-danger-bg) text-(--omp-btn-danger-text) ${innerHighlight("--omp-btn-danger-text")} hover:brightness-110 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_-4px_color-mix(in_srgb,var(--omp-error)_40%,transparent)] active:brightness-95 disabled:hover:brightness-100`,
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "h-7 gap-1.5 rounded-xl px-3 text-omp-md",
	md: "h-8 gap-1.5 rounded-xl px-3.5 text-omp-lg",
	lg: "h-10 gap-2 rounded-xl px-[18px] text-omp-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	/** Icon rendered before the label (lucide component or element). */
	icon?: ReactNode;
	/** Icon rendered after the label. */
	trailingIcon?: ReactNode;
	/** Show a spinner and disable interaction. */
	loading?: boolean;
}

export function Button({
	variant = "secondary",
	size = "md",
	icon,
	trailingIcon,
	loading,
	disabled,
	className,
	children,
	type,
	onClick,
	...rest
}: ButtonProps) {
	return (
		<button
			type={type ?? "button"}
			className={`inline-flex select-none items-center justify-center border font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--omp-accent) active:scale-[0.97] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none disabled:active:scale-100 disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`.trim()}
			disabled={disabled || loading}
			onClick={event => {
				playSound("click");
				onClick?.(event);
			}}
			{...rest}
		>
			{loading ? <Spinner size="sm" /> : icon}
			{children}
			{trailingIcon}
		</button>
	);
}
