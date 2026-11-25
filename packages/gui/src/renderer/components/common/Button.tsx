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
	`shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(${textToken})_22%,transparent),var(--omsk-shadow-sm)]`;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	primary: `border-transparent bg-gradient-to-b from-(--omsk-accent-bright) to-(--omsk-accent) text-(--omsk-bg-primary) font-semibold ${innerHighlight("--omsk-text")} hover:brightness-110 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_6px_18px_-5px_var(--omsk-accent-glow)] active:brightness-95 disabled:hover:brightness-100`,
	secondary:
		"border-(--omsk-border) bg-(--omsk-btn-secondary-bg) text-(--omsk-btn-secondary-text) shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),var(--omsk-shadow-sm)] backdrop-blur-sm hover:border-(--omsk-border-accent)/45 hover:bg-(--omsk-selected-bg) hover:text-(--omsk-text) active:brightness-[0.96]",
	ghost: "border-transparent bg-transparent text-(--omsk-muted) hover:border-(--omsk-border-muted) hover:bg-(--omsk-selected-bg) hover:text-(--omsk-text)",
	danger: `border-transparent bg-(--omsk-btn-danger-bg) text-(--omsk-btn-danger-text) ${innerHighlight("--omsk-btn-danger-text")} hover:brightness-110 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_-4px_color-mix(in_srgb,var(--omsk-error)_40%,transparent)] active:brightness-95 disabled:hover:brightness-100`,
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "h-7 gap-1.5 rounded-xl px-3 text-omsk-md",
	md: "h-8 gap-1.5 rounded-xl px-3.5 text-omsk-lg",
	lg: "h-10 gap-2 rounded-xl px-[18px] text-omsk-lg",
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
			className={`inline-flex select-none items-center justify-center border font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--omsk-accent) active:scale-[0.97] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none disabled:active:scale-100 disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`.trim()}
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
