import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
	getSharedDatabase,
	getSharedKnowledge,
	getSharedProviders,
	OmskRootHub,
	OmskSharedDatabase,
	OmskSharedKnowledge,
	OmskSharedProviders,
	startOmskHubServer,
} from "../index";

describe("OMSK Root Ecosystem & Shared Architecture", () => {
	let tempDir: string;
	let projectDbPath: string;
	let knowledgeDbPath: string;
	let globalDbPath: string;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-root-test-"));
		projectDbPath = path.join(tempDir, ".omsk", "agent.db");
		knowledgeDbPath = path.join(tempDir, ".omsk", "knowledge.db");
		globalDbPath = path.join(tempDir, "global-agent.db");
	});

	afterEach(async () => {
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("1. OmskSharedProviders initializes, persists API keys, syncs and exports JSON snapshot", async () => {
		const providers = new OmskSharedProviders(projectDbPath, globalDbPath);
		await providers.init();

		// Save an API key to the project root
		await providers.saveApiKey("anthropic", "sk-ant-test-omsk-root-key");

		expect(await providers.hasAuth("anthropic")).toBe(true);
		expect(await providers.getApiKey("anthropic")).toBe("sk-ant-test-omsk-root-key");

		// Verify that providers.json snapshot was created
		const providersJsonPath = path.join(tempDir, ".omsk", "providers.json");
		await providers.exportProvidersJson(providersJsonPath);

		const exists = await fs.stat(providersJsonPath).then(() => true).catch(() => false);
		expect(exists).toBe(true);

		const content = JSON.parse(await fs.readFile(providersJsonPath, "utf8"));
		expect(content.authenticatedCount).toBeGreaterThanOrEqual(1);
		expect(content.providers.some((p: { id: string }) => p.id === "anthropic")).toBe(true);

		// Verify catalog model discovery
		const models = providers.listModels("anthropic");
		expect(models.length).toBeGreaterThan(0);
		expect(models.some(m => m.id.includes("claude"))).toBe(true);

		providers.close();
	});

	it("2. OmskSharedDatabase provides high-concurrency WAL access, transactions and queries", () => {
		const db = new OmskSharedDatabase(projectDbPath);

		// Table creation
		db.run(`
			CREATE TABLE IF NOT EXISTS test_external_app_records (
				id TEXT PRIMARY KEY,
				service_name TEXT NOT NULL,
				payload_json TEXT NOT NULL,
				created_at INTEGER NOT NULL
			);
		`);

		// Transaction
		db.transaction(() => {
			db.run(
				"INSERT INTO test_external_app_records (id, service_name, payload_json, created_at) VALUES (?, ?, ?, ?);",
				["rec_1", "external-analytics-agent", JSON.stringify({ visits: 42 }), Date.now()],
			);
		});

		const rows = db.query<{ id: string; service_name: string }>(
			"SELECT id, service_name FROM test_external_app_records WHERE id = ?;",
			["rec_1"],
		);
		expect(rows.length).toBe(1);
		expect(rows[0]?.service_name).toBe("external-analytics-agent");

		const stats = db.getStats();
		expect(stats.tables).toBeGreaterThanOrEqual(1);
		expect(stats.journalMode.toLowerCase()).toBe("wal");

		db.close();
	});

	it("3. OmskSharedKnowledge records decisions, facts and traverses semantic graphs with FTS5", async () => {
		const knowledge = new OmskSharedKnowledge(knowledgeDbPath);

		// Record architectural decision
		const decisionId = knowledge.recordDecision(
			"Centralize Root Providers for Multi-System Access",
			"Permits external microservices and OMSK to share AI credentials with zero overhead.",
			["src/providers/index.ts", "src/database/index.ts"],
			["OmskSharedProviders", "OmskSharedDatabase"],
		);
		expect(decisionId).toMatch(/^decision_/);

		// Record fact
		const factId = knowledge.recordFact(
			"SQLite WAL Mode Concurrency",
			"Write-Ahead Logging enables simultaneous reader processes without database lock contention.",
			"architecture",
		);
		expect(factId).toMatch(/^fact_/);

		// Search
		const searchResults = knowledge.search("Centralize Root Providers");
		expect(searchResults.length).toBeGreaterThanOrEqual(1);
		expect(searchResults[0]?.name).toBe("Centralize Root Providers for Multi-System Access");

		// Graph connections
		const graph = knowledge.getConnectedGraph(decisionId);
		expect(graph).toBeDefined();
		expect(graph?.outgoing.length).toBeGreaterThanOrEqual(2);

		// JSON export for external applications
		const jsonPath = path.join(tempDir, ".omsk", "knowledge.json");
		const snapshot = await knowledge.exportJson(jsonPath);
		expect(snapshot.totalNodes).toBeGreaterThanOrEqual(2);
		expect(snapshot.decisions.length).toBeGreaterThanOrEqual(1);

		knowledge.close();
	});

	it("4. OmskRootHub coordinates all subsystems and serves multi-language REST endpoints", async () => {
		const providers = new OmskSharedProviders(projectDbPath, globalDbPath);
		const database = new OmskSharedDatabase(projectDbPath);
		const knowledge = new OmskSharedKnowledge(knowledgeDbPath);

		const hub = new OmskRootHub(providers, database, knowledge);
		await hub.init();

		// Save a credential and record a decision
		await hub.providers.saveApiKey("openai", "sk-proj-test-omsk-openai-key");
		hub.knowledge.recordFact("OMSK REST Bridge", "Allows Python, Go, and Ruby to consume shared providers.");

		const status = await hub.getStatus();
		expect(status.authenticatedProviders).toBeGreaterThanOrEqual(1);
		expect(status.knowledgeNodes).toBeGreaterThanOrEqual(1);

		// Launch REST server
		const serverInstance = await hub.startServer(0); // Port 0 picks random open port
		const baseUrl = serverInstance.url;

		// Test GET /api/status
		const statusRes = await fetch(`${baseUrl}/api/status`);
		expect(statusRes.status).toBe(200);
		const statusData = await statusRes.json();
		expect(statusData.authenticatedProviders).toBeGreaterThanOrEqual(1);

		// Test GET /api/providers
		const providersRes = await fetch(`${baseUrl}/api/providers`);
		expect(providersRes.status).toBe(200);
		const providersData = await providersRes.json();
		expect(providersData.providers.length).toBeGreaterThan(0);

		// Test GET /api/providers/openai/key
		const keyRes = await fetch(`${baseUrl}/api/providers/openai/key`);
		expect(keyRes.status).toBe(200);
		const keyData = await keyRes.json();
		expect(keyData.hasKey).toBe(true);
		expect(keyData.key).toBe("sk-proj-test-omsk-openai-key");

		// Test GET /api/knowledge?q=REST
		const knowledgeRes = await fetch(`${baseUrl}/api/knowledge?q=REST`);
		expect(knowledgeRes.status).toBe(200);
		const knowledgeData = await knowledgeRes.json();
		expect(knowledgeData.count).toBeGreaterThanOrEqual(1);

		// Test POST /api/database/query (safe SELECT)
		const queryRes = await fetch(`${baseUrl}/api/database/query`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sql: "SELECT 1 as is_alive;" }),
		});
		expect(queryRes.status).toBe(200);
		const queryData = await queryRes.json();
		expect(queryData.rows[0].is_alive).toBe(1);

		hub.close();
	});
});
