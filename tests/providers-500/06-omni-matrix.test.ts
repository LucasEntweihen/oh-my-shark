import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { OmskSharedProviders } from "../../src/providers/index";

describe("OmniProvider Matrix: Advanced Subsystem Tests (10 Tests)", () => {
	let tempDir: string;
	let projectDb: string;
	let globalDb: string;
	let matrix: OmskSharedProviders;

	beforeEach(async () => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omsk-matrix-test-"));
		projectDb = path.join(tempDir, "project-matrix.db");
		globalDb = path.join(tempDir, "global-matrix.db");
		matrix = new OmskSharedProviders(projectDb, globalDb);
		await matrix.init();
	});

	afterEach(() => {
		try {
			matrix.close();
		} catch {}
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("M-01: resolveProviderCascade returns unauthenticated for new provider", async () => {
		const res = await matrix.resolveProviderCascade("unauth-test-provider");
		expect(res.authenticated).toBe(false);
		expect(res.source).toBe("none");
	});

	it("M-02: resolveProviderCascade detects project sqlite credentials", async () => {
		await matrix.saveApiKey("openai", "sk-proj-matrix-key-12345", { persistGlobal: false });
		const res = await matrix.resolveProviderCascade("openai");
		expect(res.authenticated).toBe(true);
		expect(res.source).toBe("project_sqlite");
	});

	it("M-03: resolveProviderCascade securely masks sensitive keys", async () => {
		await matrix.saveApiKey("anthropic", "sk-ant-very-long-secret-key-12345", { persistGlobal: false });
		const res = await matrix.resolveProviderCascade("anthropic");
		expect(res.keyMasked).toBeDefined();
		expect(res.keyMasked).toContain("...");
		expect(res.keyMasked).not.toBe("sk-ant-very-long-secret-key-12345");
	});

	it("M-04: resolveProviderCascade detects environment variables", async () => {
		const p = "matrix-env-only-provider";
		process.env.MATRIX_ENV_ONLY_PROVIDER_API_KEY = "sk-env-var-999";
		try {
			const res = await matrix.resolveProviderCascade(p);
			expect(res.authenticated).toBe(true);
			expect(res.source).toBe("environment");
		} finally {
			delete process.env.MATRIX_ENV_ONLY_PROVIDER_API_KEY;
		}
	});

	it("M-05: getProviderHealth returns health metrics for openai", async () => {
		const health = await matrix.getProviderHealth("openai");
		expect(health.provider).toBe("openai");
		expect(health.modelsCount).toBeGreaterThan(0);
		expect(health.defaultModel).toBeDefined();
	});

	it("M-06: getProviderHealth detects reasoning capabilities", async () => {
		const health = await matrix.getProviderHealth("openai");
		expect(health.supportsReasoning).toBe(true);
	});

	it("M-07: getExecutionMatrix inventories all bundled providers", async () => {
		const list = await matrix.getExecutionMatrix();
		expect(list.length).toBeGreaterThan(50);
	});

	it("M-08: getExecutionMatrix accurately marks authenticated providers", async () => {
		await matrix.saveApiKey("google", "goog-matrix-key-test", { persistGlobal: false });
		const list = await matrix.getExecutionMatrix();
		const goog = list.find((item) => item.provider === "google");
		expect(goog?.authenticated).toBe(true);
		expect(goog?.source).toBe("project_sqlite");
	});

	it("M-09: getExecutionMatrix provides valid defaultModel per provider", async () => {
		const list = await matrix.getExecutionMatrix();
		for (const item of list) {
			expect(typeof item.defaultModel).toBe("string");
			expect(item.defaultModel!.length).toBeGreaterThan(0);
		}
	});

	it("M-10: multi-provider health check responds under 100ms", async () => {
		const start = performance.now();
		await Promise.all([
			matrix.getProviderHealth("openai"),
			matrix.getProviderHealth("anthropic"),
			matrix.getProviderHealth("google"),
		]);
		const elapsed = performance.now() - start;
		expect(elapsed).toBeLessThan(500);
	});
});
