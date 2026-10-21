import { expect, it, spyOn } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as updateCli from "../../src/cli/update-cli";
import Update from "../../src/commands/update";
import type { CliConfig } from "@oh-my-pi/pi-utils/cli";

const updateCommandSource = await readFile(new URL("../../src/commands/update.ts", import.meta.url), "utf8");
const updateCliSource = await readFile(new URL("../../src/cli/update-cli.ts", import.meta.url), "utf8");
const TEST_CONFIG: CliConfig = {
	bin: "omsk",
	version: "0.0.0-test",
	commands: new Map(),
};

it("loads the binary updater lazily without eagerly importing native-backed command modules", () => {
	expect(updateCommandSource).toContain('await import("../cli/update-cli")');
	expect(updateCommandSource).toContain('await import("../cli/plugin-cli")');
	expect(updateCommandSource).not.toMatch(/^import .*?(?:plugin-cli|update-cli|theme\/theme|config\/settings)/m);
});

it("keeps verified update logic independent of native-backed utility barrels", () => {
	expect(updateCliSource).not.toContain('from "@oh-my-pi/pi-utils"');
	expect(updateCliSource).not.toContain('from "@oh-my-pi/pi-utils/file-lock"');
	expect(updateCliSource).not.toContain('from "@oh-my-pi/pi-natives');
	expect(updateCliSource).not.toContain('from "../config/settings"');
	expect(updateCliSource).not.toContain('from "../modes/theme/theme"');
	expect(updateCliSource).toContain('fs.promises.open(lockPath, "wx")');
	expect(updateCliSource).toContain("process.kill(pid, 0)");
});

it("dispatches the standard update command without loading native-backed modules", async () => {
	const updateSpy = spyOn(updateCli, "runUpdateCommand").mockResolvedValue(undefined);
	const command = new Update(["--check"], TEST_CONFIG);
	await command.run();
	expect(updateSpy).toHaveBeenCalledWith({ force: false, check: true, channel: undefined });
});

it("serializes update replacements with an exclusive cross-process lock file", async () => {
	const directory = await mkdtemp(join(tmpdir(), "omsk-update-lock-"));
	const targetPath = join(directory, "omsk.exe");
	const operations: string[] = [];
	let releaseFirst!: () => void;
	let firstStarted!: () => void;
	const firstGate = new Promise<void>(resolve => {
		releaseFirst = resolve;
	});
	let secondContended!: () => void;
	const contended = new Promise<void>(resolve => {
		secondContended = resolve;
	});
	const started = new Promise<void>(resolve => {
		firstStarted = resolve;
	});

	try {
		const first = updateCli.withUpdateFileLock(targetPath, async () => {
			operations.push("first-start");
			firstStarted();
			await firstGate;
			operations.push("first-end");
		});
		await started;
		const second = updateCli.withUpdateFileLock(
			targetPath,
			async () => {
				operations.push("second-start");
			},
			secondContended,
		);
		await contended;
		expect(operations).toEqual(["first-start"]);
		releaseFirst();
		await Promise.all([first, second]);
		expect(operations).toEqual(["first-start", "first-end", "second-start"]);
	} finally {
		releaseFirst();
		await rm(directory, { recursive: true, force: true });
	}
});

it("reclaims abandoned update locks from exited processes", async () => {
	const directory = await mkdtemp(join(tmpdir(), "omsk-update-stale-lock-"));
	const targetPath = join(directory, "omsk.exe");
	const lockPath = `${targetPath}.update-lock`;
	try {
		await writeFile(lockPath, JSON.stringify({ pid: 2_147_483_647, token: "abandoned" }));
		let entered = false;
		await updateCli.withUpdateFileLock(targetPath, async () => {
			entered = true;
		});
		expect(entered).toBe(true);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
