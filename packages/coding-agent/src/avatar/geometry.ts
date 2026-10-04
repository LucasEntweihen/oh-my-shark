import { surfaceFrontSampleAt, surfacePointAt } from "./surfaces";
import type {
	AvatarExpressionDefinition,
	AvatarGeometry,
	AvatarPose,
	Expression,
	Point3,
	Quaternion,
	RenderAvatarOptions,
	SurfaceConfig,
} from "./types";

export const RADIUS = 120;
const FOCAL_LENGTH = 620;
const QUARTER_ARC_SAMPLES = 14;
const HEAD_LATITUDE_SAMPLES = 25;
const HEAD_LONGITUDE_SAMPLES = 73;
const MAX_SURFACE_CACHE_ENTRIES = 24;

const headSamplesCache = new Map<string, Point3[]>();

export function radians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export const normalizeQuaternion = ([w, x, y, z]: Quaternion): Quaternion => {
	const length = Math.hypot(w, x, y, z) || 1;
	return [w / length, x / length, y / length, z / length];
};

export const multiplyQuaternions = ([aw, ax, ay, az]: Quaternion, [bw, bx, by, bz]: Quaternion): Quaternion =>
	normalizeQuaternion([
		aw * bw - ax * bx - ay * by - az * bz,
		aw * bx + ax * bw + ay * bz - az * by,
		aw * by - ax * bz + ay * bw + az * bx,
		aw * bz + ax * by - ay * bx + az * bw,
	]);

export const quaternionFromAxisAngle = ([x, y, z]: Point3, angle: number): Quaternion => {
	const halfAngle = angle / 2;
	const sine = Math.sin(halfAngle);
	return normalizeQuaternion([Math.cos(halfAngle), x * sine, y * sine, z * sine]);
};

export function quaternionFromEuler(pitchDegrees: number, yawDegrees: number, rollDegrees: number): Quaternion {
	const x = radians(pitchDegrees);
	const y = radians(yawDegrees);
	const z = radians(rollDegrees);
	const xRotation = quaternionFromAxisAngle([1, 0, 0], x);
	const yRotation = quaternionFromAxisAngle([0, 1, 0], y);
	const zRotation = quaternionFromAxisAngle([0, 0, 1], z);
	return multiplyQuaternions(multiplyQuaternions(zRotation, xRotation), yRotation);
}

export const quaternionFromVectors = (from: Point3, to: Point3): Quaternion => {
	const dot = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
	const cross: Point3 = [
		from[1] * to[2] - from[2] * to[1],
		from[2] * to[0] - from[0] * to[2],
		from[0] * to[1] - from[1] * to[0],
	];
	return normalizeQuaternion([1 + dot, cross[0], cross[1], cross[2]]);
};

export const quaternionToEuler = ([w, x, y, z]: Quaternion): Point3 => {
	const matrix00 = 1 - 2 * (y * y + z * z);
	const matrix01 = 2 * (x * y - z * w);
	const matrix10 = 2 * (x * y + z * w);
	const matrix11 = 1 - 2 * (x * x + z * z);
	const matrix20 = 2 * (x * z - y * w);
	const matrix21 = 2 * (y * z + x * w);
	const matrix22 = 1 - 2 * (x * x + y * y);
	const headX = Math.asin(clamp(matrix21, -1, 1));
	if (Math.abs(Math.cos(headX)) < 0.00001) return [headX, 0, Math.atan2(matrix10, matrix00)];
	return [headX, Math.atan2(-matrix20, matrix22), Math.atan2(-matrix01, matrix11)];
};

export const rotateWithQuaternion = ([w, x, y, z]: Quaternion, [px, py, pz]: Point3): Point3 => {
	const tx = 2 * (y * pz - z * py);
	const ty = 2 * (z * px - x * pz);
	const tz = 2 * (x * py - y * px);
	return [px + w * tx + (y * tz - z * ty), py + w * ty + (z * tx - x * tz), pz + w * tz + (x * ty - y * tx)];
};

export const slerpQuaternion = (start: Quaternion, end: Quaternion, progress: number): Quaternion => {
	let target = end;
	let dot = start.reduce((total, value, index) => total + value * target[index]!, 0);
	if (dot < 0) {
		target = target.map(value => -value) as unknown as Quaternion;
		dot = -dot;
	}
	if (dot > 0.9995) {
		return normalizeQuaternion(
			start.map((value, index) => value + (target[index]! - value) * progress) as unknown as Quaternion,
		);
	}
	const angle = Math.acos(clamp(dot, -1, 1));
	const sine = Math.sin(angle);
	const startWeight = Math.sin((1 - progress) * angle) / sine;
	const targetWeight = Math.sin(progress * angle) / sine;
	return normalizeQuaternion(
		start.map((value, index) => value * startWeight + target[index]! * targetWeight) as unknown as Quaternion,
	);
};

