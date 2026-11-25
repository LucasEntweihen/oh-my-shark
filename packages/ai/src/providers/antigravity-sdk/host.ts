/**
 * Stateful NDJSON host bridging oh-my-shark per-step streams with the official
 * Google Antigravity Python SDK worker (`worker.py`) + loopback MCP HTTP broker.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import type { Effort } from "@oh-my-pi/pi-catalog/effort";
import { isRecord, logger, stableStringifyJson } from "@oh-my-pi/pi-utils";
import * as AIError from "../../error";
import { ProviderHttpError } from "../../error/classes";
import type {
	AntigravitySdkPayload,
	Context,
	Message,
	Model,
	ProviderSessionState,
	ServiceTier,
	StreamOptions,
	Tool,
	ToolResultMessage,
} from "../../types";
import { normalizeSchemaForMCP, toolWireSchema } from "../../utils/schema";
import { validateJsonSchemaValue } from "../../utils/schema/json-schema-validator";
import { describeToolArguments } from "../antigravity-cli/host";
import type { McpCallHandler, McpToolDefinition, McpToolOutput } from "../antigravity-cli/mcp-bridge";
import { type InputMessage, inputBlocks, isInputMessage, type Ledger, replayPrompt, transcriptDigest } from "../antigravity-cli/reconcile";
import { StepWriter } from "../antigravity-cli/step-writer";
import { McpHttpBroker } from "./mcp-http-broker";
import { resolveSdkPython, sdkWorkerScriptPath } from "./sdk-binary";

export type AntigravitySdkAuthMode = "gemini_api" | "vertex_express" | "vertex_adc" | "litert";
export type AntigravitySdkPolicyProfile = "mcp_only" | "workspace_read";

export interface AntigravitySdkStepOptions extends StreamOptions {
	reasoning?: Effort;
	serviceTier?: ServiceTier;
	authMode?: AntigravitySdkAuthMode;
	project?: string;
	location?: string;
	liteRtModelPath?: string;
	policyProfile?: AntigravitySdkPolicyProfile;
}

export type WorkerOutboundEvent =
	| { id: string; type: "session_ready"; conversation_id?: string | null; model?: string }
	| { id: string; type: "started" }
	| { id: string; type: "text_delta"; text: string }
	| { id: string; type: "thinking_delta"; text: string }
	| { id: string; type: "tool_event"; name: string; args?: unknown; status: string }
	| {
			id: string;
			type: "usage";
			input_tokens?: number;
			output_tokens?: number;
			thinking_tokens?: number;
			cached_tokens?: number;
			total_tokens?: number;
	  }
	| { id: string; type: "completed"; conversation_id?: string | null; stop_reason?: string }
	| { id: string; type: "cancelled" }
	| { id: string | null; type: "error"; code?: string; message: string };

export interface SdkWorkerTransport {
	mcpUrl?: string;
	mcpHeaders?: Record<string, string>;
	send(command: Record<string, unknown>): Promise<void> | void;
	exited: Promise<number>;
	close(): void;
}

export interface SdkTransportOptions {
	cwd: string;
	saveDir: string;
	tools: readonly McpToolDefinition[];
	signal: AbortSignal;
	env: Record<string, string>;
	onCall: McpCallHandler;
	onEvent(event: WorkerOutboundEvent): void;
}

export interface AntigravitySdkHostOptions {
	startTransport?: (options: SdkTransportOptions) => Promise<SdkWorkerTransport>;
	setupTimeoutMs?: number;
}

interface AuthResolution {
	mode: AntigravitySdkAuthMode;
	apiKey?: string;
	project?: string;
	location?: string;
	liteRtModelPath?: string;
	versionHash: string;
	accountKey: string;
}

interface ActiveStep {
	writer: StepWriter;
	messages: readonly Message[];
	done: PromiseWithResolvers<void>;
	controller: AbortController;
	activeRequestId?: string;
	aborted: boolean;
}

interface PendingCall {
	id: string;
	settle(output: McpToolOutput): void;
}

const DEFAULT_SETUP_TIMEOUT_MS = 60_000;
const CANCEL_WAIT_MS = 3_000;

/** Derive non-secret SDK auth configuration and deterministic isolation key. */
export function resolveSdkAuth(model: Model<"antigravity-sdk">, options: AntigravitySdkStepOptions): AuthResolution {
	const rawKey = options.apiKey?.trim();
	const apiKey = rawKey && !rawKey.startsWith("<") && rawKey !== "N/A" ? rawKey : undefined;
	const project = options.project ?? process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCP_PROJECT;
	const location = options.location ?? process.env.GOOGLE_CLOUD_LOCATION ?? process.env.VERTEX_LOCATION;
	const liteRtModelPath = options.liteRtModelPath ?? process.env.OMSK_LITERT_MODEL_PATH;

	let mode = options.authMode;
	if (!mode) {
		if (model.id.includes("litert") || liteRtModelPath) mode = "litert";
		else if (project && location && !apiKey) mode = "vertex_adc";
		else if (process.env.GOOGLE_GENAI_USE_VERTEXAI === "True" && apiKey) mode = "vertex_express";
		else mode = "gemini_api";
	}
	if (mode === "gemini_api" && !apiKey) {
		const envKey = process.env.GEMINI_API_KEY?.trim();
		if (envKey) {
			return {
				mode,
				apiKey: envKey,
				versionHash: sha256(JSON.stringify([mode, envKey])),
				accountKey: sha256(`${mode}:key:${sha256(envKey)}`),
			};
		}
		throw new AIError.MissingApiKeyError(
			model.provider,
			"Antigravity SDK requires GEMINI_API_KEY, Vertex AI credentials, or a LiteRT model path.",
		);
	}
	if (mode === "vertex_express") {
		const vertexKey = apiKey ?? process.env.GOOGLE_CLOUD_API_KEY?.trim();
		if (!vertexKey) {
			throw new AIError.MissingApiKeyError(model.provider, "Vertex Express mode requires GOOGLE_CLOUD_API_KEY.");
		}
		return {
			mode,
			apiKey: vertexKey,
			versionHash: sha256(JSON.stringify([mode, vertexKey])),
			accountKey: sha256(`${mode}:${sha256(vertexKey)}`),
		};
	}
	if (mode === "vertex_adc" && (!project || !location)) {
		throw new AIError.ConfigurationError(
			"Antigravity SDK Vertex ADC mode requires project and location (GOOGLE_CLOUD_PROJECT & GOOGLE_CLOUD_LOCATION).",
		);
	}
	return {
		mode,
		apiKey,
		project,
		location,
		liteRtModelPath,
		versionHash: sha256(JSON.stringify([mode, apiKey ?? "", project ?? "", location ?? "", liteRtModelPath ?? ""])),
		accountKey: sha256(`${mode}:${project ?? ""}:${location ?? ""}:${liteRtModelPath ?? ""}`),
	};
}

