import * as http from "node:http";
import * as path from "node:path";
import {
	createAgentSession,
	discoverAuthStorage,
	type CreateAgentSessionResult,
} from "../sdk";
import { ModelRegistry } from "../config/model-registry";
import { Settings } from "../config/settings";
import { getAgentDir, getProjectDir } from "@oh-my-pi/pi-utils";
import type { AgentSessionEvent } from "../session/agent-session-events";
import type { ConfiguredThinkingLevel } from "../thinking";
import { AURORA_WEB_ASSETS } from "./bundle.generated";

let globalSessionResult: CreateAgentSessionResult | undefined;
let globalModelRegistry: ModelRegistry | undefined;
let globalSettings: Settings | undefined;

async function ensureBackendSession(cwd: string = getProjectDir()) {
	if (globalSessionResult && !globalSessionResult.session.isDisposed) {
		return globalSessionResult;
	}

	const agentDir = getAgentDir();
	const authStorage = await discoverAuthStorage(agentDir);
	globalSettings = await Settings.init({ cwd });
	globalModelRegistry = new ModelRegistry(authStorage, undefined, { settings: globalSettings });
	await globalModelRegistry.refresh("online-if-uncached");

	globalSessionResult = await createAgentSession({
		cwd,
		agentDir,
		authStorage,
		modelRegistry: globalModelRegistry,
	});

	return globalSessionResult;
}

function getMimeType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".html": return "text/html; charset=utf-8";
		case ".js": return "application/javascript; charset=utf-8";
		case ".css": return "text/css; charset=utf-8";
		case ".json": return "application/json; charset=utf-8";
		case ".svg": return "image/svg+xml";
		case ".png": return "image/png";
		case ".webp": return "image/webp";
		case ".woff": return "font/woff";
		case ".woff2": return "font/woff2";
		default: return "application/octet-stream";
	}
}

