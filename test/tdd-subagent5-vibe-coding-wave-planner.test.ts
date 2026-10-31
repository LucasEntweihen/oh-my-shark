import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	areTasksDisjoint,
	planWaves,
	checkFileSizes,
	VIBE_PROMPT_CATALOG,
	VIBE_TOOL_CATALOG,
	getPromptContent,
	lookupPrompt,
} from "../packages/vibe-toolkit/src/index";

describe("Subagent 5 TDD: Vibe Coding Toolkit Wave Planner & Quality Gates", () => {
	it("correctly evaluates task file set disjointness", () => {
		const taskA = {
			id: "task-auth",
			title: "Auth Layer",
			files: ["src/auth/jwt.ts", "src/auth/session.ts"],
			dependsOn: [],
		};
		const taskB = {
			id: "task-db",
			title: "Database Layer",
			files: ["src/db/sqlite.ts", "src/db/migrations.ts"],
			dependsOn: [],
		};
		const taskC = {
			id: "task-login",
			title: "Login Endpoint",
			files: ["src/auth/jwt.ts", "src/routes/login.ts"],
			dependsOn: [],
		};

		const disjointAB = areTasksDisjoint(taskA, taskB);
		expect(disjointAB.safe).toBe(true);

		const disjointAC = areTasksDisjoint(taskA, taskC);
		expect(disjointAC.safe).toBe(false); // Collides on src/auth/jwt.ts
		expect(disjointAC.reason).toContain("src/auth/jwt.ts");
	});

	it("partitions disjoint tasks into parallel wave 0 and serializes overlapping tasks", () => {
		const tasks = [
			{ id: "t1", title: "User Service", files: ["src/user.ts"], dependsOn: [] },
			{ id: "t2", title: "Billing Service", files: ["src/billing.ts"], dependsOn: [] },
			{ id: "t3", title: "Audit Logger", files: ["src/audit.ts"], dependsOn: [] },
			{ id: "t4", title: "User Profile (Collides with t1)", files: ["src/user.ts", "src/profile.ts"], dependsOn: [] },
		];

		const plan = planWaves(tasks);
		expect(plan.valid).toBe(true);
		expect(plan.waves.length).toBeGreaterThanOrEqual(2);

		// Wave 0 must contain disjoint tasks running concurrently
		const wave0TaskIds = plan.waves[0].tasks.map((t) => t.id);
		expect(wave0TaskIds).toContain("t1");
		expect(wave0TaskIds).toContain("t2");
		expect(wave0TaskIds).toContain("t3");

		// t4 must be pushed to a subsequent wave due to file collision with t1
		expect(wave0TaskIds).not.toContain("t4");
		const subsequentTaskIds = plan.waves.slice(1).flatMap((w) => w.tasks.map((t) => t.id));
		expect(subsequentTaskIds).toContain("t4");
	});

	it("detects dependency cycles and marks plan invalid with hasCycles", () => {
		const cyclicalTasks = [
			{ id: "task-alpha", title: "Alpha", files: ["src/alpha.ts"], dependsOn: ["task-beta"] },
			{ id: "task-beta", title: "Beta", files: ["src/beta.ts"], dependsOn: ["task-alpha"] },
		];

		const plan = planWaves(cyclicalTasks);
		expect(plan.valid).toBe(false);
		expect(plan.hasCycles).toBe(true);
		expect(plan.conflicts.length).toBeGreaterThan(0);
	});

	it("enforces 350-line quality gate on source files", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omsk-subagent5-lines-"));
		try {
			// Small file (50 lines)
			const smallPath = path.join(tempDir, "small.ts");
			fs.writeFileSync(smallPath, Array.from({ length: 50 }, () => "console.log('line');").join("\n"));

			// Large file (400 lines - exceeds 350 limit)
			const largePath = path.join(tempDir, "large.ts");
			fs.writeFileSync(largePath, Array.from({ length: 400 }, () => "console.log('line');").join("\n"));

			const check = checkFileSizes(tempDir, { maxLines: 350 });
			expect(check.pass).toBe(false);
			expect(check.violatingFiles.length).toBe(1);
			expect(check.violatingFiles[0].relativePath).toBe("large.ts");
			expect(check.violatingFiles[0].lines).toBe(400);
			expect(check.violatingFiles[0].exceededBy).toBe(50);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("verifies canonical prompt catalog integrity and retrieves Prompt 13 (sec-review)", () => {
		expect(VIBE_PROMPT_CATALOG.length).toBe(14);
		expect(VIBE_TOOL_CATALOG.length).toBe(22);

		// Verify Prompt 13 (Differential Security Audit)
		const secPrompt = lookupPrompt("13");
		expect(secPrompt).toBeDefined();
		expect(secPrompt?.id).toBe("13");
		expect(secPrompt?.title).toContain("Security");

		const content = getPromptContent("13");
		expect(content).toBeDefined();
		expect(content!.length).toBeGreaterThan(50);
	});
});