/** Plan incremental turn reuse, saved-session continuation, or fresh transcript replay. */
export function planSdkTurn(
	messages: readonly Message[],
	ledger: Ledger | undefined,
):
	| { kind: "resume"; toolResult?: ToolResultMessage; input: InputMessage[] }
	| { kind: "restore"; conversationId: string; saveDir: string; replay: InputMessage[] }
	| { kind: "fresh"; replay: Message[] } {
	if (
		ledger &&
		messages.length > ledger.count &&
		transcriptDigest(messages.slice(0, ledger.count)) === ledger.digest
	) {
		const tail = messages.slice(ledger.count);
		const first = tail[0];
		const toolResult =
			ledger.pendingToolCallId !== undefined &&
			first?.role === "toolResult" &&
			first.toolCallId === ledger.pendingToolCallId
				? first
				: undefined;
		const input = toolResult ? tail.slice(1) : tail;
		if ((ledger.pendingToolCallId === undefined || toolResult) && input.every(isInputMessage)) {
			return { kind: "resume", toolResult, input };
		}
	}
	const lastAssistantIndex = messages.findLastIndex(msg => msg.role === "assistant");
	if (lastAssistantIndex >= 0) {
		const assistant = messages[lastAssistantIndex]!;
		const payload = assistant.role === "assistant" ? assistant.providerPayload : undefined;
		if (
			payload?.type === "antigravitySdk" &&
			transcriptDigest(messages.slice(0, lastAssistantIndex + 1)) === payload.digest
		) {
			const tail = messages.slice(lastAssistantIndex + 1);
			if (tail.every(isInputMessage) && tail.length > 0) {
				return {
					kind: "restore",
					conversationId: payload.conversationId,
					saveDir: payload.saveDir,
					replay: tail,
				};
			}
		}
	}
	return { kind: "fresh", replay: [...messages] };
}

