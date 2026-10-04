import { RADIUS, clamp, radians } from "./geometry";
import type { Expression, HexColor } from "./types";

/**
 * 25 calibrated facial states from the original GrokBot & Bible Strong Avatar Lab.
 * [headX, headY, headZ, widthLeft, widthRight, heightLeft, heightRight, spacing, latitude, leftAngle, rightAngle]
 */
export const GROK_CALIBRATED_PARAMS: readonly (readonly [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
])[] = [
	[7.3, 27.8, -16.1, 24.2, 27.6, 38.9, 40.7, 54.3, -20.5, 0, 0],
	[-35.6, 0.7, -8.5, 29.4, 27.3, 49.5, 49.8, 57.7, -42, 0, 0],
	[-36.2, 13.1, 15.5, 44.3, 51.3, 74.2, 76, 68.7, -40.7, 0, 0],
	[15.6, -16.5, -11.3, 54, 51, 49.6, 48.5, 70.9, 30.1, 0, 0],
	[3.4, 13, 8.9, 42.6, 44, 17.3, 16, 57.9, 4.9, 0, 0],
	[-17.7, -1.4, -8.8, 29.5, 19.2, 51.6, 41.9, 56.3, 0, 0, 90],
	[14.8, 14.5, 5.5, 22.9, 22.2, 32.4, 33.4, 50.9, 39.2, 0, 0],
	[25.7, 16.5, -13.5, 48.5, 48.3, 33.5, 33, 53.3, 41.3, 61.3, -80],
	[-22.8, -15.9, 6.2, 44.5, 43.9, 32.3, 24.6, 54.9, -42, -60.9, 69.2],
	[-11.6, 8.3, -12.7, 42.5, 22.1, 41.8, 22.2, 61.7, 12.3, 0, 0],
	[20.3, 7, 8.7, 30.2, 28.1, 48.8, 49.2, 56.8, 39.9, 0, 0],
	[17.5, -15.2, -8.7, 51, 49.2, 75.3, 73.4, 70.2, 41.6, 0, 0],
	[-10.4, 15.2, 11.8, 50.6, 51.6, 50, 50.7, 69.5, 16.7, 0, 0],
	[-6, -7.7, -9.4, 43.6, 42.8, 15.5, 18.1, 57.9, 3.5, 0, 0],
	[0.2, -3.1, 9, 29.6, 16.8, 51.5, 41.3, 56.4, -7.8, 0, 90],
	[-16.2, 38.4, 2.4, 23.7, 26.2, 32.7, 34.6, 53.9, -41.1, 0, 0],
	[3.5, -16.1, 15.8, 51, 48.5, 34.9, 33, 55.1, 41.9, 80, -62.2],
	[-17.3, 11.2, -9.1, 24.2, 44.5, 44.5, 32.2, 55, -36.5, 18.5, 67.9],
	[-0.7, 3.6, 12.2, 42.1, 22.2, 41.7, 22.1, 60.4, -9.1, 0, 0],
	[-25.3, -12.4, -13.3, 30.5, 26.8, 49.9, 48.8, 56.2, -35.8, 0, 0],
	[-41.1, 20.2, 18.8, 44.6, 53, 74.9, 77.8, 70.8, -40.6, 0, 0],
	[-14.6, -12.5, -16.1, 51.4, 50.5, 50.1, 49.4, 69, -20, 0, 0],
	[10, 2.7, 8.8, 42.9, 43.3, 16.4, 17.8, 57.9, 2.7, 0, 0],
	[-17.8, 10, -6.3, 28.8, 17.3, 51.4, 42.7, 56.6, -9.8, 0, 90],
	[-29.6, 7.5, 10.1, 21.5, 23.2, 32, 33.5, 51.2, -37.4, 0, 0],
];

export const GROK_SEMANTIC_KEYS: readonly string[] = [
	"upward-side-glance",
	"downward-gaze",
	"joyful-down-right",
	"surprised-left",
	"sleepy-squint",
	"skeptical-right",
	"small-attentive",
	"angry-right",
	"curious-left",
	"asymmetric-down-right",
	"attentive-left",
	"joyful-wide",
	"wide-downward-gaze",
	"eyes-closed",
	"skeptical-left",
	"far-right-glance",
	"angry-left",
	"playful-right",
	"asymmetric-up-left",
	"gentle-downward-gaze",
	"wide-down-left",
	"surprised-wide-left",
	"drowsy-closed",
	"suspicious-right",
	"shy-downward",
];

export interface GrokDot {
	x: number;
	y: number;
	radius: number;
	opacity: number;
}

export interface GrokEyeDots {
	left: GrokDot[];
	right: GrokDot[];
	centerLeft: [number, number];
	centerRight: [number, number];
}

/**
 * Creates an expression configuration from the calibrated table.
 */
export function expressionFromGrokIndex(index: number): Expression {
	const safeIndex = Math.max(0, Math.min(GROK_CALIBRATED_PARAMS.length - 1, index));
	const [
		headX,
		headY,
		headZ,
		widthLeft,
		widthRight,
		heightLeft,
		heightRight,
		spacing,
		latitude,
		leftAngle,
		rightAngle,
	] = GROK_CALIBRATED_PARAMS[safeIndex]!;

	return {
		id: `grok-${safeIndex.toString().padStart(2, "0")}`,
		semanticKey: GROK_SEMANTIC_KEYS[safeIndex],
		headX,
		headY,
		headZ,
		widthLeft,
		widthRight,
		heightLeft,
		heightRight,
		spacing,
		positionXLeft: 0,
		positionXRight: 0,
		positionYLeft: latitude,
		positionYRight: latitude,
		leftAngle,
		rightAngle,
		perspective: 1,
		eyeMotion: "microSaccades",
		bodyMotion: "slowDrift",
	};
}

