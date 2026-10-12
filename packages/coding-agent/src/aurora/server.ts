import * as http from "node:http";
import * as path from "node:path";
import { discoverAuthStorage } from "../session/auth-broker-config";
import { ModelRegistry } from "../config/model-registry";
import { Settings } from "../config/settings";
import { streamSimple, type Context, type Message as PiMessage, type Effort } from "@oh-my-pi/pi-ai";
import { getAgentDir, getProjectDir } from "@oh-my-pi/pi-utils";
import { AURORA_WEB_ASSETS } from "./bundle.generated";

let globalModelRegistry: ModelRegistry | undefined;
let globalSettings: Settings | undefined;

async function getRegistry(cwd: string = getProjectDir()): Promise<ModelRegistry> {
	if (globalModelRegistry) return globalModelRegistry;
	const agentDir = getAgentDir();
	const authStorage = await discoverAuthStorage(agentDir);
	globalSettings = await Settings.init({ cwd });
	globalModelRegistry = new ModelRegistry(authStorage, undefined, { settings: globalSettings });
	return globalModelRegistry;
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

// Armazena abort controllers ativos por sessão/id
const activeStreams = new Map<string, AbortController>();

export async function createAuroraHttpServer(cwd: string = getProjectDir()) {
	// Carrega modelo e registry de forma não bloqueante
	const registryPromise = getRegistry(cwd);

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
				const registry = await registryPromise;
				const available = registry.getAvailable();
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

				const defaultModel = available[0] ?? null;

				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					providers,
					models: modelsJson,
					currentModel: defaultModel ? {
						provider: defaultModel.provider,
						id: defaultModel.id,
						selector: `${defaultModel.provider}/${defaultModel.id}`,
						name: defaultModel.name,
					} : null,
					currentThinkingLevel: "high",
				}));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 2. API: Configurar nova chave de API para Provider
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
					const registry = await registryPromise;
					await registry.refresh("online");

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: true, message: `Provedor ${data.provider} configurado com sucesso.` }));
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 3. API: Interromper Resposta (Abort)
		if (pathname === "/api/chat/abort" && req.method === "POST") {
			for (const controller of activeStreams.values()) {
				controller.abort();
			}
			activeStreams.clear();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		// 4. API: Streaming Real de Mensagens via streamSimple do motor OMSK
		if (pathname === "/api/chat/stream" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => { body += chunk; });
			req.on("end", async () => {
				const streamId = crypto.randomUUID();
				const abortController = new AbortController();
				activeStreams.set(streamId, abortController);

				try {
					const data = JSON.parse(body) as {
						text: string;
						systemPrompt?: string;
						model?: { provider: string; id: string };
						thinkingLevel?: string;
						history?: Array<{ sender: "user" | "assistant"; content: string }>;
					};

					const registry = await registryPromise;
					const available = registry.getAvailable();
					const targetModel = (data.model
						? available.find(m => m.provider.toLowerCase() === data.model!.provider.toLowerCase() && m.id === data.model!.id)
						: undefined) ?? available[0];

					if (!targetModel) {
						res.writeHead(404, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Nenhum modelo disponível encontrado." }));
						return;
					}

					const apiKey = await registry.getApiKey(targetModel);

					res.writeHead(200, {
						"Content-Type": "text/event-stream; charset=utf-8",
						"Cache-Control": "no-cache",
						"Connection": "keep-alive",
					});

					const sendSse = (event: string, payload: unknown) => {
						res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
					};

					// Monta o contexto de mensagens da conversa
					const messages: PiMessage[] = [];
					if (data.history && data.history.length > 0) {
						for (const h of data.history) {
							messages.push({
								role: h.sender === "user" ? "user" : "assistant",
								content: h.content,
							});
						}
					}
					messages.push({ role: "user", content: data.text });

					const context: Context = {
						messages,
					};

					if (data.systemPrompt && data.systemPrompt.trim()) {
						context.systemPrompt = data.systemPrompt.trim();
					}

					const stream = streamSimple(targetModel, context, {
						apiKey,
						signal: abortController.signal,
						thinkingLevel: (data.thinkingLevel as Effort) || undefined,
					});

					try {
						for await (const event of stream) {
							if (abortController.signal.aborted) break;
							if (event.type === "thinking_delta") {
								sendSse("thinking_delta", { delta: event.delta });
							} else if (event.type === "text_delta") {
								sendSse("text_delta", { delta: event.delta });
							}
						}
						sendSse("done", { ok: true });
					} catch (streamErr) {
						if (!abortController.signal.aborted) {
							sendSse("error", { message: String(streamErr) });
						}
					} finally {
						activeStreams.delete(streamId);
						res.end();
					}
				} catch (err) {
					activeStreams.delete(streamId);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 5. Servir os assets estáticos da GUI (CosmoSky App)
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
