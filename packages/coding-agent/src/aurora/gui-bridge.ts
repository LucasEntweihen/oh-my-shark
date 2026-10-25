/**
 * Aurora GUI Bridge — Event Bus and Real-time Telemetry Bridge
 * Sincronização de streaming de tokens, ferramentas, ask user e tríade Doomania.
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
	private listeners = new Map<string, Set<GuiBridgeEventHandler<unknown>>>();
	private askResolver: ((option: string) => void) | null = null;

	on<T>(event: string, handler: GuiBridgeEventHandler<T>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		const set = this.listeners.get(event)!;
		const genericHandler = handler as GuiBridgeEventHandler<unknown>;
		set.add(genericHandler);

		return () => {
			set.delete(genericHandler);
			if (set.size === 0) {
				this.listeners.delete(event);
			}
		};
	}

	emit<T>(event: string, payload: T): void {
		const set = this.listeners.get(event);
		if (!set) return;
		for (const handler of set) {
			try {
				handler(payload);
			} catch (err) {
				console.error(`Error in GuiBridge listener for event ${event}:`, err);
			}
		}
	}

	setAskResolver(resolver: (option: string) => void): void {
		this.askResolver = resolver;
	}

	resolveAsk(option: string): void {
		if (this.askResolver) {
			this.askResolver(option);
			this.askResolver = null;
		}
	}
}

const emitter = new GuiBridgeEmitter();

export const guiBridge = {
	onTokenStream(chunk: string): void {
		emitter.emit("omsk:token_stream", {
			chunk,
			timestamp: performance.now(),
		} satisfies GuiTokenStreamEvent);
	},

	onToolCallStart(toolName: string, args: Record<string, unknown>): void {
		emitter.emit("omsk:tool_start", {
			toolName,
			args,
			status: "executing",
			orbitalIndicator: "active_beam",
		} satisfies GuiToolStartEvent);
	},

	onToolCallResult(toolName: string, output: string, diff?: string): void {
		emitter.emit("omsk:tool_result", {
			toolName,
			output,
			diff,
			status: "completed",
		} satisfies GuiToolResultEvent);
	},

	onAskUser(question: string, options: string[]): Promise<string> {
		return new Promise<string>(resolve => {
			emitter.setAskResolver(resolve);
			emitter.emit("omsk:ask_user", { question, options } satisfies GuiAskUserEvent);
		});
	},

	onSubagentSpawn(agentId: string, task: string, persona: DoomaniaPersona): void {
		const beaconColor =
			persona === "criativo"
				? ("#8B5CF6" as const)
				: persona === "critico"
					? ("#EF4444" as const)
					: ("#10B981" as const);

		emitter.emit("omsk:subagent_spawn", {
			agentId,
			task,
			persona,
			beaconColor,
		} satisfies GuiSubagentSpawnEvent);
	},

	subscribe<T>(event: string, handler: GuiBridgeEventHandler<T>): () => void {
		return emitter.on(event, handler);
	},

	respondToAsk(selectedOption: string): void {
		emitter.resolveAsk(selectedOption);
	},
};
