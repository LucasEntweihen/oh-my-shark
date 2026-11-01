import { describe, it, expect } from "bun:test";
import {
  handleSharkCommand,
  handleImpactCommand,
  handleCapabilitiesCommand,
  formatSharkStatus,
  globalSharkGraph,
  globalSharkBus,
} from "../src/slash-commands/builtin-shark";
import { lookupBuiltinSlashCommand } from "../src/slash-commands/builtin-registry";

describe("Shark Slash Commands Integration", () => {
  it("should look up /shark, /impact, and /capabilities in builtin registry", () => {
    const sharkCmd = lookupBuiltinSlashCommand("shark");
    expect(sharkCmd).toBeDefined();
    expect(sharkCmd?.name).toBe("shark");
    expect(sharkCmd?.aliases).toContain("ohms");

    const impactCmd = lookupBuiltinSlashCommand("impact");
    expect(impactCmd).toBeDefined();
    expect(impactCmd?.aliases).toContain("shark-impact");

    const capsCmd = lookupBuiltinSlashCommand("capabilities");
    expect(capsCmd).toBeDefined();
    expect(capsCmd?.aliases).toContain("caps");
  });

  it("should format shark architectural status", () => {
    const status = formatSharkStatus();
    expect(status).toContain("OhMyShark (OMSK) Architectural Core");
    expect(status).toContain("1. Shark Kernel (@ohms/kernel):");
    expect(status).toContain("2. Project Intelligence (@ohms/project-intelligence):");
    expect(status).toContain("3. Universal Capability Ecosystem (@ohms/capability-registry):");
    expect(status).toContain("4. Transactional Execution Engine (@ohms/execution-engine):");
    expect(status).toContain("5. Modular TUI Layout Engine (@ohms/terminal-layout):");
  });

  it("should handle /shark events subcommand", () => {
    globalSharkBus.emit({
      type: "session.started",
      sessionId: "test-integration-session",
      workingDirectory: "/test/omsk",
      timestamp: Date.now(),
    });

    const eventsOutput = handleSharkCommand("events");
    expect(eventsOutput).toContain("Shark Event Bus History:");
    expect(eventsOutput).toContain("session.started");
  });

  it("should handle /impact command with dependency traversal", () => {
    globalSharkGraph.addNode({
      id: "src/database.ts",
      kind: "file",
      path: "src/database.ts",
      exports: ["connectDb"],
      language: "typescript",
    });

    globalSharkGraph.addNode({
      id: "src/models/user.ts",
      kind: "file",
      path: "src/models/user.ts",
      exports: ["UserModel"],
      language: "typescript",
    });

    globalSharkGraph.addEdge({
      from: "src/models/user.ts",
      to: "src/database.ts",
      kind: "imports",
    });

    const impact = handleImpactCommand("src/database.ts");
    expect(impact).toContain("Impact Analysis for: src/database.ts");
    expect(impact).toContain("src/models/user.ts");
  });

  it("should handle /capabilities command and search filtering", () => {
    const allCaps = handleCapabilitiesCommand("");
    expect(allCaps).toContain("Universal Capability Ecosystem");
    expect(allCaps).toContain("Shark Event Bus");

    const searchHits = handleCapabilitiesCommand("impact");
    expect(searchHits).toContain("Shark Impact Analysis");

    const searchMiss = handleCapabilitiesCommand("nonexistent-tool-xyz");
    expect(searchMiss).toContain('No capabilities found matching query "nonexistent-tool-xyz"');
  });
});
