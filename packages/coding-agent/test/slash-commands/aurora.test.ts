import { describe, expect, it } from "bun:test";
import { createAuroraHttpServer } from "../../src/aurora/server";
import { AURORA_WEB_ASSETS } from "../../src/aurora/bundle.generated";
import { BUILTIN_SLASH_COMMAND_DEFS } from "../../src/slash-commands/builtin-registry";

describe("/aurora and /gui slash command", () => {
	it("registers /aurora in builtin slash commands with aliases", () => {
		const cmd = BUILTIN_SLASH_COMMAND_DEFS.find((c: { name: string }) => c.name === "aurora");
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe("aurora");
		expect(cmd?.aliases).toContain("gui");
		expect(cmd?.aliases).toContain("app");
		expect(cmd?.aliases).toContain("desktop");
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
			const assetKey = Object.keys(AURORA_WEB_ASSETS).find((k) => k.startsWith("assets/"));
			if (assetKey) {
				const resAsset = await fetch(`http://127.0.0.1:${port}/${assetKey}`);
				expect(resAsset.status).toBe(200);
				expect(resAsset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
			}

			// 3. /api/models should return valid JSON
			const resModels = await fetch(`http://127.0.0.1:${port}/api/models`);
			expect(resModels.status).toBe(200);
			const json = (await resModels.json()) as { ok: boolean };
			expect(json.ok).toBe(true);
		} finally {
			server.close();
		}
	});
});
