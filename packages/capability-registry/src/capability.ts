export type CapabilityOriginType = "builtin" | "skill" | "mcp" | "plugin" | "external_agent";

export type CapabilityRiskLevel = "low" | "medium" | "high" | "critical";

export interface CapabilityOrigin {
  type: CapabilityOriginType;
  source: string;
}

export interface CapabilityCompatibility {
  platforms: string[]; // e.g. ["win32", "linux", "darwin"]
  runtimes: string[];  // e.g. ["bun", "node"]
}

export interface CapabilityTrust {
  verified: boolean;
  license?: string;
  riskLevel: CapabilityRiskLevel;
}

export interface SharkCapability {
  id: string;
  name: string;
  description: string;
  origin: CapabilityOrigin;
  permissions: string[];
  dependencies: string[];
  compatibility: CapabilityCompatibility;
  trust: CapabilityTrust;
  enabled?: boolean;
}
