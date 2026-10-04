import { renderAvatarPose } from "./geometry";
import type { AvatarDefinition, AvatarExpressionDefinition, AvatarPlaybackState, AvatarScene } from "./types";

export function createInitialPlaybackState(definition: AvatarDefinition): AvatarPlaybackState {
	const defaultAnim = definition.animationOrder[0];
	return {
		activeAnimation: defaultAnim,
		activeExpression: "neutral",
		status: "playing",
		stepIndex: 0,
		direction: 1,
		phase: "transition",
		phaseStartedAt: performance.now(),
		transitionFrom: "neutral",
		blinkDueAt: performance.now() + 2500,
	};
}

function interpolateValue(start: number, end: number, t: number, mode: "spring" | "smooth" | "snappy"): number {
	const clampedT = Math.max(0, Math.min(1, t));
	let ease = clampedT;
	if (mode === "smooth") {
		ease = clampedT * clampedT * (3 - 2 * clampedT);
	} else if (mode === "snappy") {
		ease = 1 - (1 - clampedT) ** 3;
	} else if (mode === "spring") {
		const c4 = (2 * Math.PI) / 3;
		ease =
			clampedT === 0 ? 0 : clampedT === 1 ? 1 : 2 ** (-10 * clampedT) * Math.sin((clampedT * 10 - 0.75) * c4) + 1;
	}
	return start + (end - start) * ease;
}

export function interpolateExpressions(
	from: AvatarExpressionDefinition,
	to: AvatarExpressionDefinition,
	progress: number,
	transition: "spring" | "smooth" | "snappy" = "smooth",
): AvatarExpressionDefinition {
	const lerp = (a: number, b: number) => interpolateValue(a, b, progress, transition);

	return {
		head: {
			x: lerp(from.head.x, to.head.x),
			y: lerp(from.head.y, to.head.y),
			z: lerp(from.head.z, to.head.z),
		},
		eyes: {
			left: {
				width: lerp(from.eyes.left.width, to.eyes.left.width),
				height: lerp(from.eyes.left.height, to.eyes.left.height),
				x: lerp(from.eyes.left.x, to.eyes.left.x),
				y: lerp(from.eyes.left.y, to.eyes.left.y),
				angle: lerp(from.eyes.left.angle, to.eyes.left.angle),
			},
			right: {
				width: lerp(from.eyes.right.width, to.eyes.right.width),
				height: lerp(from.eyes.right.height, to.eyes.right.height),
				x: lerp(from.eyes.right.x, to.eyes.right.x),
				y: lerp(from.eyes.right.y, to.eyes.right.y),
				angle: lerp(from.eyes.right.angle, to.eyes.right.angle),
			},
			spacing: lerp(from.eyes.spacing, to.eyes.spacing),
		},
		perspective: lerp(from.perspective, to.perspective),
		motion: to.motion,
		colors: to.colors ?? from.colors,
	};
}

export function advancePlayback(
	definition: AvatarDefinition,
	state: AvatarPlaybackState,
	now: number,
): AvatarPlaybackState {
	if (state.status !== "playing" || !state.activeAnimation) return state;
	const anim = definition.animations[state.activeAnimation];
	if (!anim || anim.steps.length === 0) return state;

	const nextState = { ...state };
	const currentStep = anim.steps[nextState.stepIndex] ?? anim.steps[0]!;
	const elapsed = now - nextState.phaseStartedAt;

	if (nextState.phase === "transition") {
		if (elapsed >= currentStep.transitionMs) {
			nextState.phase = "hold";
			nextState.phaseStartedAt = now;
			nextState.activeExpression = currentStep.expression;
		}
	} else if (nextState.phase === "hold") {
		if (elapsed >= currentStep.holdMs) {
			// Advance step
			const isLast = nextState.stepIndex >= anim.steps.length - 1;
			const isFirst = nextState.stepIndex <= 0;

			if (anim.playbackMode === "once" && isLast) {
				nextState.status = "stopped";
				return nextState;
			}

			if (anim.playbackMode === "pingPong") {
				if (isLast && nextState.direction === 1) nextState.direction = -1;
				else if (isFirst && nextState.direction === -1) nextState.direction = 1;
				nextState.stepIndex += nextState.direction;
			} else {
				// Loop
				nextState.stepIndex = (nextState.stepIndex + 1) % anim.steps.length;
			}

			const nextStep = anim.steps[nextState.stepIndex]!;
			nextState.transitionFrom = currentStep.expression;
			nextState.activeExpression = nextStep.expression;
			nextState.phase = "transition";
			nextState.phaseStartedAt = now;
		}
	}

	// Update blinking logic
	if (anim.blink.enabled) {
		if (!nextState.blinkDueAt || now >= nextState.blinkDueAt) {
			nextState.blinkStartedAt = now;
			const nextInterval =
				anim.blink.minIntervalMs + Math.random() * (anim.blink.maxIntervalMs - anim.blink.minIntervalMs);
			nextState.blinkDueAt = now + anim.blink.durationMs + nextInterval;
		}
	}

	return nextState;
}

