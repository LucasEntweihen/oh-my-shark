/**
 * Procedural ASCII Deep-Ocean & Shark Aquarium simulation.
 * Generates a deterministic, unique marine habitat for every chat session and
 * empty tab, varying water depth tint, caustic sunbeams, seafloor flora,
 * shark species, colors, counts, and swimming behaviors.
 */

export type SharkSpecies = "hammerhead" | "greatWhite" | "mako" | "reef" | "pup";
export type SharkBehavior = "patrol" | "cruising" | "schooling" | "circling" | "deep-dive";

export interface OceanPalette {
	name: string;
	waterTop: string;
	waterMid: string;
	waterBottom: string;
	caustic: string;
	plankton: string;
	coral: string;
	kelp: string;
	bubble: string;
	fish: string;
	sharkBody: string[];
	sharkHighlight: string[];
	sharkEye: string;
}

export interface SharkEntity {
	id: number;
	species: SharkSpecies;
	behavior: SharkBehavior;
	/** Normalized horizontal position in columns (can travel slightly offscreen). */
	x: number;
	/** Normalized vertical position in fraction of viewport height (0.08..0.84). */
	yRatio: number;
	/** -1 facing left, 1 facing right */
	dir: 1 | -1;
	/** Depth parallax layer (0.28 far .. 1.0 near). */
	depth: number;
	/** Base horizontal swim speed in cells/sec. */
	speed: number;
	/** Individual vertical bob phase & frequency. */
	bobPhase: number;
	bobFreq: number;
	bobAmp: number;
	/** Preferred patrol lane vertical ratio. */
	homeY: number;
	/** Tail animation accumulator. */
	tailPhase: number;
	/** Primary dorsal hue & belly tint. */
	primaryColor: string;
	highlightColor: string;
	/** Cooldown (seconds) before shark can reverse direction again. */
	turnCooldown: number;
}

export interface BubbleParticle {
	xRatio: number;
	yRatio: number;
	speed: number;
	wobblePhase: number;
	glyph: string;
	opacity: number;
}

export interface FishParticle {
	xRatio: number;
	yRatio: number;
	dir: 1 | -1;
	speed: number;
	phase: number;
	color: string;
}

export interface KelpStalk {
	xRatio: number;
	height: number;
	phase: number;
	color: string;
	kind: "kelp" | "coral";
}

export interface SunRay {
	topXRatio: number;
	angleSlope: number;
	width: number;
	phase: number;
	intensity: number;
}

export interface PlanktonSpeck {
	xRatio: number;
	yRatio: number;
	drift: number;
	phase: number;
	glyph: string;
}

export interface OceanHabitat {
	seedKey: string;
	palette: OceanPalette;
	sharks: SharkEntity[];
	bubbles: BubbleParticle[];
	fish: FishParticle[];
	kelp: KelpStalk[];
	rays: SunRay[];
	plankton: PlanktonSpeck[];
	dominantBehavior: SharkBehavior;
}

export interface OceanThemeOverrides {
	waterTop?: string;
	waterBottom?: string;
	sharkTint?: string;
	accent?: string;
}

