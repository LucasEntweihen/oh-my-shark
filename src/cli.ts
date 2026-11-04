#!/usr/bin/env bun
import { getOmskHub } from "./hub";

function printHelp(): void {
	console.log(`
OMSK Root Hub CLI - Unified Providers, Knowledge Base & Shared Database

Usage:
  bun run hub <command> [options]

Commands:
  status                          Show comprehensive status of providers, DB and knowledge base
  providers                       List all AI providers and their authentication status
  models [provider]               List supported models from the catalog
  login <provider> <apiKey>       Store an API key in the root and global database
  get-key <provider>              Retrieve stored API key for a provider
  knowledge [query]               Search knowledge graph or list recent records
  record-decision <title> <why>   Record an architectural decision in Mente em Teia
  record-fact <name> <content>    Record a general fact in the knowledge base
  tables                          List SQLite tables in the shared database
  export                          Update .omsk/providers.json and .omsk/knowledge.json
  serve [port]                    Start embedded HTTP REST server (default: 3333)
`);
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const command = args[0] ?? "status";

	if (command === "help" || command === "--help" || command === "-h") {
		printHelp();
		return;
	}

	const hub = await getOmskHub();

	try {
		switch (command) {
			case "status": {
				const status = await hub.getStatus();
				console.log("\n--- OMSK Root Hub Status ---");
				console.log(`Project Root:           ${status.projectRoot}`);
				console.log(`OMSK Directory:         ${status.omskDir}`);
				console.log(`Authenticated Providers:${status.authenticatedProviders} / ${status.totalProviders}`);
				console.log(`Knowledge Base Nodes:   ${status.knowledgeNodes}`);
				console.log(`Shared Database Size:   ${status.databaseStats.sizeBytes} bytes (${status.databaseStats.tables} tables, WAL)`);
				console.log("Root Storage Files:");
				console.log(`  - agent.db:           ${status.files.agentDbExists ? "OK" : "Missing"}`);
				console.log(`  - knowledge.db:       ${status.files.knowledgeDbExists ? "OK" : "Missing"}`);
				console.log(`  - providers.json:     ${status.files.providersJsonExists ? "OK" : "Missing"}`);
				console.log(`  - knowledge.json:     ${status.files.knowledgeJsonExists ? "OK" : "Missing"}`);
				break;
			}

			case "providers": {
				const providers = await hub.providers.listProviders();
				console.log("\n--- OMSK AI Providers ---");
				for (const p of providers) {
					const authBadge = p.authenticated ? `[AUTH - ${p.authSource}]` : "[UNAUTHENTICATED]";
					console.log(`${p.id.padEnd(25)} ${authBadge.padEnd(25)} Models: ${p.modelsCount}`);
				}
				break;
			}

			case "models": {
				const providerFilter = args[1];
				const models = hub.providers.listModels(providerFilter);
				console.log(`\n--- OMSK Models Catalog (${models.length} models) ---`);
				for (const m of models.slice(0, 50)) {
					const features = [
						m.supportsThinking ? "thinking" : "",
						m.supportsImages ? "vision" : "",
					].filter(Boolean).join(", ");
					console.log(`${m.provider.padEnd(18)} ${m.id.padEnd(35)} [${features || "text"}]`);
				}
				if (models.length > 50) {
					console.log(`... and ${models.length - 50} more models. Filter with 'hub models <provider>'`);
				}
				break;
			}

			case "login": {
				const provider = args[1];
				const apiKey = args[2];
				if (!provider || !apiKey) {
					console.error("Error: Usage: hub login <provider> <apiKey>");
					process.exit(1);
				}
				await hub.providers.saveApiKey(provider, apiKey);
				console.log(`Successfully stored API key for '${provider}' in project root and global DB.`);
				break;
			}

			case "get-key": {
				const provider = args[1];
				if (!provider) {
					console.error("Error: Usage: hub get-key <provider>");
					process.exit(1);
				}
				const key = await hub.providers.getApiKey(provider);
				if (key) {
					console.log(`Key found for '${provider}': ${key.slice(0, 4)}...${key.slice(-4)}`);
				} else {
					console.log(`No key found for '${provider}'.`);
				}
				break;
			}

			case "knowledge": {
				const query = args[1];
				if (query) {
					const results = hub.knowledge.search(query);
					console.log(`\n--- Knowledge Search Results for '${query}' (${results.length}) ---`);
					for (const node of results) {
						console.log(`[${node.kind.toUpperCase()}] ${node.name} (${node.id})`);
						if (node.content) {
							console.log(`  ${node.content.slice(0, 100)}...`);
						}
					}
				} else {
					const recent = hub.knowledge.listRecent(undefined, 20);
					console.log(`\n--- Recent Knowledge Nodes (${recent.length}) ---`);
					for (const node of recent) {
						console.log(`[${node.kind.toUpperCase()}] ${node.name} (${node.id})`);
					}
				}
				break;
			}

			case "record-decision": {
				const title = args[1];
				const rationale = args[2];
				if (!title || !rationale) {
					console.error("Error: Usage: hub record-decision <title> <rationale>");
					process.exit(1);
				}
				const id = hub.knowledge.recordDecision(title, rationale);
				console.log(`Decision recorded in Mente em Teia: ${id}`);
				break;
			}

			case "record-fact": {
				const name = args[1];
				const content = args[2];
				if (!name || !content) {
					console.error("Error: Usage: hub record-fact <name> <content>");
					process.exit(1);
				}
				const id = hub.knowledge.recordFact(name, content);
				console.log(`Fact recorded in Mente em Teia: ${id}`);
				break;
			}

			case "tables": {
				const tables = hub.database.getTables();
				console.log("\n--- Shared SQLite Tables ---");
				for (const table of tables) {
					console.log(`  - ${table}`);
				}
				break;
			}

			case "export": {
				const result = await hub.exportAll();
				console.log("Export complete:");
				console.log(`  Providers: ${result.providersPath}`);
				console.log(`  Knowledge: ${result.knowledgePath}`);
				break;
			}

			case "serve": {
				const port = Number(args[1] ?? 3333);
				const serverInstance = await hub.startServer(port);
				console.log(`OMSK Hub REST Server running at ${serverInstance.url}`);
				console.log("Press Ctrl+C to stop.");
				const { promise: keepAlive } = Promise.withResolvers<void>();
				await keepAlive;
				break;
			}

			default:
				console.error(`Unknown command: ${command}`);
				printHelp();
				process.exit(1);
		}
	} finally {
		if (command !== "serve") {
			hub.close();
		}
	}
}

main().catch(err => {
	console.error(`CLI execution failed: ${String(err)}`);
	process.exit(1);
});
