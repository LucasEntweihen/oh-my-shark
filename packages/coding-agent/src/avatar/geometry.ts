import type { AvatarExpressionDefinition, AvatarGeometry, SurfaceConfig } from "./types";

export type Point3 = readonly [number, number, number];
export type Quaternion = readonly [number, number, number, number];

export const RADIUS = 120;
const FOCAL_LENGTH = 620;
const HEAD_LATITUDE_SAMPLES = 28;
const HEAD_LONGITUDE_SAMPLES = 56;

export function radians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function quaternionFromEuler(pitch: number, yaw: number, roll: number): Quaternion {
	const halfX = pitch / 2;
	const halfY = yaw / 2;
	const halfZ = roll / 2;
	const cx = Math.cos(halfX);
	const sx = Math.sin(halfX);
	const cy = Math.cos(halfY);
	const sy = Math.sin(halfY);
	const cz = Math.cos(halfZ);
	const sz = Math.sin(halfZ);
	return [
		cx * cy * cz - sx * sy * sz,
		sx * cy * cz + cx * sy * sz,
		cx * sy * cz - sx * cy * sz,
		cx * cy * sz + sx * sy * cz,
	];
}

export function rotateWithQuaternion([qw, qx, qy, qz]: Quaternion, [x, y, z]: Point3): Point3 {
	const ix = qw * x + qy * z - qz * y;
	const iy = qw * y + qz * x - qx * z;
	const iz = qw * z + qx * y - qy * x;
	const iw = -qx * x - qy * y - qz * z;
	return [
		ix * qw + iw * -qx + iy * -qz - iz * -qy,
		iy * qw + iw * -qy + iz * -qx - ix * -qz,
		iz * qw + iw * -qz + ix * -qy - iy * -qx,
	];
}

export function project([x, y, z]: Point3, perspective = 1): Point3 {
	if (perspective <= 0) return [x, y, z];
	const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z * perspective);
	return [x * scale, y * scale, z];
}
export function surfacePointAt(config: SurfaceConfig, longitude: number, latitude: number): Point3 {
	const w = config.width / 2;
	const h = config.height / 2;
	const d = config.depth / 2;

	switch (config.type) {
		case "cube": {
			const round = Math.max(0.01, config.roundness);
			const p = 2 / (0.04 + (round / 2) * 0.96);
			const sx = Math.cos(latitude) * Math.sin(longitude);
			const sy = Math.sin(latitude);
			const sz = Math.cos(latitude) * Math.cos(longitude);
			const norm = (Math.abs(sx) ** p + Math.abs(sy) ** p + Math.abs(sz) ** p) ** (1 / p) || 1;
			return [w * (sx / norm), h * (sy / norm), d * (sz / norm)];
		}
		case "capsule": {
			const capR = Math.min(w, h);
			const straight = Math.max(0, h - capR);
			const latAngle = latitude;
			const rad = w * Math.cos(latAngle);
			const yOffset = straight * Math.sign(Math.sin(latAngle));
			return [rad * Math.sin(longitude), capR * Math.sin(latAngle) + yOffset, rad * Math.cos(longitude)];
		}
		case "diamond": {
			const p = 1 + clamp(config.roundness, 0, 2) / 2;
			const sx = Math.cos(latitude) * Math.sin(longitude);
			const sy = Math.sin(latitude);
			const sz = Math.cos(latitude) * Math.cos(longitude);
			const norm = (Math.abs(sx) ** p + Math.abs(sy) ** p + Math.abs(sz) ** p) ** (1 / p) || 1;
			return [w * (sx / norm), h * (sy / norm), d * (sz / norm)];
		}
		case "cylinder": {
			const rad = w;
			const y = h * Math.sin(latitude);
			return [rad * Math.sin(longitude), y, (d / w) * rad * Math.cos(longitude)];
		}
		case "cone": {
			const frac = (1 - Math.sin(latitude)) / 2;
			const rad = w * frac;
			const y = h * Math.sin(latitude);
			return [rad * Math.sin(longitude), y, (d / w) * rad * Math.cos(longitude)];
		}
		case "mickey": {
			// Mickey surface: head sphere with subtle ear swellings
			const baseR = w;
			const sx = Math.cos(latitude) * Math.sin(longitude);
			const sy = Math.sin(latitude);
			const sz = Math.cos(latitude) * Math.cos(longitude);
			return [baseR * sx, h * sy, d * sz];
		}
		case "sphere":
		default: {
			const cosLat = Math.cos(latitude);
			return [w * cosLat * Math.sin(longitude), h * Math.sin(latitude), d * cosLat * Math.cos(longitude)];
		}
	}
}

