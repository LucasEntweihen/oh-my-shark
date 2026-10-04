export type HexColor = `#${string}`;

export type Point3 = readonly [number, number, number];
export type Quaternion = readonly [number, number, number, number];

export type SurfaceType = "sphere" | "mickey" | "cursor" | "cube" | "capsule" | "cylinder" | "cone" | "diamond";
export interface SurfaceConfig {
	type: SurfaceType;
	width: number;
	height: number;
	depth: number;
	roundness: number;
	morphRoundness?: number;
	tipRoundness?: number;
	baseRoundness?: number;
}

export type EyeMotion = "none" | "microSaccades" | "shake";
export type BodyMotion = "none" | "slowDrift" | "shake";

export interface AvatarEyeDefinition {
	width: number;
	height: number;
	x: number;
	y: number;
	angle: number;
}

export interface AvatarExpressionDefinition {
	head: { x: number; y: number; z: number };
	eyes: {
		left: AvatarEyeDefinition;
		right: AvatarEyeDefinition;
		spacing: number;
	};
	perspective: number;
	motion: {
		eyes: EyeMotion;
		body: BodyMotion;
	};
	colors?: {
		body?: HexColor;
		eyes?: HexColor;
	};
}

export interface AvatarAnimationStepDefinition {
	expression: string;
	holdMs: number;
	transitionMs: number;
	transition: "spring" | "smooth" | "snappy";
}

export interface AvatarAnimationDefinition {
	playbackMode: "loop" | "once" | "pingPong";
	steps: AvatarAnimationStepDefinition[];
	blink: {
		enabled: boolean;
		initialDelayMs: number;
		minIntervalMs: number;
		maxIntervalMs: number;
		durationMs: number;
	};
	metadata?: {
		label?: string;
		description?: string;
		group?: string;
	};
}

export interface AvatarColorsDefinition {
	body: HexColor;
	eyes: HexColor;
	accent?: HexColor;
	glow?: HexColor;
}

export interface AvatarBodyNodeDefinition {
	surface: SurfaceConfig;
	position: [number, number, number];
	rotation: [number, number, number];
}

export interface AvatarBodyDefinition {
	primary: SurfaceConfig;
	nodes: AvatarBodyNodeDefinition[];
}

export type AvatarStyleType =
	| "futuristic"
	| "academic"
	| "corporate"
	| "cyber"
	| "scholar"
	| "casual"
	| "minimalist"
	| "tactical"
	| "scientific";

export type AvatarClothingType =
	| "coat"
	| "suit"
	| "robe"
	| "armor"
	| "tunic"
	| "hoodie"
	| "vest"
	| "minimal"
	| "lab_coat";

export type AvatarAccessoryType =
	| "hud_visor"
	| "glasses"
	| "halo"
	| "cape"
	| "badge"
	| "audio_rig"
	| "wrist_gauntlet"
	| "none";

export type AvatarPostureType = "upright" | "confident" | "scholarly" | "tactical" | "relaxed" | "observant";

export type AvatarArmsPosition = "folded" | "neutral" | "gesturing" | "ready" | "hands_joined";

export type AvatarStanceType = "solid" | "relaxed" | "floating" | "hovering";

export type AvatarEyebrowsType = "neutral" | "focused" | "raised" | "determined" | "serene";

export type AvatarRenderMode = "vector" | "dots" | "pixel";
export type AvatarRootModelKind = "basic" | "dots" | "grok" | "strobi";

export interface AvatarFullBodyDefinition {
	bodiless?: boolean;
	rootModel?: AvatarRootModelKind;
	clothing?: AvatarClothingType;
	clothingColor?: HexColor;
	accentColor?: HexColor;
	accessories?: AvatarAccessoryType[];
	posture?: AvatarPostureType;
	style?: AvatarStyleType;
	limbs?: {
		armsPosition?: AvatarArmsPosition;
		stance?: AvatarStanceType;
	};
	hair?: {
		style?: "short" | "flowing" | "spiky" | "halo" | "none";
		color?: HexColor;
	};
	faceDetails?: {
		eyebrows?: AvatarEyebrowsType;
		mouth?: "neutral" | "subtle_smile" | "talking" | "firm";
	};
	interpretedMood?: string;
}

