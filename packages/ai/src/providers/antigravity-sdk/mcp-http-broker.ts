/**
 * Loopback Streamable HTTP MCP server for the official Google Antigravity SDK.
 * Listens on 127.0.0.1 with an ephemeral port and enforces a per-session
 * 256-bit bearer token on every request before dispatching host tool calls.
 */
import * as crypto from "node:crypto";
import { isRecord } from "@oh-my-pi/pi-utils";
import type { McpCallHandler, McpToolDefinition } from "../antigravity-cli/mcp-bridge";

const PROTOCOL_VERSION = "2025-06-18";
const MAX_FRAME_BYTES = 32 * 1024 * 1024;

function constantTimeEquals(expected: string, actual: string): boolean {
	const left = Buffer.from(expected, "utf8");
	const right = Buffer.from(actual, "utf8");
	if (left.length !== right.length) return false;
	return crypto.timingSafeEqual(left, right);
}

function jsonRpcError(id: string | number | null, code: number, message: string, status = 200): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function jsonRpcResult(id: string | number, result: unknown): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Ephemeral loopback MCP HTTP endpoint scoped to one Antigravity SDK worker.
 * Authentication uses a fresh CSPRNG bearer token generated in-process.
 */
export class McpHttpBroker {
	readonly port: number;
	readonly token: string;
	readonly url: string;
	readonly headers: Record<string, string>;
	readonly #server: ReturnType<typeof Bun.serve>;
	readonly #inFlight = new Set<string | number>();
	readonly #closedSignal = new AbortController();
	#closed = false;

	constructor(tools: readonly McpToolDefinition[], onCall: McpCallHandler) {
		const byName = new Map(tools.map(tool => [tool.name, tool]));
		if (byName.size !== tools.length) throw new Error("Duplicate Antigravity SDK tool name");
		this.token = crypto.randomBytes(32).toString("hex");
		const expectedAuth = `Bearer ${this.token}`;

		this.#server = Bun.serve({
			hostname: "127.0.0.1",
			port: 0,
			fetch: async req => {
				if (this.#closed) return new Response("Server closed", { status: 503 });
				const auth = req.headers.get("authorization") ?? "";
				if (!constantTimeEquals(expectedAuth, auth)) {
					return new Response("Unauthorized", { status: 401 });
				}
				const route = new URL(req.url).pathname;
				if (route !== "/mcp") {
					return new Response("Not Found", { status: 404 });
				}
				if (req.method === "DELETE") {
					return new Response(null, { status: 204 });
				}
				if (req.method !== "POST") {
					return new Response("Method Not Allowed", { status: 405 });
				}
				const declaredLen = Number(req.headers.get("content-length") ?? "0");
				if (Number.isFinite(declaredLen) && declaredLen > MAX_FRAME_BYTES) {
					return new Response("Payload Too Large", { status: 413 });
				}

				const raw = await req.text();
				if (Buffer.byteLength(raw, "utf8") > MAX_FRAME_BYTES) {
					return new Response("Payload Too Large", { status: 413 });
				}

				let request: unknown;
				try {
					request = JSON.parse(raw);
				} catch {
					return jsonRpcError(null, -32700, "Parse error", 400);
				}
				if (!isRecord(request) || request.jsonrpc !== "2.0") {
					return jsonRpcError(null, -32600, "Invalid Request", 400);
				}

				// Notifications carry no `id` and expect no JSON-RPC body.
				const id = request.id;
				if (id === undefined || id === null) {
					return new Response(null, { status: 202 });
				}
				if (typeof id !== "string" && !(typeof id === "number" && Number.isSafeInteger(id))) {
					return jsonRpcError(null, -32600, "Invalid request id", 400);
				}

				const params = isRecord(request.params) ? request.params : {};
				switch (request.method) {
					case "initialize":
						return jsonRpcResult(id, {
							protocolVersion:
								typeof params.protocolVersion === "string" ? params.protocolVersion : PROTOCOL_VERSION,
							capabilities: { tools: {} },
							serverInfo: { name: "oh-my-shark-mcp-broker", version: "1.0.0" },
						});
					case "ping":
						return jsonRpcResult(id, {});
					case "tools/list":
						return jsonRpcResult(id, { tools });
					case "tools/call": {
						const name = typeof params.name === "string" ? params.name : undefined;
						const tool = name ? byName.get(name) : undefined;
						if (!tool) {
							return jsonRpcError(id, -32602, name ? `Unknown tool: ${name.slice(0, 128)}` : "Unknown tool");
						}
						if (this.#inFlight.has(id)) {
							return jsonRpcError(id, -32600, "Duplicate request id");
						}
						const meta = isRecord(params._meta) ? params._meta : {};
						const conversationId = meta["antigravity.google/conversation_id"];
						if (conversationId !== undefined && typeof conversationId !== "string") {
							return jsonRpcError(id, -32602, "Invalid conversation id");
						}
						const args = params.arguments === undefined ? {} : params.arguments;
						this.#inFlight.add(id);
						try {
							const output = await Promise.race([
								onCall(tool.name, args, conversationId),
								new Promise<never>((_, reject) => {
									if (this.#closed) reject(new Error("MCP broker closed"));
									this.#closedSignal.signal.addEventListener(
										"abort",
										() => reject(new Error("MCP broker closed")),
										{ once: true },
									);
								}),
							]);
							return jsonRpcResult(id, output);
						} catch {
							return jsonRpcResult(id, {
								content: [{ type: "text", text: "Tool transport closed before completion" }],
								isError: true,
							});
						} finally {
							this.#inFlight.delete(id);
						}
					}
					default:
						return jsonRpcError(id, -32601, "Method not found");
				}
			},
		});

		const assignedPort = this.#server.port;
		if (assignedPort === undefined) {
			this.#server.stop(true);
			throw new Error("Failed to bind loopback MCP HTTP broker port");
		}
		this.port = assignedPort;
		this.url = `http://127.0.0.1:${assignedPort}/mcp`;
		this.headers = { Authorization: expectedAuth };
	}

	/** Idempotently shut down the HTTP listener and reject waiting tool calls. */
	close(): void {
		if (this.#closed) return;
		this.#closed = true;
		this.#closedSignal.abort();
		void this.#server.stop(true);
	}
}
