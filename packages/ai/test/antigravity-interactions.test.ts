import { describe, expect, it } from "bun:test";
import { streamAntigravityInteractions } from "@oh-my-pi/pi-ai/providers/antigravity-interactions";
import { countGoogleTokens } from "@oh-my-pi/pi-ai/providers/google-shared";
import type { Context, FetchImpl, Message } from "@oh-my-pi/pi-ai/types";
import { buildModel } from "@oh-my-pi/pi-catalog/build";

const interactionsModel = buildModel({
	api: "antigravity-interactions",
	provider: "antigravity-interactions",
	id: "antigravity-preview-09-2026",
	name: "Antigravity Managed Agent",
	baseUrl: "https://generativelanguage.googleapis.com/v1beta",
	input: ["text", "image"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	maxTokens: 65_536,
	contextWindow: 135_000,
	reasoning: true,
});

const geminiModel = buildModel({
	api: "google-generative-ai",
	provider: "google",
	id: "gemini-3.1-pro-preview",
	name: "Gemini 3.1 Pro",
	baseUrl: "https://generativelanguage.googleapis.com/v1beta",
	input: ["text", "image"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	maxTokens: 65_536,
	contextWindow: 1_048_576,
	reasoning: true,
});

describe("antigravity-interactions provider", () => {
	it("creates remote interactions, chains previous_interaction_id + environment, and records usage", async () => {
		const recordedRequests: Array<{ url: string; body: Record<string, unknown> }> = [];
		const mockFetch = (async (input, init) => {
			const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
			const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
			recordedRequests.push({ url, body });

			if (recordedRequests.length === 1) {
				return new Response(
					JSON.stringify({
						id: "int_001",
						status: "incomplete",
						environment_id: "env_remote_abc",
						outputs: [
							{ type: "thought", thought: "Planning remote script..." },
							{ type: "text", text: "Step 1 complete." },
						],
						usage: { input_tokens: 500, output_tokens: 200, thought_tokens: 80, total_tokens: 700 },
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			}

			return new Response(
				JSON.stringify({
					id: "int_002",
					status: "completed",
					environment_id: "env_remote_abc",
					output_text: "Final report PDF ready.",
					usage: { input_tokens: 300, output_tokens: 150, cached_tokens: 400, total_tokens: 850 },
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}) as FetchImpl;

		const u1: Message = { role: "user", content: "Analyze logs", timestamp: 1 };
		const turn1 = await streamAntigravityInteractions(
			interactionsModel,
			{ systemPrompt: ["Be precise."], messages: [u1] },
			{ apiKey: "AIza-test", maxTotalTokens: 50_000, fetch: mockFetch },
		).result();

		expect(turn1.stopReason).toBe("length");
		expect(turn1.providerPayload).toMatchObject({
			type: "antigravityInteractions",
			interactionId: "int_001",
			environmentId: "env_remote_abc",
		});
		expect(turn1.usage.input).toBe(500);
		expect(turn1.usage.output).toBe(200);
		expect(turn1.usage.reasoningTokens).toBe(80);
		expect(recordedRequests[0]?.body.previous_interaction_id).toBeUndefined();
		expect(recordedRequests[0]?.body.agent_config).toEqual({
			type: "antigravity",
			max_total_tokens: 50_000,
		});

		const u2: Message = { role: "user", content: "Continue and finish the PDF", timestamp: 2 };
		const turn2 = await streamAntigravityInteractions(
			interactionsModel,
			{ systemPrompt: ["Be precise."], messages: [u1, turn1, u2] },
			{ apiKey: "AIza-test", fetch: mockFetch },
		).result();

		expect(turn2.stopReason).toBe("stop");
		expect(recordedRequests[1]?.body.previous_interaction_id).toBe("int_001");
		expect(recordedRequests[1]?.body.environment).toBe("env_remote_abc");
		expect(recordedRequests[1]?.body.input).toBe("Continue and finish the PDF");
		expect(turn2.usage.cacheRead).toBe(400);
	});

	it("maps HTTP 429 errors without retrying indefinitely", async () => {
		const mockFetch = (async () =>
			new Response(
				JSON.stringify({ error: { code: 429, message: "Quota exhausted", status: "RESOURCE_EXHAUSTED" } }),
				{ status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
			)) as FetchImpl;

		const out = await streamAntigravityInteractions(
			interactionsModel,
			{ messages: [{ role: "user", content: "hi", timestamp: 1 }] },
			{ apiKey: "AIza-test", maxRetryDelayMs: 1, fetch: mockFetch },
		).result();

		expect(out.stopReason).toBe("error");
		expect(out.errorStatus).toBe(429);
		expect(out.errorMessage).toContain("RESOURCE_EXHAUSTED");
	});
});

describe("countGoogleTokens", () => {
	it("counts preflight tokens for Gemini API including system instructions", async () => {
		let capturedUrl = "";
		let capturedBody: Record<string, unknown> = {};
		const context: Context = {
			systemPrompt: ["Follow repo rules."],
			messages: [{ role: "user", content: "Count me", timestamp: 1 }],
		};

		const result = await countGoogleTokens(geminiModel, context, {
			apiKey: "AIza-key",
			fetch: (async (input, init) => {
				capturedUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
				capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
				return new Response(JSON.stringify({ totalTokens: 42, cachedContentTokenCount: 12 }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}) as FetchImpl,
		});

		expect(capturedUrl).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:countTokens");
		expect(capturedBody.generateContentRequest).toBeDefined();
		expect(result).toEqual({ totalTokens: 42, cachedContentTokenCount: 12 });
	});
});