/** Canonical Bible Strong Avatar schema (compatible with bible-strong/avatar-definition schema v1) */
export interface AvatarDefinition {
	schema: "bible-strong/avatar-definition";
	schemaVersion: 1;
	name?: string;
	body: AvatarBodyDefinition;
	colors: AvatarColorsDefinition;
	expressions: Record<string, AvatarExpressionDefinition>;
	expressionOrder: string[];
	animations: Record<string, AvatarAnimationDefinition>;
	animationOrder: string[];
	renderStyle?: AvatarRenderStyle;
	rootModel?: AvatarRootModelKind;
	fullBody?: AvatarFullBodyDefinition;
}

export interface AgentModelConfig {
	model: string;
	provider?: string;
	thinkingLevel?: "off" | "low" | "medium" | "high";
	temperature?: number;
}

export interface AgentFallbackConfig {
	models: string[];
	strategy: "next-provider" | "downgrade-effort" | "fallback-model";
}

export interface AgentStructureConfig {
	role: string;
	category: "orchestrator" | "specialist" | "critic" | "reviewer" | "scholar" | "executor";
	delegatesTo?: string[];
	calledBy?: string[];
	outputFormat?: "markdown" | "json" | "code" | "patch" | "prose";
}

/** Complete Agent Profile configured in /agent-sandbox */
export interface AgentProfile {
	id: string;
	name: string;
	title: string;
	description: string;
	systemPrompt: string;
	personality: {
		tone: string;
		traits: string[];
		style: string;
		catchphrase?: string;
		behaviorRules: string[];
	};
	functions: string[];
	models: {
		primary: AgentModelConfig;
		reasoning?: AgentModelConfig;
	};
	fallbacks: AgentFallbackConfig;
	structure: AgentStructureConfig;
	avatar: AvatarDefinition;
	createdAt: string;
	updatedAt: string;
}

export interface AvatarGeometry {
	headPath: string;
	leftPath: string;
	rightPath: string;
	leftVisible: boolean;
	rightVisible: boolean;
	frontPaths: string[];
	backPaths: string[];
	backNodeIds?: (string | null)[];
	frontNodeIds?: (string | null)[];
	wirePaths?: string[];
}

export interface Expression {
	id: string;
	semanticKey?: string;
	headX: number;
	headY: number;
	headZ: number;
	widthLeft: number;
	widthRight: number;
	heightLeft: number;
	heightRight: number;
	spacing: number;
	positionXLeft: number;
	positionXRight: number;
	positionYLeft: number;
	positionYRight: number;
	leftAngle: number;
	rightAngle: number;
	perspective: number;
	eyeMotion: EyeMotion;
	bodyMotion: BodyMotion;
	bodyColor?: string;
	eyeColor?: string;
}

export interface AvatarPose {
	expression: Expression;
	orientation: Quaternion;
}

export interface RenderAvatarOptions {
	includeWire?: boolean;
	eyeOffset?: Readonly<{ x: number; y: number }>;
}

export type PixelRenderStyle = {
	type: "pixel";
	resolution: number;
};

export type AvatarRenderStyle = { type: "vector" } | { type: "dots" } | PixelRenderStyle;

export interface GrokDotRing {
	points: [number, number][];
	center: [number, number];
	radius: number;
}

export interface AvatarScene {
	geometry: AvatarGeometry;
	colors: {
		body: string;
		eyes: string;
		accent?: string;
		glow?: string;
	};
}

export interface AvatarPlaybackState {
	activeAnimation?: string;
	activeExpression: string;
	status: "playing" | "paused" | "stopped";
	stepIndex: number;
	direction: 1 | -1;
	phase: "transition" | "hold";
	phaseStartedAt: number;
	transitionFrom: string;
	blinkDueAt?: number;
	blinkStartedAt?: number;
}
