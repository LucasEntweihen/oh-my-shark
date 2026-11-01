export type RiskTier = "low" | "medium" | "high" | "critical";

export type Permission =
  | "read:project"
  | "write:project"
  | "execute:shell"
  | "access:credentials"
  | "write:outside"
  | (string & {});

export const DEFAULT_RISK_MAP: Record<string, RiskTier> = {
  "read:project": "low",
  "write:project": "medium",
  "execute:shell": "high",
  "access:credentials": "critical",
  "write:outside": "critical",
};

export class SharkPermissionManager {
  private readonly grantedPermissions = new Set<string>();
  private readonly riskMap: Record<string, RiskTier>;

  constructor(initialPermissions: string[] = ["read:project"], customRiskMap?: Record<string, RiskTier>) {
    this.riskMap = { ...DEFAULT_RISK_MAP, ...customRiskMap };
    for (const perm of initialPermissions) {
      this.grantedPermissions.add(perm);
    }
  }

  public classifyRisk(permission: string): RiskTier {
    return this.riskMap[permission] ?? "medium";
  }

  public grant(permission: string): void {
    this.grantedPermissions.add(permission);
  }

  public revoke(permission: string): void {
    this.grantedPermissions.delete(permission);
  }

  public has(permission: string): boolean {
    return this.grantedPermissions.has(permission);
  }

  public require(permission: string): void {
    if (!this.has(permission)) {
      const risk = this.classifyRisk(permission);
      throw new Error(
        `[SharkPermissionManager] Access Denied: Permission "${permission}" (${risk} risk) is not granted.`
      );
    }
  }

  public listGranted(): string[] {
    return Array.from(this.grantedPermissions);
  }
}
