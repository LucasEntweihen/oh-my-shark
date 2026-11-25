/**
 * Python runtime & `google-antigravity` package resolution for the local
 * Antigravity SDK sidecar (`google-antigravity` PyPI package).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { $which, getAntigravitySdkDir } from "@oh-my-pi/pi-utils";

export interface AntigravitySdkProbeResult {
	available: boolean;
	pythonPath?: string;
	version?: string;
	reason?: string;
}

/** Root directory for managed Antigravity SDK venvs and persistent conversations. */
export function antigravitySdkDir(): string {
	return getAntigravitySdkDir();
}

/** Absolute path to the bundled NDJSON Python worker script. */
export function sdkWorkerScriptPath(): string {
	return path.join(import.meta.dir, "worker.py");
}

/** Candidate venv Python binary inside `sdkDir`. */
export function venvPythonPath(sdkDir: string = antigravitySdkDir()): string {
	return process.platform === "win32"
		? path.join(sdkDir, ".venv", "Scripts", "python.exe")
		: path.join(sdkDir, ".venv", "bin", "python");
}

/**
 * Resolves the Python executable used to launch `worker.py`.
 * Order: `OMSK_ANTIGRAVITY_PYTHON` -> managed `.venv` -> `python3` / `python`.
 */
export function resolveSdkPython(sdkDir: string = antigravitySdkDir()): string {
	const override = process.env.OMSK_ANTIGRAVITY_PYTHON?.trim();
	if (override) return override;
	const managed = venvPythonPath(sdkDir);
	if (fs.existsSync(managed)) return managed;
	const sysPython = $which("python3") ?? $which("python");
	if (sysPython) return sysPython;
	throw new Error(
		"Python executable not found for Antigravity SDK sidecar. Set OMSK_ANTIGRAVITY_PYTHON or create a .venv with `pip install google-antigravity`.",
	);
}

/** Non-throwing probe checking whether `google.antigravity` is importable in the resolved interpreter. */
export async function probeAntigravitySdk(
	pythonPath?: string,
	timeoutMs = 10_000,
): Promise<AntigravitySdkProbeResult> {
	let resolved: string;
	try {
		resolved = pythonPath ?? resolveSdkPython();
	} catch (error) {
		return { available: false, reason: error instanceof Error ? error.message : String(error) };
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const proc = Bun.spawn(
			[
				resolved,
				"-c",
				"import google.antigravity as ag; print(getattr(ag, '__version__', 'installed'))",
			],
			{ stdin: "ignore", stdout: "pipe", stderr: "pipe" },
		);
		const exitCode = await Promise.race([
			proc.exited,
			new Promise<number>((_, reject) => {
				controller.signal.addEventListener("abort", () => {
					try {
						proc.kill();
					} catch {
						// Process may already have exited.
					}
					reject(new Error("Timed out probing google.antigravity"));
				});
			}),
		]);
		const stdout = (await new Response(proc.stdout).text()).trim();
		const stderr = (await new Response(proc.stderr).text()).trim();
		if (exitCode !== 0) {
			return {
				available: false,
				pythonPath: resolved,
				reason: stderr || `python exited with code ${exitCode}`,
			};
		}
		return { available: true, pythonPath: resolved, version: stdout || "installed" };
	} catch (error) {
		return {
			available: false,
			pythonPath: resolved,
			reason: error instanceof Error ? error.message : String(error),
		};
	} finally {
		clearTimeout(timer);
	}
}
