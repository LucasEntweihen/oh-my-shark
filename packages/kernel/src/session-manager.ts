import type { SharkEventBus } from "./event-bus";
import { PerformanceProfiler } from "./performance-profiler";

export type SessionState = "idle" | "running" | "paused" | "finished";

export interface SessionInfo {
  id: string;
  workingDirectory: string;
  state: SessionState;
  startTime: number;
  endTime?: number;
  activeTaskId?: string;
  tasksCompleted: number;
  tasksFailed: number;
}
export interface SessionMessage {
  readonly id: string;
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
  readonly timestamp: number;
  readonly tokenCount?: number;
  readonly blobHash?: string;
}

export interface PaginatedHistory {
  readonly messages: readonly SessionMessage[];
  readonly totalCount: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}


export class SharkSessionManager {
  private currentSession: SessionInfo | null = null;
  private readonly eventBus?: SharkEventBus;
  private history: SessionMessage[] = [];
  private blobRegistry: Map<string, string> = new Map();

  constructor(eventBus?: SharkEventBus) {
    this.eventBus = eventBus;
  }

  public initSession(sessionId: string, workingDirectory: string): SessionInfo {
    const session: SessionInfo = {
      id: sessionId,
      workingDirectory,
      state: "running",
      startTime: Date.now(),
      tasksCompleted: 0,
      tasksFailed: 0,
    };
    this.currentSession = session;
    this.history = [];

    this.eventBus?.emit({
      type: "session.started",
      sessionId,
      workingDirectory,
      timestamp: session.startTime,
    });

    return { ...session };
  }

  public getActiveSession(): SessionInfo | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  public runTask(taskId: string, objective: string): void {
    if (!this.currentSession) {
      throw new Error("No active session to run task in");
    }
    if (this.currentSession.state === "finished") {
      throw new Error("Cannot run task in a finished session");
    }

    this.currentSession.activeTaskId = taskId;
    this.currentSession.state = "running";

    this.eventBus?.emit({
      type: "task.planned",
      taskId,
      objective,
      operationCount: 1,
      timestamp: Date.now(),
    });
  }

  public completeTask(taskId: string, checkpointId: string, artifacts: string[] = []): void {
    if (!this.currentSession) return;
    if (this.currentSession.activeTaskId === taskId) {
      this.currentSession.activeTaskId = undefined;
    }
    this.currentSession.tasksCompleted += 1;

    this.eventBus?.emit({
      type: "task.committed",
      taskId,
      checkpointId,
      artifacts,
      timestamp: Date.now(),
    });
    PerformanceProfiler.getInstance().recordTaskCompletionHeapSample(taskId);
  }

  public failTask(taskId: string, reason: string, failedCheck: string): void {
    if (!this.currentSession) return;
    if (this.currentSession.activeTaskId === taskId) {
      this.currentSession.activeTaskId = undefined;
    }
    this.currentSession.tasksFailed += 1;

    this.eventBus?.emit({
      type: "validation.failed",
      taskId,
      reason,
      failedCheck,
      timestamp: Date.now(),
    });
    PerformanceProfiler.getInstance().recordTaskCompletionHeapSample(taskId);
  }

  public pauseSession(): void {
    if (this.currentSession && this.currentSession.state === "running") {
      this.currentSession.state = "paused";
    }
  }

  public resumeSession(): void {
    if (this.currentSession && this.currentSession.state === "paused") {
      this.currentSession.state = "running";
    }
  }

  public finishSession(): SessionInfo {
    if (!this.currentSession) {
      throw new Error("No active session to finish");
    }
    this.currentSession.state = "finished";
    this.currentSession.endTime = Date.now();
    this.currentSession.activeTaskId = undefined;

    const finished = { ...this.currentSession };
    return finished;
  }

  // --- Incremental History & Memory Deduplication (Fases 04 e 05) ---

  public appendMessage(msg: Omit<SessionMessage, "id" | "timestamp"> & { id?: string; timestamp?: number }): SessionMessage {
    const id = msg.id ?? `msg_${this.history.length + 1}_${Date.now()}`;
    const timestamp = msg.timestamp ?? Date.now();
    const deduplicatedContent = this.deduplicateBlob(msg.content);

    const fullMessage: SessionMessage = {
      id,
      role: msg.role,
      content: deduplicatedContent,
      timestamp,
      tokenCount: msg.tokenCount,
      blobHash: msg.blobHash,
    };

    this.history.push(fullMessage);
    return fullMessage;
  }

  public getPaginatedHistory(offset: number = 0, limit: number = 50): PaginatedHistory {
    const safeOffset = Math.max(0, offset);
    const safeLimit = Math.max(1, limit);
    const totalCount = this.history.length;
    const slice = this.history.slice(safeOffset, safeOffset + safeLimit);

    return {
      messages: slice,
      totalCount,
      offset: safeOffset,
      limit: safeLimit,
      hasMore: safeOffset + safeLimit < totalCount,
    };
  }

  public getMessageCount(): number {
    return this.history.length;
  }

  public deduplicateBlob(content: string): string {
    if (content.length < 128) return content;
    const sampleKey = `${content.length}:${content.slice(0, 32)}:${content.slice(-32)}`;
    const existing = this.blobRegistry.get(sampleKey);
    if (existing !== undefined && existing === content) {
      return existing;
    }
    this.blobRegistry.set(sampleKey, content);
    return content;
  }

  public clearBlobRegistry(): void {
    this.blobRegistry.clear();
  }
}
