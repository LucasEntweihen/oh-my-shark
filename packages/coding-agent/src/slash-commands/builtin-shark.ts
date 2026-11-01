import {
  SharkEventBus,
  SharkSessionManager,
  SharkPermissionManager,
  type SharkEvent,
} from "@ohms/kernel";
import {
  ProjectGraph,
  ImpactAnalyzer,
  IncrementalIndexer,
} from "@ohms/project-intelligence";
import {
  CapabilityRegistry,
  CapabilityLifecycle,
  type SharkCapability,
} from "@ohms/capability-registry";
import {
  ExecutionFSM,
  CheckpointEngine,
  PlanValidator,
} from "@ohms/execution-engine";
import {
  TerminalLayoutEngine,
  ThemeEngine,
  PanelExtensionRegistry,
} from "@ohms/terminal-layout";
import { commandConsumed } from "./helpers/parse";
import type {
  ParsedSlashCommand,
  SlashCommandResult,
  SlashCommandRuntime,
  SlashCommandSpec,
  TuiSlashCommandRuntime,
} from "./types";

// Singleton instances for session-wide state
export const globalSharkBus = new SharkEventBus();
export const globalSharkSession = new SharkSessionManager(globalSharkBus);
export const globalSharkPermissions = new SharkPermissionManager();
export const globalSharkGraph = new ProjectGraph();
export const globalSharkIndexer = new IncrementalIndexer(globalSharkGraph);
export const globalSharkAnalyzer = new ImpactAnalyzer(globalSharkGraph);
export const globalSharkCapabilities = new CapabilityRegistry();
export const globalSharkLifecycle = new CapabilityLifecycle();
export const globalSharkFSM = new ExecutionFSM();
export const globalSharkCheckpoints = new CheckpointEngine();
export const globalSharkValidator = new PlanValidator();
export const globalSharkLayout = new TerminalLayoutEngine();
export const globalSharkThemes = new ThemeEngine();
export const globalSharkPanelExtensions = new PanelExtensionRegistry();

// Initialize default capability ecosystem
globalSharkCapabilities.register({
  id: "kernel-event-bus",
  name: "Shark Event Bus",
  description: "Native typed hexagonal event bus for telemetry and decoupling",
  origin: { type: "builtin", source: "core" },
  permissions: ["read:project"],
  dependencies: [],
  compatibility: { platforms: ["all"], runtimes: ["all"] },
  trust: { verified: true, riskLevel: "low" },
});

globalSharkCapabilities.register({
  id: "project-impact-analyzer",
  name: "Shark Impact Analysis",
  description: "AST & dependency graph traversal for change radius computation",
  origin: { type: "builtin", source: "core" },
  permissions: ["read:project"],
  dependencies: [],
  compatibility: { platforms: ["all"], runtimes: ["all"] },
  trust: { verified: true, riskLevel: "low" },
});

globalSharkCapabilities.register({
  id: "transactional-checkpoints",
  name: "Transactional Checkpoint Engine",
  description: "SHA-256 operation snapshotting with atomic file rollback",
  origin: { type: "builtin", source: "core" },
  permissions: ["write:project"],
  dependencies: [],
  compatibility: { platforms: ["all"], runtimes: ["all"] },
  trust: { verified: true, riskLevel: "medium" },
});

export function formatSharkStatus(): string {
  const lines: string[] = [
    "🦈 OhMyShark (OMSK) Architectural Core v0.0.48",
    "================================================",
    "Native Authorial Platform — 100% Terminal-First",
    "",
    "1. Shark Kernel (@ohms/kernel):",
    `   - Event Bus: Active (${globalSharkBus.getHistory().length} events recorded)`,
    `   - Permissions: ${globalSharkPermissions.listGranted().join(", ")}`,
    `   - Session: ${globalSharkSession.getActiveSession()?.state ?? "ready"}`,
    "",
    "2. Project Intelligence (@ohms/project-intelligence):",
    `   - Graph Nodes: ${globalSharkGraph.getAllNodes().length}`,
    `   - Cached Files: ${globalSharkIndexer.getCachedFilesCount()}`,
    `   - Impact Analyzer: Ready`,
    "",
    "3. Universal Capability Ecosystem (@ohms/capability-registry):",
    `   - Registered Capabilities: ${globalSharkCapabilities.getCount()}`,
    `   - Security Sandbox: Active (Path traversal & Secret redaction enforced)`,
    "",
    "4. Transactional Execution Engine (@ohms/execution-engine):",
    `   - State: ${globalSharkFSM.getState()}`,
    `   - Checkpoints Stored: ${globalSharkCheckpoints.getCheckpointCount()}`,
    "",
    "5. Modular TUI Layout Engine (@ohms/terminal-layout):",
    `   - Preset: ${globalSharkLayout.getPreset()}`,
    `   - Theme: ${globalSharkThemes.getTheme()}`,
    `   - Custom Panels Registered: ${globalSharkPanelExtensions.getAll().length}`,
  ];
  return lines.join("\n");
}

