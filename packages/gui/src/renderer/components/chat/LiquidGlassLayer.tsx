import { useId } from "react";
import { cx } from "../../lib/format";

interface LiquidGlassLayerProps {
	className?: string;
}

/**
 * Optical Liquid Glass barrier placed in front of the ASCII shark aquarium.
 * Uses an SVG turbulence/displacement refraction filter alongside frosted
 * backdrop blur, caustics, and a translucent contrast veil so foreground text
 * always remains crisp and legible.
 */
export function LiquidGlassLayer({ className }: LiquidGlassLayerProps) {
	const filterId = useId().replace(/:/g, "-");

	return (
		<div
			aria-hidden
			data-liquid-glass="true"
			className={cx("omsk-liquid-glass pointer-events-none absolute inset-0 overflow-hidden", className)}
		>
			<svg className="absolute h-0 w-0" focusable="false">
				<defs>
					<filter id={`omsk-glass-refract-${filterId}`} x="-5%" y="-5%" width="110%" height="110%">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.012 0.018"
							numOctaves={2}
							seed={7}
							result="noise"
						/>
						<feDisplacementMap
							in="SourceGraphic"
							in2="noise"
							scale={4}
							xChannelSelector="R"
							yChannelSelector="G"
						/>
					</filter>
				</defs>
			</svg>
			<div
				className="omsk-liquid-glass-refraction absolute inset-0"
				style={{ filter: `url(#omsk-glass-refract-${filterId})` }}
			/>
			<div className="omsk-liquid-glass-veil absolute inset-0" />
			<div className="omsk-liquid-glass-rim absolute inset-0" />
		</div>
	);
}
