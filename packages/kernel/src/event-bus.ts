export type SharkEventType =
  | "session.started"
  | "task.planned"
  | "tool.discovered"
  | "tool.started"
  | "tool.completed"
  | "file.changed"
  | "validation.failed"
  | "task.committed"
  | "profiler.snapshot"
  | "resource.pressure"
  | "worker.lifecycle";

export interface BaseEvent {
  type: SharkEventType;
  timestamp: number;
}

export interface SessionStartedEvent extends BaseEvent {
  type: "session.started";
  sessionId: string;
  workingDirectory: string;
}

export interface TaskPlannedEvent extends BaseEvent {
  type: "task.planned";
  taskId: string;
  objective: string;
  operationCount: number;
}

export interface ToolDiscoveredEvent extends BaseEvent {
  type: "tool.discovered";
  toolId: string;
  origin: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ToolStartedEvent extends BaseEvent {
  type: "tool.started";
  operationId: string;
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface ToolCompletedEvent extends BaseEvent {
  type: "tool.completed";
  operationId: string;
  durationMs: number;
  success: boolean;
}

export interface FileChangedEvent extends BaseEvent {
  type: "file.changed";
  path: string;
  changeType: "create" | "update" | "delete";
  hash: string;
}

export interface ValidationFailedEvent extends BaseEvent {
  type: "validation.failed";
  taskId: string;
  reason: string;
  failedCheck: string;
}

export interface TaskCommittedEvent extends BaseEvent {
  type: "task.committed";
  taskId: string;
  checkpointId: string;
  artifacts: string[];
}
export interface ProfilerSnapshotEvent extends BaseEvent {
  type: "profiler.snapshot";
  ramCurrentMb: number;
  cpuPercent: number;
  activeWorkers: number;
}

export interface ResourcePressureEvent extends BaseEvent {
  type: "resource.pressure";
  level: "high" | "critical";
  rssMb: number;
}

export interface WorkerLifecycleEvent extends BaseEvent {
  type: "worker.lifecycle";
  action: "spawned" | "reaped" | "completed";
  workerId: string;
}


export type SharkEvent =
  | SessionStartedEvent
  | TaskPlannedEvent
  | ToolDiscoveredEvent
  | ToolStartedEvent
  | ToolCompletedEvent
  | FileChangedEvent
  | ValidationFailedEvent
  | TaskCommittedEvent
  | ProfilerSnapshotEvent
  | ResourcePressureEvent
  | WorkerLifecycleEvent;

export type EventHandler<T extends SharkEvent = SharkEvent> = (event: T) => void | Promise<void>;

export class SharkEventBus {
  private readonly handlers = new Map<SharkEventType | "*", Set<EventHandler>>();
  private readonly history: SharkEvent[] = [];
  private readonly maxHistorySize: number;

  constructor(options: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 1000;
  }

  public subscribe<T extends SharkEvent>(
    type: T["type"] | "*",
    handler: EventHandler<T>
  ): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as EventHandler);

    return () => {
      set?.delete(handler as EventHandler);
      if (set && set.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  public emit(event: SharkEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    const specificHandlers = this.handlers.get(event.type);
    const wildcardHandlers = this.handlers.get("*");

    const targets: EventHandler[] = [];
    if (specificHandlers) targets.push(...specificHandlers);
    if (wildcardHandlers) targets.push(...wildcardHandlers);

    for (const handler of targets) {
      try {
        const result = handler(event);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((err: unknown) => {
            console.error(`[SharkEventBus] Async subscriber error on ${event.type}:`, err);
          });
        }
      } catch (err: unknown) {
        // Error isolation: faulty listener never breaks other listeners or the caller
        console.error(`[SharkEventBus] Sync subscriber error on ${event.type}:`, err);
      }
    }
  }

  public getHistory(filter?: { type?: SharkEventType; since?: number }): SharkEvent[] {
    let result = this.history;
    if (filter?.type) {
      result = result.filter(e => e.type === filter.type);
    }
    if (typeof filter?.since === "number") {
      result = result.filter(e => e.timestamp >= (filter.since as number));
    }
    return [...result];
  }

  public replay(sinceTimestamp: number, targetHandler: EventHandler): void {
    const events = this.getHistory({ since: sinceTimestamp });
    for (const ev of events) {
      try {
        targetHandler(ev);
      } catch (err: unknown) {
        console.error(`[SharkEventBus] Replay subscriber error on ${ev.type}:`, err);
      }
    }
  }

  public clearHistory(): void {
    this.history.length = 0;
  }
}
