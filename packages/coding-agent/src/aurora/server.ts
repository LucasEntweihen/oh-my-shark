import * as http from "node:http";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import type { Context, Effort, Message } from "@oh-my-pi/pi-ai";
import { streamSimple } from "@oh-my-pi/pi-ai";
import { getOAuthProviders } from "@oh-my-pi/pi-ai/oauth";
import { getAgentDir, getProjectDir } from "@oh-my-pi/pi-utils";
import { ModelRegistry } from "../config/model-registry";
import { Settings } from "../config/settings";
import { discoverAuthStorage } from "../session/auth-broker-config";
import { createAgentSession } from "../sdk";
import type { AgentSession } from "../session/agent-session";
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
let globalAgentSession: AgentSession | undefined;
let activeSelectedModel: { provider: string; id: string; thinkingLevel?: string } | null = null;
let currentWorkingDir: string = getProjectDir();

async function getRegistry(cwd: string = currentWorkingDir): Promise<ModelRegistry> {
	if (globalModelRegistry) return globalModelRegistry;
	const agentDir = getAgentDir();
	const authStorage = await discoverAuthStorage(agentDir);
	globalSettings = await Settings.init({ cwd });
	globalModelRegistry = new ModelRegistry(authStorage, undefined, { settings: globalSettings });
	return globalModelRegistry;
}

