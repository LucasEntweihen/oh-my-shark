import * as fs from "node:fs";
import * as path from "node:path";
import type { ApiKeyResolver, StoredAuthCredential } from "../../packages/ai/src/auth-storage";
import { AuthStorage } from "../../packages/ai/src/auth-storage";
import { SqliteAuthCredentialStore } from "../../packages/ai/src/auth/sqlite-credential-store";
import { completeSimple, streamSimple } from "../../packages/ai/src/stream";
import type { Context } from "../../packages/ai/src/types";
import type { Api, Model, SimpleStreamOptions } from "../../packages/ai/src/types";
import {
	type GeneratedProvider,
	getBundledModel,
	getBundledModels,
	getBundledProviders,
} from "../../packages/catalog/src/models";
import {
	ensureProjectOmskDir,
	getGlobalAgentDbPath,
	getProjectAgentDbPath,
	getProjectProvidersJsonPath,
	getProjectRoot,
} from "../config/paths";

export interface ProviderSummary {
	id: string;
	authenticated: boolean;
	authSource?: "local_sqlite" | "environment" | "none";
	modelsCount: number;
	defaultModelId?: string;
}

export interface ModelSummary {
	id: string;
	provider: string;
	name: string;
	contextWindow: number;
	maxOutputTokens?: number;
	supportsImages: boolean;
	supportsThinking: boolean;
	pricing?: {
		inputPerMillion: number;
		outputPerMillion: number;
	};
}

export interface SimpleCompletionOptions {
	provider: string;
	modelId: string;
	prompt: string;
	systemPrompt?: string;
	temperature?: number;
}

export interface SimpleCompletionResult {
	text: string;
	provider: string;
	modelId: string;
	inputTokens: number;
	outputTokens: number;
}

export interface SimpleStreamPromptOptions {
	provider: string;
	modelId: string;
	prompt: string;
	systemPrompt?: string;
	temperature?: number;
	onDelta?: (text: string) => void;
}

export interface AssistantStreamEvent {
	type: string;
	delta?: string;
	content?: unknown;
	[key: string]: unknown;
}

let cachedSharedProviders: OmskSharedProviders | undefined;

/**
 * Shared provider and login subsystem anchored at the project root.
 * Manages provider authentication, multi-model catalog discovery, bidirectional sync,
 * and unified execution for OMSK and any external system or script.
 */
export class OmskSharedProviders {
	private localStore!: SqliteAuthCredentialStore;
	private authStorage!: AuthStorage;
	private initialized = false;
	private readonly projectDbPath: string;
	private readonly globalDbPath: string;

	constructor(projectDbPath: string = getProjectAgentDbPath(), globalDbPath: string = getGlobalAgentDbPath()) {
		this.projectDbPath = path.resolve(projectDbPath);
		this.globalDbPath = path.resolve(globalDbPath);
	}

