import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { type } from "@oh-my-pi/omptype";
import { StepWriter } from "@oh-my-pi/pi-ai/providers/antigravity-cli/step-writer";
import {
	AntigravitySdkHost,
	resolveSdkAuth,
	type SdkTransportOptions,
	type SdkWorkerTransport,
} from "@oh-my-pi/pi-ai/providers/antigravity-sdk/host";
import { McpHttpBroker } from "@oh-my-pi/pi-ai/providers/antigravity-sdk/mcp-http-broker";
import type { AssistantMessage, Context, Message, Tool, ToolResultMessage } from "@oh-my-pi/pi-ai/types";
import { AssistantMessageEventStream } from "@oh-my-pi/pi-ai/utils/event-stream";
import { buildModel } from "@oh-my-pi/pi-catalog/build";

const sdkModel = buildModel({
	api: "antigravity-sdk",
	provider: "google-antigravity-sdk",
	id: "gemini-4-hydrogen",
	name: "Gemini 4 Hydrogen (Antigravity SDK)",
	baseUrl: "https://generativelanguage.googleapis.com/v1beta",
	input: ["text", "image"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	maxTokens: 262_144,
	contextWindow: 1_048_576,
	reasoning: true,
	supportsTools: true,
});

const readTool: Tool = {
	name: "read",
	description: "Read workspace file",
	parameters: type({ path: "string" }),
};

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) {
		await cleanup();
	}
});

async function runSdkStep(
	host: AntigravitySdkHost,
	context: Context,
	options: Parameters<AntigravitySdkHost["step"]>[2] = {},
): Promise<AssistantMessage> {
	const stream = new AssistantMessageEventStream();
	const writer = new StepWriter(sdkModel, stream);
	await host.step(sdkModel, context, options, writer);
	return writer.output;
}

describe("McpHttpBroker", () => {
	it("rejects unauthorized callers and enforces per-session bearer authentication", async () => {
		const broker = new McpHttpBroker(
			[
				{
					name: "read",
					description: "Read file",
					inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
				},
			],
			async (_name, args) => ({
				content: [{ type: "text", text: `read:${JSON.stringify(args)}` }],
			}),
		);
		cleanups.push(() => broker.close());

		const unauth = await fetch(broker.url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
		});
		expect(unauth.status).toBe(401);

		const listRes = await fetch(broker.url, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...broker.headers },
			body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
		});
		expect(listRes.status).toBe(200);
		const listJson = (await listRes.json()) as { result: { tools: Array<{ name: string }> } };
		expect(listJson.result.tools.map(t => t.name)).toEqual(["read"]);

		const unknownRes = await fetch(broker.url, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...broker.headers },
			body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "evil", arguments: {} } }),
		});
		const unknownJson = (await unknownRes.json()) as { error?: { code: number; message: string } };
		expect(unknownJson.error?.code).toBe(-32602);

		const callRes = await fetch(broker.url, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...broker.headers },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 4,
				method: "tools/call",
				params: { name: "read", arguments: { path: "src/index.ts" } },
			}),
		});
		const callJson = (await callRes.json()) as { result: { content: Array<{ text: string }> } };
		expect(callJson.result.content[0]?.text).toContain("src/index.ts");
	});
});

describe("resolveSdkAuth", () => {
	it("resolves gemini_api, vertex_express, vertex_adc, and litert modes cleanly", () => {
		expect(resolveSdkAuth(sdkModel, { apiKey: "AIza-test" }).mode).toBe("gemini_api");
		expect(resolveSdkAuth(sdkModel, { authMode: "vertex_express", apiKey: "v-key" }).mode).toBe("vertex_express");
		expect(
			resolveSdkAuth(sdkModel, { authMode: "vertex_adc", project: "my-gcp", location: "us-central1" }),
		).toMatchObject({
			mode: "vertex_adc",
			project: "my-gcp",
			location: "us-central1",
		});
		expect(() => resolveSdkAuth(sdkModel, { authMode: "vertex_adc", project: "only-proj" })).toThrow(/location/);

		const litert = resolveSdkAuth(
			{ ...sdkModel, id: "gemma-4-26b-litert" },
			{ liteRtModelPath: "C:/models/gemma4.litertlm" },
		);
		expect(litert.mode).toBe("litert");
		expect(litert.liteRtModelPath).toBe("C:/models/gemma4.litertlm");
	});
});