export function project(point: Point3, perspective = 1): Point3 {
	const denominator = FOCAL_LENGTH - point[2] * perspective;
	const scale = Math.abs(denominator) < 0.0001 ? FOCAL_LENGTH / 0.0001 : FOCAL_LENGTH / denominator;
	return [point[0] * scale, point[1] * scale, point[2]];
}

export const axisVector = (axis: "x" | "y" | "z"): Point3 =>
	axis === "x" ? [1, 0, 0] : axis === "y" ? [0, 1, 0] : [0, 0, 1];

export const poseFromExpression = (expression: Expression): AvatarPose => ({
	expression,
	orientation: quaternionFromEuler(expression.headX, expression.headY, expression.headZ),
});

const roundedRectangle = (width: number, height: number): (readonly [number, number])[] => {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const cornerRadius = Math.min(halfHeight, halfWidth);
	const points: (readonly [number, number])[] = [];

	const addLine = (start: readonly [number, number], end: readonly [number, number]) => {
		const samples = Math.max(2, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 1.5));
		for (let index = 0; index < samples; index += 1) {
			const progress = index / samples;
			points.push([start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress]);
		}
	};

	const addArc = (centerX: number, centerY: number, startAngle: number) => {
		for (let index = 0; index < QUARTER_ARC_SAMPLES; index += 1) {
			const angle = startAngle + (index / QUARTER_ARC_SAMPLES) * (Math.PI / 2);
			points.push([centerX + Math.cos(angle) * cornerRadius, centerY + Math.sin(angle) * cornerRadius]);
		}
	};

	addLine([-halfWidth + cornerRadius, -halfHeight], [halfWidth - cornerRadius, -halfHeight]);
	addArc(halfWidth - cornerRadius, -halfHeight + cornerRadius, -Math.PI / 2);
	addLine([halfWidth, -halfHeight + cornerRadius], [halfWidth, halfHeight - cornerRadius]);
	addArc(halfWidth - cornerRadius, halfHeight - cornerRadius, 0);
	addLine([halfWidth - cornerRadius, halfHeight], [-halfWidth + cornerRadius, halfHeight]);
	addArc(-halfWidth + cornerRadius, halfHeight - cornerRadius, Math.PI / 2);
	addLine([-halfWidth, halfHeight - cornerRadius], [-halfWidth, -halfHeight + cornerRadius]);
	addArc(-halfWidth + cornerRadius, -halfHeight + cornerRadius, Math.PI);
	return points;
};

export const pathToSvg = (points: Point3[], close = true): string => {
	if (!points.length) return "";
	return `M${points[0]![0].toFixed(2)} ${points[0]![1].toFixed(2)}${points
		.slice(1)
		.map(pt => `L${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`)
		.join("")}${close ? "Z" : ""}`;
};

export const convexHull = (points: Point3[]): Point3[] => {
	if (points.length <= 3) return points;
	const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cross = (o: Point3, a: Point3, b: Point3): number =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const lower: Point3[] = [];
	for (const p of sorted) {
		while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
			lower.pop();
		}
		lower.push(p);
	}
	const upper: Point3[] = [];
	for (let i = sorted.length - 1; i >= 0; i--) {
		const p = sorted[i]!;
		while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
			upper.pop();
		}
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return [...lower, ...upper];
};

export const smoothClosedPath = (points: Point3[]): string => {
	if (points.length < 3) return pathToSvg(points);
	const n = points.length;
	let d = `M${points[0]![0].toFixed(2)} ${points[0]![1].toFixed(2)}`;
	for (let i = 0; i < n; i++) {
		const curr = points[i]!;
		const prev = points[(i - 1 + n) % n]!;
		const next = points[(i + 1) % n]!;
		const next2 = points[(i + 2) % n]!;
		const cp1x = curr[0] + (next[0] - prev[0]) / 6;
		const cp1y = curr[1] + (next[1] - prev[1]) / 6;
		const cp2x = next[0] - (next2[0] - curr[0]) / 6;
		const cp2y = next[1] - (next2[1] - curr[1]) / 6;
		d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
	}
	return `${d}Z`;
};

type ProjectedSurfacePoint = { point: Point3; normal: Point3 };
type LocalSurfacePoint = ProjectedSurfacePoint;

