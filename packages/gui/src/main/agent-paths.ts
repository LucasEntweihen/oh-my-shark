import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/** Keep desktop config and session discovery on the same Agent profile. */
export function agentDir(): string {
	const override = process.env.OMSK_AGENT_DIR || process.env.PI_CODING_AGENT_DIR;
	if (override) return override;
	const home = os.homedir();
	const candidates = [
		path.join(home, ".omsk", "agent"),
		path.join(home, ".ohms", "agent"),
		path.join(home, ".omp", "agent"),
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate;
	}
	return candidates[0];
}