	/**
	 * Initializes local SQLite credential storage, triggers automatic fallback sync from global storage
	 * if the local project storage is fresh, and exports a synchronized JSON snapshot for non-SQLite readers.
	 */
	async init(): Promise<void> {
		if (this.initialized) {
			return;
		}

		ensureProjectOmskDir(getProjectRoot());
		this.localStore = await SqliteAuthCredentialStore.open(this.projectDbPath);
		this.authStorage = new AuthStorage(this.localStore, {
			sourceLabel: `root-omsk ${this.projectDbPath}`,
		});
		await this.authStorage.reload();

		// If root project store has no credentials, sync from global ~/.omsk/agent/agent.db
		const localProviders = this.localStore.listProviders();
		if (localProviders.length === 0 && fs.existsSync(this.globalDbPath)) {
			await this.syncGlobalToRoot();
		}

		this.initialized = true;
		await this.exportProvidersJson();
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.init();
		}
	}

	/**
	 * Returns the underlying AuthStorage instance.
	 */
	async getAuthStorage(): Promise<AuthStorage> {
		await this.ensureInitialized();
		return this.authStorage;
	}

	/**
	 * Lists all available providers, authentication status, and total bundled models.
	 */
	async listProviders(): Promise<ProviderSummary[]> {
		await this.ensureInitialized();
		const bundledProviders = getBundledProviders();
		const summaries: ProviderSummary[] = [];

		for (const provider of bundledProviders) {
			const models = getBundledModels(provider as GeneratedProvider);
			const hasConfigured = this.authStorage.hasConcreteAuth(provider) || this.authStorage.hasAuth(provider);
			const envKey = process.env[`${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`];
			const authenticated = hasConfigured || (typeof envKey === "string" && envKey.length > 0);

			summaries.push({
				id: provider,
				authenticated,
				authSource: hasConfigured ? "local_sqlite" : envKey ? "environment" : "none",
				modelsCount: models.length,
				defaultModelId: models[0]?.id,
			});
		}

		return summaries;
	}

	/**
	 * Resolves the active API key or access token for a given provider.
	 */
	async getApiKey(provider: string): Promise<string | undefined> {
		await this.ensureInitialized();
		const storedKey = await this.authStorage.getApiKey(provider);
		if (storedKey && storedKey.length > 0) {
			return storedKey;
		}
		const envKey = process.env[`${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`];
		if (typeof envKey === "string" && envKey.length > 0) {
			return envKey;
		}
		return undefined;
	}

	/**
	 * Checks if authentication is configured or available in environment for a provider.
	 */
	async hasAuth(provider: string): Promise<boolean> {
		const key = await this.getApiKey(provider);
		return key !== undefined && key.length > 0;
	}

	/**
	 * Saves or updates an API key for a provider in the root database and optionally synchronizes to the global user database.
	 */
	async saveApiKey(provider: string, apiKey: string, options: { persistGlobal?: boolean } = {}): Promise<void> {
		await this.ensureInitialized();
		const trimmed = apiKey.trim();
		if (trimmed.length === 0) {
			throw new Error(`Cannot save empty API key for provider '${provider}'`);
		}

		// 1. Save to project root SQLite
		this.localStore.upsertAuthCredentialForProvider(provider, {
			type: "api_key",
			key: trimmed,
			source: "login",
		});
		await this.authStorage.reload();

		// 2. Persist to global ~/.omsk/agent/agent.db if requested (default true)
		if (options.persistGlobal !== false) {
			try {
				if (fs.existsSync(path.dirname(this.globalDbPath))) {
					const globalStore = await SqliteAuthCredentialStore.open(this.globalDbPath);
					globalStore.upsertAuthCredentialForProvider(provider, {
						type: "api_key",
						key: trimmed,
						source: "login",
					});
					globalStore.close();
				}
			} catch (err) {
				console.warn(`[OMSK Providers] Global persistence skipped: ${String(err)}`);
			}
		}

		// 3. Update providers.json snapshot on root
		await this.exportProvidersJson();
	}

	/**
	 * Removes stored credentials for a provider.
	 */
	async removeCredential(provider: string): Promise<boolean> {
		await this.ensureInitialized();
		const removed = this.localStore.removeAuthCredential(provider);
		await this.authStorage.reload();
		await this.exportProvidersJson();
		return removed;
	}

	/**
	 * Synchronizes credentials from the user's global ~/.omsk/agent/agent.db into the project root database.
	 */
	async syncGlobalToRoot(): Promise<{ syncedProviders: string[] }> {
		if (!fs.existsSync(this.globalDbPath)) {
			return { syncedProviders: [] };
		}

		const globalStore = await SqliteAuthCredentialStore.open(this.globalDbPath);
		const synced: string[] = [];
		try {
			const globalProviders = globalStore.listProviders();
			for (const provider of globalProviders) {
				const creds = globalStore.listAuthCredentials(provider);
				for (const item of creds) {
					if (item.credential) {
						this.localStore.upsertAuthCredentialForProvider(provider, item.credential);
						if (!synced.includes(provider)) {
							synced.push(provider);
						}
					}
				}
			}
			await this.authStorage.reload();
		} finally {
			globalStore.close();
		}

		await this.exportProvidersJson();
		return { syncedProviders: synced };
	}

	/**
	 * Synchronizes credentials from the project root database into the user's global ~/.omsk/agent/agent.db.
	 */
	async syncRootToGlobal(): Promise<{ syncedProviders: string[] }> {
		await this.ensureInitialized();
		const synced: string[] = [];
		const globalStore = await SqliteAuthCredentialStore.open(this.globalDbPath);

		try {
			const localProviders = this.localStore.listProviders();
			for (const provider of localProviders) {
				const creds = this.localStore.listAuthCredentials(provider);
				for (const item of creds) {
					if (item.credential) {
						globalStore.upsertAuthCredentialForProvider(provider, item.credential);
						if (!synced.includes(provider)) {
							synced.push(provider);
						}
					}
				}
			}
		} finally {
			globalStore.close();
		}

		return { syncedProviders: synced };
	}

	/**
	 * Lists models available in the catalog, optionally filtered by provider.
	 */
	listModels(providerFilter?: string): ModelSummary[] {
		const providers = providerFilter ? [providerFilter as GeneratedProvider] : (getBundledProviders() as GeneratedProvider[]);
		const results: ModelSummary[] = [];

		for (const provider of providers) {
			const models = getBundledModels(provider);
			for (const m of models) {
				results.push({
					id: m.id,
					provider: m.provider,
					name: m.name ?? m.id,
					contextWindow: m.contextWindow ?? 128000,
					maxOutputTokens: m.maxTokens,
					supportsImages: m.supportsImages ?? false,
					supportsThinking: m.supportsThinking ?? false,
					pricing: m.cost
						? {
								inputPerMillion: m.cost.input,
								outputPerMillion: m.cost.output,
							}
						: undefined,
				});
			}
		}

		return results;
	}

	/**
	 * Retrieves the exact Model spec object from the bundled catalog.
	 */
	getModel(provider: string, modelId: string): Model<Api> | undefined {
		try {
			return getBundledModel(provider as GeneratedProvider, modelId);
		} catch {
			return undefined;
		}
	}

	/**
	 * Completes a single prompt using the selected provider and model with zero configuration overhead.
	 */
	async complete(options: SimpleCompletionOptions): Promise<SimpleCompletionResult> {
		await this.ensureInitialized();
		const model = this.getModel(options.provider, options.modelId);
		if (!model) {
			throw new Error(`Model '${options.provider}/${options.modelId}' not found in OMSK catalog`);
		}

		const apiKey = await this.getApiKey(options.provider);
		if (!apiKey) {
			throw new Error(
				`No API key configured for provider '${options.provider}'. Use saveApiKey() or configure ${options.provider.toUpperCase().replace(/-/g, "_")}_API_KEY.`,
			);
		}

		const context: Context = {
			messages: [
				...(options.systemPrompt ? [{ role: "system" as const, content: options.systemPrompt }] : []),
				{ role: "user" as const, content: options.prompt, timestamp: Date.now() },
			],
		};

		const response = await completeSimple(model, context, {
			apiKey,
			temperature: options.temperature,
		});

		const text = response.content
			.filter(c => c.type === "text")
			.map(c => ("text" in c ? c.text : ""))
			.join("\n");

		return {
			text,
			provider: options.provider,
			modelId: options.modelId,
			inputTokens: response.usage?.input ?? 0,
			outputTokens: response.usage?.output ?? 0,
		};
	}

	/**
	 * Streams a prompt response using the selected provider and model with realtime chunk callbacks.
	 */
	async stream(options: SimpleStreamPromptOptions): Promise<AsyncIterable<AssistantStreamEvent>> {
		await this.ensureInitialized();
		const model = this.getModel(options.provider, options.modelId);
		if (!model) {
			throw new Error(`Model '${options.provider}/${options.modelId}' not found in OMSK catalog`);
		}

		const apiKey = await this.getApiKey(options.provider);
		if (!apiKey) {
			throw new Error(
				`No API key configured for provider '${options.provider}'. Use saveApiKey() or configure ${options.provider.toUpperCase().replace(/-/g, "_")}_API_KEY.`,
			);
		}

		const context: Context = {
			messages: [
				...(options.systemPrompt ? [{ role: "system" as const, content: options.systemPrompt }] : []),
				{ role: "user" as const, content: options.prompt, timestamp: Date.now() },
			],
		};

		const stream = streamSimple(model, context, {
			apiKey,
			temperature: options.temperature,
		});

		if (options.onDelta) {
			(async () => {
				for await (const event of stream) {
					if (event.type === "text_delta" && event.delta) {
						options.onDelta(event.delta);
					}
				}
			})().catch(() => {});
		}

		return stream;
	}

	/**
	 * Exports a fast, clean JSON snapshot of configured providers and models to the project root.
	 * Allows foreign languages (Python, Go, Rust, Ruby, shell scripts) to inspect credentials and models instantly.
	 */
	async exportProvidersJson(destPath: string = getProjectProvidersJsonPath()): Promise<void> {
		const providers = await this.listProviders();
		const authenticated = providers.filter(p => p.authenticated);

		const snapshot = {
			updatedAt: Date.now(),
			projectRoot: getProjectRoot(),
			totalProviders: providers.length,
			authenticatedCount: authenticated.length,
			providers: authenticated.map(p => ({
				id: p.id,
				authSource: p.authSource,
				modelsCount: p.modelsCount,
				defaultModel: p.defaultModelId,
			})),
		};

		try {
			const dir = path.dirname(destPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
			}
			fs.writeFileSync(destPath, JSON.stringify(snapshot, null, 2), "utf8");
		} catch (err) {
			console.error(`[OMSK Providers] Failed to write ${destPath}: ${String(err)}`);
		}
	}

	/**
	 * Closes the underlying SQLite credential store.
	 */
	close(): void {
		if (this.localStore) {
			try {
				this.localStore.close();
			} catch {}
		}
		if (cachedSharedProviders === this) {
			cachedSharedProviders = undefined;
		}
		this.initialized = false;
	}
}

/**
 * Returns the singleton shared providers manager for the project root.
 */
export async function getSharedProviders(
	projectDbPath?: string,
	globalDbPath?: string,
): Promise<OmskSharedProviders> {
	if (!cachedSharedProviders) {
		cachedSharedProviders = new OmskSharedProviders(projectDbPath, globalDbPath);
		await cachedSharedProviders.init();
	}
	return cachedSharedProviders;
}
