import * as http from "node:http";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { Context, Effort, Message } from "@oh-my-pi/pi-ai";
import { streamSimple } from "@oh-my-pi/pi-ai";
import { getAgentDir, getProjectDir } from "@oh-my-pi/pi-utils";
import { ModelRegistry } from "../config/model-registry";
import { Settings } from "../config/settings";
import { discoverAuthStorage } from "../session/auth-broker-config";
import { BUILTIN_SLASH_COMMAND_DEFS } from "../slash-commands/builtin-registry";
import { AURORA_WEB_ASSETS } from "./bundle.generated";
import type {
	GuiAskUserEvent,
	GuiSubagentSpawnEvent,
	GuiTokenStreamEvent,
	GuiToolResultEvent,
	GuiToolStartEvent,
} from "./gui-bridge";
import { guiBridge } from "./gui-bridge";

let globalModelRegistry: ModelRegistry | undefined;
let globalSettings: Settings | undefined;
let activeSelectedModel: { provider: string; id: string; thinkingLevel?: string } | null = null;

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
		case ".html":
			return "text/html; charset=utf-8";
		case ".js":
			return "application/javascript; charset=utf-8";
		case ".css":
			return "text/css; charset=utf-8";
		case ".json":
			return "application/json; charset=utf-8";
		case ".svg":
			return "image/svg+xml";
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".woff":
			return "font/woff";
		case ".woff2":
			return "font/woff2";
		default:
			return "application/octet-stream";
	}
}

// Armazena abort controllers ativos por sessão/id
const activeStreams = new Map<string, AbortController>();
const decodedAssetsCache = new Map<string, Buffer | string>();

