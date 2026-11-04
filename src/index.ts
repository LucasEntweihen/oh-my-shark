/**
 * OMSK Ecosystem - Root Integration Layer
 * Unified providers, authentication, shared databases, and semantic knowledge graph.
 */

// Configuration & Path Discovery
export {
	ensureProjectOmskDir,
	getGlobalAgentDbPath,
	getProjectAgentDbPath,
	getProjectKnowledgeDbPath,
	getProjectKnowledgeJsonPath,
	getProjectOmskDir,
	getProjectProvidersJsonPath,
	getProjectRoot,
} from "./config/paths";

// Shared High-Concurrency SQLite Database
export {
	type DatabaseStats,
	getSharedDatabase,
	OmskSharedDatabase,
} from "./database";

// Semantic Knowledge Base & Mente em Teia Graph
export {
	type FileStalenessCheck,
	getSharedKnowledge,
	type KnowledgeExportSnapshot,
	type KnowledgeSearchOptions,
	type MultiHopSubgraph,
	OmskSharedKnowledge,
	type TeiaConnectedGraph,
	type TeiaEdge,
	type TeiaNode,
	type TeiaNodeKind,
	type TeiaRelation,
} from "./knowledge";

// Provider Management, Authentication & AI Inferences
export {
	getSharedProviders,
	type ModelSummary,
	OmskSharedProviders,
	type ProviderSummary,
	type SimpleCompletionOptions,
	type SimpleCompletionResult,
	type SimpleStreamPromptOptions,
} from "./providers";

// Unified Root Hub
export {
	getOmskHub,
	getOmskRoot,
	type OmskHubStatus,
	OmskRootHub,
} from "./hub";

// Multi-Language REST Server
export {
	type OmskServerInstance,
	startOmskHubServer,
} from "./server";
