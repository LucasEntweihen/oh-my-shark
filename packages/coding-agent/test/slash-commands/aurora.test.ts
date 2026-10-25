import { describe, expect, it } from "bun:test";
import { createAuroraHttpServer } from "../../src/aurora/server";
import { AURORA_WEB_ASSETS } from "../../src/aurora/bundle.generated";
import { BUILTIN_SLASH_COMMAND_DEFS } from "../../src/slash-commands/builtin-registry";

describe("Aurora HTTP Server & Harness Integration", () => {
	it("does not register /aurora in builtin slash commands (decoupled GUI)", () => {
		const cmd = BUILTIN_SLASH_COMMAND_DEFS.find((c: { name: string }) => c.name === "aurora");
		expect(cmd).toBeUndefined();
	});

	it("starts Aurora HTTP server with proper headers and cache controls", async () => {
		const { server, port } = await createAuroraHttpServer();
		try {
			// 1. Root / index.html should have no-cache
			const resIndex = await fetch(`http://127.0.0.1:${port}/`);
			expect(resIndex.status).toBe(200);
			expect(resIndex.headers.get("content-type")).toContain("text/html");
			expect(resIndex.headers.get("cache-control")).toBe("no-cache");
			const html = await resIndex.text();
			expect(html).toContain("<!doctype html>");

			// 2. An asset should have long-term immutable cache
			const assetKey = Object.keys(AURORA_WEB_ASSETS).find(k => k.startsWith("assets/"));
			if (assetKey) {
				const resAsset = await fetch(`http://127.0.0.1:${port}/${assetKey}`);
				expect(resAsset.status).toBe(200);
				expect(resAsset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
			}

			// 3. /api/models should return valid JSON with authenticatedProviders
			const resModels = await fetch(`http://127.0.0.1:${port}/api/models`);
			expect(resModels.status).toBe(200);
			const modelsData = (await resModels.json()) as { ok: boolean; models: unknown[]; authenticatedProviders: string[] };
			expect(modelsData.ok).toBe(true);
			expect(Array.isArray(modelsData.models)).toBe(true);
			expect(Array.isArray(modelsData.authenticatedProviders)).toBe(true);

			// 4. /api/providers should return real status of providers
			const resProviders = await fetch(`http://127.0.0.1:${port}/api/providers`);
			expect(resProviders.status).toBe(200);
			const provData = (await resProviders.json()) as { ok: boolean; providers: Array<{ id: string; status: string }> };
			expect(provData.ok).toBe(true);
			expect(Array.isArray(provData.providers)).toBe(true);
			expect(provData.providers.length).toBeGreaterThan(0);

			// 5. /api/tools should return the list of tools supported by harness
			const resTools = await fetch(`http://127.0.0.1:${port}/api/tools`);
			expect(resTools.status).toBe(200);
			const toolsData = (await resTools.json()) as { ok: boolean; tools: Array<{ name: string; description: string }> };
			expect(toolsData.ok).toBe(true);
			expect(toolsData.tools.some(t => t.name === "read")).toBe(true);
			expect(toolsData.tools.some(t => t.name === "write")).toBe(true);
			expect(toolsData.tools.some(t => t.name === "bash")).toBe(true);

			// 6. /api/system/stats should return real telemetry
			const resStats = await fetch(`http://127.0.0.1:${port}/api/system/stats`);
			expect(resStats.status).toBe(200);
			const statsData = (await resStats.json()) as { ok: boolean; stats: { uptime: number; heapUsed: number; cwd: string } };
			expect(statsData.ok).toBe(true);
			expect(statsData.stats.uptime).toBeGreaterThanOrEqual(0);
			expect(statsData.stats.heapUsed).toBeGreaterThan(0);

			// 7. /api/fs/browse should return directory contents
			const resFs = await fetch(`http://127.0.0.1:${port}/api/fs/browse`);
			expect(resFs.status).toBe(200);
			const fsData = (await resFs.json()) as { ok: boolean; currentDir: string; entries: Array<{ name: string }> };
			expect(fsData.ok).toBe(true);
			expect(typeof fsData.currentDir).toBe("string");
			expect(Array.isArray(fsData.entries)).toBe(true);

			// 8. /api/commands should return full catalog of slash commands
			const resCommands = await fetch(`http://127.0.0.1:${port}/api/commands`);
			expect(resCommands.status).toBe(200);
			const commandsData = (await resCommands.json()) as { ok: boolean; commands: Array<{ name: string }> };
			expect(commandsData.ok).toBe(true);
			expect(commandsData.commands.some(c => c.name === "/doomania")).toBe(true);
		} finally {
			server.close();
		}
	});

	it("supports session lifecycle and abort endpoint", async () => {
		const { server, port } = await createAuroraHttpServer();
		try {
			const resSession = await fetch(`http://127.0.0.1:${port}/api/sessions/new`, { method: "POST" });
			expect(resSession.status).toBe(200);
			const sessionJson = (await resSession.json()) as { ok: boolean; sessionId: string };
			expect(sessionJson.ok).toBe(true);
			expect(sessionJson.sessionId.startsWith("sess-")).toBe(true);

			const resAbort = await fetch(`http://127.0.0.1:${port}/api/chat/abort`, { method: "POST" });
			expect(resAbort.status).toBe(200);
			const abortJson = (await resAbort.json()) as { ok: boolean };
			expect(abortJson.ok).toBe(true);
		} finally {
			server.close();
		}
	});
});
