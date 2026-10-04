import { surfacePresets } from "./surfaces";
import type { SurfaceConfig, SurfaceType } from "./types";

export type BodyVector = readonly [number, number, number];

export interface BodyNode {
	id: string;
	name: string;
	surface: SurfaceConfig;
	position: BodyVector;
	rotation: BodyVector;
}

export interface AvatarBody {
	primary: SurfaceConfig;
	nodes: BodyNode[];
}

export const bodyPrimitiveTypes = ["sphere", "cube", "capsule", "cylinder", "cone", "diamond"] as const;

export const MAX_BODY_NODES = 16;

const allSurfaceTypes = Object.keys(surfacePresets) as SurfaceType[];
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isVector = (value: unknown): value is BodyVector =>
	Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);

export const parseSurfaceConfig = (value: unknown, fallback: SurfaceConfig): SurfaceConfig => {
	if (!value || typeof value !== "object") return { ...fallback };
	const candidate = value as Partial<SurfaceConfig>;
	const type = candidate.type && allSurfaceTypes.includes(candidate.type) ? candidate.type : fallback.type;
	const preset = surfacePresets[type];
	const numericFields = ["width", "height", "depth", "roundness"] as const;
	if (numericFields.some(field => !isFiniteNumber(candidate[field]))) return { ...fallback };
	if (candidate.morphRoundness !== undefined && !isFiniteNumber(candidate.morphRoundness)) return { ...fallback };
	if (candidate.tipRoundness !== undefined && !isFiniteNumber(candidate.tipRoundness)) return { ...fallback };
	if (candidate.baseRoundness !== undefined && !isFiniteNumber(candidate.baseRoundness)) return { ...fallback };
	return { ...preset, ...candidate, type };
};

export const parseAvatarBody = (value: unknown, fallbackPrimary: SurfaceConfig): AvatarBody => {
	if (!value || typeof value !== "object") return { primary: fallbackPrimary, nodes: [] };
	const candidate = value as Partial<AvatarBody>;
	const primary = parseSurfaceConfig(candidate.primary, fallbackPrimary);
	const seenIds = new Set<string>();
	const nodes = Array.isArray(candidate.nodes)
		? candidate.nodes
				.filter((node): node is BodyNode => {
					if (!node || typeof node !== "object") return false;
					const surface = (node as BodyNode).surface;
					const id = (node as BodyNode).id;
					if (id === "primary" || seenIds.has(id)) return false;
					const valid = Boolean(
						typeof (node as BodyNode).id === "string" &&
						id &&
						typeof (node as BodyNode).name === "string" &&
						surface &&
						bodyPrimitiveTypes.includes(surface.type as (typeof bodyPrimitiveTypes)[number]) &&
						isFiniteNumber(surface.width) &&
						isFiniteNumber(surface.height) &&
						isFiniteNumber(surface.depth) &&
						isFiniteNumber(surface.roundness) &&
						isVector((node as BodyNode).position) &&
						isVector((node as BodyNode).rotation),
					);
					if (valid) seenIds.add(id);
					return valid;
				})
				.slice(0, MAX_BODY_NODES)
				.map(node => ({
					id: node.id,
					name: node.name,
					surface: parseSurfaceConfig(node.surface, surfacePresets.sphere),
					position: [...node.position] as unknown as BodyVector,
					rotation: [...node.rotation] as unknown as BodyVector,
				}))
		: [];
	return { primary, nodes };
};