export function sampleAvatarScene(definition: AvatarDefinition, state: AvatarPlaybackState, now: number): AvatarScene {
	const currentExpr = definition.expressions[state.activeExpression] ?? definition.expressions["neutral"]!;
	const fromExpr = definition.expressions[state.transitionFrom] ?? currentExpr;

	let targetExpr = currentExpr;
	if (state.phase === "transition" && state.activeAnimation) {
		const anim = definition.animations[state.activeAnimation];
		const step = anim?.steps[state.stepIndex];
		const transitionMs = step?.transitionMs ?? 300;
		const progress = Math.min(1, (now - state.phaseStartedAt) / transitionMs);
		targetExpr = interpolateExpressions(fromExpr, currentExpr, progress, step?.transition ?? "smooth");
	}

	// Calculate blink ratio (1 = fully open, 0 = closed)
	let blinkRatio = 1;
	const anim = state.activeAnimation ? definition.animations[state.activeAnimation] : undefined;
	if (anim?.blink.enabled && state.blinkStartedAt) {
		const blinkElapsed = now - state.blinkStartedAt;
		const dur = anim.blink.durationMs;
		if (blinkElapsed < dur) {
			// Triangle blink waveform
			const half = dur / 2;
			blinkRatio = blinkElapsed < half ? 1 - blinkElapsed / half : (blinkElapsed - half) / half;
			blinkRatio = Math.max(0.08, Math.min(1, blinkRatio));
		}
	}

	const geometry = renderAvatarPose(definition.body.primary, targetExpr, blinkRatio);
	const bodyColor = targetExpr.colors?.body ?? definition.colors.body;
	const eyesColor = targetExpr.colors?.eyes ?? definition.colors.eyes;

	return {
		geometry,
		colors: {
			body: bodyColor,
			eyes: eyesColor,
			accent: definition.colors.accent,
			glow: definition.colors.glow,
		},
	};
}

let clipCounter = 0;

export function renderAvatarSvg(scene: AvatarScene, size = 300): string {
	const id = ++clipCounter;
	const clipId = `avatar-clip-${id}`;
	const { geometry, colors } = scene;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -150 300 300" width="${size}" height="${size}" role="img">
	<defs>
		<filter id="glow-${id}" x="-30%" y="-30%" width="160%" height="160%">
			<feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${colors.glow ?? colors.accent ?? colors.body}" flood-opacity="0.6"/>
		</filter>
		<clipPath id="${clipId}">
			<path d="${geometry.headPath}" />
		</clipPath>
	</defs>
	<path d="${geometry.headPath}" fill="${colors.body}" filter="url(#glow-${id})" />
	<g clip-path="url(#${clipId})">
		<path d="${geometry.leftPath}" fill="${colors.eyes}" opacity="${geometry.leftVisible ? "1" : "0"}" />
		<path d="${geometry.rightPath}" fill="${colors.eyes}" opacity="${geometry.rightVisible ? "1" : "0"}" />
	</g>
</svg>`;
}
