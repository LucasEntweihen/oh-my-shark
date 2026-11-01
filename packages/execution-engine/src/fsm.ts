export type ExecutionState =
  | "CREATED"
  | "INVESTIGATING"
  | "PLANNED"
  | "EXECUTING"
  | "VALIDATING"
  | "COMMITTED"
  | "RECOVERING"
  | "WAITING_FOR_APPROVAL"
  | "ABORTED";

export interface StateTransitionRecord {
  from: ExecutionState;
  to: ExecutionState;
  timestamp: number;
  reason?: string;
}

export const VALID_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  CREATED: ["INVESTIGATING", "ABORTED"],
  INVESTIGATING: ["PLANNED", "ABORTED"],
  PLANNED: ["EXECUTING", "ABORTED"],
  EXECUTING: ["VALIDATING", "ABORTED"],
  VALIDATING: ["COMMITTED", "RECOVERING", "WAITING_FOR_APPROVAL", "ABORTED"],
  RECOVERING: ["EXECUTING", "ABORTED"],
  WAITING_FOR_APPROVAL: ["EXECUTING", "ABORTED"],
  COMMITTED: [],
  ABORTED: [],
};

export class ExecutionFSM {
  private currentState: ExecutionState = "CREATED";
  private readonly history: StateTransitionRecord[] = [];

  public getState(): ExecutionState {
    return this.currentState;
  }

  public canTransitionTo(nextState: ExecutionState): boolean {
    const allowed = VALID_TRANSITIONS[this.currentState] ?? [];
    return allowed.includes(nextState);
  }

  public transition(nextState: ExecutionState, reason?: string): void {
    if (!this.canTransitionTo(nextState)) {
      throw new Error(
        `[ExecutionFSM] Illegal state transition: cannot transition from "${this.currentState}" to "${nextState}".`
      );
    }

    const record: StateTransitionRecord = {
      from: this.currentState,
      to: nextState,
      timestamp: Date.now(),
      reason,
    };

    this.history.push(record);
    this.currentState = nextState;
  }

  public isTerminal(): boolean {
    return this.currentState === "COMMITTED" || this.currentState === "ABORTED";
  }

  public getHistory(): StateTransitionRecord[] {
    return [...this.history];
  }
}