const ARCHETYPES: readonly OceanPalette[] = [
	{
		name: "Midnight Abyss",
		waterTop: "#092136",
		waterMid: "#061322",
		waterBottom: "#03070e",
		caustic: "#38bdf8",
		plankton: "#22d3ee",
		coral: "#1e4b6e",
		kelp: "#0f766e",
		bubble: "#7dd3fc",
		fish: "#67e8f9",
		sharkBody: ["#38bdf8", "#0284c7", "#64748b", "#0ea5e9"],
		sharkHighlight: ["#bae6fd", "#e0f2fe", "#7dd3fc"],
		sharkEye: "#fef08a",
	},
	{
		name: "Bioluminescent Trench",
		waterTop: "#08293a",
		waterMid: "#061626",
		waterBottom: "#030911",
		caustic: "#00e5ff",
		plankton: "#34d399",
		coral: "#2e1065",
		kelp: "#059669",
		bubble: "#a5f3fc",
		fish: "#5eead4",
		sharkBody: ["#00e5ff", "#2dd4bf", "#3b82f6", "#38bdf8"],
		sharkHighlight: ["#ccfbf1", "#cffafe", "#a7f3d0"],
		sharkEye: "#ff8a4c",
	},
	{
		name: "Pelagic Indigo",
		waterTop: "#131b3a",
		waterMid: "#0a1026",
		waterBottom: "#050712",
		caustic: "#818cf8",
		plankton: "#60a5fa",
		coral: "#312e81",
		kelp: "#0369a1",
		bubble: "#c7d2fe",
		fish: "#93c5fd",
		sharkBody: ["#60a5fa", "#818cf8", "#94a3b8", "#38bdf8"],
		sharkHighlight: ["#e0e7ff", "#dbeafe", "#bfdbfe"],
		sharkEye: "#fde047",
	},
	{
		name: "Emerald Kelp Forest",
		waterTop: "#072b29",
		waterMid: "#05191a",
		waterBottom: "#030c0e",
		caustic: "#2dd4bf",
		plankton: "#6ee7b7",
		coral: "#115e59",
		kelp: "#10b981",
		bubble: "#99f6e4",
		fish: "#a7f3d0",
		sharkBody: ["#2dd4bf", "#14b8a6", "#38bdf8", "#64748b"],
		sharkHighlight: ["#ccfbf1", "#d1fae5", "#bae6fd"],
		sharkEye: "#fbbf24",
	},
	{
		name: "Coral Twilight Reef",
		waterTop: "#1e1633",
		waterMid: "#110e24",
		waterBottom: "#070612",
		caustic: "#c084fc",
		plankton: "#f472b6",
		coral: "#7e22ce",
		kelp: "#0e7490",
		bubble: "#e9d5ff",
		fish: "#f9a8d4",
		sharkBody: ["#38bdf8", "#a855f7", "#c084fc", "#60a5fa"],
		sharkHighlight: ["#f3e8ff", "#e0f2fe", "#fbcfe8"],
		sharkEye: "#38bdf8",
	},
	{
		name: "Arctic Blue",
		waterTop: "#0c2538",
		waterMid: "#071826",
		waterBottom: "#040b13",
		caustic: "#7dd3fc",
		plankton: "#bae6fd",
		coral: "#1e3a5f",
		kelp: "#0284c7",
		bubble: "#e0f2fe",
		fish: "#bae6fd",
		sharkBody: ["#7dd3fc", "#93c5fd", "#cbd5e1", "#38bdf8"],
		sharkHighlight: ["#f0f9ff", "#e2e8f0", "#e0f2fe"],
		sharkEye: "#fb923c",
	},
];

interface SharkSprite {
	right: readonly string[];
	left: readonly string[];
	rightTailAlt: readonly string[];
	leftTailAlt: readonly string[];
}

