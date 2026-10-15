/**
 * .omp/tools/gui-bridge.ts — Ponte de Eventos IPC entre o Motor OMSK e o Frontend Astral Codex
 *
 * Provê sincronização em tempo real de:
 * 1. Stream contínuo de tokens de raciocínio e texto;
 * 2. Início e conclusão de ferramentas (pi-builtins, pi-ast, discovery);
 * 3. Protocolo de interrupção e aprovação do Ask Tool;
 * 4. Despacho concorrente dos agentes da Tríade Doomania (criativo, crítico, permissivo);
 * 5. Telemetria de processos, memória e reversão temporal (TTSR).
 */

export type DoomaniaPersona = "criativo" | "critico" | "permissivo";

export interface GuiTokenStreamEvent {
	chunk: string;
	timestamp: number;
}

export interface GuiToolStartEvent {
	toolName: string;
	args: Record<string, unknown>;
	status: "executing";
	orbitalIndicator: "active_beam";
}

export interface GuiToolResultEvent {
	toolName: string;
	output: string;
	diff?: string;
	status: "completed";
}

export interface GuiAskUserEvent {
	question: string;
	options: string[];
}

export interface GuiSubagentSpawnEvent {
	agentId: string;
	task: string;
	persona: DoomaniaPersona;
	beaconColor: "#8B5CF6" | "#EF4444" | "#10B981";
}

export type GuiBridgeEventHandler<T> = (data: T) => void;

class GuiBridgeEmitter {
	private readonly listeners = new Map<string, Set<(data: unknown) => void>>();
	private askResolver: ((selectedOption: string) => void) | null = null;

	on<T>(event: string, handler: GuiBridgeEventHandler<T>): () => void {
		let handlers = this.listeners.get(event);
		if (!handlers) {
			handlers = new Set();
			this.listeners.set(event, handlers);
		}
		const genericHandler = handler as (data: unknown) => void;
		handlers.add(genericHandler);

		return () => {
			handlers?.delete(genericHandler);
		};
	}

	emit<T>(event: string, payload: T): void {
		const handlers = this.listeners.get(event);
		if (handlers) {
			for (const handler of handlers) {
				handler(payload);
			}
		}

		// Espelha para Tauri IPC se a janela nativa estiver conectada
		if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
			try {
				const tauri = (window as unknown as { __TAURI_INTERNALS__?: { invoke?: (cmd: string, args: unknown) => void } });
				tauri.__TAURI_INTERNALS__?.invoke?.("omsk_emit_event", { event, payload });
			} catch {
				// Silencioso se fora do runtime nativo
			}
		}
	}

	// Resolve resposta do modal Ask
	resolveAsk(selectedOption: string): void {
		if (this.askResolver) {
			this.askResolver(selectedOption);
			this.askResolver = null;
		}
	}

	setAskResolver(resolver: (option: string) => void): void {
		this.askResolver = resolver;
	}
}

const emitter = new GuiBridgeEmitter();

export const guiBridge = {
	/**
	 * Emissão contínua de tokens do LLM para o Stream de Missão
	 */
	onTokenStream(chunk: string): void {
		const event: GuiTokenStreamEvent = {
			chunk,
			timestamp: performance.now(),
		};
		emitter.emit("omsk:token_stream", event);
	},

	/**
	 * Notificação de início de ferramenta (pi-builtins, pi-ast ou discovery)
	 */
	onToolCallStart(toolName: string, args: Record<string, unknown>): void {
		const event: GuiToolStartEvent = {
			toolName,
			args,
			status: "executing",
			orbitalIndicator: "active_beam",
		};
		emitter.emit("omsk:tool_start", event);
	},

	/**
	 * Entrega do resultado da ferramenta e diff gerado na máquina
	 */
	onToolCallResult(toolName: string, output: string, diff?: string): void {
		const event: GuiToolResultEvent = {
			toolName,
			output,
			diff,
			status: "completed",
		};
		emitter.emit("omsk:tool_result", event);
	},

	/**
	 * Interrupção estruturada da ferramenta Ask (Aprovação de Segurança)
	 */
	onAskUser(question: string, options: string[]): Promise<string> {
		return new Promise<string>((resolve) => {
			emitter.setAskResolver(resolve);
			const event: GuiAskUserEvent = { question, options };
			emitter.emit("omsk:ask_user", event);
		});
	},

	/**
	 * Despacho de subagentes concorrentes (Tríade Doomania ou Task)
	 */
	onSubagentSpawn(agentId: string, task: string, persona: DoomaniaPersona): void {
		const beaconColor = persona === "criativo"
			? ("#8B5CF6" as const)
			: persona === "critico"
				? ("#EF4444" as const)
				: ("#10B981" as const);

		const event: GuiSubagentSpawnEvent = {
			agentId,
			task,
			persona,
			beaconColor,
		};
		emitter.emit("omsk:subagent_spawn", event);
	},

	/**
	 * Registra listeners de eventos da GUI
	 */
	subscribe<T>(event: string, handler: GuiBridgeEventHandler<T>): () => void {
		return emitter.on(event, handler);
	},

	/**
	 * Responde a uma solicitação ativa do protocolo Ask
	 */
	respondToAsk(selectedOption: string): void {
		emitter.resolveAsk(selectedOption);
	},
};
