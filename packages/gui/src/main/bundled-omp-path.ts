import { existsSync } from "node:fs";
import { join } from "node:path";

/** Filename of the bundled OMSK sidecar on this platform. */
export function bundledOmpFilename(): string {
	return process.platform === "win32" ? "omsk.exe" : "omsk";
}

/** Candidate filenames for the bundled sidecar, ordered by preference. */
export function bundledOmpFilenames(): readonly string[] {
	return process.platform === "win32" ? ["omsk.exe", "ohms.exe", "omp.exe"] : ["omsk", "ohms", "omp"];
}

/** Resolve a bundled sidecar path, accepting a Windows .exe suffix when needed. */
export function resolveOmpCandidate(...parts: string[]): string | null {
	const candidate = join(...parts);
	if (existsSync(candidate)) return candidate;
	if (process.platform === "win32" && !candidate.toLowerCase().endsWith(".exe")) {
		const withExe = `${candidate}.exe`;
		if (existsSync(withExe)) return withExe;
	}
	return null;
}

/** Resolve the highest-priority sidecar executable present inside a directory. */
export function resolveBundledOmpInDir(dir: string): string | null {
	for (const name of bundledOmpFilenames()) {
		const found = resolveOmpCandidate(dir, name);
		if (found) return found;
	}
	for (const base of ["omsk", "ohms", "omp"]) {
		const found = resolveOmpCandidate(dir, base);
		if (found) return found;
	}
	return null;
}
