import { describe, it, expect } from "bun:test";
import {
  CapabilityRegistry,
  CapabilityLifecycle,
  SecuritySandbox,
  type SharkCapability,
} from "../src/index";

describe("Shark Universal Capability Ecosystem (Module 3 - Extensibility & Security)", () => {
  it("Test 1: should ingest capabilities across multiple origins (skill, mcp, builtin, external_agent)", () => {
    const registry = new CapabilityRegistry();

    const mcpCap: SharkCapability = {
      id: "mcp-filesystem",
      name: "MCP File System Server",
      description: "Model Context Protocol compliant file system toolset",
      origin: { type: "mcp", source: "npx @modelcontextprotocol/server-filesystem" },
      permissions: ["read:project", "write:project"],
      dependencies: ["node"],
      compatibility: { platforms: ["win32", "linux", "darwin"], runtimes: ["bun", "node"] },
      trust: { verified: true, riskLevel: "medium" },
    };

    const skillCap: SharkCapability = {
      id: "agent-skill-git",
      name: "Git Master Skill",
      description: "Agent Skills standard directory containing SKILL.md",
      origin: { type: "skill", source: "./skills/git/SKILL.md" },
      permissions: ["execute:shell"],
      dependencies: ["git"],
      compatibility: { platforms: ["all"], runtimes: ["all"] },
      trust: { verified: true, riskLevel: "high" },
    };

    registry.register(mcpCap);
    registry.register(skillCap);

    expect(registry.getCount()).toBe(2);
    expect(registry.findById("mcp-filesystem")?.origin.type).toBe("mcp");
    expect(registry.findById("agent-skill-git")?.origin.type).toBe("skill");
  });

  it("Test 2: should enforce 6-stage lifecycle progression and prevent illegal stage jumps", () => {
    const lifecycle = new CapabilityLifecycle();
    const capId = "plugin-ast-grep";

    lifecycle.initCapability(capId);
    expect(lifecycle.getStage(capId)).toBe("DISCOVERY");

    // Advance legitimately one by one
    lifecycle.advanceStage(capId, "IDENTIFICATION");
    expect(lifecycle.getStage(capId)).toBe("IDENTIFICATION");

    lifecycle.advanceStage(capId, "INSPECTION");
    expect(lifecycle.getStage(capId)).toBe("INSPECTION");

    // Illegal attempt to jump directly to ACTIVATION skipping COMPATIBILITY & AUTHORIZATION
    expect(() => {
      lifecycle.advanceStage(capId, "ACTIVATION");
    }).toThrow(/Invalid lifecycle transition/);

    expect(lifecycle.isActivated(capId)).toBe(false);

    // Complete the chain
    lifecycle.advanceStage(capId, "COMPATIBILITY");
    lifecycle.advanceStage(capId, "AUTHORIZATION");
    expect(lifecycle.isAuthorized(capId)).toBe(true);

    lifecycle.advanceStage(capId, "ACTIVATION");
    expect(lifecycle.isActivated(capId)).toBe(true);

    expect(lifecycle.getHistory(capId)).toEqual([
      "DISCOVERY",
      "IDENTIFICATION",
      "INSPECTION",
      "COMPATIBILITY",
      "AUTHORIZATION",
      "ACTIVATION",
    ]);
  });

  it("Test 3: should classify capability risk levels and enforce authorization gates", () => {
    const registry = new CapabilityRegistry();

    const lowRisk: SharkCapability = {
      id: "read-doc",
      name: "Doc Reader",
      description: "Reads public markdown documentation",
      origin: { type: "builtin", source: "kernel" },
      permissions: ["read:project"],
      dependencies: [],
      compatibility: { platforms: ["all"], runtimes: ["all"] },
      trust: { verified: true, riskLevel: "low" },
    };

    const criticalRisk: SharkCapability = {
      id: "cred-extractor",
      name: "Credential Vault Reader",
      description: "Accesses sensitive environment credentials",
      origin: { type: "plugin", source: "external" },
      permissions: ["access:credentials"],
      dependencies: [],
      compatibility: { platforms: ["all"], runtimes: ["all"] },
      trust: { verified: false, riskLevel: "critical" },
    };

    registry.register(lowRisk);
    registry.register(criticalRisk);

    const lowCapabilities = registry.filterByRisk("low");
    const criticalCapabilities = registry.filterByRisk("critical");

    expect(lowCapabilities.length).toBe(1);
    expect(lowCapabilities[0].id).toBe("read-doc");

    expect(criticalCapabilities.length).toBe(1);
    expect(criticalCapabilities[0].id).toBe("cred-extractor");
  });

  it("Test 4: should protect execution with security sandbox path traversal checks and secret redaction", () => {
    const workspaceRoot = "C:/projects/my-app";

    // Safe paths inside workspace
    expect(SecuritySandbox.checkPathSafety("src/index.ts", workspaceRoot)).toBe(true);
    expect(SecuritySandbox.checkPathSafety("./components/Button.tsx", workspaceRoot)).toBe(true);

    // Malicious path traversal attempts outside workspace
    expect(SecuritySandbox.checkPathSafety("../../Windows/System32", workspaceRoot)).toBe(false);
    expect(SecuritySandbox.checkPathSafety("../../../etc/shadow", workspaceRoot)).toBe(false);

    // Secret redaction
    const rawLog = "Connecting with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test and apiKey: sk-abc12345678901234567890";
    const redacted = SecuritySandbox.redactSecrets(rawLog);

    expect(redacted).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");
    expect(redacted).not.toContain("sk-abc12345678901234567890");
    expect(redacted).toContain("Bearer [REDACTED_TOKEN]");
    expect(redacted).toContain("[REDACTED_API_KEY]");
  });

  it("Test 5: should support full-text search, origin filtering, and platform compatibility checks", () => {
    const registry = new CapabilityRegistry();

    registry.register({
      id: "ripgrep-search",
      name: "Ripgrep Fast Search",
      description: "High-speed text search using ripgrep binary",
      origin: { type: "builtin", source: "core" },
      permissions: ["read:project"],
      dependencies: ["ripgrep"],
      compatibility: { platforms: ["win32", "linux", "darwin"], runtimes: ["bun"] },
      trust: { verified: true, riskLevel: "low" },
    });

    registry.register({
      id: "linux-ebpf-tracer",
      name: "Linux eBPF Kernel Tracer",
      description: "Low-overhead Linux kernel probe for performance tracing",
      origin: { type: "plugin", source: "ebpf" },
      permissions: ["execute:shell"],
      dependencies: ["bpftrace"],
      compatibility: { platforms: ["linux"], runtimes: ["bun", "node"] },
      trust: { verified: true, riskLevel: "high" },
    });

    const searchResults = registry.search("ripgrep");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].id).toBe("ripgrep-search");

    const builtinCapabilities = registry.filterByOrigin("builtin");
    expect(builtinCapabilities.length).toBe(1);
    expect(builtinCapabilities[0].id).toBe("ripgrep-search");

    const capRipgrep = registry.findById("ripgrep-search")!;
    const capLinux = registry.findById("linux-ebpf-tracer")!;

    expect(registry.isCompatible(capRipgrep, "win32", "bun")).toBe(true);
    expect(registry.isCompatible(capLinux, "win32", "bun")).toBe(false);
    expect(registry.isCompatible(capLinux, "linux", "bun")).toBe(true);
  });
});