const surfaceCacheKey = (surface: SurfaceConfig): string =>
	JSON.stringify([
		surface.type,
		surface.width,
		surface.height,
		surface.depth,
		surface.roundness,
		surface.morphRoundness,
		surface.tipRoundness,
		surface.baseRoundness,
	]);

const cacheSurfaceValue = <Value>(cache: Map<string, Value>, key: string, value: Value): Value => {
	if (cache.size >= MAX_SURFACE_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
	cache.set(key, value);
	return value;
};

const canonicalFaceCoordinates = (x: number, y: number): readonly [number, number] => {
	const longitude = x / RADIUS;
	const latitude = y / RADIUS;
	return [RADIUS * Math.cos(latitude) * Math.sin(longitude), RADIUS * Math.sin(latitude)];
};

const projectLocalSurfacePoint = (pose: AvatarPose, sample: LocalSurfacePoint): ProjectedSurfacePoint => ({
	point: project(rotateWithQuaternion(pose.orientation, sample.point), pose.expression.perspective),
	normal: rotateWithQuaternion(pose.orientation, sample.normal),
});

const projectFacePoint = (pose: AvatarPose, surface: SurfaceConfig, x: number, y: number): ProjectedSurfacePoint => {
	const [faceX, faceY] = canonicalFaceCoordinates(x, y);
	return projectLocalSurfacePoint(pose, surfaceFrontSampleAt(surface, faceX, faceY));
};

const eyePoints = (
	pose: AvatarPose,
	surface: SurfaceConfig,
	side: -1 | 1,
	blink: number,
	offset: Readonly<{ x: number; y: number }> = { x: 0, y: 0 },
): ProjectedSurfacePoint[] => {
	const expr = pose.expression;
	const suffix = side < 0 ? "Left" : "Right";
	const width = expr[`width${suffix}`];
	const restingHeight = expr[`height${suffix}`];
	const height = 5 + (restingHeight - 5) * blink;
	const centerX = (side * expr.spacing) / 2 + expr[`positionX${suffix}`] + offset.x;
	const centerY = expr[`positionY${suffix}`] + offset.y;
	const angle = radians(side < 0 ? expr.leftAngle : expr.rightAngle);

	return roundedRectangle(width, height).map(([localX, localY]) => {
		const rotatedX = localX * Math.cos(angle) - localY * Math.sin(angle);
		const rotatedY = localX * Math.sin(angle) + localY * Math.cos(angle);
		return projectFacePoint(pose, surface, centerX + rotatedX, centerY + rotatedY);
	});
};

type ProjectedEllipse = {
	centerX: number;
	centerY: number;
	majorRadius: number;
	minorRadius: number;
	rotation: number;
};

const ellipseProjection = (
	centerX: number,
	centerY: number,
	covarianceXX: number,
	covarianceXY: number,
	covarianceYY: number,
): ProjectedEllipse | null => {
	const trace = covarianceXX + covarianceYY;
	const difference = Math.hypot(covarianceXX - covarianceYY, covarianceXY * 2);
	const majorSquared = (trace + difference) / 2;
	const minorSquared = (trace - difference) / 2;
	if (majorSquared <= 0 || minorSquared <= 0) return null;

	return {
		centerX,
		centerY,
		majorRadius: Math.sqrt(majorSquared),
		minorRadius: Math.sqrt(minorSquared),
		rotation: Math.atan2(covarianceXY * 2, covarianceXX - covarianceYY) / 2,
	};
};

const ellipsePath = ({ centerX, centerY, majorRadius, minorRadius, rotation }: ProjectedEllipse): string => {
	const rotationDegrees = (rotation * 180) / Math.PI;
	const offsetX = Math.cos(rotation) * majorRadius;
	const offsetY = Math.sin(rotation) * majorRadius;
	const startX = centerX + offsetX;
	const startY = centerY + offsetY;
	const endX = centerX - offsetX;
	const endY = centerY - offsetY;

	return `M${startX.toFixed(2)} ${startY.toFixed(2)}A${majorRadius.toFixed(2)} ${minorRadius.toFixed(2)} ${rotationDegrees.toFixed(2)} 0 1 ${endX.toFixed(2)} ${endY.toFixed(2)}A${majorRadius.toFixed(2)} ${minorRadius.toFixed(2)} ${rotationDegrees.toFixed(2)} 0 1 ${startX.toFixed(2)} ${startY.toFixed(2)}Z`;
};

const projectedEllipsoid = (
	pose: AvatarPose,
	axes: Point3,
	localCenter: Point3 = [0, 0, 0],
): ProjectedEllipse | null => {
	const rotatedAxes = [
		rotateWithQuaternion(pose.orientation, [1, 0, 0]),
		rotateWithQuaternion(pose.orientation, [0, 1, 0]),
		rotateWithQuaternion(pose.orientation, [0, 0, 1]),
	];
	const center = rotateWithQuaternion(pose.orientation, localCenter);

	const covarianceXX = rotatedAxes.reduce(
		(total, axis, index) => total + axis[0] * axis[0] * axes[index]! * axes[index]!,
		0,
	);
	const covarianceXY = rotatedAxes.reduce(
		(total, axis, index) => total + axis[0] * axis[1] * axes[index]! * axes[index]!,
		0,
	);
	const covarianceYY = rotatedAxes.reduce(
		(total, axis, index) => total + axis[1] * axis[1] * axes[index]! * axes[index]!,
		0,
	);

	const projectedCenter = project(center, pose.expression.perspective);
	return ellipseProjection(projectedCenter[0], projectedCenter[1], covarianceXX, covarianceXY, covarianceYY);
};

const headPath = (pose: AvatarPose, surface: SurfaceConfig): string => {
	if (surface.type === "sphere" || surface.type === "mickey") {
		const ellipse = projectedEllipsoid(pose, [surface.width / 2, surface.height / 2, surface.depth / 2]);
		if (ellipse) return ellipsePath(ellipse);
	}

	const key = surfaceCacheKey(surface);
	let localSamples = headSamplesCache.get(key);
	if (!localSamples) {
		localSamples = Array.from({ length: HEAD_LATITUDE_SAMPLES }, (_, latitudeIndex) => {
			const latitude = -Math.PI / 2 + (latitudeIndex / (HEAD_LATITUDE_SAMPLES - 1)) * Math.PI;
			return Array.from({ length: HEAD_LONGITUDE_SAMPLES }, (_, longitudeIndex) => {
				const longitude = -Math.PI + (longitudeIndex / (HEAD_LONGITUDE_SAMPLES - 1)) * Math.PI * 2;
				return surfacePointAt(surface, longitude, latitude);
			});
		}).flat();
		cacheSurfaceValue(headSamplesCache, key, localSamples);
	}

	const projectedSamples = localSamples.map(sample =>
		project(rotateWithQuaternion(pose.orientation, sample), pose.expression.perspective),
	);
	return smoothClosedPath(convexHull(projectedSamples));
};

export const renderAvatar = (
	pose: AvatarPose,
	surface: SurfaceConfig,
	blink = 1,
	options: RenderAvatarOptions = {},
): AvatarGeometry => {
	const leftSamples = eyePoints(pose, surface, -1, blink, options.eyeOffset);
	const rightSamples = eyePoints(pose, surface, 1, blink, options.eyeOffset);
	const left = leftSamples.map(sample => sample.point);
	const right = rightSamples.map(sample => sample.point);

	return {
		backPaths: [],
		frontPaths: [],
		headPath: headPath(pose, surface),
		leftPath: smoothClosedPath(left),
		rightPath: smoothClosedPath(right),
		leftVisible: leftSamples.reduce((total, sample) => total + sample.normal[2], 0) > 0,
		rightVisible: rightSamples.reduce((total, sample) => total + sample.normal[2], 0) > 0,
		wirePaths: [],
	};
};

export function renderAvatarPose(
	surface: SurfaceConfig,
	expressionDef: AvatarExpressionDefinition,
	blink = 1,
): AvatarGeometry {
	const expr: Expression = {
		id: "active",
		headX: expressionDef.head.x,
		headY: expressionDef.head.y,
		headZ: expressionDef.head.z,
		widthLeft: expressionDef.eyes.left.width,
		widthRight: expressionDef.eyes.right.width,
		heightLeft: expressionDef.eyes.left.height,
		heightRight: expressionDef.eyes.right.height,
		spacing: expressionDef.eyes.spacing,
		positionXLeft: expressionDef.eyes.left.x,
		positionXRight: expressionDef.eyes.right.x,
		positionYLeft: expressionDef.eyes.left.y,
		positionYRight: expressionDef.eyes.right.y,
		leftAngle: expressionDef.eyes.left.angle,
		rightAngle: expressionDef.eyes.right.angle,
		perspective: expressionDef.perspective,
		eyeMotion: expressionDef.motion.eyes,
		bodyMotion: expressionDef.motion.body,
	};
	const pose = poseFromExpression(expr);
	return renderAvatar(pose, surface, blink);
}