export function handleSharkCommand(args: string): string {
  const trimmed = args.trim();
  if (!trimmed || trimmed === "status") {
    return formatSharkStatus();
  }
  if (trimmed === "events") {
    const history = globalSharkBus.getHistory();
    if (history.length === 0) return "No events recorded yet in Shark Event Bus.";
    return [
      "🦈 Shark Event Bus History:",
      ...history.slice(-10).map((e: SharkEvent) => `  [${new Date(e.timestamp).toISOString()}] ${e.type}`),
    ].join("\n");
  }
  return formatSharkStatus();
}

export function handleImpactCommand(args: string): string {
  const target = args.trim();
  if (!target) {
    return [
      "🦈 Shark Impact Analysis",
      "Usage: /impact <file-or-symbol-id>",
      "Example: /impact src/auth.ts",
      "Calculates direct and transitive dependents, affected callers, tests to run, and contract breach risk.",
    ].join("\n");
  }

  const result = globalSharkAnalyzer.analyze(target);
  return [
    `🦈 Impact Analysis for: ${target}`,
    "----------------------------------------",
    `Contract Risk: ${result.contractRisk.toUpperCase()}`,
    `Explanation: ${result.explanation}`,
    `Affected Files (${result.affectedFiles.length}): ${result.affectedFiles.length ? result.affectedFiles.join(", ") : "None"}`,
    `Dependent Callers (${result.dependentCallers.length}): ${result.dependentCallers.length ? result.dependentCallers.join(", ") : "None"}`,
    `Associated Tests (${result.associatedTests.length}): ${result.associatedTests.length ? result.associatedTests.join(", ") : "None"}`,
  ].join("\n");
}

export function handleCapabilitiesCommand(query: string): string {
  const q = query.trim();
  const caps = q ? globalSharkCapabilities.search(q) : globalSharkCapabilities.getActiveCapabilities();

  if (caps.length === 0) {
    return `No capabilities found matching query "${q}".`;
  }

  return [
    `🦈 Universal Capability Ecosystem (${caps.length} active):`,
    "----------------------------------------------------------",
    ...caps.map((c: SharkCapability) => `  - [${c.origin.type.toUpperCase()}] ${c.name} (${c.id}) [Risk: ${c.trust.riskLevel}]`),
  ].join("\n");
}

export const SHARK_SLASH_COMMAND: SlashCommandSpec = {
  name: "shark",
  aliases: ["ohms", "shark-status"],
  description: "Exibe o status arquitetural e telemetria do núcleo OhMyShark (Kernel, Intelligence, Execution, TUI)",
  allowArgs: true,
  handle: async (_cmd: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
    await runtime.output(handleSharkCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
  handleTui: async (_cmd: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
    runtime.ctx.showStatus(handleSharkCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
};

export const IMPACT_SLASH_COMMAND: SlashCommandSpec = {
  name: "impact",
  aliases: ["shark-impact"],
  description: "Executa a Shark Impact Analysis para calcular o raio de impacto, testes e riscos de contrato de uma alteração",
  allowArgs: true,
  handle: async (_cmd: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
    await runtime.output(handleImpactCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
  handleTui: async (_cmd: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
    runtime.ctx.showStatus(handleImpactCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
};

export const CAPABILITIES_SLASH_COMMAND: SlashCommandSpec = {
  name: "capabilities",
  aliases: ["caps"],
  description: "Inspeciona o ecossistema universal de capacidades (Skills, MCP, Plugins, Builtins)",
  allowArgs: true,
  handle: async (_cmd: ParsedSlashCommand, runtime: SlashCommandRuntime): Promise<SlashCommandResult> => {
    await runtime.output(handleCapabilitiesCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
  handleTui: async (_cmd: ParsedSlashCommand, runtime: TuiSlashCommandRuntime): Promise<SlashCommandResult> => {
    runtime.ctx.showStatus(handleCapabilitiesCommand(_cmd.args ?? ""));
    return commandConsumed();
  },
};

export const BUILTIN_SHARK_SLASH_COMMANDS: ReadonlyArray<SlashCommandSpec> = [
  SHARK_SLASH_COMMAND,
  IMPACT_SLASH_COMMAND,
  CAPABILITIES_SLASH_COMMAND,
];
