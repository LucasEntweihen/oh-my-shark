import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
	ActivationEngine,
	computeContentHash,
	CURATED_75_SKILLS,
	extractMarkdownSections,
	findCuratedSkill,
	installSkills,
	parseSkillContent,
	resolveSkillsForPrompt,
	runSkillsDoctor,
	searchCuratedSkills,
	uninstallSkill,
	UniversalSkillRegistry,
	validateSkill,
	verifySkillIntegrity,
} from "../src/skills";

describe("Universal Skills Engine", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-skills-test-"));
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
	});

	describe("Parser and Validator", () => {
		it("parses valid frontmatter and markdown sections", () => {
			const raw = `---
name: frontend-design
description: Create distinct, production-grade frontend interfaces with high taste.
disable-model-invocation: true
tags: [frontend, ui, design]
---

# Frontend Design

## Objective
Build distinctive components.

## Requirements
1. Use clean CSS and layout systems.
`;
			const parsed = parseSkillContent(raw, "/mock/frontend-design/SKILL.md");
			expect(parsed.frontmatter.name).toBe("frontend-design");
			expect(parsed.frontmatter.description).toContain("production-grade");
			expect(parsed.frontmatter.disableModelInvocation).toBe(true);
			expect(parsed.standard).toBe("agentskills");
			expect(parsed.contentHash.length).toBe(64);

			const sections = extractMarkdownSections(parsed.markdown);
			expect(sections.has("objective")).toBe(true);
			expect(sections.has("requirements")).toBe(true);
		});

		it("validates skill constraints and detects path traversal", () => {
			const safeSkill = {
				id: "safe-skill",
				name: "Safe Skill",
				description: "A safe skill",
				version: "1.0.0",
				filePath: path.join(tempDir, "SKILL.md"),
				baseDir: tempDir,
				content: "# Safe",
				frontmatter: {},
				level: "project" as const,
				source: "local",
				trust: "trusted" as const,
				permissions: { filesystem: "workspace" as const },
				dependencies: [],
				standard: "agentskills" as const,
				contentHash: "hash",
				hide: false,
			};

			const validResult = validateSkill(safeSkill);
			expect(validResult.valid).toBe(true);

			const unsafeSkill = {
				...safeSkill,
				dependencies: ["../../etc/passwd"],
			};

			const invalidResult = validateSkill(unsafeSkill);
			expect(invalidResult.valid).toBe(false);
			expect(invalidResult.issues.some(i => i.field === "dependencies")).toBe(true);
		});
	});

	describe("Curated 75 Skills Marketplace", () => {
		it("contains all 75 essential skills across 5 core categories", () => {
			expect(CURATED_75_SKILLS.length).toBe(75);

			const categories = new Set(CURATED_75_SKILLS.map(s => s.category));
			expect(categories.has("autonomous-engineering")).toBe(true);
			expect(categories.has("anthropic-official")).toBe(true);
			expect(categories.has("frontend-web")).toBe(true);
			expect(categories.has("advanced-quality")).toBe(true);
			expect(categories.has("backend-infra-security")).toBe(true);
		});

		it("searches skills accurately by keyword, tag, or repository", () => {
			const frontendMatches = searchCuratedSkills("frontend");
			expect(frontendMatches.length).toBeGreaterThan(0);
			expect(frontendMatches.some(m => m.id === "frontend-design")).toBe(true);

			const superpowerMatches = searchCuratedSkills("", { repository: "obra/superpowers" });
			expect(superpowerMatches.length).toBe(15);

			const debuggingMatches = searchCuratedSkills("debugging");
			expect(debuggingMatches.some(m => m.id === "systematic-debugging")).toBe(true);
		});

		it("locates specific curated skills by id or name", () => {
			const skill = findCuratedSkill("brainstorming");
			expect(skill).toBeDefined();
			expect(skill?.repository).toBe("obra/superpowers");
			expect(skill?.priority).toBe("maximum");
		});
	});

	describe("Installer, Uninstaller and Manifests", () => {
		it("installs a curated skill, generates manifest, and verifies integrity", async () => {
			const fakeHome = path.join(tempDir, "user-home");
			const fakeCwd = path.join(tempDir, "workspace");
			await fs.mkdir(fakeHome, { recursive: true });
			await fs.mkdir(fakeCwd, { recursive: true });

			const installRes = await installSkills({
				target: "brainstorming",
				scope: "user",
			});

			expect(installRes.success).toBe(true);
			expect(installRes.installedSkills.length).toBe(1);

			const installed = installRes.installedSkills[0];
			expect(installed.id).toBe("brainstorming");

			const manifest = installRes.manifests[0];
			expect(manifest).toBeDefined();
			expect(manifest.id).toBe("brainstorming");

			const integrity = await verifySkillIntegrity(installed, manifest);
			expect(integrity.matches).toBe(true);

			// Test uninstall
			const uninstallRes = await uninstallSkill("brainstorming", { scope: "user" });
			expect(uninstallRes.success).toBe(true);
		});
	});

	describe("Intelligent Resolver and Activation Engine", () => {
		it("resolves skills from prompt intent and keywords", () => {
			const registry = new UniversalSkillRegistry();

			const skill1 = {
				id: "fastapi-templates",
				name: "FastAPI Templates",
				description: "Build FastAPI backend with async endpoints",
				version: "1.0.0",
				filePath: "/mock/fastapi/SKILL.md",
				baseDir: "/mock/fastapi",
				content: "# FastAPI",
				frontmatter: { tags: ["fastapi", "python", "backend"] },
				level: "installed" as const,
				source: "installed",
				trust: "verified" as const,
				permissions: {},
				dependencies: ["postgresql-table-design"],
				standard: "agentskills" as const,
				contentHash: "h1",
				hide: false,
			};

			const skill2 = {
				id: "postgresql-table-design",
				name: "PostgreSQL Table Design",
				description: "Postgres schema design and optimization",
				version: "1.0.0",
				filePath: "/mock/postgres/SKILL.md",
				baseDir: "/mock/postgres",
				content: "# Postgres",
				frontmatter: { tags: ["postgres", "database", "sql"] },
				level: "installed" as const,
				source: "installed",
				trust: "verified" as const,
				permissions: {},
				dependencies: [],
				standard: "agentskills" as const,
				contentHash: "h2",
				hide: false,
			};

			registry.register(skill1);
			registry.register(skill2);

			const matches = resolveSkillsForPrompt(
				"Preciso desenvolver uma API rápida em python com banco postgres",
				registry,
			);

			expect(matches.length).toBeGreaterThan(0);
			const matchedIds = matches.map(m => m.skill.id);
			expect(matchedIds.includes("fastapi-templates")).toBe(true);
			// Check dependency resolution
			expect(matchedIds.includes("postgresql-table-design")).toBe(true);
		});

		it("manages Tier 1 Discovery and Tier 2 Activation", async () => {
			const engine = new ActivationEngine();
			const testSkill = {
				id: "test-skill",
				name: "Test Skill",
				description: "Tiered activation demonstration",
				version: "1.0.0",
				filePath: "/mock/SKILL.md",
				baseDir: "/mock",
				content: "# Tier 2 Full Content",
				frontmatter: { triggers: ["@test"] },
				level: "project" as const,
				source: "local",
				trust: "trusted" as const,
				permissions: {},
				dependencies: [],
				standard: "agentskills" as const,
				contentHash: "h",
				hide: false,
			};

			// Tier 1
			const index = engine.getTier1DiscoveryIndex([testSkill]);
			expect(index.length).toBe(1);
			expect(index[0].id).toBe("test-skill");
			expect(index[0].description).toBe("Tiered activation demonstration");

			// Tier 2
			const activated = await engine.activateSkill(testSkill);
			expect(activated.tier).toBe(2);
			expect(activated.content).toBe("# Tier 2 Full Content");
			expect(engine.getActiveSkills().length).toBe(1);

			engine.reset();
			expect(engine.getActiveSkills().length).toBe(0);
		});
	});

	describe("Doctor Diagnostics", () => {
		it("runs diagnostics without uncaught exceptions", async () => {
			const report = await runSkillsDoctor({ cwd: tempDir, home: tempDir });
			expect(report).toBeDefined();
			expect(typeof report.healthy).toBe("boolean");
			expect(Array.isArray(report.issues)).toBe(true);
		});
	});
});