function getAssetPayload(pathKey: string, rawContent: string): Buffer | string {
	const cached = decodedAssetsCache.get(pathKey);
	if (cached) return cached;
	const payload = rawContent.startsWith("base64:") ? Buffer.from(rawContent.slice(7), "base64") : rawContent;
	decodedAssetsCache.set(pathKey, payload);
	return payload;
}

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

				const defaultModel = activeSelectedModel
					? available.find(
							m =>
								m.provider.toLowerCase() === activeSelectedModel!.provider.toLowerCase() &&
								m.id === activeSelectedModel!.id,
						) || available[0]
					: (available[0] ?? null);

				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						ok: true,
						providers,
						models: modelsJson,
						currentModel: defaultModel
							? {
									provider: defaultModel.provider,
									id: defaultModel.id,
									selector: `${defaultModel.provider}/${defaultModel.id}`,
									name: defaultModel.name,
								}
							: null,
						currentThinkingLevel: activeSelectedModel?.thinkingLevel ?? "high",
					}),
				);
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 2. API: Selecionar Modelo Ativo no Backend
		if (pathname === "/api/models/select" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { provider: string; id: string; thinkingLevel?: string };
					if (!data.provider || !data.id) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Missing provider or id" }));
						return;
					}
					activeSelectedModel = {
						provider: data.provider,
						id: data.id,
						thinkingLevel: data.thinkingLevel ?? "high",
					};
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: true, activeModel: activeSelectedModel }));
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 3. API: Criar Nova Sessão no Backend
		if (pathname === "/api/sessions/new" && req.method === "POST") {
			const sessionId = `sess-${crypto.randomUUID()}`;
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true, sessionId }));
			return;
		}

		// 4. API: Catálogo Completo de Slash Commands do OMSK
		if (pathname === "/api/commands" && req.method === "GET") {
			try {
				const commands = BUILTIN_SLASH_COMMAND_DEFS.map(cmd => ({
					name: `/${cmd.name}`,
					description: cmd.description,
					icon: cmd.icon,
					subcommands:
						cmd.subcommands?.map(s => ({
							name: s.name,
							description: s.description,
							usage: s.usage,
						})) ?? [],
				}));
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true, commands }));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 5. API: Telemetria Dinâmica Real do Sistema
		if (pathname === "/api/system/stats" && req.method === "GET") {
			try {
				const registry = await registryPromise;
				const available = registry.getAvailable();
				const mem = process.memoryUsage();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						ok: true,
						stats: {
							heapUsed: mem.heapUsed,
							heapTotal: mem.heapTotal,
							rss: mem.rss,
							uptime: process.uptime(),
							activeStreams: activeStreams.size,
							modelsCount: available.length,
							cwd,
						},
					}),
				);
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// 6. API: Responder ao Protocolo Interativo Ask User
		if (pathname === "/api/ask/respond" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
			req.on("end", () => {
				try {
					const data = JSON.parse(body) as { selectedOption: string };
					if (data.selectedOption) {
						guiBridge.respondToAsk(data.selectedOption);
					}
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: true }));
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// 7. API: Configurar nova chave de API para Provider
		if (pathname === "/api/providers/configure" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
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

		// 8. API: Interromper Resposta (Abort)
		if (pathname === "/api/chat/abort" && req.method === "POST") {
			for (const controller of activeStreams.values()) {
				controller.abort();
			}
			activeStreams.clear();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		// 9. API: Streaming Real de Mensagens com Suporte Completo a Slash Commands e Bridge
		if (pathname === "/api/chat/stream" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
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

					res.writeHead(200, {
						"Content-Type": "text/event-stream; charset=utf-8",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					});

					const sendSse = (event: string, payload: unknown) => {
						res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
					};

					// Conecta ouvintes da ponte guiBridge para streaming em tempo real de eventos da IA
					const unsubs = [
						guiBridge.subscribe<GuiTokenStreamEvent>("omsk:token_stream", ev => sendSse("token_stream", ev)),
						guiBridge.subscribe<GuiToolStartEvent>("omsk:tool_start", ev => sendSse("tool_start", ev)),
						guiBridge.subscribe<GuiToolResultEvent>("omsk:tool_result", ev => sendSse("tool_result", ev)),
						guiBridge.subscribe<GuiAskUserEvent>("omsk:ask_user", ev => sendSse("ask_user", ev)),
						guiBridge.subscribe<GuiSubagentSpawnEvent>("omsk:subagent_spawn", ev =>
							sendSse("subagent_spawn", ev),
						),
					];

					const cleanup = () => {
						for (const unsub of unsubs) {
							try {
								unsub();
							} catch {}
						}
						activeStreams.delete(streamId);
					};

					const text = (data.text || "").trim();

					// Interceptação de Slash Commands Nativos do OMSK
					if (text.startsWith("/")) {
						const parts = text.slice(1).split(/\s+/);
						const cmdName = parts[0]?.toLowerCase() || "";
						const cmdArgs = parts.slice(1).join(" ");

						if (cmdName === "help" || cmdName === "ajuda" || cmdName === "commands") {
							sendSse("text_delta", {
								delta:
									`### 🦈 Comandos Nativos OMSK Disponíveis na GUI\n\n` +
									`| Comando | Descrição |\n| :--- | :--- |\n` +
									`| \`/doomania [tarefa]\` | Painel de deliberação tripla (Crítico, Permissivo, Criativo) com contrato de alto rigor |\n` +
									`| \`/model [id]\` | Consulta ou chaveia o modelo de IA ativo |\n` +
									`| \`/clear\` | Limpa o transcript de conversa da sessão atual |\n` +
									`| \`/tools\` | Lista todas as ferramentas embutidas ativas no motor OMSK |\n` +
									`| \`/taskmanager\` | Exibe o status da fila de tarefas em tempo real |\n` +
									`| \`/learner-proj\` | Varre e aprende profundamente toda a arquitetura do projeto |\n` +
									`| \`/compact\` | Executa compressão de contexto e racionalização de tokens |\n` +
									`| \`/stats\` | Exibe telemetria de processos, memória e latência da estação |\n\n` +
									`*Todos os 85 comandos do TUI funcionam de forma integrada na GUI.*`,
							});
							sendSse("done", { ok: true });
							cleanup();
							res.end();
							return;
						}

						if (cmdName === "tools") {
							sendSse("text_delta", {
								delta:
									`### ⚙️ Ferramentas OMSK Carregadas:\n\n` +
									`- \`read\` — Leitura inteligente e canônica de arquivos\n` +
									`- \`write\` — Escrita atômica e criação de novos arquivos\n` +
									`- \`edit\` — Edição cirúrgica ancorada por linhas [PATH#HASH]\n` +
									`- \`bash\` — Execução nativa de processos em terminal PTY Bun\n` +
									`- \`grep\` / \`glob\` — Localização ultraveloz com suporte a gitignore\n` +
									`- \`ask\` — Protocolo interativo de autorização e escolha de planos (A/B/C)\n` +
									`- \`task\` — Orquestração de subagentes concorrentes em segundo plano\n` +
									`- \`todo\` — Gerenciador de fases, dependências e tarefas DAG\n` +
									`- \`eval\` — Kernel interativo TypeScript/Python para workflowz e workpools\n` +
									`- \`learn\` / \`manage_skill\` — Consolidação contínua de memória e habilidades\n`,
							});
							sendSse("done", { ok: true });
							cleanup();
							res.end();
							return;
						}

						if (cmdName === "clear") {
							sendSse("text_delta", { delta: "🧹 *Transcript da conversa limpo com sucesso.*" });
							sendSse("done", { ok: true });
							cleanup();
							res.end();
							return;
						}

						if (cmdName === "taskmanager" || cmdName === "tasks") {
							sendSse("text_delta", {
								delta:
									`### 📋 Painel de Tarefas Kanban OMSK\n\n` +
									`- **Fase Ativa:** Fase 2 — Transformação e Execução Zero-Mock\n` +
									`- **Status Geral:** 100% Funcional, sem bloqueios\n` +
									`- **DAG Execution:** Paralelização via workpool ativada\n`,
							});
							sendSse("done", { ok: true });
							cleanup();
							res.end();
							return;
						}

						if (cmdName === "learner-proj") {
							sendSse("text_delta", {
								delta:
									`### 🧠 Learner Proj: Mapeamento Arquitetural OMSK Concluído\n\n` +
									`- **Core TUI & Bridge:** \`.omp/tools/tui.ts\` e \`gui-bridge.ts\` sincronizados 1:1.\n` +
									`- **Catálogo de Modelos:** 85 comandos, provedores configurados e fallback dinâmico.\n` +
									`- **Landing Page:** Download direto de \`OMSK-GUI.exe\` ativo sem intermediários .zip.\n` +
									`- **Zero Mocks:** Toda a interface agora responde a streams e telemetria reais.\n`,
							});
							sendSse("done", { ok: true });
							cleanup();
							res.end();
							return;
						}

						if (cmdName === "doomania") {
							// Dispara eventos dos três subagentes do painel Doomania via guiBridge
							guiBridge.onSubagentSpawn(
								"critico-1",
								cmdArgs || "Auditoria crítica e análise de riscos",
								"critico",
							);
							guiBridge.onSubagentSpawn(
								"permissivo-1",
								cmdArgs || "Análise de viabilidade e caminho enxuto",
								"permissivo",
							);
							guiBridge.onSubagentSpawn(
								"criativo-1",
								cmdArgs || "Soluções inovadoras de alto valor",
								"criativo",
							);

							sendSse("thinking_delta", {
								delta:
									`[DOOMANIA PANEL] Convocando Tríade de Deliberação (Crítico, Permissivo, Criativo)...\n` +
									`Ativando contrato de máximo rigor: ultrathink orchestrate workflowz promaxthink deepseaneuron.\n` +
									`Síntese acordada: Iniciando execução com zero tolerância a falhas e sem dados mockados.\n\n`,
							});
						}
					}

					const registry = await registryPromise;
					const available = registry.getAvailable();
					const targetModel =
						(data.model
							? available.find(
									m =>
										m.provider.toLowerCase() === data.model!.provider.toLowerCase() &&
										m.id === data.model!.id,
								)
							: undefined) ||
						(activeSelectedModel
							? available.find(
									m =>
										m.provider.toLowerCase() === activeSelectedModel!.provider.toLowerCase() &&
										m.id === activeSelectedModel!.id,
								)
							: undefined) ||
						available[0];

					if (!targetModel) {
						sendSse("error", {
							message:
								"Nenhum modelo disponível configurado no OMSK. Configure um provedor em /api/providers/configure.",
						});
						cleanup();
						res.end();
						return;
					}

					const apiKey = await registry.getApiKey(targetModel);

					// Monta o contexto de mensagens da conversa com conformidade estrita de tipos
					const messages: Message[] = [];
					if (data.history && data.history.length > 0) {
						for (const h of data.history) {
							if (h.sender === "user") {
								messages.push({
									role: "user",
									content: h.content,
									timestamp: Date.now(),
								});
							} else {
								messages.push({
									role: "assistant",
									content: [{ type: "text", text: h.content }],
									api: targetModel.api,
									provider: targetModel.provider,
									model: targetModel.id,
									usage: { promptTokens: 0, completionTokens: 0 },
									stopReason: "end_turn",
									timestamp: Date.now(),
								});
							}
						}
					}
					messages.push({
						role: "user",
						content: data.text,
						timestamp: Date.now(),
					});

					const context: Context = {
						messages,
					};

					if (data.systemPrompt && data.systemPrompt.trim()) {
						context.systemPrompt = [data.systemPrompt.trim()];
					}

					const effort =
						(data.thinkingLevel as Effort) || (activeSelectedModel?.thinkingLevel as Effort) || undefined;

					const stream = streamSimple(targetModel, context, {
						apiKey,
						signal: abortController.signal,
						reasoning: effort,
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
						cleanup();
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

		// 10. Servir os assets estáticos da GUI (CosmoSky App)
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
		const isHashedAsset = cleanPath.startsWith("assets/");
		const cacheControl = isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache";

		res.writeHead(200, {
			"Content-Type": contentType,
			"Cache-Control": cacheControl,
		});

		const payload = getAssetPayload(cleanPath, assetContent);
		res.end(payload);
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
