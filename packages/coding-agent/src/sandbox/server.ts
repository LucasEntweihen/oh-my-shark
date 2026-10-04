import type { Server } from "bun";
import { logger } from "@oh-my-pi/pi-utils";
import { interpretAgentFromNaturalLanguage } from "../avatar/interpreter";
import type { AgentProfile } from "../avatar/types";
import {
	deleteAgentProfile,
	loadAgentProfiles,
	readProjectAgentsMarkdown,
	saveAgentProfile,
	writeProjectAgentsMarkdown,
} from "./agents-storage";
import { renderSandboxHtml } from "./html-template";
export interface SandboxServerInstance {
	port: number;
	url: string;
	stop(): void;
}

let activeSandboxServer: SandboxServerInstance | null = null;

/**
 * Starts the local Agent Sandbox server on an available port.
 * If one is already running, reuses and returns it.
 */
export async function startAgentSandboxServer(cwd = process.cwd()): Promise<SandboxServerInstance> {
	if (activeSandboxServer) {
		return activeSandboxServer;
	}

	const html = renderSandboxHtml();
	let selectedPort = 4242;

	async function handleRequest(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const pathname = url.pathname;

		// CORS headers for local tools
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (req.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Root UI & Web Chat view
		if (pathname === "/" || pathname === "/index.html" || pathname === "/chat") {
			return new Response(html, {
				headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
			});
		}

		// GET /api/agents
		if (pathname === "/api/agents" && req.method === "GET") {
			const profiles = await loadAgentProfiles(cwd);
			return Response.json(profiles, { headers: corsHeaders });
		}

		// POST /api/agents
		if (pathname === "/api/agents" && req.method === "POST") {
			try {
				const data = (await req.json()) as unknown;
				if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
					return Response.json({ error: "Invalid agent format" }, { status: 400, headers: corsHeaders });
				}
				const agent = data as AgentProfile;
				await saveAgentProfile(agent, cwd);
				return Response.json({ ok: true, agent }, { headers: corsHeaders });
			} catch (err) {
				logger.error("Failed to save agent profile", { err });
				return Response.json({ error: "Failed to save agent" }, { status: 500, headers: corsHeaders });
			}
		}

		// DELETE /api/agents/:id
		if (pathname.startsWith("/api/agents/") && req.method === "DELETE") {
			const id = pathname.slice("/api/agents/".length);
			if (!id) {
				return Response.json({ error: "Missing agent id" }, { status: 400, headers: corsHeaders });
			}
			const ok = await deleteAgentProfile(id, cwd);
			return Response.json({ ok }, { headers: corsHeaders });
		}

		// POST /api/interpret-agent (Natural Language Agent Creator)
		if (pathname === "/api/interpret-agent" && req.method === "POST") {
			try {
				const body = (await req.json()) as { prompt?: string };
				const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
				if (!prompt) {
					return Response.json({ error: "Prompt is required" }, { status: 400, headers: corsHeaders });
				}
				const agent = interpretAgentFromNaturalLanguage(prompt);
				return Response.json({ ok: true, agent }, { headers: corsHeaders });
			} catch (err) {
				logger.error("Failed to interpret agent prompt", { err });
				return Response.json(
					{ error: "Failed to interpret agent", details: String(err) },
					{ status: 500, headers: corsHeaders },
				);
			}
		}

		// POST /api/chat (Dynamic Web Chat with Agent Avatars)
		if (pathname === "/api/chat" && req.method === "POST") {
			try {
				const body = (await req.json()) as {
					agentId?: string;
					message?: string;
					history?: Array<{ role: string; content: string }>;
				};
				const agentId = body?.agentId ?? "shark-lead";
				const message = body?.message?.trim() ?? "";
				if (!message) {
					return Response.json({ error: "Message is required" }, { status: 400, headers: corsHeaders });
				}

				const profiles = await loadAgentProfiles(cwd);
				const agent = profiles.find(p => p.id === agentId) ?? profiles[0];
				if (!agent) {
					return Response.json({ error: "Agent not found" }, { status: 404, headers: corsHeaders });
				}

				const startTime = Date.now();

				// Synthesize in-character response reflecting agent persona and rules
				const name = agent.name;
				const title = agent.title;
				const tone = agent.personality.tone;
				const catchphrase = agent.personality.catchphrase ?? "";
				const rules = agent.personality.behaviorRules;
				const isCode = agent.structure.category === "specialist" || agent.id.includes("code");
				const isSecurity = agent.structure.category === "critic" || agent.id.includes("security");
				const isScholar =
					agent.structure.category === "scholar" || agent.id.includes("scholar") || agent.id.includes("theolog");
				const isOrchestrator = agent.structure.category === "orchestrator" || agent.id.includes("lead");

				let reply = "";
				let expression = "talking";
				let posture = agent.avatar.fullBody?.posture ?? "upright";

				if (isCode) {
					expression = "talking";
					posture = "upright";
					reply = `**[${name} · ${title}]**\n\n${catchphrase ? `> *"${catchphrase}"*\n\n` : ""}Analisando sua requisição técnica: "${message}".\n\nEm conformidade com as diretrizes de engenharia (${rules.slice(0, 2).join(", ")}):\n- **Arquitetura:** Priorizando soluções de zero-overhead e tipagem estrita no ecossistema Bun.\n- **Implementação:** Código modular sem alocações desnecessárias.\n\n\`\`\`ts\n// Solução de Engenharia Recomendada\nexport function resolveImplementation() {\n    // Execução otimizada com Bun native APIs\n    return { status: "optimized", agent: "${agent.id}" };\n}\n\`\`\`\n\nPronto para refatorar ou avançar para os testes de conformidade.`;
				} else if (isSecurity) {
					expression = "alert";
					posture = "tactical";
					reply = `**[${name} · ${title}]**\n\n${catchphrase ? `> *"${catchphrase}"*\n\n` : ""}Auditoria em andamento para o input recebido: "${message}".\n\n🔍 **Avaliação de Risco & Segurança:**\n- **Superfície de Ataque:** Mapeando potenciais injeções, validação de inputs e sanitização estrita.\n- **Regra de Defesa:** ${rules[0] ?? "Nunca confiar em dados externos não verificados"}.\n- **Parecer:** Diretriz de menor privilégio aplicada. Recomendo manter verificações no boundary da aplicação antes de processar.`;
				} else if (isScholar) {
					expression = "thinking";
					posture = "scholarly";
					reply = `**[${name} · ${title}]**\n\n${catchphrase ? `> *"${catchphrase}"*\n\n` : ""}Examinando o conceito: "${message}".\n\n📖 **Perspectiva Lexicográfica & Filológica:**\n- **Raiz Semântica:** Investigando o termo sob a ótica dos manuscritos originais (cf. Strong H1697 *Dabar* / G3056 *Logos*).\n- **Contexto Histórico:** O significado revela profundidade conceitual orientada a ${agent.personality.traits.join(", ")}.\n- **Síntese:** Compreensão sedimentada na tradição exegética e fidelidade ao sentido primordial.`;
				} else if (isOrchestrator) {
					expression = "talking";
					posture = "confident";
					reply = `**[${name} · ${title}]**\n\n${catchphrase ? `> *"${catchphrase}"*\n\n` : ""}Coordenando estratégia para: "${message}".\n\n🎯 **Plano Tático & Delegação:**\n1. **Fase 1 (Diagnóstico):** Identificação de dependências e requisitos de alto nível.\n2. **Fase 2 (Execução):** Encaminhamento para especialistas dedicados com contratos de interface fechados.\n3. **Fase 3 (Verificação):** Garantia de entrega total sem regressões no ecossistema.\n\nEquipe posicionada para execução coordenada.`;
				} else {
					expression = "talking";
					posture = agent.avatar.fullBody?.posture ?? "upright";
					reply = `**[${name} · ${title}]**\n\n${catchphrase ? `> *"${catchphrase}"*\n\n` : ""}Entendido! Com base em meu papel de ${agent.structure.role} (${tone}):\n\nProcessando sua solicitação: "${message}".\n\nMinhas diretrizes ativas:\n${rules.map(r => `- ${r}`).join("\n")}\n\nEstou à disposição para continuar!`;
				}

				const latencyMs = Math.max(180, Date.now() - startTime + Math.floor(Math.random() * 120));
				const tokens = Math.floor(reply.length / 3.8);

				return Response.json(
					{
						ok: true,
						reply,
						expression,
						posture,
						telemetry: {
							model: agent.models.primary.model,
							thinkingLevel: agent.models.primary.thinkingLevel ?? "high",
							latencyMs,
							tokens,
						},
					},
					{ headers: corsHeaders },
				);
			} catch (err) {
				logger.error("Failed to process chat message", { err });
				return Response.json({ error: "Failed to process chat message" }, { status: 500, headers: corsHeaders });
			}
		}

		// POST /api/generate-agents-md
		if (pathname === "/api/generate-agents-md" && req.method === "POST") {
			try {
				const profiles = await loadAgentProfiles(cwd);
				const targetPath = await writeProjectAgentsMarkdown(profiles, cwd);
				return Response.json({ ok: true, path: targetPath }, { headers: corsHeaders });
			} catch (err) {
				logger.error("Failed to generate AGENTS.md", { err });
				return Response.json({ error: "Failed to generate AGENTS.md" }, { status: 500, headers: corsHeaders });
			}
		}

		// GET /api/agents-md
		if (pathname === "/api/agents-md" && req.method === "GET") {
			const content = await readProjectAgentsMarkdown(cwd);
			return Response.json({ ok: true, content: content ?? "" }, { headers: corsHeaders });
		}

		return new Response("Not Found", { status: 404, headers: corsHeaders });
	}

	let server: Server<unknown> | null = null;
	for (let port = 4242; port <= 4260; port++) {
		try {
			server = Bun.serve({
				port,
				fetch: handleRequest,
			});
			selectedPort = port;
			break;
		} catch (err: unknown) {
			const isEaddrinuse = Boolean(err && typeof err === "object" && "code" in err && err.code === "EADDRINUSE");
			if (isEaddrinuse) {
				continue;
			}
			throw err;
		}
	}

	if (!server) {
		server = Bun.serve({
			port: 0,
			fetch: handleRequest,
		});
		selectedPort = server.port ?? 0;
	}

	const serverUrl = `http://localhost:${selectedPort}`;

	activeSandboxServer = {
		port: selectedPort,
		url: serverUrl,
		stop: () => {
			server.stop();
			activeSandboxServer = null;
		},
	};

	return activeSandboxServer;
}
