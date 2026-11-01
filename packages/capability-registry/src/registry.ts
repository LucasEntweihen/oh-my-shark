import type { CapabilityOriginType, CapabilityRiskLevel, SharkCapability } from "./capability";

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, SharkCapability>();

  public register(capability: SharkCapability): void {
    this.capabilities.set(capability.id, {
      ...capability,
      enabled: capability.enabled ?? true,
    });
  }

  public unregister(id: string): boolean {
    return this.capabilities.delete(id);
  }

  public findById(id: string): SharkCapability | undefined {
    const found = this.capabilities.get(id);
    return found ? { ...found } : undefined;
  }

  public search(query: string): SharkCapability[] {
    const q = query.toLowerCase();
    const results: SharkCapability[] = [];
    for (const cap of this.capabilities.values()) {
      if (
        cap.name.toLowerCase().includes(q) ||
        cap.description.toLowerCase().includes(q) ||
        cap.id.toLowerCase().includes(q)
      ) {
        results.push({ ...cap });
      }
    }
    return results;
  }

  public filterByOrigin(type: CapabilityOriginType): SharkCapability[] {
    const results: SharkCapability[] = [];
    for (const cap of this.capabilities.values()) {
      if (cap.origin.type === type) {
        results.push({ ...cap });
      }
    }
    return results;
  }

  public filterByRisk(risk: CapabilityRiskLevel): SharkCapability[] {
    const results: SharkCapability[] = [];
    for (const cap of this.capabilities.values()) {
      if (cap.trust.riskLevel === risk) {
        results.push({ ...cap });
      }
    }
    return results;
  }

  public getActiveCapabilities(): SharkCapability[] {
    const results: SharkCapability[] = [];
    for (const cap of this.capabilities.values()) {
      if (cap.enabled !== false) {
        results.push({ ...cap });
      }
    }
    return results;
  }

  public isCompatible(capability: SharkCapability, platform = process.platform, runtime = "bun"): boolean {
    const platformMatch =
      capability.compatibility.platforms.length === 0 ||
      capability.compatibility.platforms.includes(platform) ||
      capability.compatibility.platforms.includes("all");

    const runtimeMatch =
      capability.compatibility.runtimes.length === 0 ||
      capability.compatibility.runtimes.includes(runtime) ||
      capability.compatibility.runtimes.includes("all");

    return platformMatch && runtimeMatch;
  }

  public getCount(): number {
    return this.capabilities.size;
  }
}
