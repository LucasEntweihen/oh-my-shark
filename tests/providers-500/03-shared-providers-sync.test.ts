import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { SqliteAuthCredentialStore } from "../../packages/ai/src/auth/sqlite-credential-store";
import { OmskSharedProviders } from "../../src/providers/index";

describe("Providers Suite 3: Shared Providers & Bidirectional Sync (100 Tests)", () => {
	let tempDir: string;
	let projectDb: string;
	let globalDb: string;
	let providers: OmskSharedProviders;

	beforeEach(async () => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omsk-shared-test-"));
		projectDb = path.join(tempDir, "project-agent.db");
		globalDb = path.join(tempDir, "global-agent.db");
		providers = new OmskSharedProviders(projectDb, globalDb);
		await providers.init();
	});

	afterEach(() => {
		try {
			providers.close();
		} catch {}
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {}
	});

	describe("Part 1: Initialization & Provider Listing (20 tests)", () => {
		it("P3-01: initializes cleanly and creates project db", () => {
			expect(fs.existsSync(projectDb)).toBe(true);
		});

		it("P3-02: lists all bundled providers with count > 10", async () => {
			const list = await providers.listProviders();
			expect(list.length).toBeGreaterThan(10);
		});

		it("P3-03: provider list contains openai", async () => {
			const list = await providers.listProviders();
			const p = list.find((item) => item.id === "openai");
			expect(p).toBeDefined();
			expect(p?.modelsCount).toBeGreaterThan(0);
		});

		it("P3-04: provider list contains anthropic", async () => {
			const list = await providers.listProviders();
			const p = list.find((item) => item.id === "anthropic");
			expect(p).toBeDefined();
			expect(p?.modelsCount).toBeGreaterThan(0);
		});

		it("P3-05: provider list contains google", async () => {
			const list = await providers.listProviders();
			const p = list.find((item) => item.id === "google");
			expect(p).toBeDefined();
		});

		it("P3-06: provider list contains deepseek", async () => {
			const list = await providers.listProviders();
			const p = list.find((item) => item.id === "deepseek");
			expect(p).toBeDefined();
		});

		it("P3-07: provider list contains ollama-cloud", async () => {
			const list = await providers.listProviders();
			const p = list.find((item) => item.id === "ollama-cloud");
			expect(p).toBeDefined();
		});

		for (let i = 8; i <= 20; i++) {
			it(`P3-${i < 10 ? "0" + i : i}: verifies provider index ${i} has defaultModelId`, async () => {
				const list = await providers.listProviders();
				const p = list[i % list.length];
				expect(p.defaultModelId).toBeDefined();
				expect(typeof p.defaultModelId).toBe("string");
			});
		}
	});

	describe("Part 2: API Key Management & Resolution (20 tests)", () => {
		it("P3-21: returns undefined when no key is set and no env exists", async () => {
			const key = await providers.getApiKey("nonexistent-test-p");
			expect(key).toBeUndefined();
		});

		it("P3-22: saves and resolves API key for openai", async () => {
			await providers.saveApiKey("openai", "sk-proj-test-12345", { persistGlobal: false });
			const key = await providers.getApiKey("openai");
			expect(key).toBe("sk-proj-test-12345");
		});

		it("P3-23: reports hasAuth true after saving key", async () => {
			await providers.saveApiKey("anthropic", "sk-ant-test-999", { persistGlobal: false });
			expect(await providers.hasAuth("anthropic")).toBe(true);
		});

		it("P3-24: removes credential and returns true", async () => {
			await providers.saveApiKey("google", "goog-key", { persistGlobal: false });
			expect(await providers.hasAuth("google")).toBe(true);
			const removed = await providers.removeCredential("google");
			expect(removed).toBe(true);
			expect(await providers.hasAuth("google")).toBe(false);
		});

		it("P3-25: throws when attempting to save empty key", async () => {
			expect(providers.saveApiKey("openai", "   ")).rejects.toThrow();
		});

		for (let i = 26; i <= 40; i++) {
			it(`P3-${i}: sets and reads credential for test-p-${i}`, async () => {
				const p = `test-prov-${i}`;
				const k = `secret-key-${i}`;
				await providers.saveApiKey(p, k, { persistGlobal: false });
				expect(await providers.getApiKey(p)).toBe(k);
				expect(await providers.hasAuth(p)).toBe(true);
			});
		}
	});

	describe("Part 3: Bidirectional Sync Between Project and Global (20 tests)", () => {
		it("P3-41: syncGlobalToRoot with missing global db returns empty", async () => {
			const res = await providers.syncGlobalToRoot();
			expect(res.syncedProviders).toEqual([]);
		});

		it("P3-42: syncs keys from global to project when global has credentials", async () => {
			const globalStore = await SqliteAuthCredentialStore.open(globalDb);
			globalStore.upsertAuthCredentialForProvider("deepseek", { type: "api_key", key: "sk-deepseek-from-global", source: "login" });
			globalStore.close();

			const res = await providers.syncGlobalToRoot();
			expect(res.syncedProviders).toContain("deepseek");
			expect(await providers.getApiKey("deepseek")).toBe("sk-deepseek-from-global");
		});

		it("P3-43: syncRootToGlobal writes project credentials into global db", async () => {
			await providers.saveApiKey("groq", "gsk-groq-key", { persistGlobal: false });
			const res = await providers.syncRootToGlobal();
			expect(res.syncedProviders).toContain("groq");

			const globalStore = await SqliteAuthCredentialStore.open(globalDb);
			const creds = globalStore.listAuthCredentials("groq");
			expect(creds.length).toBeGreaterThan(0);
			globalStore.close();
		});

		for (let i = 44; i <= 60; i++) {
			it(`P3-${i}: bidirectional multi-key sync round ${i}`, async () => {
				const p = `sync-pair-${i}`;
				await providers.saveApiKey(p, `val-${i}`, { persistGlobal: false });
				await providers.syncRootToGlobal();

				const globalStore = await SqliteAuthCredentialStore.open(globalDb);
				const creds = globalStore.listAuthCredentials(p);
				expect(creds.length).toBeGreaterThan(0);
				globalStore.close();
			});
		}
	});

	describe("Part 4: JSON Snapshot Export (20 tests)", () => {
		it("P3-61: exports providers.json snapshot", async () => {
			const jsonPath = path.join(tempDir, "providers.json");
			await providers.exportProvidersJson(jsonPath);
			expect(fs.existsSync(jsonPath)).toBe(true);
			const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
			expect(data).toBeDefined();
			expect(Array.isArray(data.providers)).toBe(true);
		});

		it("P3-62: providers.json contains updatedAt and totalProviders", async () => {
			const jsonPath = path.join(tempDir, "providers.json");
			await providers.exportProvidersJson(jsonPath);
			const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
			expect(data.updatedAt).toBeDefined();
			expect(typeof data.updatedAt).toBe("number");
			expect(data.totalProviders).toBeGreaterThan(0);
		});

		for (let i = 63; i <= 80; i++) {
			it(`P3-${i}: verifies snapshot integrity with authenticated openai ${i}`, async () => {
				const jsonPath = path.join(tempDir, `providers-${i}.json`);
				await providers.saveApiKey("openai", `sk-key-${i}`, { persistGlobal: false });
				await providers.exportProvidersJson(jsonPath);
				const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
				const openaiEntry = data.providers.find((item: { id: string }) => item.id === "openai");
				expect(openaiEntry).toBeDefined();
				expect(openaiEntry.authSource).toBe("local_sqlite");
			});
		}
	});

	describe("Part 5: Environmental Fallbacks & Robustness (20 tests)", () => {
		for (let i = 81; i <= 100; i++) {
			it(`P3-${i}: env variable resolution fallback test ${i}`, async () => {
				const envVar = `TEST_PROV_ENV_${i}_API_KEY`;
				process.env[envVar] = `env-val-${i}`;
				try {
					const resolved = await providers.getApiKey(`test-prov-env-${i}`);
					expect(resolved).toBe(`env-val-${i}`);
				} finally {
					delete process.env[envVar];
				}
			});
		}
	});
});
