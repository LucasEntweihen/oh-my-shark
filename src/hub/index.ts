import * as fs from "node:fs";
import {
	getProjectAgentDbPath,
	getProjectKnowledgeDbPath,
	getProjectKnowledgeJsonPath,
	getProjectOmskDir,
	getProjectProvidersJsonPath,
	getProjectRoot,
} from "../config/paths";
import { type DatabaseStats, getSharedDatabase, OmskSharedDatabase } from "../database";
import { getSharedKnowledge, type KnowledgeExportSnapshot, OmskSharedKnowledge } from "../knowledge";
import { getSharedProviders, OmskSharedProviders, type ProviderSummary } from "../providers";
import { type OmskServerInstance, startOmskHubServer } from "../server";

export interface OmskHubStatus {
	projectRoot: string;
	omskDir: string;
	authenticatedProviders: number;
	totalProviders: number;
	knowledgeNodes: number;
	databaseStats: DatabaseStats;
	files: {
		agentDbExists: boolean;
		knowledgeDbExists: boolean;
		providersJsonExists: boolean;
		knowledgeJsonExists: boolean;
	};
}

let cachedHub: OmskRootHub | undefined;

/**
 * Root Hub for the OMSK Ecosystem.
 * Unified coordinator exposing shared providers, databases, and semantic knowledge graphs
 * for both OMSK internal execution and external consuming systems.
 */
export class OmskRootHub {
	public readonly providers: OmskSharedProviders;
	public readonly database: OmskSharedDatabase;
	public readonly knowledge: OmskSharedKnowledge;
	private serverInstance?: OmskServerInstance;
	private initialized = false;

	constructor(
		providers?: OmskSharedProviders,
		database?: OmskSharedDatabase,
		knowledge?: OmskSharedKnowledge,
	) {
		this.database = database ?? getSharedDatabase();
		this.knowledge = knowledge ?? getSharedKnowledge();
		this.providers = providers ?? new OmskSharedProviders();
	}

	/**
	 * Initializes all subsystems in parallel and ensures root storage integrity.
	 */
	async init(): Promise<void> {
		if (this.initialized) {
			return;
		}

		await this.providers.init();
		this.knowledge.exportJsonSync();
		this.initialized = true;
	}

	/**
	 * Returns comprehensive operational status across databases, knowledge graphs, and AI providers.
	 */
	async getStatus(): Promise<OmskHubStatus> {
		if (!this.initialized) {
			await this.init();
		}

		const providerSummaries = await this.providers.listProviders();
		const authenticatedCount = providerSummaries.filter(p => p.authenticated).length;
		const dbStats = this.database.getStats();
		const recentNodes = this.knowledge.listRecent(undefined, 1000);

		return {
			projectRoot: getProjectRoot(),
			omskDir: getProjectOmskDir(),
			authenticatedProviders: authenticatedCount,
			totalProviders: providerSummaries.length,
			knowledgeNodes: recentNodes.length,
			databaseStats: dbStats,
			files: {
				agentDbExists: fs.existsSync(getProjectAgentDbPath()),
				knowledgeDbExists: fs.existsSync(getProjectKnowledgeDbPath()),
				providersJsonExists: fs.existsSync(getProjectProvidersJsonPath()),
				knowledgeJsonExists: fs.existsSync(getProjectKnowledgeJsonPath()),
			},
		};
	}

	/**
	 * Exports all JSON snapshots (providers and knowledge) to the root directory.
	 */
	async exportAll(): Promise<{ providersPath: string; knowledgePath: string }> {
		if (!this.initialized) {
			await this.init();
		}

		const providersPath = getProjectProvidersJsonPath();
		const knowledgePath = getProjectKnowledgeJsonPath();

		await this.providers.exportProvidersJson(providersPath);
		this.knowledge.exportJsonSync(knowledgePath);

		return { providersPath, knowledgePath };
	}

	/**
	 * Launches an embedded HTTP REST server on the specified port for external apps.
	 */
	async startServer(port: number = 3333): Promise<OmskServerInstance> {
		if (!this.initialized) {
			await this.init();
		}
		if (this.serverInstance) {
			return this.serverInstance;
		}
		this.serverInstance = startOmskHubServer(this, port);
		return this.serverInstance;
	}

	/**
	 * Stops the embedded server if running.
	 */
	stopServer(): void {
		if (this.serverInstance) {
			this.serverInstance.stop();
			this.serverInstance = undefined;
		}
	}

	/**
	 * Gracefully closes all database connections and servers.
	 */
	close(): void {
		this.stopServer();
		this.providers.close();
		this.knowledge.close();
		this.database.close();
		if (cachedHub === this) {
			cachedHub = undefined;
		}
		this.initialized = false;
	}
}

/**
 * Gets or creates the singleton OmskRootHub instance.
 */
export async function getOmskHub(): Promise<OmskRootHub> {
	if (!cachedHub) {
		cachedHub = new OmskRootHub();
		await cachedHub.init();
	}
	return cachedHub;
}

/** Alias for getOmskHub */
export const getOmskRoot = getOmskHub;
