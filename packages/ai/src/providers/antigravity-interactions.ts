/**
 * Managed remote Antigravity Sandbox Agent provider via Gemini Interactions API
 * (`POST {baseUrl}/interactions`, `antigravity-preview-09-2026`).
 *
 * Chains multi-turn stateful remote environments safely via `previous_interaction_id`
 * + `environment` only when the preceding transcript digest matches.
 */
import * as crypto from "node:crypto";
import type { Effort } from "@oh-my-pi/pi-catalog/effort";
import { fetchWithRetry, isRecord } from "@oh-my-pi/pi-utils";
import * as AIError from "../error";
import { getEnvApiKey } from "../env-api-key";
import type { AntigravityInteractionsPayload, Context, FetchImpl, Model, StreamFunction, StreamOptions } from "../types";
import { AssistantMessageEventStream } from "../utils/event-stream";
import { StepWriter } from "./antigravity-cli/step-writer";
import { inputBlocks, isInputMessage, replayPrompt, transcriptDigest } from "./antigravity-cli/reconcile";
import { extractGoogleErrorMessage } from "./google-shared";

export interface AntigravityInteractionsOptions extends StreamOptions {
	reasoning?: Effort;
	/** Remote sandbox environment identifier or `"remote"` to allocate one. */
	environmentId?: string;
	/** Explicit prior interaction ID to resume from. */
	previousInteractionId?: string;
	/** Best-effort total token budget (`agent_config.max_total_tokens`). */
	maxTotalTokens?: number;
	/** Optional underlying planner/executor model hint for `agent_config.model`. */
	interactionModel?: string;
}

interface InteractionsOutputBlock {
	type?: string;
	text?: string;
	thought?: string;
	summary?: string;
}

interface InteractionsUsage {
	input_tokens?: number;
	output_tokens?: number;
	cached_tokens?: number;
	thought_tokens?: number;
	thinking_tokens?: number;
	total_tokens?: number;
}

interface InteractionsResponseBody {
	id?: string;
	status?: string;
	environment?: string;
	environment_id?: string;
	output_text?: string;
	outputs?: InteractionsOutputBlock[];
	usage?: InteractionsUsage;
	error?: { code?: string; message?: string };
}

const DEFAULT_INTERACTIONS_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Streams one managed remote Antigravity interaction step via Gemini Interactions API. */
export const streamAntigravityInteractions: StreamFunction<"antigravity-interactions"> = (
	model: Model<"antigravity-interactions">,
	context: Context,
	options: AntigravityInteractionsOptions = {},
): AssistantMessageEventStream => {
	const stream = new AssistantMessageEventStream();
	const writer = new StepWriter(model, stream);
	void runInteractionStep(model, context, options, writer).catch(async error => {
		writer.fail(
			await AIError.finalize(error, {
				api: model.api,
				provider: model.provider,
				model: model.id,
				signal: options.signal,
			}),
		);
	});
	return stream;
};

async function runInteractionStep(
	model: Model<"antigravity-interactions">,
	context: Context,
	options: AntigravityInteractionsOptions,
	writer: StepWriter,
): Promise<void> {
	options.signal?.throwIfAborted();
	const apiKey = options.apiKey?.trim() || getEnvApiKey(model.provider)?.trim();
	if (!apiKey) {
		throw new AIError.MissingApiKeyError(
			model.provider,
			"Antigravity Interactions API requires GEMINI_API_KEY or options.apiKey.",
		);
	}

	const continuation = resolveContinuation(context.messages, options);
	const input = buildInteractionInput(continuation.messages);
	const systemInstruction = (context.systemPrompt ?? []).filter(Boolean).join("\n\n");

	const agentConfig: Record<string, unknown> = {
		type: "antigravity",
		...(options.interactionModel ? { model: options.interactionModel } : {}),
		...(options.maxTotalTokens !== undefined && Number.isFinite(options.maxTotalTokens) && options.maxTotalTokens > 0
			? { max_total_tokens: Math.floor(options.maxTotalTokens) }
			: {}),
	};

	const payloadBody: Record<string, unknown> = {
		agent: model.id,
		input,
		environment: continuation.environment,
		agent_config: agentConfig,
		...(continuation.previousInteractionId ? { previous_interaction_id: continuation.previousInteractionId } : {}),
		...(!continuation.previousInteractionId && systemInstruction ? { system_instruction: systemInstruction } : {}),
	};

	const base = (model.baseUrl?.trim() || DEFAULT_INTERACTIONS_BASE).replace(/\/+$/, "");
	const url = `${base}/interactions`;
	const fetchImpl = options.fetch ?? (globalThis.fetch.bind(globalThis) as FetchImpl);

	const response = await fetchWithRetry(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-goog-api-key": apiKey,
			...model.headers,
			...options.headers,
		},
		body: JSON.stringify(payloadBody),
		signal: options.signal,
		maxAttempts: 3,
		maxDelayMs: options.maxRetryDelayMs,
		fetch: fetchImpl,
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		throw new AIError.GoogleApiError(
			`Antigravity Interactions API error (${response.status}): ${extractGoogleErrorMessage(errorText, response.status)}`,
			response.status,
			{ headers: response.headers },
		);
	}

	const parsed: unknown = await response.json();
	if (!isRecord(parsed)) {
		throw new AIError.ProviderResponseError("Antigravity Interactions API returned non-object JSON", {
			kind: "envelope",
		});
	}
	const raw = parsed as InteractionsResponseBody;
	if (raw.status === "failed") {
		const errorMsg = isRecord(raw.error) && typeof raw.error.message === "string" ? raw.error.message : undefined;
		throw new AIError.ProviderResponseError(errorMsg || "Antigravity remote interaction failed", {
			kind: "output",
		});
	}
	if (raw.status === "cancelled") {
		throw new Error("Antigravity remote interaction was cancelled");
	}

	emitInteractionOutputs(raw, writer);
	recordInteractionUsage(isRecord(raw.usage) ? (raw.usage as InteractionsUsage) : undefined, writer);

	const interactionId =
		(typeof raw.id === "string" && raw.id) || continuation.previousInteractionId || `int_${crypto.randomUUID()}`;
	const environmentId =
		(typeof raw.environment_id === "string" && raw.environment_id) ||
		(typeof raw.environment === "string" && raw.environment) ||
		continuation.environment;
	const digest = transcriptDigest([...context.messages, writer.output]);
	const payload: AntigravityInteractionsPayload = {
		type: "antigravityInteractions",
		interactionId,
		environmentId,
		digest,
	};
	writer.finish(raw.status === "incomplete" ? "length" : "stop", payload);
}

