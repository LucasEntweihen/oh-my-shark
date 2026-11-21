import { getTransactionalEditEngine } from "../edit/transactional-engine";
import { getMenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import { globalSharkAnalyzer, globalSharkBus, globalSharkCheckpoints } from "../slash-commands/builtin-shark";
import { SharkOrchestratorEngine } from "./engine";
import type { OrchestratorEngineOptions } from "./types";

export * from "./types";
export * from "./tdd-enforcer";
export * from "./engine";

let globalOrchestrator: SharkOrchestratorEngine | null = null;

/**
 * Returns the process-wide SharkOrchestratorEngine singleton wired into
 * the shared SharkEventBus, ImpactAnalyzer, CheckpointEngine, TransactionalEditEngine,
 * and MenteEmTeiaStore.
 */
export function getGlobalOrchestrator(options?: OrchestratorEngineOptions): SharkOrchestratorEngine {
	if (!globalOrchestrator || options) {
		globalOrchestrator = new SharkOrchestratorEngine({
			eventBus: globalSharkBus,
			impactAnalyzer: globalSharkAnalyzer,
			checkpointEngine: globalSharkCheckpoints,
			txEngine: getTransactionalEditEngine(options?.baseDir),
			teiaStore: getMenteEmTeiaStore(),
			...options,
		});
	}
	return globalOrchestrator;
}