/** Owns one Python Antigravity SDK worker process and its loopback MCP broker. */
export class AntigravitySdkHost implements ProviderSessionState {
	readonly #saveDir: string;
	readonly #options: Required<AntigravitySdkHostOptions>;
	#transport: SdkWorkerTransport | undefined;
	#transportKey = "";
	#tools = new Map<string, McpToolDefinition>();
	#conversationId: string | undefined;
	#sessionInitKey = "";
	#ledger: Ledger | undefined;
	#pending: PendingCall | undefined;
	#step: ActiveStep | undefined;
	#sessionReadyWaiter: PromiseWithResolvers<{ conversationId?: string }> | undefined;

	constructor(saveDir: string, options: AntigravitySdkHostOptions = {}) {
		this.#saveDir = saveDir;
		this.#options = {
			startTransport: options.startTransport ?? startProductionTransport,
			setupTimeoutMs: options.setupTimeoutMs ?? DEFAULT_SETUP_TIMEOUT_MS,
		};
	}

	get conversationId(): string | undefined {
		return this.#conversationId;
	}

	get hasPendingTurn(): boolean {
		return this.#pending !== undefined || this.#step !== undefined;
	}

	async step(
		model: Model<"antigravity-sdk">,
		context: Context,
		options: AntigravitySdkStepOptions,
		writer: StepWriter,
	): Promise<void> {
		if (this.#step) throw new Error("Antigravity SDK is already executing a step for this session");

		const step: ActiveStep = {
			writer,
			messages: context.messages,
			done: Promise.withResolvers<void>(),
			controller: new AbortController(),
			aborted: false,
		};
		step.done.promise.catch(() => undefined);
		this.#step = step;

		const onAbort = () => {
			step.aborted = true;
			if (step.activeRequestId && this.#transport) {
				void Promise.resolve(this.#transport.send({ id: step.activeRequestId, type: "cancel" })).catch(() => {});
			}
			this.#failStep(new Error("Request was aborted"));
		};
		options.signal?.addEventListener("abort", onAbort, { once: true });

		try {
			if (options.signal?.aborted) onAbort();
			step.controller.signal.throwIfAborted();

			const cwd = options.cwd ?? process.cwd();
			const tools = (context.tools ?? []).map(toMcpTool);
			const toolsKey = stableStringifyJson(tools);
			const auth = resolveSdkAuth(model, options);
			const systemInstructions = (context.systemPrompt ?? []).join("\n\n");
			const policyProfile = options.policyProfile ?? "mcp_only";
			const processKey = sha256(JSON.stringify([cwd, toolsKey, auth.versionHash]));

			let plan = planSdkTurn(context.messages, this.#ledger);
			const sessionKey = sha256(
				JSON.stringify([
					model.id,
					model.baseUrl,
					systemInstructions,
					policyProfile,
					options.liteRtModelPath ?? "",
				]),
			);

			if (this.#transport && this.#transportKey !== processKey) {
				this.#stopTransport();
				if (plan.kind === "resume") plan = { kind: "fresh", replay: [...context.messages] };
			}
			if (plan.kind === "resume" && this.#sessionInitKey !== sessionKey) {
				plan = { kind: "fresh", replay: [...context.messages] };
			}
			if (plan.kind === "resume" && plan.toolResult && !this.#pending) {
				plan = { kind: "fresh", replay: [...context.messages] };
			}

			if (!this.#transport) {
				await fs.mkdir(this.#saveDir, { recursive: true });
				const transport = await withTimeout(
					this.#options.startTransport({
						cwd,
						saveDir: this.#saveDir,
						tools,
						signal: step.controller.signal,
						env: buildWorkerEnv(auth),
						onCall: (name, args, callerId) => this.#onToolCall(name, args, callerId),
						onEvent: event => this.#onWorkerEvent(event),
					}),
					this.#options.setupTimeoutMs,
					"Antigravity SDK worker startup timed out",
				);
				this.#transport = transport;
				this.#transportKey = processKey;
				this.#tools = new Map(tools.map(tool => [tool.name, tool]));
				void transport.exited.then(
					code => {
						if (this.#transport === transport) {
							this.#transport = undefined;
							if (this.#step) this.#failStep(new Error(`Antigravity SDK worker exited with code ${code}`));
						}
					},
					() => {
						if (this.#transport === transport) {
							this.#transport = undefined;
							if (this.#step) this.#failStep(new Error("Antigravity SDK worker terminated unexpectedly"));
						}
					},
				);
			}

			if (plan.kind !== "resume") {
				this.#releasePending("Cancelled: conversation restarted or diverged.");
				const restoreId = plan.kind === "restore" ? plan.conversationId : undefined;
				const initSaveDir = plan.kind === "restore" ? plan.saveDir : this.#saveDir;
				const initReqId = `init_${crypto.randomUUID()}`;
				const waiter = Promise.withResolvers<{ conversationId?: string }>();
				this.#sessionReadyWaiter = waiter;
				await this.#transport.send({
					id: initReqId,
					type: "init_session",
					save_dir: initSaveDir,
					conversation_id: restoreId ?? null,
					model: model.id,
					base_url: model.baseUrl,
					system_instructions: systemInstructions || undefined,
					policy_profile: policyProfile,
					litert_model_path: auth.liteRtModelPath,
					auth: {
						mode: auth.mode,
						api_key: auth.apiKey,
						project: auth.project,
						location: auth.location,
					},
					...(this.#transport.mcpUrl
						? {
								mcp: {
									name: "harness_tools",
									url: this.#transport.mcpUrl,
									headers: this.#transport.mcpHeaders ?? {},
								},
							}
						: {}),
				});
				const ready = await withTimeout(
					waiter.promise,
					this.#options.setupTimeoutMs,
					"Antigravity SDK session initialization timed out",
				);
				this.#conversationId = ready.conversationId ?? restoreId;
				this.#sessionInitKey = sessionKey;
			}

			if (plan.kind === "resume" && plan.toolResult) {
				const pending = this.#pending;
				if (!pending) throw new Error("Antigravity SDK lost pending MCP tool continuation");
				this.#pending = undefined;
				pending.settle(toMcpOutput(plan.toolResult));
			} else {
				const messagesToSend =
					plan.kind === "resume" ? plan.input : plan.kind === "restore" ? plan.replay : plan.replay;
				const parts = toWorkerParts(messagesToSend, plan.kind === "fresh");
				if (parts.length === 0) throw new Error("Antigravity SDK has no input to send");
				const reqId = `chat_${crypto.randomUUID()}`;
				step.activeRequestId = reqId;
				await this.#transport.send({ id: reqId, type: "chat", parts });
			}

			await step.done.promise;
		} catch (error) {
			this.#failStep(error);
			throw step.aborted ? new Error("Request was aborted") : error;
		} finally {
			options.signal?.removeEventListener("abort", onAbort);
			if (this.#step === step) this.#step = undefined;
		}
	}

	close(): void {
		this.#failStep(new Error("Antigravity SDK session closed"));
		this.#stopTransport();
		this.#conversationId = undefined;
	}

	async dispose(): Promise<void> {
		const active = this.#transport;
		if (active) {
			void Promise.resolve(active.send({ type: "shutdown" })).catch(() => {});
			await Promise.race([active.exited.catch(() => 0), Bun.sleep(CANCEL_WAIT_MS)]);
		}
		this.close();
	}

	#onWorkerEvent(event: WorkerOutboundEvent): void {
		if (event.type === "session_ready") {
			if (event.conversation_id) this.#conversationId = event.conversation_id;
			this.#sessionReadyWaiter?.resolve({ conversationId: event.conversation_id ?? undefined });
			this.#sessionReadyWaiter = undefined;
			return;
		}
		if (event.type === "error") {
			const mapped = mapWorkerError(event.code, event.message);
			if (this.#sessionReadyWaiter) {
				this.#sessionReadyWaiter.reject(mapped);
				this.#sessionReadyWaiter = undefined;
			}
			this.#failStep(mapped);
			return;
		}
		const step = this.#step;
		if (!step || step.writer.done) return;

		switch (event.type) {
			case "thinking_delta":
				step.writer.thinking(event.text);
				return;
			case "text_delta":
				step.writer.text(event.text);
				return;
			case "usage": {
				const u = step.writer.output.usage;
				u.input = event.input_tokens ?? u.input;
				u.output = event.output_tokens ?? u.output;
				u.cacheRead = event.cached_tokens ?? u.cacheRead;
				if (event.thinking_tokens !== undefined) u.reasoningTokens = event.thinking_tokens;
				u.totalTokens = event.total_tokens ?? u.input + u.output + u.cacheRead + u.cacheWrite;
				return;
			}
			case "cancelled":
				this.#failStep(new Error("Request was aborted"));
				return;
			case "completed": {
				if (event.conversation_id) this.#conversationId = event.conversation_id;
				const conversationId = this.#conversationId ?? "local";
				const digest = transcriptDigest([...step.messages, step.writer.output]);
				const payload: AntigravitySdkPayload = {
					type: "antigravitySdk",
					conversationId,
					saveDir: this.#saveDir,
					digest,
				};
				step.writer.finish(event.stop_reason === "max_tokens" ? "length" : "stop", payload);
				this.#ledger = { count: step.messages.length + 1, digest };
				step.done.resolve();
				return;
			}
		}
	}

	async #onToolCall(name: string, args: unknown, _callerId: string | undefined): Promise<McpToolOutput> {
		const step = this.#step;
		if (!step || step.writer.done || step.aborted || this.#pending) {
			return { content: [{ type: "text", text: "Tool call rejected: no active step" }], isError: true };
		}
		const tool = this.#tools.get(name);
		if (!tool) {
			return { content: [{ type: "text", text: `Unknown tool: ${name.slice(0, 128)}` }], isError: true };
		}
		const validation = validateJsonSchemaValue(tool.inputSchema, args);
		if (!validation.success || !isRecord(args)) {
			return { content: [{ type: "text", text: describeToolArguments(tool, args, validation) }], isError: true };
		}
		const id = `agsdk_${crypto.randomUUID().replaceAll("-", "")}`;
		const deferred = Promise.withResolvers<McpToolOutput>();
		this.#pending = { id, settle: deferred.resolve };
		step.writer.toolCall({ type: "toolCall", id, name, arguments: args });
		const conversationId = this.#conversationId ?? "local";
		const digest = transcriptDigest([...step.messages, step.writer.output]);
		step.writer.finish("toolUse", {
			type: "antigravitySdk",
			conversationId,
			saveDir: this.#saveDir,
			digest,
		});
		this.#ledger = { count: step.messages.length + 1, digest, pendingToolCallId: id };
		step.done.resolve();
		return deferred.promise;
	}

	#releasePending(reason: string): void {
		const pending = this.#pending;
		this.#pending = undefined;
		pending?.settle({ content: [{ type: "text", text: reason }], isError: true });
	}

	#failStep(error: unknown): void {
		this.#ledger = undefined;
		this.#releasePending("Tool call cancelled because the SDK step ended.");
		if (this.#sessionReadyWaiter) {
			this.#sessionReadyWaiter.reject(error instanceof Error ? error : new Error(String(error)));
			this.#sessionReadyWaiter = undefined;
		}
		const step = this.#step;
		if (step) {
			step.controller.abort(error);
			step.done.reject(error instanceof Error ? error : new Error(String(error)));
		}
	}

	#stopTransport(): void {
		const active = this.#transport;
		this.#transport = undefined;
		this.#transportKey = "";
		this.#sessionInitKey = "";
		active?.close();
	}
}

