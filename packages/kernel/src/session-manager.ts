import type { SharkEventBus } from "./event-bus";

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

export class SharkSessionManager {
  private currentSession: SessionInfo | null = null;
  private readonly eventBus?: SharkEventBus;

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
}