describe("AntigravitySdkHost", () => {
	it("parks MCP tool calls across steps and completes turns with usage and session fingerprint", async () => {
		const saveDir = await mkdtemp(path.join(tmpdir(), "ag-sdk-host-"));
		cleanups.push(() => rm(saveDir, { recursive: true, force: true }));

		const sentCommands: Array<Record<string, unknown>> = [];
		let mcpOutputPromise: Promise<unknown> | undefined;
		let transportOptions: SdkTransportOptions | undefined;

		const host = new AntigravitySdkHost(saveDir, {
			startTransport: async opts => {
				transportOptions = opts;
				const exited = Promise.withResolvers<number>();
				const transport: SdkWorkerTransport = {
					mcpUrl: "http://127.0.0.1:9999/mcp",
					mcpHeaders: { Authorization: "Bearer test" },
					exited: exited.promise,
					close: () => exited.resolve(0),
					send: cmd => {
						sentCommands.push(cmd);
						if (cmd.type === "init_session") {
							queueMicrotask(() => {
								opts.onEvent({
									id: String(cmd.id),
									type: "session_ready",
									conversation_id: "conv_sdk_001",
								});
							});
						} else if (cmd.type === "chat") {
							queueMicrotask(() => {
								opts.onEvent({ id: String(cmd.id), type: "started" });
								opts.onEvent({ id: String(cmd.id), type: "thinking_delta", text: "Checking README..." });
								opts.onEvent({ id: String(cmd.id), type: "text_delta", text: "Let me read the file." });
								mcpOutputPromise = opts.onCall("read", { path: "README.md" }, "conv_sdk_001");
							});
						}
					},
				};
				return transport;
			},
		});
		cleanups.push(() => host.dispose());

		const userMsg: Message = { role: "user", content: "Inspect README.md", timestamp: 1 };
		const firstAssistant = await runSdkStep(
			host,
			{ systemPrompt: ["Be thorough."], messages: [userMsg], tools: [readTool] },
			{ apiKey: "AIza-test", cwd: saveDir },
		);

		expect(firstAssistant.stopReason).toBe("toolUse");
		expect(firstAssistant.providerPayload).toMatchObject({
			type: "antigravitySdk",
			conversationId: "conv_sdk_001",
			saveDir,
		});
		const callBlock = firstAssistant.content.find(block => block.type === "toolCall");
		expect(callBlock?.type).toBe("toolCall");
		if (callBlock?.type !== "toolCall") throw new Error("Expected toolCall block");

		// Step 2: deliver tool result to settle the parked MCP call and let the worker finish.
		const toolResult: ToolResultMessage = {
			role: "toolResult",
			toolCallId: callBlock.id,
			toolName: "read",
			content: [{ type: "text", text: "# Hello Shark" }],
			isError: false,
			timestamp: 2,
		};

		const step2Promise = runSdkStep(
			host,
			{ systemPrompt: ["Be thorough."], messages: [userMsg, firstAssistant, toolResult], tools: [readTool] },
			{ apiKey: "AIza-test", cwd: saveDir },
		);

		expect(await mcpOutputPromise).toEqual({
			content: [{ type: "text", text: "# Hello Shark" }],
			isError: false,
		});
		const chatCmdId = String(sentCommands.find(c => c.type === "chat")?.id);
		transportOptions!.onEvent({ id: chatCmdId, type: "text_delta", text: "Done reading!" });
		transportOptions!.onEvent({
			id: chatCmdId,
			type: "usage",
			input_tokens: 120,
			output_tokens: 45,
			thinking_tokens: 30,
			cached_tokens: 10,
			total_tokens: 175,
		});
		transportOptions!.onEvent({ id: chatCmdId, type: "completed", conversation_id: "conv_sdk_001", stop_reason: "stop" });

		const secondAssistant = await step2Promise;
		expect(secondAssistant.stopReason).toBe("stop");
		expect(secondAssistant.usage.input).toBe(120);
		expect(secondAssistant.usage.output).toBe(45);
		expect(secondAssistant.usage.reasoningTokens).toBe(30);
		expect(secondAssistant.usage.cacheRead).toBe(10);
		expect(secondAssistant.usage.totalTokens).toBe(175);
		// Only one init_session + one chat was sent because step 2 resumed the parked turn.
		expect(sentCommands.filter(c => c.type === "init_session")).toHaveLength(1);
		expect(sentCommands.filter(c => c.type === "chat")).toHaveLength(1);
	});
});