function resolveContinuation(
	messages: Context["messages"],
	options: AntigravityInteractionsOptions,
): {
	previousInteractionId?: string;
	environment: string;
	messages: Context["messages"];
} {
	if (options.previousInteractionId) {
		const lastUserIdx = messages.findLastIndex(msg => !isInputMessage(msg));
		const tail = lastUserIdx >= 0 ? messages.slice(lastUserIdx + 1) : messages;
		return {
			previousInteractionId: options.previousInteractionId,
			environment: options.environmentId ?? "remote",
			messages: tail.length > 0 ? tail : messages,
		};
	}

	const lastAssistantIdx = messages.findLastIndex(msg => msg.role === "assistant");
	if (lastAssistantIdx >= 0) {
		const assistant = messages[lastAssistantIdx]!;
		const payload = assistant.role === "assistant" ? assistant.providerPayload : undefined;
		if (
			payload?.type === "antigravityInteractions" &&
			transcriptDigest(messages.slice(0, lastAssistantIdx + 1)) === payload.digest
		) {
			const tail = messages.slice(lastAssistantIdx + 1);
			if (tail.length > 0 && tail.every(isInputMessage)) {
				return {
					previousInteractionId: payload.interactionId,
					environment: options.environmentId ?? payload.environmentId ?? "remote",
					messages: tail,
				};
			}
		}
	}

	return {
		environment: options.environmentId ?? "remote",
		messages,
	};
}

function buildInteractionInput(messages: Context["messages"]): string | Array<Record<string, unknown>> {
	const usesIncrementalInput = messages.length > 0 && messages.every(isInputMessage);
	const blocks = usesIncrementalInput ? messages.flatMap(inputBlocks) : replayPrompt(messages);
	if (blocks.length === 0) {
		throw new AIError.ValidationError("Antigravity Interactions API requires non-empty input");
	}
	if (blocks.every(block => block.type === "text")) {
		return blocks.map(block => block.text).join("\n\n");
	}
	const parts: Array<Record<string, unknown>> = [];
	for (const block of blocks) {
		if (block.type === "text") {
			parts.push({ type: "text", text: block.text });
		} else if (block.type === "image") {
			parts.push({ type: "image", data: block.data, mime_type: block.mimeType });
		}
	}
	return parts;
}

function emitInteractionOutputs(raw: InteractionsResponseBody, writer: StepWriter): void {
	let emittedText = false;
	if (Array.isArray(raw.outputs)) {
		for (const item of raw.outputs) {
			if (!isRecord(item)) continue;
			if (item.type === "thought" && typeof item.thought === "string") {
				writer.thinking(item.thought);
			} else if (typeof item.summary === "string" && item.type === "thought") {
				writer.thinking(item.summary);
			} else if (typeof item.text === "string" && item.text.length > 0) {
				writer.text(item.text);
				emittedText = true;
			}
		}
	}
	if (!emittedText && typeof raw.output_text === "string" && raw.output_text.length > 0) {
		writer.text(raw.output_text);
	}
}

function recordInteractionUsage(usage: InteractionsUsage | undefined, writer: StepWriter): void {
	if (!usage || !isRecord(usage)) return;
	const out = writer.output.usage;
	if (typeof usage.input_tokens === "number") out.input = usage.input_tokens;
	if (typeof usage.output_tokens === "number") out.output = usage.output_tokens;
	if (typeof usage.cached_tokens === "number") out.cacheRead = usage.cached_tokens;
	const thought = usage.thought_tokens ?? usage.thinking_tokens;
	if (typeof thought === "number") out.reasoningTokens = thought;
	out.totalTokens =
		typeof usage.total_tokens === "number"
			? usage.total_tokens
			: out.input + out.output + out.cacheRead + out.cacheWrite;
}
