import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "bun:test";
import {
	areTasksDisjoint,
	checkFileSizes,
	evaluateHarness,
	getPromptContent,
	getToolContent,
	lookupPrompt,
	lookupTool,
	planWaves,
	scaffoldMissingManifestFiles,
	validateManifest,
	VIBE_PROMPT_CATALOG,
	VIBE_TOOL_CATALOG,
} from "../src/index";

describe("Vibe Toolkit: Manifest Validator", () => {
	it("detects missing canonical files and scaffolds them cleanly", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-manifest-test-"));
		try {
			const initialCheck = validateManifest(tempDir);
			expect(initialCheck.valid).toBe(false);
			expect(initialCheck.missingCount).toBe(9);

			const { created } = scaffoldMissingManifestFiles(tempDir, { projectName: "TestApp" });
			expect(created.length).toBe(9);

			const afterCheck = validateManifest(tempDir);
			expect(afterCheck.valid).toBe(true);
			expect(afterCheck.existingCount).toBe(9);
			expect(afterCheck.missingCount).toBe(0);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("Vibe Toolkit: File Size Checker (350-line gate)", () => {
	it("identifies files exceeding the line limit", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-filesize-test-"));
		try {
			fs.writeFileSync(path.join(tempDir, "small.ts"), new Array(100).fill("const x = 1;").join("\n"));
			fs.writeFileSync(path.join(tempDir, "large.ts"), new Array(400).fill("const y = 2;").join("\n"));

			const result = checkFileSizes(tempDir, { maxLines: 350 });
			expect(result.pass).toBe(false);
			expect(result.totalFilesScanned).toBe(2);
			expect(result.violatingFiles.length).toBe(1);
			expect(result.violatingFiles[0].relativePath).toBe("large.ts");
			expect(result.violatingFiles[0].lines).toBe(400);
			expect(result.violatingFiles[0].exceededBy).toBe(50);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("passes when all files are under the line limit", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-filesize-pass-"));
		try {
			fs.writeFileSync(path.join(tempDir, "file1.ts"), new Array(50).fill("console.log('hi');").join("\n"));
			fs.writeFileSync(path.join(tempDir, "file2.ts"), new Array(350).fill("console.log('bye');").join("\n"));

			const result = checkFileSizes(tempDir, { maxLines: 350 });
			expect(result.pass).toBe(true);
			expect(result.violatingFiles.length).toBe(0);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("Vibe Toolkit: Wave Planner & Disjointness", () => {
	it("allows disjoint tasks to run in parallel and serializes colliding ones", () => {
		const tasks = [
			{
				id: "T1",
				title: "Update user schema",
				files: ["src/user.ts"],
				dependsOn: [],
			},
			{
				id: "T2",
				title: "Update auth routes",
				files: ["src/auth.ts"],
				dependsOn: [],
			},
			{
				id: "T3",
				title: "Update auth middleware touching user.ts",
				files: ["src/user.ts", "src/middleware.ts"],
				dependsOn: [],
			},
		];

		const plan = planWaves(tasks);
		expect(plan.valid).toBe(true);
		expect(plan.totalTasks).toBe(3);
		expect(plan.waves.length).toBe(2);
		expect(plan.waves[0].tasks.map(t => t.id)).toEqual(["T1", "T2"]);
		expect(plan.waves[1].tasks.map(t => t.id)).toEqual(["T3"]);
	});

	it("enforces dependent tasks to be scheduled in subsequent waves", () => {
		const tasks = [
			{
				id: "A",
				title: "Core database migration",
				files: ["src/db.ts"],
				dependsOn: [],
			},
			{
				id: "B",
				title: "Service relying on migration",
				files: ["src/service.ts"],
				dependsOn: ["A"],
			},
		];

		const plan = planWaves(tasks);
		expect(plan.valid).toBe(true);
		expect(plan.waves.length).toBe(2);
		expect(plan.waves[0].tasks[0].id).toBe("A");
		expect(plan.waves[1].tasks[0].id).toBe("B");
	});

	it("degrades tasks with missing files to serial execution", () => {
		const check = areTasksDisjoint(
			{ id: "X", title: "Missing files", files: [], dependsOn: [] },
			{ id: "Y", title: "Valid files", files: ["src/index.ts"], dependsOn: [] },
		);
		expect(check.safe).toBe(false);
		expect(check.reason).toContain("failsafe serial degradation");
	});

	it("detects dependency cycles cleanly", () => {
		const cyclicTasks = [
			{ id: "1", title: "One", files: ["1.ts"], dependsOn: ["2"] },
			{ id: "2", title: "Two", files: ["2.ts"], dependsOn: ["1"] },
		];
		const plan = planWaves(cyclicTasks);
		expect(plan.valid).toBe(false);
		expect(plan.hasCycles).toBe(true);
	});
});

describe("Vibe Toolkit: Prompt & Tool Catalog", () => {
	it("has all 14 prompts indexed with readable content", () => {
		expect(VIBE_PROMPT_CATALOG.length).toBe(14);
		for (const prompt of VIBE_PROMPT_CATALOG) {
			const meta = lookupPrompt(prompt.id);
			expect(meta).toBeDefined();
			expect(meta?.title).toBe(prompt.title);

			const content = getPromptContent(prompt.id);
			expect(content).toBeDefined();
			expect(content && content.length > 50).toBe(true);
		}
	});

	it("has all 22 tools indexed with readable content", () => {
		expect(VIBE_TOOL_CATALOG.length).toBe(22);
		for (const tool of VIBE_TOOL_CATALOG) {
			const meta = lookupTool(tool.id);
			expect(meta).toBeDefined();
			expect(meta?.title).toBe(tool.title);

			const content = getToolContent(tool.id);
			expect(content).toBeDefined();
			expect(content && content.length > 50).toBe(true);
		}
	});
});

describe("Vibe Toolkit: Harness Evaluator", () => {
	it("evaluates package directory harness and returns structured report", () => {
		const pkgDir = path.resolve(import.meta.dir, "..");
		const report = evaluateHarness(pkgDir);
		expect(report).toBeDefined();
		expect(report.checks.length).toBeGreaterThanOrEqual(4);
		expect(report.summary.totalChecks).toBeGreaterThanOrEqual(4);
		expect(report.summary.passedChecks).toBeGreaterThanOrEqual(3);
	});
});
