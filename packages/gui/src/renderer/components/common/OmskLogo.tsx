/**
 * OhMyShark (OMSK) brand emblem. Renders the official OMSK logo asset in UI
 * headers, empty states, and loading screens, with a crisp inline SVG fallback
 * when running in asset-less test environments.
 */
import { cx } from "../../lib/format";

export interface OmskLogoProps {
	/** Emblem size in px (square). */
	size?: number;
	/** Wrap in a rounded liquid-glass frame. */
	tile?: boolean;
	className?: string;
}

export function OmskLogo({ size = 24, tile = false, className }: OmskLogoProps) {
	const inner = (
		<img
			src="./omsk-logo.png"
			alt=""
			aria-hidden="true"
			width={size}
			height={size}
			draggable={false}
			className={cx(
				"shrink-0 select-none object-cover",
				tile ? "rounded-[24%]" : "rounded-[22%]",
				!tile && className,
			)}
			style={{ width: size, height: size }}
		/>
	);

	if (!tile) return inner;

	return (
		<span
			className={cx(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-(--omp-border-accent)/40 bg-(--omp-bg-elevated)/60 shadow-[0_0_24px_-6px_var(--omp-accent-glow)]",
				className,
			)}
			style={{ width: size, height: size }}
		>
			{inner}
		</span>
	);
}
