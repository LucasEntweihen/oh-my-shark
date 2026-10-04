import type { AvatarBody, BodyNode } from "./body";
import { poseFromExpression, renderAvatar } from "./geometry";
import { surfacePresets } from "./surfaces";
import type {
	AvatarBodyDefinition,
	AvatarDefinition,
	AvatarExpressionDefinition,
	AvatarScene,
	Expression,
	SurfaceConfig,
} from "./types";

export const expressionFromDefinition = (key: string, expression: AvatarExpressionDefinition): Expression => ({
	id: key,
	semanticKey: key,
	headX: expression.head.x,
	headY: expression.head.y,
	headZ: expression.head.z,
	widthLeft: expression.eyes.left.width,
	widthRight: expression.eyes.right.width,
	heightLeft: expression.eyes.left.height,
	heightRight: expression.eyes.right.height,
	spacing: expression.eyes.spacing,
	positionXLeft: expression.eyes.left.x,
	positionXRight: expression.eyes.right.x,
	positionYLeft: expression.eyes.left.y,
	positionYRight: expression.eyes.right.y,
	leftAngle: expression.eyes.left.angle,
	rightAngle: expression.eyes.right.angle,
	perspective: expression.perspective,
	eyeMotion: expression.motion.eyes,
	bodyMotion: expression.motion.body,
	...(expression.colors?.body ? { bodyColor: expression.colors.body } : {}),
	...(expression.colors?.eyes ? { eyeColor: expression.colors.eyes } : {}),
});

export const bodyFromDefinition = (body: AvatarBodyDefinition): AvatarBody => ({
	primary: { ...body.primary },
	nodes: (body.nodes ?? []).map((node, index): BodyNode => ({
		id: `node-${index}`,
		name: `Node ${index + 1}`,
		surface: { ...node.surface },
		position: [...node.position],
		rotation: [...node.rotation],
	})),
});

export const renderAvatarExpression = (
	definition: Readonly<AvatarDefinition>,
	expression: Expression,
	colors: { body?: string; eyes?: string } = {},
	blink = 1,
): AvatarScene => {
	const body = bodyFromDefinition(definition.body);
	const pose = poseFromExpression(expression);
	const geometry = renderAvatar(pose, body.primary, blink);

	return {
		geometry,
		colors: {
			body: colors.body ?? expression.bodyColor ?? definition.colors.body,
			eyes: colors.eyes ?? expression.eyeColor ?? definition.colors.eyes,
			accent: definition.colors.accent,
			glow: definition.colors.glow,
		},
	};
};

export const renderAvatarDefinition = (
	definition: Readonly<AvatarDefinition>,
	expressionKey = "neutral",
	blink = 1,
): AvatarScene => {
	const publicExpression = definition.expressions[expressionKey] ?? definition.expressions.neutral;
	if (!publicExpression) {
		const fallbackPrimary: SurfaceConfig = definition.body?.primary ?? surfacePresets.sphere;
		const fallbackExpr: Expression = {
			id: "neutral",
			headX: 0,
			headY: 0,
			headZ: 0,
			widthLeft: 20,
			widthRight: 20,
			heightLeft: 45,
			heightRight: 45,
			spacing: 35,
			positionXLeft: 0,
			positionXRight: 0,
			positionYLeft: 0,
			positionYRight: 0,
			leftAngle: 0,
			rightAngle: 0,
			perspective: 1,
			eyeMotion: "none",
			bodyMotion: "none",
		};
		return {
			geometry: renderAvatar(poseFromExpression(fallbackExpr), fallbackPrimary, blink),
			colors: {
				body: definition.colors?.body ?? "#00F0FF",
				eyes: definition.colors?.eyes ?? "#0B0F19",
			},
		};
	}

	const expression = expressionFromDefinition(expressionKey, publicExpression);
	return renderAvatarExpression(definition, expression, publicExpression.colors, blink);
};