async function startProductionTransport(options: SdkTransportOptions): Promise<SdkWorkerTransport> {
	const python = resolveSdkPython();
	const workerPath = sdkWorkerScriptPath();
	let closeProcess: (() => void) | undefined;
	const broker = new McpHttpBroker(options.tools, options.onCall);
	try {
		const proc = Bun.spawn([python, workerPath], {
			cwd: options.cwd,
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
			env: options.env,
		});
		let closed = false;
		const close = () => {
			if (closed) return;
			closed = true;
			broker.close();
			try {
				proc.kill();
			} catch {
				// Ignore already-exited subprocess.
			}
		};
		closeProcess = close;
		void readNdjsonLines(proc.stdout, options.onEvent, () => {
			if (!closed) closeProcess?.();
		});
		void drainStderr(proc.stderr);
		return {
			mcpUrl: broker.url,
			mcpHeaders: broker.headers,
			send: async cmd => {
				if (closed) throw new Error("Antigravity SDK worker is closed");
				proc.stdin.write(`${JSON.stringify(cmd)}\n`);
				await proc.stdin.flush();
			},
			exited: proc.exited,
			close,
		};
	} catch (error) {
		broker.close();
		throw error;
	}
}

async function readNdjsonLines(
	stdout: ReadableStream<Uint8Array>,
	onEvent: (event: WorkerOutboundEvent) => void,
	onEnd: () => void,
): Promise<void> {
	const decoder = new TextDecoder();
	let buffer = "";
	try {
		for await (const chunk of stdout) {
			buffer += decoder.decode(chunk, { stream: true });
			for (let nl = buffer.indexOf("\n"); nl >= 0; nl = buffer.indexOf("\n")) {
				const line = buffer.slice(0, nl).trim();
				buffer = buffer.slice(nl + 1);
				if (!line) continue;
				try {
					onEvent(JSON.parse(line) as WorkerOutboundEvent);
				} catch {
					logger.warn("Ignored malformed NDJSON line from Antigravity SDK worker");
				}
			}
		}
	} finally {
		onEnd();
	}
}