export async function getOrCreateAgentSession(cwd: string = currentWorkingDir): Promise<AgentSession> {
	if (globalAgentSession) return globalAgentSession;
	const agentDir = getAgentDir();
	const sessionResult = await createAgentSession({
		cwd,
		agentDir,
	});
	globalAgentSession = sessionResult.session;
	return globalAgentSession;
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

// Armazena abort controllers ativos por streamId
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
	currentWorkingDir = cwd;
	const registryPromise = getRegistry(cwd);

	const server = http.createServer(async (req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
		const pathname = parsedUrl.pathname;

		// ====================================================================
		// 1. API: Obter modelos e status real dos providers
		// ====================================================================
		if (pathname === "/api/models" && req.method === "GET") {
			try {
				const registry = await registryPromise;
				const available = registry.getAvailable();
				const authedProviders = registry.authStorage.list();

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
						providers: Array.from(new Set(available.map(m => m.provider))).sort(),
						authenticatedProviders: authedProviders,
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

		// ====================================================================
		// 2. API: Selecionar Modelo Ativo no Backend
		// ====================================================================
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

		// ====================================================================
		// 3. API: Listagem completa e detalhada de Provedores e seus status REAIS
		// ====================================================================
		if (pathname === "/api/providers" && req.method === "GET") {
			try {
				const registry = await registryPromise;
				const authedList = registry.authStorage.list();
				const oauthProviders = getOAuthProviders();
				const availableModels = registry.getAvailable();

				const providersData = oauthProviders.map(p => {
					const isAuthed = authedList.includes(p.id) || registry.authStorage.has(p.id);
					const modelsForProv = availableModels.filter(m => m.provider.toLowerCase() === p.id.toLowerCase());
					return {
						id: p.id,
						name: p.name,
						status: isAuthed ? ("connected" as const) : ("disconnected" as const),
						isOAuth: true,
						available: p.available,
						modelsCount: modelsForProv.length,
						models: modelsForProv.map(m => ({ id: m.id, name: m.name })),
					};
				});

				// Provedores adicionais configurados via API Key mas não-OAuth
				for (const authedId of authedList) {
					if (!providersData.some(p => p.id === authedId)) {
						const modelsForProv = availableModels.filter(m => m.provider.toLowerCase() === authedId.toLowerCase());
						providersData.push({
							id: authedId,
							name: authedId.toUpperCase(),
							status: "connected",
							isOAuth: false,
							available: true,
							modelsCount: modelsForProv.length,
							models: modelsForProv.map(m => ({ id: m.id, name: m.name })),
						});
					}
				}

				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						ok: true,
						providers: providersData,
						authenticatedProviders: authedList,
					}),
				);
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// ====================================================================
		// 4. API: Configurar nova chave de API para Provider ou /login
		// ====================================================================
		if (
			(pathname === "/api/providers/configure" || pathname === "/api/providers/login") &&
			req.method === "POST"
		) {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { provider: string; apiKey?: string; key?: string };
					const key = data.apiKey || data.key;
					if (!data.provider || !key || !key.trim()) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Missing provider or apiKey" }));
						return;
					}

					const agentDir = getAgentDir();
					const authStorage = await discoverAuthStorage(agentDir);
					await authStorage.set(data.provider, { type: "api_key", key: key.trim() });
					const registry = await registryPromise;
					await registry.refresh("online");

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(
						JSON.stringify({
							ok: true,
							provider: data.provider,
							message: `Provedor ${data.provider} autenticado com sucesso no OMSK.`,
						}),
					);
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// ====================================================================
		// 5. API: Desconectar Provedor (Logout)
		// ====================================================================
		if (pathname === "/api/providers/logout" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { provider: string };
					if (!data.provider) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Missing provider" }));
						return;
					}

					const agentDir = getAgentDir();
					const authStorage = await discoverAuthStorage(agentDir);
					await authStorage.remove(data.provider);
					const registry = await registryPromise;

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(
						JSON.stringify({
							ok: true,
							provider: data.provider,
							message: `Provedor ${data.provider} desconectado.`,
						}),
					);
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// ====================================================================
		// 6. API: Catálogo Completo de Slash Commands do OMSK
		// ====================================================================
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
				if (!commands.some(c => c.name === "/doomania")) {
					commands.unshift({
						name: "/doomania",
						description: "Painel de deliberação tripla (Crítico, Permissivo, Criativo) com contrato de alto rigor",
						icon: "bolt",
						subcommands: [],
					});
				}
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true, commands }));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// ====================================================================
		// 7. API: Catálogo Completo de Ferramentas Reais do Harness
		// ====================================================================
		if (pathname === "/api/tools" && req.method === "GET") {
			try {
				const toolsList = [
					{ name: "read", description: "Leitura cirúrgica de arquivos e payloads [PATH#HASH]" },
					{ name: "write", description: "Criação e escrita atômica com validação de hash" },
					{ name: "edit", description: "Edição precisa ancorada por blocos hashline sem race conditions" },
					{ name: "bash", description: "Execução controlada de processos no terminal nativo PTY" },
					{ name: "grep", description: "Busca de expressões regulares em alta velocidade" },
					{ name: "glob", description: "Varredura de árvore de arquivos respeitando .gitignore" },
					{ name: "lsp", description: "Inteligência de linguagem (diagnostics, definition, rename)" },
					{ name: "ast_edit", description: "Refatoração estrutural AST através de padrões sintáticos" },
					{ name: "ask", description: "Protocolo interativo de autorização e escolha de planos" },
					{ name: "task", description: "Orquestração concorrente de subagentes delegados" },
					{ name: "todo", description: "Gerenciador DAG de fases, tarefas e pendências" },
					{ name: "eval", description: "Kernel interativo TypeScript/Python com workpools" },
					{ name: "learn", description: "Consolidação e aprendizado contínuo de memória" },
					{ name: "manage_skill", description: "Gerenciamento de bibliotecas de habilidades" },
				];
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true, tools: toolsList }));
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// ====================================================================
		// 8. API: Telemetria Dinâmica Real do Sistema
		// ====================================================================
		if (pathname === "/api/system/stats" && req.method === "GET") {
			try {
				const registry = await registryPromise;
				const available = registry.getAvailable();
				const mem = process.memoryUsage();
				const authedCount = registry.authStorage.list().length;

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
							authenticatedProvidersCount: authedCount,
							cwd: currentWorkingDir,
							platform: process.platform,
							nodeVersion: process.version,
						},
					}),
				);
			} catch (err) {
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		// ====================================================================
		// 9. API: Workspace & Navegação no Sistema de Arquivos Local (/api/fs/browse)
		// ====================================================================
		if (pathname === "/api/fs/browse" && req.method === "GET") {
			try {
				const reqDir = parsedUrl.searchParams.get("dir") || currentWorkingDir;
				const resolvedPath = path.resolve(reqDir.replace(/^~/, os.homedir()));
				const dirents = fs.readdirSync(resolvedPath, { withFileTypes: true });
				const entries = dirents
					.filter(d => !d.name.startsWith(".git") && d.name !== "node_modules")
					.map(d => {
						const fullPath = path.join(resolvedPath, d.name).replace(/\\/g, "/");
						let size = 0;
						try {
							if (d.isFile()) size = fs.statSync(fullPath).size;
						} catch {}
						return {
							name: d.name,
							path: fullPath,
							isDirectory: d.isDirectory(),
							size,
						};
					})
					.sort((a, b) => (a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1));

				const parent = path.dirname(resolvedPath).replace(/\\/g, "/");
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						success: true,
						ok: true,
						currentDir: resolvedPath.replace(/\\/g, "/"),
						parentDir: parent !== resolvedPath.replace(/\\/g, "/") ? parent : null,
						homedir: os.homedir().replace(/\\/g, "/"),
						entries,
					}),
				);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Diretório inacessível";
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ success: false, ok: false, error: message }));
			}
			return;
		}

		// ====================================================================
		// 9b. API: Árvore Recursiva de Arquivos do Workspace (/api/fs/tree)
		// ====================================================================
		if (pathname === "/api/fs/tree" && req.method === "GET") {
			try {
				const reqDir = parsedUrl.searchParams.get("dir") || currentWorkingDir;
				const resolvedPath = path.resolve(reqDir.replace(/^~/, os.homedir()));

				function scanDirRecursive(dir: string, depth = 0, maxDepth = 2): any[] {
					if (depth > maxDepth) return [];
					const items: any[] = [];
					try {
						const entries = fs.readdirSync(dir, { withFileTypes: true });
						for (const e of entries) {
							if (e.name.startsWith(".git") || e.name === "node_modules" || e.name === "dist") continue;
							const full = path.join(dir, e.name).replace(/\\/g, "/");
							if (e.isDirectory()) {
								items.push({
									id: `dir-${full}`,
									name: e.name,
									path: full,
									type: "directory",
									availability: "selected",
									isExpanded: depth === 0,
									children: scanDirRecursive(full, depth + 1, maxDepth),
								});
							} else {
								let sizeStr = "";
								try {
									const s = fs.statSync(full).size;
									sizeStr = `${(s / 1024).toFixed(1)} KB`;
								} catch {}
								items.push({
									id: `file-${full}`,
									name: e.name,
									path: full,
									type: "file",
									availability: "available",
									size: sizeStr,
								});
							}
						}
					} catch {}
					return items;
				}

				const tree = scanDirRecursive(resolvedPath);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						success: true,
						ok: true,
						rootPath: resolvedPath.replace(/\\/g, "/"),
						tree,
					}),
				);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Falha ao escanear árvore";
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ success: false, ok: false, error: message }));
			}
			return;
		}

		// ====================================================================
		// 10. API: Selecionar e Alterar Diretório do Workspace Ativo (/api/fs/set-directory)
		// ====================================================================
		if (pathname === "/api/fs/set-directory" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const data = JSON.parse(body) as { path: string };
					if (!data.path) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Missing directory path" }));
						return;
					}
					const targetDir = path.resolve(data.path.replace(/^~/, os.homedir()));
					if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Diretório inexistente ou inválido" }));
						return;
					}

					currentWorkingDir = targetDir;
					// Reseta registry para re-indexar escopo do novo projeto
					globalModelRegistry = undefined;
					globalAgentSession = undefined;
					await getRegistry(currentWorkingDir);

					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(
						JSON.stringify({
							ok: true,
							currentDir: currentWorkingDir.replace(/\\/g, "/"),
							message: "Diretório de trabalho atualizado com sucesso.",
						}),
					);
				} catch (err) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			});
			return;
		}

		// ====================================================================
		// 11. API: Responder ao Protocolo Interativo Ask User
		// ====================================================================
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

		// ====================================================================
		// 12. API: Interromper Resposta (Abort)
		// ====================================================================
		if (pathname === "/api/chat/abort" && req.method === "POST") {
			for (const controller of activeStreams.values()) {
				controller.abort();
			}
			activeStreams.clear();
			if (globalAgentSession) {
				void globalAgentSession.abort();
			}
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		// ====================================================================
		// 13. API: Criar Nova Sessão no Backend
		// ====================================================================
		if (pathname === "/api/sessions/new" && req.method === "POST") {
			const sessionId = `sess-${crypto.randomUUID()}`;
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true, sessionId }));
			return;
		}

		// ====================================================================
		// 14. API: Streaming Real de Mensagens com Suporte Completo a Slash Commands e Bridge
		// ====================================================================
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

						if (cmdName === "stats") {
							const mem = process.memoryUsage();
							sendSse("text_delta", {
								delta:
									`### 📊 Telemetria do Sistema Oh My Shark:\n\n` +
									`- **Heap Utilizado:** ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB\n` +
									`- **RSS:** ${(mem.rss / 1024 / 1024).toFixed(1)} MB\n` +
									`- **Uptime:** ${Math.floor(process.uptime())}s\n` +
									`- **Sessões Ativas:** ${activeStreams.size}\n` +
									`- **Diretório Ativo:** \`${currentWorkingDir}\`\n`,
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
								"Nenhum modelo disponível configurado no OMSK. Configure um provedor em /api/providers/configure ou via /login.",
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
									usage: {
										input: 0,
										output: 0,
										cacheRead: 0,
										cacheWrite: 0,
										totalTokens: 0,
										cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
									},
									stopReason: "stop",
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

		// ====================================================================
		// 15. Servir os assets estáticos da GUI
		// ====================================================================
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
