import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Subagent 1 TDD: CLI Purity & Zero-GUI Invariants", () => {
	it("verifies package.json contains zero GUI scripts", () => {
		const pkgPath = path.resolve("package.json");
		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
		const scripts = pkg.scripts || {};
		expect(scripts["gui:app"]).toBeUndefined();
		expect(scripts["gui:build"]).toBeUndefined();
		expect(scripts["gui:sync"]).toBeUndefined();
		expect(Object.keys(scripts).some((s) => s.startsWith("gui:"))).toBe(false);
	});

	it("verifies apps/omsk-gui contains zero active binaries or electron source code", () => {
		const guiDir = path.resolve("apps/omsk-gui");
		if (fs.existsSync(guiDir)) {
			const files = fs.readdirSync(guiDir);
			expect(files.filter((f) => f.endsWith(".exe") || f.endsWith(".dll") || f.endsWith(".asar") && !f.endsWith(".old"))).toEqual([]);
		} else {
			expect(fs.existsSync(guiDir)).toBe(false);
		}
	});

	it("verifies site/src has zero GUI components, modals or AuroraApp", () => {
		expect(fs.existsSync(path.resolve("site/src/AuroraApp.tsx"))).toBe(false);
		expect(fs.existsSync(path.resolve("site/src/components/chat"))).toBe(false);
		expect(fs.existsSync(path.resolve("site/src/components/astral"))).toBe(false);
		expect(fs.existsSync(path.resolve("site/src/components/aurora"))).toBe(false);
		expect(fs.existsSync(path.resolve("site/src/lib/omsk-api.ts"))).toBe(false);
	});

	it("verifies packages/coding-agent has zero taskmanager GUI launcher or Tkinter scripts", () => {
		expect(fs.existsSync(path.resolve("packages/coding-agent/src/taskmanager"))).toBe(false);
		expect(fs.existsSync(path.resolve("packages/coding-agent/src/aurora"))).toBe(false);
		expect(fs.existsSync(path.resolve("packages/coding-agent/src/commands/gui.ts"))).toBe(false);
	});

	it("verifies CLI entrypoint executes in pure headless mode reporting correct version", () => {
		const cliPath = path.resolve("packages/coding-agent/src/cli.ts");
		expect(fs.existsSync(cliPath)).toBe(true);

		const proc = Bun.spawnSync([process.execPath, cliPath, "--version"], {
			cwd: process.cwd(),
			env: { ...process.env, NO_COLOR: "1" },
		});

		expect(proc.exitCode).toBe(0);
		const stdout = proc.stdout.toString().trim();
		expect(stdout).toMatch(/^omsk[\/\s]\d+\.\d+\.\d+/);
	});
});