async function drainStderr(stderr: ReadableStream<Uint8Array>): Promise<void> {
	const decoder = new TextDecoder();
	for await (const chunk of stderr) {
		const text = decoder.decode(chunk, { stream: true }).trim();
		if (text) logger.debug("[antigravity-sdk]", { text: text.slice(0, 500) });
	}
}

function buildWorkerEnv(auth: AuthResolution): Record<string, string> {
	const env: Record<string, string> = {
		PATH: process.env.PATH ?? "",
		HOME: process.env.HOME ?? "",
		USERPROFILE: process.env.USERPROFILE ?? "",
		APPDATA: process.env.APPDATA ?? "",
		LOCALAPPDATA: process.env.LOCALAPPDATA ?? "",
		TEMP: process.env.TEMP ?? "",
		TMP: process.env.TMP ?? "",
		PYTHONUNBUFFERED: "1",
		PYTHONIOENCODING: "utf-8",
	};
	if (auth.mode === "gemini_api" && auth.apiKey) env.GEMINI_API_KEY = auth.apiKey;
	if (auth.mode === "vertex_express" && auth.apiKey) {
		env.GOOGLE_GENAI_USE_VERTEXAI = "True";
		env.GOOGLE_CLOUD_API_KEY = auth.apiKey;
	}
	if (auth.mode === "vertex_adc") {
		env.GOOGLE_GENAI_USE_VERTEXAI = "True";
		if (auth.project) env.GOOGLE_CLOUD_PROJECT = auth.project;
		if (auth.location) env.GOOGLE_CLOUD_LOCATION = auth.location;
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		}
	}
	return env;
}