export function convexHull(points: Point3[]): Point3[] {
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
}

export function pathToSvg(points: Point3[], closed = true): string {
	if (points.length === 0) return "";
	const start = points[0]!;
	let d = `M${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
	for (let i = 1; i < points.length; i++) {
		const p = points[i]!;
		d += ` L${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
	}
	if (closed) d += " Z";
	return d;
}

export function smoothPathToSvg(points: Point3[]): string {
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
	d += " Z";
	return d;
}

export function sampleEyeOval(
	eye: { width: number; height: number; x: number; y: number; angle: number },
	blink = 1,
	samples = 24,
): Point3[] {
	const points: Point3[] = [];
	const rad = radians(eye.angle);
	const cosA = Math.cos(rad);
	const sinA = Math.sin(rad);
	const rx = Math.max(1, eye.width / 2);
	const ry = Math.max(0.5, (eye.height / 2) * blink);

	for (let i = 0; i < samples; i++) {
		const theta = (i / samples) * Math.PI * 2;
		const localX = rx * Math.cos(theta);
		const localY = ry * Math.sin(theta);
		const rotX = localX * cosA - localY * sinA;
		const rotY = localX * sinA + localY * cosA;
		points.push([eye.x + rotX, eye.y + rotY, 0]);
	}
	return points;
}

export function renderAvatarPose(
	surface: SurfaceConfig,
	expression: AvatarExpressionDefinition,
	blink = 1,
): AvatarGeometry {
	const orientation = quaternionFromEuler(
		radians(expression.head.x),
		radians(expression.head.y),
		radians(expression.head.z),
	);

	// Generate head surface sample points
	const headPoints: Point3[] = [];
	for (let latIdx = 0; latIdx < HEAD_LATITUDE_SAMPLES; latIdx++) {
		const lat = -Math.PI / 2 + (latIdx / (HEAD_LATITUDE_SAMPLES - 1)) * Math.PI;
		for (let lonIdx = 0; lonIdx < HEAD_LONGITUDE_SAMPLES; lonIdx++) {
			const lon = -Math.PI + (lonIdx / (HEAD_LONGITUDE_SAMPLES - 1)) * Math.PI * 2;
			const pt = surfacePointAt(surface, lon, lat);
			const rot = rotateWithQuaternion(orientation, pt);
			const proj = project(rot, expression.perspective);
			headPoints.push(proj);
		}
	}

	const hull = convexHull(headPoints);
	const headPath = smoothPathToSvg(hull);

	// Eye positioning with perspective & head rotation
	const halfSpacing = expression.eyes.spacing / 2;
	const leftEyeConfig = {
		width: expression.eyes.left.width,
		height: expression.eyes.left.height,
		x: -halfSpacing + expression.eyes.left.x,
		y: expression.eyes.left.y,
		angle: expression.eyes.left.angle,
	};
	const rightEyeConfig = {
		width: expression.eyes.right.width,
		height: expression.eyes.right.height,
		x: halfSpacing + expression.eyes.right.x,
		y: expression.eyes.right.y,
		angle: expression.eyes.right.angle,
	};

	const leftSamples = sampleEyeOval(leftEyeConfig, blink);
	const rightSamples = sampleEyeOval(rightEyeConfig, blink);

	// Project eye points onto head surface orientation
	const projectEyePoints = (samples: Point3[]): { points: Point3[]; visible: boolean } => {
		const proj = samples.map(pt => {
			// Find approximate surface depth
			const rot = rotateWithQuaternion(orientation, [pt[0], pt[1], surface.depth / 2]);
			return project(rot, expression.perspective);
		});
		// Eye is visible if head orientation points somewhat towards camera
		const normalZ = rotateWithQuaternion(orientation, [0, 0, 1])[2];
		return { points: proj, visible: normalZ > -0.2 };
	};

	const leftResult = projectEyePoints(leftSamples);
	const rightResult = projectEyePoints(rightSamples);

	const leftPath = smoothPathToSvg(leftResult.points);
	const rightPath = smoothPathToSvg(rightResult.points);

	return {
		headPath,
		leftPath,
		rightPath,
		leftVisible: leftResult.visible,
		rightVisible: rightResult.visible,
		frontPaths: [],
		backPaths: [],
	};
}