export async function createAuroraHttpServer(cwd: string = getProjectDir()) {
	await ensureBackendSession(cwd);

	const server = http.createServer(async (req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
		const pathname = parsedUrl.pathname;

		// 1. API: Obter modelos e providers REAIS configurados
		if (pathname === "/api/models" && req.method === "GET") {
			try {
				if (!globalModelRegistry) {
					await ensureBackendSession(cwd);
				}
				const available = globalModelRegistry!.getAvailable();
				const providers = Array.from(new Set(available.map(m => m.provider))).sort();

				const modelsJson = available.map(m => ({
					provider: m.provider,
					id: m.id,
					selector: `${m.provider}/${m.id}`,
					name: m.name,
					contextWindow: m.contextWindow,
					maxTokens: m.maxTokens,
					reasoning: Boolean(m.reasoning),
					thinking: m.thinking ? ["minimal", "low", "medium", "high", "max"] : [],
					input: m.input,
				}));

				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					providers,
					models: modelsJson,
					currentModel: globalSessionResult?.session.model ? {
						provider: globalSessionResult.session.model.provider,
						id: globalSessionResult.session.model.id,
						selector: `${globalSessionResult.session.model.provider}/${globalSessionResult.session.model.id}`,
						name: globalSessionResult.session.model.name,
					} : null,
					currentThinkingLevel: globalSessionResult?.session.configuredThinkingLevel(),
				}));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 2. API: Configurar / chave de API para novo Provider
		if (pathname === "/api/providers/configure" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => { body += chunk; });
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { provider: string; apiKey?: string };
					if (!data.provider || !data.apiKey) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Missing provider or apiKey" }));
						return;
					}

					const agentDir = getAgentDir();
					const authStorage = await discoverAuthStorage(agentDir);
					await authStorage.set(data.provider, { type: "api_key", key: data.apiKey });
					await globalModelRegistry?.refresh("online");

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: true, message: `Provider ${data.provider} configurado com sucesso.` }));
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 3. API: Trocar Modelo Ativo ou Nível de Raciocínio
		if (pathname === "/api/models/select" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => { body += chunk; });
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { provider: string; id: string; thinkingLevel?: string };
					const session = globalSessionResult?.session;
					if (!session || !globalModelRegistry) {
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Session or registry not initialized" }));
						return;
					}

					const target = globalModelRegistry.getAvailable().find(
						m => m.provider.toLowerCase() === data.provider.toLowerCase() && m.id === data.id
					);

					if (!target) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: `Modelo ${data.provider}/${data.id} não encontrado entre os disponíveis` }));
						return;
					}

					await session.setModel(target);
					if (data.thinkingLevel !== undefined) {
						session.setThinkingLevel(data.thinkingLevel as ConfiguredThinkingLevel);
					}

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: true,
						selected: `${target.provider}/${target.id}`,
						thinkingLevel: session.configuredThinkingLevel(),
					}));
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 4. API: Obter estado das sessões
		if (pathname === "/api/sessions" && req.method === "GET") {
			try {
				const session = globalSessionResult?.session;
				const currentSessionId = session?.sessionManager.getSessionId() ?? "default";
				const entries = session?.sessionManager.getEntries() ?? [];
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					currentSessionId,
					entriesCount: entries.length,
				}));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 5. API: Nova Sessão
		if (pathname === "/api/sessions/new" && req.method === "POST") {
			try {
				await globalSessionResult?.session.newSession();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					sessionId: globalSessionResult?.session.sessionManager.getSessionId(),
				}));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 6. API: Interromper Resposta (Abort)
		if (pathname === "/api/chat/abort" && req.method === "POST") {
			try {
				await globalSessionResult?.session.abort();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true }));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 7. API: Envio de Mensagem com Server-Sent Events (SSE Real Streaming)
		if (pathname === "/api/chat/stream" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => { body += chunk; });
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as {
						text: string;
						systemPrompt?: string;
						model?: { provider: string; id: string };
						thinkingLevel?: string;
					};

					const session = globalSessionResult?.session;
					if (!session) {
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Session not active" }));
						return;
					}

					// Atualiza modelo ou thinking level se fornecido
					if (data.model && globalModelRegistry) {
						const match = globalModelRegistry.getAvailable().find(
							m => m.provider.toLowerCase() === data.model!.provider.toLowerCase() && m.id === data.model!.id
						);
						if (match) {
							await session.setModel(match);
						}
					}
					if (data.thinkingLevel) {
						session.setThinkingLevel(data.thinkingLevel as ConfiguredThinkingLevel);
					}

					// Inicia resposta SSE
					res.writeHead(200, {
						"Content-Type": "text/event-stream; charset=utf-8",
						"Cache-Control": "no-cache",
						"Connection": "keep-alive",
					});

					const sendSse = (event: string, payload: unknown) => {
						res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
					};

					// Inscreve no stream de eventos reais do OMSK
					const unsubscribe = session.subscribe((ev: AgentSessionEvent) => {
						if (ev.type === "message_update") {
							const asstEvent = "assistantMessageEvent" in ev ? (ev.assistantMessageEvent as { type?: string; delta?: string }) : undefined;
							if (!asstEvent) return;

							if (asstEvent.type === "thinking_delta" && asstEvent.delta) {
								sendSse("thinking_delta", { delta: asstEvent.delta });
							} else if (asstEvent.type === "text_delta" && asstEvent.delta) {
								sendSse("text_delta", { delta: asstEvent.delta });
							}
						} else if (ev.type === "tool_execution_start") {
							sendSse("tool_start", { toolName: ev.toolName, toolCallId: ev.toolCallId, args: ev.args });
						} else if (ev.type === "tool_execution_end") {
							sendSse("tool_end", { toolCallId: ev.toolCallId, isError: ev.isError });
						}
					});

					try {
						await session.prompt(data.text);
						sendSse("done", { ok: true });
					} catch (promptErr) {
						sendSse("error", { message: String(promptErr) });
					} finally {
						unsubscribe();
						res.end();
					}
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 8. Servir os assets estáticos da GUI (Vite / Aurora App)
		let cleanPath = pathname.replace(/^\//, "");
		if (!cleanPath || cleanPath === "index.html") {
			cleanPath = "index.html";
		}

		let assetContent = AURORA_WEB_ASSETS[cleanPath];
		if (!assetContent) {
			cleanPath = "index.html";
			assetContent = AURORA_WEB_ASSETS["index.html"];
		}

		if (!assetContent) {
			res.writeHead(404);
			res.end("Not Found");
			return;
		}

		const contentType = getMimeType(cleanPath);
		res.writeHead(200, {
			"Content-Type": contentType,
			"Cache-Control": "no-cache",
		});

		if (assetContent.startsWith("base64:")) {
			res.end(Buffer.from(assetContent.slice(7), "base64"));
		} else {
			res.end(assetContent);
		}
	});

	const { port } = await new Promise<{ port: number }>((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const addr = server.address();
			if (addr && typeof addr === "object") {
				resolve({ port: addr.port });
			} else {
				reject(new Error("Failed to get port from server"));
			}
		});
	});

	return { server, port };
}
