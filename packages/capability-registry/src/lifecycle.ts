export type LifecycleStage =
  | "DISCOVERY"
  | "IDENTIFICATION"
  | "INSPECTION"
  | "COMPATIBILITY"
  | "AUTHORIZATION"
  | "ACTIVATION";

export const STAGE_ORDER: Record<LifecycleStage, number> = {
  DISCOVERY: 1,
  IDENTIFICATION: 2,
  INSPECTION: 3,
  COMPATIBILITY: 4,
  AUTHORIZATION: 5,
  ACTIVATION: 6,
};

export class CapabilityLifecycle {
  private readonly stages = new Map<string, LifecycleStage>();
  private readonly stageHistory = new Map<string, LifecycleStage[]>();

  public initCapability(capabilityId: string): void {
    this.stages.set(capabilityId, "DISCOVERY");
    this.stageHistory.set(capabilityId, ["DISCOVERY"]);
  }

  public getStage(capabilityId: string): LifecycleStage {
    return this.stages.get(capabilityId) ?? "DISCOVERY";
  }

  public getHistory(capabilityId: string): LifecycleStage[] {
    return [...(this.stageHistory.get(capabilityId) ?? ["DISCOVERY"])];
  }

  public advanceStage(capabilityId: string, nextStage: LifecycleStage): void {
    const currentStage = this.getStage(capabilityId);
    const currentOrder = STAGE_ORDER[currentStage];
    const nextOrder = STAGE_ORDER[nextStage];

    // Must advance exactly one step at a time
    if (nextOrder !== currentOrder + 1) {
      throw new Error(
        `[CapabilityLifecycle] Invalid lifecycle transition for "${capabilityId}": cannot advance from ${currentStage} directly to ${nextStage}.`
      );
    }

    this.stages.set(capabilityId, nextStage);
    const history = this.stageHistory.get(capabilityId) ?? [];
    history.push(nextStage);
    this.stageHistory.set(capabilityId, history);
  }

  public isAuthorized(capabilityId: string): boolean {
    const order = STAGE_ORDER[this.getStage(capabilityId)];
    return order >= STAGE_ORDER.AUTHORIZATION;
  }

  public isActivated(capabilityId: string): boolean {
    return this.getStage(capabilityId) === "ACTIVATION";
  }
}