function toWorkerParts(messages: readonly Message[], useReplayEnvelope: boolean): Array<Record<string, unknown>> {
	const blocks = useReplayEnvelope ? replayPrompt(messages) : messages.filter(isInputMessage).flatMap(inputBlocks);
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

function toMcpTool(tool: Tool): McpToolDefinition {
	const schema: unknown = normalizeSchemaForMCP(toolWireSchema(tool));
	if (!isRecord(schema)) throw new Error(`Invalid schema for Antigravity SDK tool ${tool.name}`);
	return { name: tool.name, description: tool.description, inputSchema: schema };
}

function toMcpOutput(result: ToolResultMessage): McpToolOutput {
	return {
		content: result.content.map(part =>
			part.type === "text"
				? { type: "text", text: part.text }
				: { type: "image", data: part.data, mimeType: part.mimeType },
		),
		isError: result.isError,
	};
}

function mapWorkerError(code: string | undefined, message: string): Error {
	if (/\b429\b|RESOURCE_EXHAUSTED/i.test(message)) {
		return new ProviderHttpError(message, 429, { code: code ?? "RESOURCE_EXHAUSTED" });
	}
	if (/\b403\b|PERMISSION_DENIED/i.test(message)) {
		return new ProviderHttpError(message, 403, { code: code ?? "PERMISSION_DENIED" });
	}
	if (/\b401\b|UNAUTHENTICATED/i.test(message)) {
		return new ProviderHttpError(message, 401, { code: code ?? "UNAUTHENTICATED" });
	}
	return new Error(code ? `[${code}] ${message}` : message);
}

function sha256(value: string): string {
	return crypto.createHash("sha256").update(value).digest("hex");
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	let timer: NodeJS.Timeout | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error(message)), ms);
			}),
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

export { describeToolArguments, validateJsonSchemaValue };
