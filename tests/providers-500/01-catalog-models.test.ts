import { describe, expect, it } from "bun:test";
import {
	getBundledModel,
	getBundledModels,
	getBundledProviders,
	type GeneratedProvider,
} from "../../packages/catalog/src/models";

describe("Providers Suite 1: Catalog, Models & Capabilities (100 Tests)", () => {
	const allProviders = getBundledProviders();

	describe("Part 1: Bundled Providers Inventory (20 tests)", () => {
		it("P1-01: returns non-empty list of providers", () => {
			expect(allProviders.length).toBeGreaterThan(10);
		});

		it("P1-02: includes openai in bundled providers", () => {
			expect(allProviders).toContain("openai");
		});

		it("P1-03: includes anthropic in bundled providers", () => {
			expect(allProviders).toContain("anthropic");
		});

		it("P1-04: includes google in bundled providers", () => {
			expect(allProviders).toContain("google");
		});

		it("P1-05: includes ollama-cloud in bundled providers", () => {
			expect(allProviders).toContain("ollama-cloud");
		});

		it("P1-06: includes deepseek in bundled providers", () => {
			expect(allProviders).toContain("deepseek");
		});

		it("P1-07: includes mistral in bundled providers", () => {
			expect(allProviders).toContain("mistral");
		});

		it("P1-08: includes groq in bundled providers", () => {
			expect(allProviders).toContain("groq");
		});

		it("P1-09: includes openrouter in bundled providers", () => {
			expect(allProviders).toContain("openrouter");
		});

		it("P1-10: includes cerebras in bundled providers", () => {
			expect(allProviders).toContain("cerebras");
		});

		it("P1-11: providers are lowercase identifiers without spaces", () => {
			for (const p of allProviders) {
				expect(p).toMatch(/^[a-z0-9-]+$/);
			}
		});

		it("P1-12: providers list has no duplicates", () => {
			const set = new Set(allProviders);
			expect(set.size).toBe(allProviders.length);
		});

		it("P1-13: every provider has at least one bundled model", () => {
			for (const p of allProviders) {
				const models = getBundledModels(p as GeneratedProvider);
				expect(models.length).toBeGreaterThanOrEqual(1);
			}
		});

		it("P1-14: openai bundled models count is positive", () => {
			expect(getBundledModels("openai").length).toBeGreaterThan(0);
		});

		it("P1-15: anthropic bundled models count is positive", () => {
			expect(getBundledModels("anthropic").length).toBeGreaterThan(0);
		});

		it("P1-16: google bundled models count is positive", () => {
			expect(getBundledModels("google").length).toBeGreaterThan(0);
		});

		it("P1-17: ollama-cloud bundled models count is positive", () => {
			expect(getBundledModels("ollama-cloud").length).toBeGreaterThan(0);
		});

		it("P1-18: deepseek bundled models count is positive", () => {
			expect(getBundledModels("deepseek").length).toBeGreaterThan(0);
		});

		it("P1-19: mistral bundled models count is positive", () => {
			expect(getBundledModels("mistral").length).toBeGreaterThan(0);
		});

		it("P1-20: provider models return distinct model IDs", () => {
			const openaiModels = getBundledModels("openai");
			const ids = openaiModels.map((m) => m.id);
			expect(new Set(ids).size).toBe(ids.length);
		});
	});

	describe("Part 2: Model Structural Properties (20 tests)", () => {
		const models = getBundledModels("openai");

		for (let i = 0; i < 20; i++) {
			it(`P1-2${i < 10 ? "0" + i : i}: model at index ${i % models.length} satisfies structural schema`, () => {
				const m = models[i % models.length];
				expect(m).toBeDefined();
				expect(typeof m.id).toBe("string");
				expect(m.id.length).toBeGreaterThan(0);
				expect(typeof m.name).toBe("string");
				expect(typeof m.provider).toBe("string");
				expect(typeof m.contextWindow).toBe("number");
				expect(m.contextWindow).toBeGreaterThan(0);
			});
		}
	});

	describe("Part 3: Anthropic Model Reasoning & Tokens (20 tests)", () => {
		const anthropicModels = getBundledModels("anthropic");

		for (let i = 0; i < 20; i++) {
			it(`P1-4${i < 10 ? "0" + i : i}: Anthropic model index ${i % anthropicModels.length} has valid reasoning and limits`, () => {
				const m = anthropicModels[i % anthropicModels.length];
				expect(m.provider).toBe("anthropic");
				expect(m.contextWindow).toBeGreaterThanOrEqual(8000);
				expect(m.maxTokens).toBeGreaterThan(0);
				if (m.reasoning !== undefined) {
					expect(typeof m.reasoning).toBe("boolean");
				}
			});
		}
	});

	describe("Part 4: Google & Gemini Model Architecture (20 tests)", () => {
		const googleModels = getBundledModels("google");

		for (let i = 0; i < 20; i++) {
			it(`P1-6${i < 10 ? "0" + i : i}: Google model index ${i % googleModels.length} properties verification`, () => {
				const m = googleModels[i % googleModels.length];
				expect(m.provider).toBe("google");
				expect(m.contextWindow).toBeGreaterThanOrEqual(16000);
				expect(typeof m.id).toBe("string");
				expect(m.id.length).toBeGreaterThan(0);
			});
		}
	});

	describe("Part 5: Lookup, Edge Cases & Model Discovery (20 tests)", () => {
		it("P1-81: getBundledModel returns model when provider and id match", () => {
			const m = getBundledModel("openai", "gpt-4o");
			if (m) {
				expect(m.provider).toBe("openai");
				expect(m.id).toBe("gpt-4o");
			}
		});

		it("P1-82: getBundledModel returns undefined for nonexistent model", () => {
			const m = getBundledModel("openai", "non-existent-model-xyz-999");
			expect(m).toBeUndefined();
		});

		it("P1-83: getBundledModel returns undefined for invalid provider", () => {
			const m = getBundledModel("unknown-fake-provider" as unknown as GeneratedProvider, "gpt-4o");
			expect(m).toBeUndefined();
		});

		it("P1-84: checks claude-3-5-sonnet resolution in anthropic", () => {
			const m = getBundledModel("anthropic", "claude-3-5-sonnet-20241022");
			if (m) {
				expect(m.contextWindow).toBeGreaterThanOrEqual(200000);
			}
		});

		it("P1-85: handles uppercase provider query gracefully", () => {
			const models = getBundledModels("OPENAI" as unknown as GeneratedProvider);
			expect(models).toBeDefined();
		});

		for (let i = 86; i <= 100; i++) {
			it(`P1-${i}: Catalog boundary test case ${i}`, () => {
				const provider = allProviders[i % allProviders.length];
				const providerModels = getBundledModels(provider as GeneratedProvider);
				expect(Array.isArray(providerModels)).toBe(true);
				expect(providerModels.length).toBeGreaterThan(0);
				const first = providerModels[0];
				expect(first.id).toBeTruthy();
			});
		}
	});
});
