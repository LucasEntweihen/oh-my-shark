import * as path from "node:path";

export class SecuritySandbox {
  public static checkPathSafety(targetPath: string, workspaceRoot: string): boolean {
    const resolvedRoot = path.resolve(workspaceRoot);
    const resolvedTarget = path.resolve(resolvedRoot, targetPath);

    // Path must reside strictly inside or match workspace root
    const relative = path.relative(resolvedRoot, resolvedTarget);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return false; // Traversal attempt outside workspace
    }
    return true;
  }

  public static checkRealPathSafety(targetPath: string, workspaceRoot: string): boolean {
    if (!this.checkPathSafety(targetPath, workspaceRoot)) return false;
    try {
      const fs = require("node:fs");
      if (fs.existsSync(targetPath)) {
        const realTarget = fs.realpathSync(targetPath);
        const realRoot = fs.realpathSync(workspaceRoot);
        const rel = path.relative(realRoot, realTarget);
        if (rel.startsWith("..") || path.isAbsolute(rel)) {
          return false;
        }
      }
    } catch {
      // File does not exist yet; structural path safety is retained
    }
    return true;
  }

  public static redactSecrets(text: string): string {
    let result = text;

    // Redact Bearer tokens
    result = result.replace(/Bearer\s+[A-Za-z0-9_\-\.]{15,}/gi, "Bearer [REDACTED_TOKEN]");

    // Redact API keys (sk-..., gsk-..., key-...)
    result = result.replace(/(?:sk|gsk|key|ghp|gho)_[A-Za-z0-9_\-]{16,}/gi, "[REDACTED_API_KEY]");
    result = result.replace(/sk-[A-Za-z0-9_\-]{16,}/gi, "[REDACTED_API_KEY]");

    // Redact Private keys
    result = result.replace(
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]"
    );

    return result;
  }

  public static clampTimeout(requestedMs: number, maxAllowedMs = 30000): number {
    if (requestedMs <= 0 || !Number.isFinite(requestedMs)) {
      return maxAllowedMs;
    }
    return Math.min(requestedMs, maxAllowedMs);
  }
}