/**
 * Computes sample dots along an eye ellipse ring in the Grok style.
 */
export function computeGrokEyeRingDots(
	centerX: number,
	centerY: number,
	width: number,
	height: number,
	angleDegrees: number,
	blink = 1,
	numDots = 28,
): GrokDot[] {
	const dots: GrokDot[] = [];
	const angleRad = radians(angleDegrees);
	const cosA = Math.cos(angleRad);
	const sinA = Math.sin(angleRad);
	const rx = Math.max(2, width / 2);
	const effectiveHeight = 4 + (height - 4) * Math.max(0.04, blink);
	const ry = Math.max(1, effectiveHeight / 2);

	for (let i = 0; i < numDots; i++) {
		const theta = (i / numDots) * Math.PI * 2;
		const localX = rx * Math.cos(theta);
		const localY = ry * Math.sin(theta);
		const rotX = localX * cosA - localY * sinA;
		const rotY = localX * sinA + localY * cosA;

		dots.push({
			x: centerX + rotX,
			y: centerY + rotY,
			radius: 2.2,
			opacity: 1,
		});
	}
	return dots;
}

/**
 * Calculates complete Grok dots layout with 3D spherical projection.
 */
export function computeGrokDots(expression: Expression, blink = 1, gazeX = 0, gazeY = 0, dotsPerEye = 28): GrokEyeDots {
	const turnRad = radians(expression.headY);
	const halfSpacing = expression.spacing / 2;

	// Center coordinates with spherical curvature projection
	const radius = RADIUS * 0.9;

	const projectEyeCenter = (baseX: number, baseY: number): { x: number; y: number; depth: number } => {
		const baseLongitude = Math.asin(clamp(baseX / radius, -1, 1));
		const longitude = baseLongitude + turnRad;
		const depth = Math.cos(longitude);
		const x = radius * Math.sin(longitude) + gazeX;
		const y = baseY + gazeY + expression.headX * 0.4;
		return { x, y, depth };
	};

	const leftCenter = projectEyeCenter(-halfSpacing + expression.positionXLeft, expression.positionYLeft);
	const rightCenter = projectEyeCenter(halfSpacing + expression.positionXRight, expression.positionYRight);

	const leftDots = computeGrokEyeRingDots(
		leftCenter.x,
		leftCenter.y,
		expression.widthLeft * Math.max(0.1, leftCenter.depth),
		expression.heightLeft,
		expression.leftAngle,
		blink,
		dotsPerEye,
	);

	const rightDots = computeGrokEyeRingDots(
		rightCenter.x,
		rightCenter.y,
		expression.widthRight * Math.max(0.1, rightCenter.depth),
		expression.heightRight,
		expression.rightAngle,
		blink,
		dotsPerEye,
	);

	return {
		left: leftDots,
		right: rightDots,
		centerLeft: [leftCenter.x, leftCenter.y],
		centerRight: [rightCenter.x, rightCenter.y],
	};
}

/**
 * Renders SVG elements for the Grok dots system.
 */
export function renderGrokDotsSvg(eyeDots: GrokEyeDots, eyeColor: HexColor | string): string {
	const renderRing = (dots: GrokDot[]): string =>
		dots
			.map(
				d =>
					`<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${d.radius.toFixed(1)}" fill="${eyeColor}" opacity="${d.opacity.toFixed(2)}"/>`,
			)
			.join("");

	return `<g class="grok-dots-eyes">${renderRing(eyeDots.left)}${renderRing(eyeDots.right)}</g>`;
}

/**
 * Renders an ANSI ASCII Braille grid representing the Grok Dots avatar for the terminal.
 */
export function renderGrokTerminalDotsGrid(expression: Expression, blink = 1, width = 32, height = 14): string[] {
	const grid: string[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => " "));
	const dots = computeGrokDots(expression, blink);

	const mapToGrid = (ptX: number, ptY: number): [number, number] | null => {
		const gx = Math.round(((ptX + 130) / 260) * (width - 1));
		const gy = Math.round(((ptY + 110) / 220) * (height - 1));
		if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
			return [gx, gy];
		}
		return null;
	};

	// Draw head contour dots
	const headDotsCount = 48;
	for (let i = 0; i < headDotsCount; i++) {
		const ang = (i / headDotsCount) * Math.PI * 2;
		const hx = RADIUS * Math.cos(ang);
		const hy = RADIUS * Math.sin(ang);
		const mapped = mapToGrid(hx, hy);
		if (mapped) {
			grid[mapped[1]]![mapped[0]] = "·";
		}
	}

	// Draw eye dots with intense glyphs
	for (const dot of [...dots.left, ...dots.right]) {
		const mapped = mapToGrid(dot.x, dot.y);
		if (mapped) {
			grid[mapped[1]]![mapped[0]] = "●";
		}
	}

	return grid.map(row => row.join(""));
}
