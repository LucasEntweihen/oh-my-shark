import type { TeiaNodeKind } from "./knowledge";
import type { Server } from "bun";
import type { OmskRootHub } from "./hub";

export interface OmskServerInstance {
	server: Server<unknown>;
	port: number;
	url: string;
	stop: () => void;
}

function jsonResponse(data: unknown, status: number = 200): Response {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}

function errorResponse(message: string, status: number = 400): Response {
	return jsonResponse({ error: true, message }, status);
}

/**
 * Starts an embedded HTTP REST server on top of Bun providing multi-language access
 * to OMSK providers, knowledge graph, and shared databases.
 */
export function startOmskHubServer(hub: OmskRootHub, port: number = 3333): OmskServerInstance {
	const server = Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);
			const method = req.method.toUpperCase();

			if (method === "OPTIONS") {
				return new Response(null, {
					status: 204,
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				});
			}

			try {
				// GET /api/status
				if (method === "GET" && url.pathname === "/api/status") {
					const status = await hub.getStatus();
					return jsonResponse(status);
				}

				// GET /api/providers
				if (method === "GET" && url.pathname === "/api/providers") {
					const providers = await hub.providers.listProviders();
					return jsonResponse({ providers });
				}

				// GET /api/providers/models
				if (method === "GET" && url.pathname === "/api/providers/models") {
					const providerFilter = url.searchParams.get("provider") ?? undefined;
					const models = hub.providers.listModels(providerFilter);
					return jsonResponse({ total: models.length, models });
				}

				// GET /api/providers/:provider/key
				if (method === "GET" && url.pathname.startsWith("/api/providers/") && url.pathname.endsWith("/key")) {
					const parts = url.pathname.split("/");
					const providerId = parts[3];
					if (!providerId) {
						return errorResponse("Provider id missing in URL path");
					}
					const key = await hub.providers.getApiKey(providerId);
					return jsonResponse({ provider: providerId, hasKey: key !== undefined, key });
				}

				// POST /api/providers/login
				if (method === "POST" && url.pathname === "/api/providers/login") {
					const body = (await req.json().catch(() => null)) as { provider?: string; apiKey?: string } | null;
					if (!body?.provider || !body?.apiKey) {
						return errorResponse("Missing required fields: 'provider' and 'apiKey'");
					}
					await hub.providers.saveApiKey(body.provider, body.apiKey);
					return jsonResponse({ success: true, message: `API key saved for ${body.provider}` });
				}

				// POST /api/providers/complete
				if (method === "POST" && url.pathname === "/api/providers/complete") {
					const body = (await req.json().catch(() => null)) as {
						provider?: string;
						modelId?: string;
						prompt?: string;
						systemPrompt?: string;
						temperature?: number;
					} | null;
					if (!body?.provider || !body?.modelId || !body?.prompt) {
						return errorResponse("Missing required fields: 'provider', 'modelId', 'prompt'");
					}
					const result = await hub.providers.complete({
						provider: body.provider,
						modelId: body.modelId,
						prompt: body.prompt,
						systemPrompt: body.systemPrompt,
						temperature: body.temperature,
					});
					return jsonResponse(result);
				}

				// GET /api/knowledge
				if (method === "GET" && url.pathname === "/api/knowledge") {
					const query = url.searchParams.get("q");
					const kindParam = url.searchParams.get("kind");
					const kind = (kindParam && ["file", "symbol", "decision", "task", "test", "evidence", "fix"].includes(kindParam)
						? (kindParam as TeiaNodeKind)
						: undefined);
					const limit = Number(url.searchParams.get("limit") ?? "50");

					if (query && query.trim().length > 0) {
						const results = hub.knowledge.search(query, { kind, limit });
						return jsonResponse({ query, count: results.length, nodes: results });
					}
					const recent = hub.knowledge.listRecent(kind, limit);
					return jsonResponse({ count: recent.length, nodes: recent });
				}

				// POST /api/knowledge/decision
				if (method === "POST" && url.pathname === "/api/knowledge/decision") {
					const body = (await req.json().catch(() => null)) as {
						title?: string;
						rationale?: string;
						files?: string[];
						symbols?: string[];
						metadata?: Record<string, unknown>;
					} | null;
					if (!body?.title || !body?.rationale) {
						return errorResponse("Missing required fields: 'title', 'rationale'");
					}
					const id = hub.knowledge.recordDecision(
						body.title,
						body.rationale,
						body.files ?? [],
						body.symbols ?? [],
						body.metadata,
					);
					return jsonResponse({ success: true, id });
				}

				// POST /api/knowledge/fact
				if (method === "POST" && url.pathname === "/api/knowledge/fact") {
					const body = (await req.json().catch(() => null)) as {
						name?: string;
						content?: string;
						category?: string;
						metadata?: Record<string, unknown>;
					} | null;
					if (!body?.name || !body?.content) {
						return errorResponse("Missing required fields: 'name', 'content'");
					}
					const id = hub.knowledge.recordFact(
						body.name,
						body.content,
						body.category ?? "general",
						body.metadata,
					);
					return jsonResponse({ success: true, id });
				}

				// GET /api/database/tables
				if (method === "GET" && url.pathname === "/api/database/tables") {
					const tables = hub.database.getTables();
					return jsonResponse({ tables });
				}

				// POST /api/database/query
				if (method === "POST" && url.pathname === "/api/database/query") {
					const body = (await req.json().catch(() => null)) as {
						sql?: string;
						params?: unknown[];
					} | null;
					if (!body?.sql) {
						return errorResponse("Missing required field 'sql'");
					}
					const trimmed = body.sql.trim();
					// Allow SELECT only for safe query endpoint
					if (!trimmed.toUpperCase().startsWith("SELECT") && !trimmed.toUpperCase().startsWith("PRAGMA")) {
						return errorResponse("Only SELECT and PRAGMA statements are permitted on /api/database/query", 403);
					}
					const rows = hub.database.query(trimmed, body.params ?? []);
					return jsonResponse({ count: rows.length, rows });
				}

				return errorResponse(`Endpoint not found: ${method} ${url.pathname}`, 404);
			} catch (err) {
				return errorResponse(`Server internal error: ${String(err)}`, 500);
			}
		},
	});

	const actualPort = server.port ?? port;
	const url = `http://localhost:${actualPort}`;

	return {
		server,
		port: actualPort,
		url,
		stop: () => server.stop(),
	};
}
