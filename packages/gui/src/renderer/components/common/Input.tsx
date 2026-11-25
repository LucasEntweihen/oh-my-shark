/**
 * Text input with label/error, auto-growing TextArea, and monospace variant.
 * All elements forward refs so react-hook-form register() works directly.
 */

import {
	forwardRef,
	type InputHTMLAttributes,
	type ReactNode,
	type TextareaHTMLAttributes,
	useCallback,
	useLayoutEffect,
	useRef,
} from "react";

const BASE_INPUT =
	"w-full rounded-lg border bg-(--omsk-input-bg) leading-[1.45] text-(--omsk-text) placeholder:text-(--omsk-dim) shadow-(--omsk-shadow-sm) transition-[border-color,box-shadow] duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Field metrics. `compact` is the dense-form size (settings rows), the same
 * height and type step as the dropdowns beside it; the default suits dialogs.
 */
export const FIELD_SIZE = {
	default: "px-3 py-[9px] text-omsk-lg",
	compact: "px-2.5 py-1.5 text-omsk-md",
} as const;

/** Resting hairline + teal focus ring; error swaps both for the error tokens. */
function stateClasses(error: boolean): string {
	return error
		? "border-(--omsk-error) focus:border-(--omsk-error) focus:shadow-[0_0_0_3px_var(--omsk-error-dim)]"
		: "border-(--omsk-input-border) hover:border-(--omsk-border-strong) focus:border-(--omsk-input-focus-border) focus:shadow-[0_0_0_3px_var(--omsk-input-glow)] disabled:hover:border-(--omsk-input-border)";
}

function FieldShell({
	label,
	error,
	hint,
	children,
}: {
	label?: string;
	error?: string;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<label className="block">
			{label && <span className="mb-1.5 block text-omsk-md font-medium text-(--omsk-text-secondary)">{label}</span>}
			{children}
			{error ? (
				<span data-field-error="" className="mt-1.5 block text-omsk-md text-(--omsk-error)">
					{error}
				</span>
			) : hint ? (
				<span className="mt-1.5 block text-omsk-md text-(--omsk-dim)">{hint}</span>
			) : null}
		</label>
	);
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	hint?: string;
	/** Monospace (code) styling. */
	mono?: boolean;
	/** Dense-form size; see FIELD_SIZE. */
	compact?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ label, error, hint, mono, compact, className, ...rest },
	ref,
) {
	return (
		<FieldShell label={label} error={error} hint={hint}>
			<input
				ref={ref}
				className={`${BASE_INPUT} ${FIELD_SIZE[compact ? "compact" : "default"]} ${stateClasses(Boolean(error))} ${mono ? "font-mono" : ""} ${className ?? ""}`.trim()}
				{...rest}
			/>
		</FieldShell>
	);
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	hint?: string;
	mono?: boolean;
	/** Dense-form size; see FIELD_SIZE. */
	compact?: boolean;
	/** Grow height with content instead of scrolling. */
	autoGrow?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
	{ label, error, hint, mono, compact, autoGrow, className, rows = 3, onInput, ...rest },
	ref,
) {
	const innerRef = useRef<HTMLTextAreaElement | null>(null);

	const resize = useCallback(() => {
		const el = innerRef.current;
		if (!el || !autoGrow) return;
		el.style.height = "0px";
		// Border-box height counts the borders scrollHeight leaves out; without
		// them the content overflows by 2px and draws a scrollbar.
		el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
	}, [autoGrow]);

	useLayoutEffect(resize, [resize]);

	return (
		<FieldShell label={label} error={error} hint={hint}>
			<textarea
				ref={node => {
					innerRef.current = node;
					if (typeof ref === "function") ref(node);
					else if (ref) ref.current = node;
				}}
				className={`${BASE_INPUT} ${FIELD_SIZE[compact ? "compact" : "default"]} resize-none leading-relaxed ${stateClasses(Boolean(error))} ${mono ? "font-mono" : ""} ${className ?? ""}`.trim()}
				onInput={event => {
					resize();
					onInput?.(event);
				}}
				rows={rows}
				{...rest}
			/>
		</FieldShell>
	);
});