const SHARK_SPRITES: Record<SharkSpecies, SharkSprite> = {
	hammerhead: {
		right: [
			"              /|              ",
			"             /%|              ",
			"|\\          /##|         __   ",
			"| \\________/###|________/o \\_ ",
			"\\   ======#####////######[|] )",
			"/  _______#####\\\\\\\\######____)",
			"| /        \\###|   \\_/        ",
			"|/          \\__|              ",
		],
		rightTailAlt: [
			"              /|              ",
			"             /%|              ",
			"/|          /##|         __   ",
			"\\ \\________/###|________/o \\_ ",
			" >  ======#####////######[|] )",
			"/  _______#####\\\\\\\\######____)",
			"| /        \\###|   \\_/        ",
			"\\|          \\__|              ",
		],
		left: [
			"              |\\              ",
			"              |%\\             ",
			"   __         |##\\          /|",
			" _/ o\\________|###\\________/ |",
			"( [|]######\\\\\\\\#####======   /",
			"(____######////#####_______  \\",
			"        \\_/   |###/        \\ |",
			"              |__/          \\|",
		],
		leftTailAlt: [
			"              |\\              ",
			"              |%\\             ",
			"   __         |##\\          |\\",
			" _/ o\\________|###\\________/ /",
			"( [|]######\\\\\\\\#####======  < ",
			"(____######////#####_______  \\",
			"        \\_/   |###/        \\ |",
			"              |__/          |/",
		],
	},
	greatWhite: {
		right: [
			"            /|             ",
			"           /#|             ",
			"|\\       _/##|____         ",
			"| \\_____/####////##====o_  ",
			" >  ====#####\\\\\\\\########_\\",
			"| /     \\####\\______/  V   ",
			"|/       \\___|             ",
		],
		rightTailAlt: [
			"            /|             ",
			"           /#|             ",
			"/|       _/##|____         ",
			"\\ \\_____/####////##====o_  ",
			" \\  ====#####\\\\\\\\########_\\",
			"/ /     \\####\\______/  V   ",
			"\\|       \\___|             ",
		],
		left: [
			"             |\\            ",
			"             |#\\           ",
			"         ____|##\\_       /|",
			"  _o====##\\\\\\\\####\\_____/ |",
			" /_########////====  <     ",
			"   V  \\______/####/     \\ |",
			"             |___/       \\|",
		],
		leftTailAlt: [
			"             |\\            ",
			"             |#\\           ",
			"         ____|##\\_       |\\",
			"  _o====##\\\\\\\\####\\_____/ /",
			" /_########////====  /     ",
			"   V  \\______/####/  \\ \\   ",
			"             |___/    |/   ",
		],
	},
	mako: {
		right: [
			"          /|         ",
			"|\\  _____/#|_____    ",
			" \\==#####///###o_>   ",
			"|/  -----\\##\\___/    ",
			"          \\|         ",
		],
		rightTailAlt: [
			"          /|         ",
			"/|  _____/#|_____    ",
			" >==#####///###o_>   ",
			"\\|  -----\\##\\___/    ",
			"          \\|         ",
		],
		left: [
			"         |\\          ",
			"    _____|#\\_____  /|",
			"   <_o###\\\\\\#####==/ ",
			"    \\___/##/-----  \\|",
			"         |/          ",
		],
		leftTailAlt: [
			"         |\\          ",
			"    _____|#\\_____  |\\",
			"   <_o###\\\\\\#####==< ",
			"    \\___/##/-----  |/",
			"         |/          ",
		],
	},
	reef: {
		right: ["       /|      ", "|\\____/#|___   ", " >===###/##o>  ", "|/    \\_|__/   "],
		rightTailAlt: ["       /|      ", "/|____/#|___   ", " \\===###/##o>  ", "\\|    \\_|__/   "],
		left: ["      |\\       ", "   ___|#\\____/|", "  <o##\\###===< ", "   \\__|_/    \\|"],
		leftTailAlt: ["      |\\       ", "   ___|#\\____|\\", "  <o##\\###===/ ", "   \\__|_/    |/"],
	},
	pup: {
		right: ["    /|  ", "><=#o>  ", "    \\|  "],
		rightTailAlt: ["    /|  ", "~<=#o>  ", "    \\|  "],
		left: ["  |\\    ", "  <o#=><", "  |/    "],
		leftTailAlt: ["  |\\    ", "  <o#=>~", "  |/    "],
	},
};

const BEHAVIORS: readonly SharkBehavior[] = ["patrol", "cruising", "schooling", "circling", "deep-dive"];
const BUBBLE_GLYPHS = ["o", "O", "°", "·"] as const;
const PLANKTON_GLYPHS = ["·", ".", ":", "+", "*", "~"] as const;

