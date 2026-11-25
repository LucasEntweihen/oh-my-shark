import { describe, expect, test } from "bun:test";
import { buildModel } from "@oh-my-pi/pi-catalog/build";
import { resolveModelPolicy } from "@oh-my-pi/pi-catalog/compat/resolve";
import { Effort } from "@oh-my-pi/pi-catalog/effort";
import {
	antigravityInteractionsModelManagerOptions,
	googleAntigravitySdkModelManagerOptions,
	PROVIDER_DESCRIPTORS,
} from "@oh-my-pi/pi-catalog/provider-models";

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("google-antigravity-sdk & antigravity-interactions catalog", () => {
	test("registers descriptors with expected defaults and APIs", () => {
		const sdkDesc = PROVIDER_DESCRIPTORS.find(d => d.providerId === "google-antigravity-sdk");
		const intDesc = PROVIDER_DESCRIPTORS.find(d => d.providerId === "antigravity-interactions");

		expect(sdkDesc).toBeDefined();
		expect(sdkDesc?.defaultModel).toBe("gemini-4-hydrogen");
		expect(sdkDesc?.allowUnauthenticated).toBe(true);

		expect(intDesc).toBeDefined();
		expect(intDesc?.defaultModel).toBe("antigravity-preview-09-2026");
	});

	test("exposes verified SDK & LiteRT seeds and merges live Gemini API discovery", async () => {
		const options = googleAntigravitySdkModelManagerOptions({
			apiKey: "test-gemini-key",
			fetch: (async input => {
				const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
				expect(url).toContain("/models");
				return jsonResponse({
					models: [
						{
							name: "models/gemini-4-hydrogen",
							displayName: "Upstream Hydrogen",
							supportedGenerationMethods: ["generateContent"],
							inputTokenLimit: 123,
							outputTokenLimit: 45,
						},
						{
							name: "models/gemini-4-ultra-preview",
							displayName: "Gemini 4 Ultra Preview",
							supportedGenerationMethods: ["generateContent"],
							inputTokenLimit: 1_048_576,
							outputTokenLimit: 65_536,
						},
					],
				});
			}) as typeof fetch,
		});

		expect(options.staticModels?.map(m => m.id)).toContain("gemini-4-hydrogen");
		expect(options.staticModels?.map(m => m.id)).toContain("gemma-4-26b-litert");

		const hydrogenSeed = options.staticModels!.find(m => m.id === "gemini-4-hydrogen")!;
		const builtHydrogen = buildModel(hydrogenSeed);
		expect(builtHydrogen.contextWindow).toBe(1_048_576);
		expect(builtHydrogen.maxTokens).toBe(262_144);
		expect(builtHydrogen.thinking?.efforts).toContain(Effort.XHigh);
		expect(resolveModelPolicy(hydrogenSeed).thinking?.mode).toBe("google-level");

		const dynamic = await options.fetchDynamicModels!();
		expect(dynamic).not.toBeNull();
		const mergedHydrogen = dynamic!.find(m => m.id === "gemini-4-hydrogen")!;
		// Verified static SDK seed keeps its authoritative limits instead of being overwritten.
		expect(mergedHydrogen.contextWindow).toBe(1_048_576);
		const extraUltra = dynamic!.find(m => m.id === "gemini-4-ultra-preview")!;
		expect(extraUltra.api).toBe("antigravity-sdk");
		expect(extraUltra.provider).toBe("google-antigravity-sdk");
		expect(extraUltra.contextWindow).toBe(1_048_576);
	});

	test("exposes managed remote Interactions seed cleanly", () => {
		const options = antigravityInteractionsModelManagerOptions();
		expect(options.providerId).toBe("antigravity-interactions");
		expect(options.staticModels?.map(m => m.id)).toEqual(["antigravity-preview-09-2026"]);
		const agentModel = buildModel(options.staticModels![0]!);
		expect(agentModel.api).toBe("antigravity-interactions");
		expect(agentModel.supportsTools).toBe(true);
	});
});
