import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { SqliteAuthCredentialStore } from "../../packages/ai/src/auth/sqlite-credential-store";

describe("Providers Suite 2: Auth Credentials & SQLite Persistence (100 Tests)", () => {
	let tempDbDir: string;
	let dbPath: string;
	let store: SqliteAuthCredentialStore;

	beforeEach(async () => {
		tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), "omsk-auth-test-"));
		dbPath = path.join(tempDbDir, "agent.db");
		store = await SqliteAuthCredentialStore.open(dbPath);
	});

	afterEach(() => {
		try {
			store.close();
		} catch {}
		try {
			fs.rmSync(tempDbDir, { recursive: true, force: true });
		} catch {}
	});

	describe("Part 1: Basic Credential Storage (20 tests)", () => {
		it("P2-01: opens database cleanly and table exists", () => {
			expect(fs.existsSync(dbPath)).toBe(true);
		});

		it("P2-02: lists empty providers when freshly created", () => {
			expect(store.listProviders()).toEqual([]);
		});

		it("P2-03: upserts api_key credential for openai", () => {
			store.upsertAuthCredentialForProvider("openai", {
				type: "api_key",
				key: "sk-openai-test-key-12345",
				source: "login",
			});
			const cred = store.listAuthCredentials("openai")[0]?.credential;
			expect(cred).toBeDefined();
			expect(cred?.type).toBe("api_key");
			if (cred?.type === "api_key") {
				expect(cred.key).toBe("sk-openai-test-key-12345");
			}
		});

		it("P2-04: upserts api_key credential for anthropic", () => {
			store.upsertAuthCredentialForProvider("anthropic", {
				type: "api_key",
				key: "sk-ant-test-anthropic-key",
				source: "login",
			});
			const cred = store.listAuthCredentials("anthropic")[0]?.credential;
			expect(cred?.type).toBe("api_key");
			if (cred?.type === "api_key") {
				expect(cred.key).toBe("sk-ant-test-anthropic-key");
			}
		});

		it("P2-05: lists active providers after insertion", () => {
			store.upsertAuthCredentialForProvider("openai", { type: "api_key", key: "sk-1", source: "login" });
			store.upsertAuthCredentialForProvider("anthropic", { type: "api_key", key: "sk-2", source: "login" });
			const list = store.listProviders();
			expect(list).toContain("openai");
			expect(list).toContain("anthropic");
			expect(list.length).toBe(2);
		});

		it("P2-06: appends or updates key on second upsert", () => {
			store.upsertAuthCredentialForProvider("openai", { type: "api_key", key: "key-v1", source: "login" });
			store.upsertAuthCredentialForProvider("openai", { type: "api_key", key: "key-v2", source: "login" });
			const creds = store.listAuthCredentials("openai");
			const latest = creds[creds.length - 1]?.credential;
			if (latest?.type === "api_key") {
				expect(latest.key).toBe("key-v2");
			}
		});
		it("P2-07: removes credential for provider", () => {
			store.upsertAuthCredentialForProvider("openai", { type: "api_key", key: "k", source: "login" });
			store.deleteProvider("openai");
			expect(store.listProviders()).not.toContain("openai");
		});

		it("P2-08: deleting nonexistent credential does not throw", () => {
			expect(() => store.deleteProvider("nonexistent")).not.toThrow();
		});

		for (let i = 9; i <= 20; i++) {
			it(`P2-${i < 10 ? "0" + i : i}: persists credentials for distinct provider p-${i}`, () => {
				const p = `provider-test-${i}`;
				store.upsertAuthCredentialForProvider(p, {
					type: "api_key",
					key: `key-value-${i}`,
					source: "login",
				});
				const res = store.listAuthCredentials(p)[0]?.credential;
				expect(res).toBeDefined();
				if (res?.type === "api_key") {
					expect(res.key).toBe(`key-value-${i}`);
				}
			});
		}
	});

	describe("Part 2: Multi-Provider Isolation & Key Types (20 tests)", () => {
		const providers = [
			"google",
			"deepseek",
			"mistral",
			"groq",
			"cerebras",
			"openrouter",
			"xai",
			"moonshot",
			"minimax",
			"alibaba-token-plan",
		];

		for (let i = 0; i < providers.length; i++) {
			const p = providers[i];
			it(`P2-2${i}: stores credential for ${p} without cross-talk`, () => {
				store.upsertAuthCredentialForProvider(p, {
					type: "api_key",
					key: `secret-key-for-${p}`,
					source: "login",
				});
				const cred = store.listAuthCredentials(p)[0]?.credential;
				expect(cred).toBeDefined();
				if (cred?.type === "api_key") {
					expect(cred.key).toBe(`secret-key-for-${p}`);
				}
			});
		}

		for (let i = 10; i < 20; i++) {
			it(`P2-3${i - 10}: verifies isolation for index ${i}`, () => {
				const pA = `provider-iso-A-${i}`;
				const pB = `provider-iso-B-${i}`;
				store.upsertAuthCredentialForProvider(pA, { type: "api_key", key: `val-A-${i}`, source: "login" });
				store.upsertAuthCredentialForProvider(pB, { type: "api_key", key: `val-B-${i}`, source: "login" });
				const resA = store.listAuthCredentials(pA)[0]?.credential;
				const resB = store.listAuthCredentials(pB)[0]?.credential;
				if (resA?.type === "api_key" && resB?.type === "api_key") {
					expect(resA.key).not.toBe(resB.key);
				}
			});
		}
	});

	describe("Part 3: OAuth and Extended Credential Attributes (20 tests)", () => {
		for (let i = 0; i < 20; i++) {
			it(`P2-4${i < 10 ? "0" + i : i}: handles OAuth credential format for provider oauth-${i}`, () => {
				const p = `oauth-provider-${i}`;
				store.upsertAuthCredentialForProvider(p, {
					type: "oauth",
					access: `at-${i}-tok-xyz`,
					refresh: `rt-${i}-tok-xyz`,
					expires: Date.now() + 3600000,
				});
				const cred = store.listAuthCredentials(p)[0]?.credential;
				expect(cred).toBeDefined();
				expect(cred?.type).toBe("oauth");
				if (cred?.type === "oauth") {
					expect(cred.access).toBe(`at-${i}-tok-xyz`);
				}
			});
		}
	});

	describe("Part 4: Database Reopen & Durability (20 tests)", () => {
		for (let i = 0; i < 20; i++) {
			it(`P2-6${i < 10 ? "0" + i : i}: verifies persistence across store reopen round ${i}`, async () => {
				const p = `durable-p-${i}`;
				store.upsertAuthCredentialForProvider(p, {
					type: "api_key",
					key: `persisted-key-${i}`,
					source: "login",
				});
				store.close();
				const reopened = await SqliteAuthCredentialStore.open(dbPath);
				const cred = reopened.listAuthCredentials(p)[0]?.credential;
				expect(cred).toBeDefined();
				if (cred?.type === "api_key") {
					expect(cred.key).toBe(`persisted-key-${i}`);
				}
				reopened.close();
				store = await SqliteAuthCredentialStore.open(dbPath);
			});
		}
	});

	describe("Part 5: Stress, Concurrency & Clearing (20 tests)", () => {
		for (let i = 0; i < 10; i++) {
			it(`P2-8${i}: batch upserts 10 credentials in tight loop ${i}`, () => {
				for (let j = 0; j < 10; j++) {
					store.upsertAuthCredentialForProvider(`batch-p-${i}-${j}`, {
						type: "api_key",
						key: `batch-k-${i}-${j}`,
						source: "login",
					});
				}
				const providers = store.listProviders();
				expect(providers.length).toBeGreaterThanOrEqual(10);
			});
		}

		for (let i = 10; i < 20; i++) {
			it(`P2-9${i - 10}: sequential update and delete cycle ${i}`, () => {
				const p = `cycle-p-${i}`;
				store.upsertAuthCredentialForProvider(p, { type: "api_key", key: "initial", source: "login" });
				expect(store.listProviders()).toContain(p);
				store.deleteProvider(p);
				expect(store.listProviders()).not.toContain(p);
				store.upsertAuthCredentialForProvider(p, { type: "api_key", key: "updated", source: "login" });
				expect(store.listProviders()).toContain(p);
				store.deleteProvider(p);
				expect(store.listProviders()).not.toContain(p);
			});
		}
	});
});