export function hashSeed(input: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export function createPrng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(rng: () => number, list: readonly T[]): T {
	return list[Math.floor(rng() * list.length) % list.length] as T;
}

export function createOceanHabitat(seedKey: string): OceanHabitat {
	const rng = createPrng(hashSeed(seedKey));
	const palette = pick(rng, ARCHETYPES);
	const dominantBehavior = pick(rng, BEHAVIORS);
	const sharkCount = 3 + Math.floor(rng() * 5); // 3 to 7 sharks per ocean

	// Ensure at least one iconic hammerhead or great white in every habitat
	const speciesPool: SharkSpecies[] = ["hammerhead", "greatWhite", "mako", "reef", "pup"];
	const sharks: SharkEntity[] = [];
	const sharedSchoolDir: 1 | -1 = rng() < 0.5 ? 1 : -1;

	for (let i = 0; i < sharkCount; i++) {
		const species: SharkSpecies = i === 0 ? (rng() < 0.65 ? "hammerhead" : "greatWhite") : pick(rng, speciesPool);
		const behavior: SharkBehavior =
			dominantBehavior === "schooling" && i < 4
				? "schooling"
				: rng() < 0.5
					? dominantBehavior
					: pick(rng, BEHAVIORS);
		const depth = 0.32 + (i / Math.max(1, sharkCount - 1)) * 0.68;
		const speedScale = species === "mako" ? 1.45 : species === "pup" ? 1.25 : species === "greatWhite" ? 0.85 : 1.0;
		const dir: 1 | -1 = behavior === "schooling" ? sharedSchoolDir : rng() < 0.5 ? 1 : -1;
		const homeY = 0.14 + rng() * 0.68;

		sharks.push({
			id: i,
			species,
			behavior,
			x: rng() * 110,
			yRatio: homeY,
			dir,
			depth,
			speed: (3.4 + rng() * 5.2) * speedScale * (0.55 + depth * 0.55),
			bobPhase: rng() * Math.PI * 2,
			bobFreq: 0.7 + rng() * 1.1,
			bobAmp: behavior === "deep-dive" ? 0.08 + rng() * 0.06 : 0.018 + rng() * 0.032,
			homeY,
			tailPhase: rng() * Math.PI * 2,
			primaryColor: pick(rng, palette.sharkBody),
			highlightColor: pick(rng, palette.sharkHighlight),
			turnCooldown: 0,
		});
	}

	// Sort far-to-near so closer sharks naturally overlap distant ones
	sharks.sort((a, b) => a.depth - b.depth);

	const bubbleCount = 16 + Math.floor(rng() * 14);
	const bubbles: BubbleParticle[] = Array.from({ length: bubbleCount }, () => ({
		xRatio: rng(),
		yRatio: rng(),
		speed: 0.035 + rng() * 0.065,
		wobblePhase: rng() * Math.PI * 2,
		glyph: pick(rng, BUBBLE_GLYPHS),
		opacity: 0.25 + rng() * 0.45,
	}));

	const fishCount = 6 + Math.floor(rng() * 10);
	const fish: FishParticle[] = Array.from({ length: fishCount }, () => ({
		xRatio: rng(),
		yRatio: 0.25 + rng() * 0.58,
		dir: rng() < 0.5 ? 1 : -1,
		speed: 0.04 + rng() * 0.07,
		phase: rng() * Math.PI * 2,
		color: palette.fish,
	}));

	const kelpCount = 10 + Math.floor(rng() * 10);
	const kelp: KelpStalk[] = Array.from({ length: kelpCount }, (_, idx) => ({
		xRatio: (idx + 0.2 + rng() * 0.6) / kelpCount,
		height: 3 + Math.floor(rng() * 6),
		phase: rng() * Math.PI * 2,
		color: rng() < 0.7 ? palette.kelp : palette.coral,
		kind: rng() < 0.68 ? "kelp" : "coral",
	}));

	const rayCount = 3 + Math.floor(rng() * 4);
	const rays: SunRay[] = Array.from({ length: rayCount }, () => ({
		topXRatio: 0.08 + rng() * 0.84,
		angleSlope: 0.14 + rng() * 0.18,
		width: 4 + Math.floor(rng() * 6),
		phase: rng() * Math.PI * 2,
		intensity: 0.08 + rng() * 0.12,
	}));

	const planktonCount = 36 + Math.floor(rng() * 28);
	const plankton: PlanktonSpeck[] = Array.from({ length: planktonCount }, () => ({
		xRatio: rng(),
		yRatio: 0.06 + rng() * 0.86,
		drift: (rng() - 0.35) * 0.018,
		phase: rng() * Math.PI * 2,
		glyph: pick(rng, PLANKTON_GLYPHS),
	}));

	return {
		seedKey,
		palette,
		sharks,
		bubbles,
		fish,
		kelp,
		rays,
		plankton,
		dominantBehavior,
	};
}

export function stepOceanHabitat(
	habitat: OceanHabitat,
	dtSeconds: number,
	elapsedSeconds: number,
	cols: number,
	pointer?: { xRatio: number; yRatio: number; active: boolean },
): void {
	const clampedDt = Math.min(Math.max(dtSeconds, 0), 0.12);
	const safeCols = Math.max(40, cols);

	for (const shark of habitat.sharks) {
		shark.turnCooldown = Math.max(0, shark.turnCooldown - clampedDt);
		let speedMult = 1;
		if (shark.behavior === "patrol") {
			speedMult = 1.1 + Math.sin(elapsedSeconds * 0.7 + shark.bobPhase) * 0.25;
		} else if (shark.behavior === "circling") {
			speedMult = 0.95;
		}

		// Gentle pointer curiosity / evasion
		let pointerDy = 0;
		if (pointer?.active) {
			const dxNorm = shark.x / safeCols - pointer.xRatio;
			const dyNorm = shark.yRatio - pointer.yRatio;
			const dist = Math.hypot(dxNorm, dyNorm);
			if (dist < 0.26) {
				speedMult *= 1.32;
				pointerDy = (dyNorm >= 0 ? 1 : -1) * (0.26 - dist) * 0.22;
			}
		}

		shark.x += shark.dir * shark.speed * speedMult * clampedDt;
		shark.tailPhase += clampedDt * shark.speed * speedMult * 0.85;

		const bobOffset = Math.sin(elapsedSeconds * shark.bobFreq + shark.bobPhase) * shark.bobAmp;
		const targetY = Math.min(0.84, Math.max(0.1, shark.homeY + bobOffset + pointerDy));
		shark.yRatio += (targetY - shark.yRatio) * Math.min(1, clampedDt * 2.2);

		const spriteWidth = SHARK_SPRITES[shark.species].right[0]?.length ?? 16;
		if (shark.behavior === "circling" && shark.turnCooldown <= 0) {
			if (shark.dir === 1 && shark.x > safeCols - spriteWidth - 4) {
				shark.dir = -1;
				shark.turnCooldown = 2.5;
			} else if (shark.dir === -1 && shark.x < 4) {
				shark.dir = 1;
				shark.turnCooldown = 2.5;
			}
		} else {
			if (shark.dir === 1 && shark.x > safeCols + 6) {
				shark.x = -spriteWidth - 4;
			} else if (shark.dir === -1 && shark.x < -spriteWidth - 6) {
				shark.x = safeCols + 4;
			}
		}
	}

	for (const bubble of habitat.bubbles) {
		bubble.yRatio -= bubble.speed * clampedDt;
		bubble.xRatio += Math.sin(elapsedSeconds * 2.1 + bubble.wobblePhase) * 0.004 * clampedDt * 12;
		if (bubble.yRatio < -0.04) {
			bubble.yRatio = 0.98;
			bubble.xRatio = (bubble.xRatio + 0.17) % 1;
		}
	}

	for (const speck of habitat.plankton) {
		speck.xRatio += speck.drift * clampedDt;
		if (speck.xRatio > 1.02) speck.xRatio = -0.02;
		if (speck.xRatio < -0.02) speck.xRatio = 1.02;
	}

	for (const f of habitat.fish) {
		f.xRatio += f.dir * f.speed * clampedDt;
		if (f.dir === 1 && f.xRatio > 1.06) f.xRatio = -0.06;
		if (f.dir === -1 && f.xRatio < -0.06) f.xRatio = 1.06;
	}
}

export function renderOceanToCanvas(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	habitat: OceanHabitat,
	elapsedSeconds: number,
	overrides?: OceanThemeOverrides,
): void {
	if (width <= 0 || height <= 0) return;
	const { palette } = habitat;
	const topColor = overrides?.waterTop || palette.waterTop;
	const bottomColor = overrides?.waterBottom || palette.waterBottom;
	const causticColor = overrides?.accent || palette.caustic;

	// 1. Deep underwater gradient background
	const grad = ctx.createLinearGradient(0, 0, 0, height);
	grad.addColorStop(0, topColor);
	grad.addColorStop(0.45, palette.waterMid);
	grad.addColorStop(1, bottomColor);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	const cellW = 7.8;
	const cellH = 14.5;
	const cols = Math.max(24, Math.floor(width / cellW));
	const rows = Math.max(12, Math.floor(height / cellH));

	ctx.textBaseline = "top";

	// 2. Volumetric ASCII light rays descending from surface
	ctx.font = "12px 'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
	for (const ray of habitat.rays) {
		const pulse = 0.55 + 0.45 * Math.sin(elapsedSeconds * 0.45 + ray.phase);
		ctx.fillStyle = causticColor;
		const rayRows = Math.floor(rows * 0.72);
		for (let r = 0; r < rayRows; r++) {
			const fade = (1 - r / rayRows) * ray.intensity * pulse;
			if (fade < 0.02) continue;
			ctx.globalAlpha = fade;
			const baseCol = Math.floor(ray.topXRatio * cols + r * ray.angleSlope);
			for (let w = 0; w < ray.width; w += 2) {
				const c = baseCol + w;
				if (c < 0 || c >= cols) continue;
				const ch = (r + w) % 3 === 0 ? "\\" : (r + w) % 3 === 1 ? ":" : ".";
				ctx.fillText(ch, c * cellW, r * cellH);
			}
		}
	}

	// 3. Drifting halftone water dots & plankton snow
	ctx.fillStyle = overrides?.accent || palette.plankton;
	for (const speck of habitat.plankton) {
		const twinkle = 0.16 + 0.24 * (0.5 + 0.5 * Math.sin(elapsedSeconds * 1.4 + speck.phase));
		ctx.globalAlpha = twinkle;
		ctx.fillText(speck.glyph, speck.xRatio * width, speck.yRatio * height);
	}

	// 4. Seafloor sand ripples & swaying kelp / coral silhouettes
	ctx.globalAlpha = 0.34;
	ctx.fillStyle = palette.coral;
	const floorY = height - cellH * 1.15;
	let sandLine = "";
	for (let c = 0; c < cols; c++) {
		const wave = Math.sin(c * 0.22 + elapsedSeconds * 0.35);
		sandLine += wave > 0.3 ? "~" : wave < -0.3 ? "_" : ".";
	}
	ctx.fillText(sandLine, 0, floorY);

	for (const stalk of habitat.kelp) {
		ctx.fillStyle = stalk.color;
		ctx.globalAlpha = stalk.kind === "kelp" ? 0.46 : 0.4;
		const baseX = stalk.xRatio * width;
		for (let h = 1; h <= stalk.height; h++) {
			const sway = Math.sin(elapsedSeconds * 1.1 + stalk.phase + h * 0.55) * (h * 0.9);
			const ch =
				stalk.kind === "coral"
					? h === stalk.height
						? "Y"
						: h % 2 === 0
							? "{}"
							: "||"
					: (h + Math.floor(elapsedSeconds + stalk.phase)) % 2 === 0
						? "("
						: ")";
			ctx.fillText(ch, baseX + sway, floorY - h * cellH * 0.9);
		}
	}

	// 5. Baitfish schools
	for (const f of habitat.fish) {
		ctx.fillStyle = f.color;
		ctx.globalAlpha = 0.48;
		const fy = f.yRatio * height + Math.sin(elapsedSeconds * 2.5 + f.phase) * 4;
		ctx.fillText(f.dir === 1 ? "><>" : "<><", f.xRatio * width, fy);
	}

	// 6. Rising bubble columns
	ctx.fillStyle = palette.bubble;
	for (const b of habitat.bubbles) {
		ctx.globalAlpha = b.opacity;
		ctx.fillText(b.glyph, b.xRatio * width, b.yRatio * height);
	}

	// 7. Multi-species ASCII sharks (layered back-to-front by depth)
	for (const shark of habitat.sharks) {
		const scale = 0.72 + shark.depth * 0.46;
		const cw = cellW * scale;
		const ch = cellH * scale;
		const fontSize = Math.round(12 * scale);
		ctx.font = `600 ${fontSize}px 'JetBrains Mono', 'Cascadia Code', Consolas, monospace`;

		const sprite = SHARK_SPRITES[shark.species];
		const useAlt = Math.sin(shark.tailPhase) > 0;
		const rowsArt =
			shark.dir === 1 ? (useAlt ? sprite.rightTailAlt : sprite.right) : useAlt ? sprite.leftTailAlt : sprite.left;

		const originX = shark.x * cellW;
		const originY = shark.yRatio * height - (rowsArt.length * ch) / 2;
		const bodyColor = overrides?.sharkTint || shark.primaryColor;
		const hiColor = overrides?.accent || shark.highlightColor;
		const sharkAlpha = 0.42 + shark.depth * 0.52;

		for (let r = 0; r < rowsArt.length; r++) {
			const line = rowsArt[r] ?? "";
			const py = originY + r * ch;
			for (let c = 0; c < line.length; c++) {
				const char = line[c];
				if (!char || char === " ") continue;
				const px = originX + c * cw;
				if (px < -cw * 2 || px > width + cw * 2) continue;

				if (char === "o") {
					ctx.fillStyle = palette.sharkEye;
					ctx.globalAlpha = Math.min(1, sharkAlpha + 0.15);
				} else if (char === "#" || char === "@" || char === "[" || char === "]" || char === "%") {
					ctx.fillStyle = hiColor;
					ctx.globalAlpha = sharkAlpha * 0.95;
				} else if (char === "=" || char === "/" || char === "\\" || char === "|" || char === ">") {
					ctx.fillStyle = bodyColor;
					ctx.globalAlpha = sharkAlpha;
				} else {
					ctx.fillStyle = bodyColor;
					ctx.globalAlpha = sharkAlpha * 0.78;
				}
				ctx.fillText(char, px, py);
			}
		}
	}

	ctx.globalAlpha = 1;
}
