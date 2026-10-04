import { logger } from "@oh-my-pi/pi-utils";
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

	const server = Bun.serve({
		port: selectedPort,
		async fetch(req) {
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

			// Root UI
			if (pathname === "/" || pathname === "/index.html") {
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
		},
	});

	selectedPort = server.port ?? 4242;
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
