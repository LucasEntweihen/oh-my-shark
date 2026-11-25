import { useEffect, useMemo, useRef } from "react";
import { cx } from "../../lib/format";
import {
	createOceanHabitat,
	type OceanThemeOverrides,
	renderOceanToCanvas,
	stepOceanHabitat,
} from "../../lib/ocean-aquarium";

interface OceanAquariumBackdropProps {
	/** Unique seed per empty tab or active chat session. */
	seedKey: string;
	className?: string;
}

function readOceanCssOverrides(): OceanThemeOverrides {
	if (typeof document === "undefined") return {};
	const computeStyle = typeof getComputedStyle === "function" ? getComputedStyle : window?.getComputedStyle;
	const style =
		typeof computeStyle === "function" ? computeStyle(document.documentElement) : document.documentElement.style;
	if (!style) return {};
	const waterTop = style.getPropertyValue("--omsk-ocean-top").trim();
	const waterBottom = style.getPropertyValue("--omsk-ocean-bottom").trim();
	const sharkTint = style.getPropertyValue("--omsk-shark-color").trim();
	const accent =
		style.getPropertyValue("--omsk-accent-bright").trim() || style.getPropertyValue("--omsk-accent").trim();
	return {
		waterTop: waterTop || undefined,
		waterBottom: waterBottom || undefined,
		sharkTint: sharkTint || undefined,
		accent: accent || undefined,
	};
}

/**
 * Full-bleed ASCII ocean aquarium backdrop rendered at 24fps behind the
 * Liquid Glass layer. Automatically pauses when hidden and respects
 * `prefers-reduced-motion`.
 */
export function OceanAquariumBackdrop({ seedKey, className }: OceanAquariumBackdropProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pointerRef = useRef<{ xRatio: number; yRatio: number; active: boolean }>({
		xRatio: 0.5,
		yRatio: 0.5,
		active: false,
	});
	const overridesRef = useRef<OceanThemeOverrides>(readOceanCssOverrides());

	const habitat = useMemo(() => createOceanHabitat(seedKey), [seedKey]);

	// Re-read CSS overrides whenever theme attributes or custom variables change on <html>
	useEffect(() => {
		overridesRef.current = readOceanCssOverrides();
		if (typeof MutationObserver === "undefined") return;
		const observer = new MutationObserver(() => {
			overridesRef.current = readOceanCssOverrides();
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["style", "data-theme", "data-theme-name"],
		});
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;
		let ctx: CanvasRenderingContext2D | null = null;
		try {
			ctx = canvas.getContext("2d");
		} catch {
			return;
		}
		if (!ctx) return;

		const reducedMotion =
			typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let width = Math.max(container.clientWidth, 320);
		let height = Math.max(container.clientHeight, 240);

		const syncCanvasSize = () => {
			width = Math.max(container.clientWidth, 320);
			height = Math.max(container.clientHeight, 240);
			cachedRect = container.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		let cachedRect = container.getBoundingClientRect();
		syncCanvasSize();
		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => {
						syncCanvasSize();
						if (ctx) renderOceanToCanvas(ctx, width, height, habitat, 0, overridesRef.current);
					})
				: null;
		resizeObserver?.observe(container);

		let rafId = 0;
		let lastDrawMs = 0;
		let elapsed = 0;
		let frameIntervalMs = 42; // ~24fps crisp ASCII ocean motion, adapts to 15fps on slower GPUs
		let paused = document.hidden;

		// Draw initial frame immediately
		renderOceanToCanvas(ctx, width, height, habitat, 0, overridesRef.current);

		if (reducedMotion) {
			return () => resizeObserver?.disconnect();
		}

		const tick = (now: number) => {
			if (paused || document.hidden) {
				rafId = 0;
				return;
			}
			if (lastDrawMs === 0) lastDrawMs = now;
			const deltaMs = now - lastDrawMs;
			if (deltaMs >= frameIntervalMs) {
				const dt = deltaMs / 1000;
				lastDrawMs = now;
				elapsed += dt;
				const cols = Math.floor(width / 7.8);
				const t0 = performance.now();
				stepOceanHabitat(habitat, dt, elapsed, cols, pointerRef.current);
				if (ctx) renderOceanToCanvas(ctx, width, height, habitat, elapsed, overridesRef.current);
				const drawCost = performance.now() - t0;
				frameIntervalMs = drawCost > 16 ? 66 : 42;
			}
			rafId = window.requestAnimationFrame(tick);
		};

		const scheduleTick = () => {
			if (!paused && !document.hidden && rafId === 0) {
				lastDrawMs = 0;
				rafId = window.requestAnimationFrame(tick);
			}
		};

		const onVisibilityChange = () => {
			paused = document.hidden;
			if (!paused) scheduleTick();
		};
		const onWindowBlur = () => {
			paused = true;
		};
		const onWindowFocus = () => {
			paused = document.hidden;
			scheduleTick();
		};

		const onPointerMove = (event: PointerEvent) => {
			if (cachedRect.width <= 0 || cachedRect.height <= 0) return;
			const xRatio = (event.clientX - cachedRect.left) / cachedRect.width;
			const yRatio = (event.clientY - cachedRect.top) / cachedRect.height;
			pointerRef.current = {
				xRatio,
				yRatio,
				active: xRatio >= 0 && xRatio <= 1 && yRatio >= 0 && yRatio <= 1,
			};
		};
		const onPointerLeave = () => {
			pointerRef.current.active = false;
		};

		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("blur", onWindowBlur);
		window.addEventListener("focus", onWindowFocus);
		window.addEventListener("pointermove", onPointerMove, { passive: true });
		container.addEventListener("pointerleave", onPointerLeave, { passive: true });
		scheduleTick();

		return () => {
			if (rafId !== 0) window.cancelAnimationFrame(rafId);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("blur", onWindowBlur);
			window.removeEventListener("focus", onWindowFocus);
			window.removeEventListener("pointermove", onPointerMove);
			container.removeEventListener("pointerleave", onPointerLeave);
			resizeObserver?.disconnect();
		};
	}, [habitat]);

	return (
		<div
			ref={containerRef}
			aria-hidden
			data-ocean-aquarium="true"
			data-aquarium-habitat={habitat.palette.name}
			data-aquarium-behavior={habitat.dominantBehavior}
			data-aquarium-sharks={habitat.sharks.length}
			className={cx(
				"omsk-ocean-aquarium pointer-events-none absolute inset-0 overflow-hidden select-none",
				className,
			)}
		>
			<canvas ref={canvasRef} className="block h-full w-full" />
		</div>
	);
}
