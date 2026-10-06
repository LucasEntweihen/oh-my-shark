import * as path from "node:path";
import * as fs from "node:fs";
import { checkPythonKernelAvailability } from "../eval/py/kernel";
import { logger } from "@oh-my-pi/pi-utils";

/**
 * Launch the Python Task Manager GUI in a detached, independent process.
 */
export async function launchTaskManagerGui(cwd?: string): Promise<{ ok: boolean; reason?: string }> {
	const workingDir = cwd ?? process.cwd();
	const scriptPath = path.join(import.meta.dir, "taskmanager.py");

	if (!fs.existsSync(scriptPath)) {
		return { ok: false, reason: `TaskManager script not found at ${scriptPath}` };
	}

	const availability = await checkPythonKernelAvailability(workingDir);
	if (!availability.ok || !availability.pythonPath) {
		return {
			ok: false,
			reason: availability.reason ?? "Python interpreter not found. Please install Python 3.8+ or configure python.interpreter.",
		};
	}

	try {
		const pythonBin = availability.pythonPath;
		// Spawn Python GUI detached with its own window
		const child = Bun.spawn([pythonBin, scriptPath], {
			cwd: workingDir,
			stdin: "ignore",
			stdout: "ignore",
			stderr: "ignore",
			detached: true,
			env: {
				...process.env,
				PYTHONUNBUFFERED: "1",
				PYTHONIOENCODING: "utf-8",
			},
		});

		child.unref();
		return { ok: true };
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		logger.error("Failed to launch Task Manager GUI", { error: msg });
		return { ok: false, reason: msg };
	}
}
