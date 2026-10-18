export interface PlannedTask {
	id: string;
	title: string;
	files: string[];
	dependsOn: string[];
	resources?: string[];
	notes?: string;
}

export interface Wave {
	waveNumber: number;
	tasks: PlannedTask[];
	disjointFiles: string[];
	resourcesUsed: string[];
}

export interface WavePlanResult {
	valid: boolean;
	totalTasks: number;
	totalWaves: number;
	waves: Wave[];
	hasCycles: boolean;
	conflicts: Array<{ taskA: string; taskB: string; reason: string }>;
	serializedDueToMissingFiles: string[];
}

/**
 * Normalizes file paths for disjointness checks (lowercase on Windows, slashes unified).
 */
function normalizePath(filePath: string): string {
	return filePath.trim().replace(/\\/g, "/").toLowerCase();
}

/**
 * Validates whether two tasks can safely execute in the same parallel wave.
 */
export function areTasksDisjoint(
	a: PlannedTask,
	b: PlannedTask,
): { safe: boolean; reason?: string } {
	// 1. Files must be specified
	if (a.files.length === 0) {
		return { safe: false, reason: `Task ${a.id} has no explicit Files declared (failsafe serial degradation)` };
	}
	if (b.files.length === 0) {
		return { safe: false, reason: `Task ${b.id} has no explicit Files declared (failsafe serial degradation)` };
	}

	// 2. Files intersection must be empty
	const filesA = new Set(a.files.map(normalizePath));
	for (const fb of b.files) {
		const normB = normalizePath(fb);
		if (filesA.has(normB)) {
			return { safe: false, reason: `Shared file collision on '${fb}' between ${a.id} and ${b.id}` };
		}
	}

	// 3. Resources intersection must be empty (ignoring 'none' or empty)
	if (a.resources && b.resources) {
		const resA = new Set(a.resources.map(r => r.trim().toLowerCase()).filter(r => r && r !== "none"));
		for (const rb of b.resources) {
			const normRb = rb.trim().toLowerCase();
			if (normRb && normRb !== "none" && resA.has(normRb)) {
				return { safe: false, reason: `Resource collision on '${rb}' between ${a.id} and ${b.id}` };
			}
		}
	}

	return { safe: true };
}

/**
 * Groups an array of planned tasks into validated, conflict-free parallel waves.
 */
export function planWaves(tasks: PlannedTask[]): WavePlanResult {
	const conflicts: Array<{ taskA: string; taskB: string; reason: string }> = [];
	const serializedDueToMissingFiles: string[] = [];

	if (tasks.length === 0) {
		return {
			valid: true,
			totalTasks: 0,
			totalWaves: 0,
			waves: [],
			hasCycles: false,
			conflicts: [],
			serializedDueToMissingFiles: [],
		};
	}

	// Build dependency graph & check for cycles
	const taskMap = new Map<string, PlannedTask>();
	for (const t of tasks) {
		taskMap.set(t.id, t);
		if (t.files.length === 0) {
			serializedDueToMissingFiles.push(t.id);
		}
	}

	// Transitive dependencies computation
	const transitiveDeps = new Map<string, Set<string>>();
	let hasCycles = false;

	function getTransitive(taskId: string, visiting = new Set<string>()): Set<string> {
		if (transitiveDeps.has(taskId)) {
			return transitiveDeps.get(taskId)!;
		}
		if (visiting.has(taskId)) {
			hasCycles = true;
			return new Set();
		}
		visiting.add(taskId);

		const task = taskMap.get(taskId);
		const result = new Set<string>();
		if (task) {
			for (const depId of task.dependsOn) {
				result.add(depId);
				const sub = getTransitive(depId, new Set(visiting));
				for (const s of sub) result.add(s);
			}
		}
		transitiveDeps.set(taskId, result);
		return result;
	}

	for (const t of tasks) {
		getTransitive(t.id);
	}

	if (hasCycles) {
		conflicts.push({
			taskA: "cycle",
			taskB: "cycle",
			reason: "Cycle detected in task dependencies (graph must be a DAG)",
		});
		return {
			valid: false,
			totalTasks: tasks.length,
			totalWaves: 0,
			waves: [],
			hasCycles: true,
			conflicts,
			serializedDueToMissingFiles,
		};
	}

	// Schedule tasks into waves
	// A task can only enter wave W if all its dependencies are in waves < W,
	// and it has no file/resource collisions with other tasks already in wave W.
	const taskAssignedWave = new Map<string, number>();
	const waves: Wave[] = [];

	for (const task of tasks) {
		// Determine min wave number based on dependencies
		let minWave = 0;
		const deps = transitiveDeps.get(task.id) ?? new Set();
		for (const depId of deps) {
			if (taskAssignedWave.has(depId)) {
				const depWave = taskAssignedWave.get(depId)!;
				minWave = Math.max(minWave, depWave + 1);
			}
		}

		// Try to place task in wave >= minWave where no collision occurs
		let targetWaveIdx = minWave;
		while (true) {
			if (targetWaveIdx >= waves.length) {
				// Create new wave
				waves.push({
					waveNumber: waves.length + 1,
					tasks: [],
					disjointFiles: [],
					resourcesUsed: [],
				});
			}

			const currentWave = waves[targetWaveIdx];
			let canFitInWave = true;

			// If task has no files, it degrades to serial execution (must be alone in wave)
			if (task.files.length === 0 && currentWave.tasks.length > 0) {
				canFitInWave = false;
			} else {
				for (const existingTask of currentWave.tasks) {
					const check = areTasksDisjoint(task, existingTask);
					if (!check.safe) {
						canFitInWave = false;
						break;
					}
				}
			}

			if (canFitInWave) {
				currentWave.tasks.push(task);
				currentWave.disjointFiles.push(...task.files);
				if (task.resources) {
					currentWave.resourcesUsed.push(...task.resources.filter(r => r && r !== "none"));
				}
				taskAssignedWave.set(task.id, targetWaveIdx);
				break;
			}

			targetWaveIdx++;
		}
	}

	return {
		valid: conflicts.length === 0,
		totalTasks: tasks.length,
		totalWaves: waves.length,
		waves,
		hasCycles: false,
		conflicts,
		serializedDueToMissingFiles,
	};
}
