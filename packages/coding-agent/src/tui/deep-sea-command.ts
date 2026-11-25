/**
 * Deep Sea Command Cockpit TUI Component for Oh My Shark (OMSK).
 * Reinvents the terminal interface from a flat chat log into an interactive engineering cockpit:
 * - Active Mission Tracking (task status, phase progression, elapsed time, subtasks)
 * - Changes & Checkpoint Monitor (+/- lines, rollback availability)
 * - Validation & Checks Guard (LSP, compiler, tests)
 * - Real-time Event Stream with reactive EventBus (subscribe & emit)
 * - Interactive shortcut dispatcher ([Ctrl+P], [Ctrl+J], [Ctrl+D], [Ctrl+L])
 * - Three adaptive densities: "compact", "standard", "advanced"
 * - Adaptive rendering from 20 columns up to ultra-wide displays
 * - 100% Pure TypeScript string & ANSI calculation for complete cross-platform portability.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { PRODUCT_VERSION } from "@oh-my-pi/pi-utils";
import { truncate as truncateToWidth } from "@oh-my-pi/pi-tui/text/width";
import { REST_FRAME } from "../modes/components/shark-logo";
import type { ChangesSummary, FileChangeDiff } from "../edit/transactional-engine";
import { getMenteEmTeiaStore } from "../memories/mente-em-teia-sqlite";
import type { OrchestratorRun } from "../orchestrator/types";
import { lookup as lookupSetting } from "../config/registry";
import { settings } from "../config/settings";
import "./cockpit-settings";

export type CockpitDensity = "compact" | "standard" | "advanced";
export type CockpitDensityMode = "auto" | "compact" | "standard" | "advanced";
export type CockpitSidebarMode = "auto" | "visible" | "collapsed" | "hidden";

export interface CockpitConfig {
	density: CockpitDensityMode;
	sidebar: CockpitSidebarMode;
	eventStreamLines: number;
	showTips: boolean;
	showMemoryGraph: boolean;
	showRecentFiles: boolean;
	showProgress: boolean;
	showShortcuts: boolean;
	autoHeight: boolean;
}

export const DEFAULT_COCKPIT_CONFIG: CockpitConfig = {
	density: "auto",
	sidebar: "auto",
	eventStreamLines: 4,
	showTips: true,
	showMemoryGraph: true,
	showRecentFiles: true,
	showProgress: true,
	showShortcuts: true,
	autoHeight: true,
};

function getSettingSafe<T>(key: string, fallback: T): T {
	try {
		const setting = lookupSetting(key);
		if (!setting) return fallback;
		const val = setting.get(settings);
		return val !== undefined ? (val as unknown as T) : fallback;
	} catch {
		return fallback;
	}
}

export interface ActiveMissionInfo {
	id: string;
	title: string;
	phase: string;
	progressPercent: number;
	activeSubtask?: string;
	startTime?: number;
	endTime?: number;
	status?: "active" | "completed" | "failed";
}

export interface CockpitEventItem {
	timestamp: string;
	label: string;
	detail?: string;
	type: "edit" | "test" | "checkpoint" | "tool" | "error";
	status?: "passed" | "failed" | "active";
}

export type CockpitEventListener = (event: CockpitEventItem) => void;

export interface ShortcutBinding {
	key: string;
	label: string;
	action: () => void;
}

export interface LspStatusItem {
	name: string;
	language: string;
	status: "ready" | "error" | "connecting" | "available";
}

export interface SessionHistoryItem {
	name: string;
	timeAgo: string;
	active?: boolean;
}

export interface ActivityStepItem {
	label: string;
	status: "completed" | "active" | "pending";
}

export interface RecentFileItem {
	path: string;
	linesAdded: number;
	linesRemoved: number;
}

export interface MemoryGraphNode {
	id: string;
	label: string;
	kind: string;
}

export interface MemoryGraphEdge {
	source: string;
	target: string;
	label?: string;
}

export interface MemoryGraphData {
	nodes: MemoryGraphNode[];
	edges: MemoryGraphEdge[];
}

export interface DeepSeaCockpitOptions {
	density?: CockpitDensity;
	config?: Partial<CockpitConfig>;
	workspaceName?: string;
	version?: string;
	modelName?: string;
	providerName?: string;
	mission?: ActiveMissionInfo;
	changes?: ChangesSummary;
	passedChecks?: number;
	totalChecks?: number;
	recentEvents?: CockpitEventItem[];
	gitBranch?: string;
	quickTips?: string[];
	recentSessions?: SessionHistoryItem[];
	lspServers?: LspStatusItem[];
	activitySteps?: ActivityStepItem[];
	recentFiles?: RecentFileItem[];
	memoryGraph?: MemoryGraphData;
	agentStatus?: string;
	completedSteps?: number;
	totalSteps?: number;
	progressPercent?: number;
}

const ANSI_REGEX = /\u001B\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
	return text.replace(ANSI_REGEX, "");
}

export function visibleWidth(text: string): number {
	return stripAnsi(text).length;
}

export function padToWidth(text: string, targetWidth: number): string {
	const w = visibleWidth(text);
	if (w >= targetWidth) return truncateToWidth(text, targetWidth);
	return text + " ".repeat(targetWidth - w);
}

const style = {
	bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
	dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
	accent: (s: string) => `\x1b[38;2;0;221;245m${s}\x1b[39m`, // Luminous cyan
	cyan: (s: string) => `\x1b[38;2;0;221;245m${s}\x1b[39m`,
	blue: (s: string) => `\x1b[38;2;30;144;255m${s}\x1b[39m`,
	deepBlue: (s: string) => `\x1b[38;2;27;73;101m${s}\x1b[39m`,
	borderBlue: (s: string) => `\x1b[38;2;16;60;100m${s}\x1b[39m`,
	success: (s: string) => `\x1b[38;2;0;230;118m${s}\x1b[39m`,
	warning: (s: string) => `\x1b[38;2;255;214;0m${s}\x1b[39m`,
	yellow: (s: string) => `\x1b[38;2;255;214;0m${s}\x1b[39m`,
	error: (s: string) => `\x1b[38;2;255;82;82m${s}\x1b[39m`,
	muted: (s: string) => `\x1b[38;2;112;128;144m${s}\x1b[39m`,
	white: (s: string) => `\x1b[38;2;255;255;255m${s}\x1b[39m`,
	activePill: (s: string) => `\x1b[7;38;2;0;221;245m${s}\x1b[27m`,
	bgDeep: (s: string) => `\x1b[48;2;5;11;22m${s}\x1b[49m`,
};

export class DeepSeaCockpit {
	private density: CockpitDensity;
	private config: CockpitConfig;
	private workspaceName: string;
	private gitBranch: string;
	private version: string;
	private modelName: string;
	private providerName: string;
	private lastGitSyncAt = 0;
	private lastGitSyncCwd = "";
	private mission: ActiveMissionInfo;
	private changes: ChangesSummary;
	private passedChecks: number;
	private totalChecks: number;
	private events: CockpitEventItem[];
	private eventListeners: Set<CockpitEventListener> = new Set();
	private shortcuts: Map<string, ShortcutBinding> = new Map();
	private quickTips: string[];
	private recentSessions: SessionHistoryItem[];
	private lspServers: LspStatusItem[];
	private activitySteps: ActivityStepItem[];
	private recentFiles: RecentFileItem[];
	private memoryGraph: MemoryGraphData;
	private agentStatus: string;
	private completedSteps: number;
	private totalSteps: number;

	constructor(options: DeepSeaCockpitOptions = {}) {
		this.config = {
			density: options.config?.density ?? getSettingSafe("cockpit.density", DEFAULT_COCKPIT_CONFIG.density),
			sidebar: options.config?.sidebar ?? getSettingSafe("cockpit.sidebar", DEFAULT_COCKPIT_CONFIG.sidebar),
			eventStreamLines:
				options.config?.eventStreamLines ??
				getSettingSafe("cockpit.eventStreamLines", DEFAULT_COCKPIT_CONFIG.eventStreamLines),
			showTips: options.config?.showTips ?? getSettingSafe("cockpit.showTips", DEFAULT_COCKPIT_CONFIG.showTips),
			showMemoryGraph:
				options.config?.showMemoryGraph ??
				getSettingSafe("cockpit.showMemoryGraph", DEFAULT_COCKPIT_CONFIG.showMemoryGraph),
			showRecentFiles:
				options.config?.showRecentFiles ??
				getSettingSafe("cockpit.showRecentFiles", DEFAULT_COCKPIT_CONFIG.showRecentFiles),
			showProgress:
				options.config?.showProgress ?? getSettingSafe("cockpit.showProgress", DEFAULT_COCKPIT_CONFIG.showProgress),
			showShortcuts:
				options.config?.showShortcuts ??
				getSettingSafe("cockpit.showShortcuts", DEFAULT_COCKPIT_CONFIG.showShortcuts),
			autoHeight:
				options.config?.autoHeight ?? getSettingSafe("cockpit.autoHeight", DEFAULT_COCKPIT_CONFIG.autoHeight),
		};
		if (options.density !== undefined) {
			this.density = options.density;
			this.config.density = options.density;
		} else if (this.config.density !== "auto") {
			this.density = this.config.density;
		} else {
			this.density = "advanced";
		}
		this.workspaceName = options.workspaceName ?? (path.basename(process.cwd()) || "workspace");
		this.gitBranch = options.gitBranch ?? "";
		this.version = options.version ?? PRODUCT_VERSION;
		this.modelName = options.modelName ?? "Not configured";
		this.providerName = options.providerName ?? "";
		this.mission = options.mission ?? {
			id: "idle",
			title: "Ready for instructions",
			phase: "Idle",
			progressPercent: 0,
			startTime: Date.now(),
			status: "active",
		};
		this.changes = options.changes ?? {
			totalAdded: 0,
			totalRemoved: 0,
			modifiedCount: 0,
			checkpointsCount: 0,
		};
		this.passedChecks = options.passedChecks ?? 0;
		this.totalChecks = options.totalChecks ?? 0;
		this.events = options.recentEvents ? [...options.recentEvents] : [];
		this.quickTips = options.quickTips
			? [...options.quickTips]
			: ["Run /diff, /tasks, /events or /cockpit cycle", "Real-time workspace, git & memory telemetry"];
		this.recentSessions = options.recentSessions ? [...options.recentSessions] : [];
		this.lspServers = options.lspServers ? [...options.lspServers] : [];
		this.activitySteps = options.activitySteps ? [...options.activitySteps] : [];
		this.recentFiles = options.recentFiles ? [...options.recentFiles] : [];
		this.memoryGraph = options.memoryGraph ?? { nodes: [], edges: [] };
		this.agentStatus = options.agentStatus ?? "Ready";
		this.completedSteps = options.completedSteps ?? 0;
		this.totalSteps = options.totalSteps ?? 0;

		if (options.progressPercent !== undefined) {
			this.mission.progressPercent = options.progressPercent;
		}

		this.initDefaultShortcuts();
	}

	private initDefaultShortcuts(): void {
		this.registerShortcut("Ctrl+P", "Commands", () => {});
		this.registerShortcut("Ctrl+J", "Tasks", () => {});
		this.registerShortcut("Ctrl+D", "Diff", () => {});
		this.registerShortcut("Ctrl+L", "Events", () => {});
	}

	public setConfig(update: Partial<CockpitConfig>): void {
		this.config = { ...this.config, ...update };
		if (update.density !== undefined && update.density !== "auto") {
			this.density = update.density;
		}
	}

	public getConfig(): Readonly<CockpitConfig> {
		return { ...this.config };
	}

	public setDensity(density: CockpitDensity | "auto"): void {
		if (density === "auto") {
			this.config.density = "auto";
		} else {
			this.density = density;
			this.config.density = density;
		}
	}

	public cycleDensity(): CockpitDensity {
		const order: CockpitDensity[] = ["compact", "standard", "advanced"];
		const idx = order.indexOf(this.density);
		const next = order[(idx + 1) % order.length];
		this.setDensity(next);
		this.emitEvent({
			type: "tool",
			label: "Cockpit density",
			detail: next,
		});
		return next;
	}

	public setWorkspaceInfo(workspaceName: string, gitBranch?: string): void {
		if (workspaceName.length > 0) this.workspaceName = workspaceName;
		if (gitBranch !== undefined) this.gitBranch = gitBranch;
	}

	public setSidebar(sidebar: CockpitSidebarMode): void {
		this.config.sidebar = sidebar;
	}

	public setEventStreamLines(lines: number): void {
		this.config.eventStreamLines = Math.max(0, Math.min(16, lines));
	}

	public setShowTips(show: boolean): void {
		this.config.showTips = show;
	}

	public setShowMemoryGraph(show: boolean): void {
		this.config.showMemoryGraph = show;
	}

	public setShowRecentFiles(show: boolean): void {
		this.config.showRecentFiles = show;
	}

	public setShowProgress(show: boolean): void {
		this.config.showProgress = show;
	}

	public setShowShortcuts(show: boolean): void {
		this.config.showShortcuts = show;
	}

	public setAutoHeight(auto: boolean): void {
		this.config.autoHeight = auto;
	}

	public resolveEffectiveDensity(termWidth: number, termHeight?: number): CockpitDensity {
		if (this.config.density !== "auto") {
			return this.config.density;
		}
		const h = termHeight ?? (typeof process !== "undefined" && process.stdout?.rows ? process.stdout.rows : 35);
		if (termWidth < 50 || h <= 20) {
			return "compact";
		}
		if (termWidth < 85 || h <= 26) {
			return "standard";
		}
		return "advanced";
	}

	public resolveSidebarWidth(termWidth: number): { show: boolean; width: number; isFullLogo: boolean } {
		if (this.config.sidebar === "hidden") {
			return { show: false, width: 0, isFullLogo: false };
		}
		if (this.config.sidebar === "collapsed") {
			return { show: true, width: 20, isFullLogo: false };
		}
		if (this.config.sidebar === "visible") {
			const w =
				termWidth >= 115
					? Math.max(58, Math.min(62, Math.floor(termWidth * 0.48)))
					: Math.max(20, Math.min(32, Math.floor(termWidth * 0.28)));
			return { show: true, width: w, isFullLogo: w >= 56 };
		}
		if (termWidth < 80) {
			return { show: false, width: 0, isFullLogo: false };
		}
		if (termWidth >= 115) {
			const w = Math.max(58, Math.min(62, Math.floor(termWidth * 0.48)));
			return { show: true, width: w, isFullLogo: true };
		}
		const w = Math.max(22, Math.min(32, Math.floor(termWidth * 0.28)));
		return { show: true, width: w, isFullLogo: false };
	}

	public getDensity(): CockpitDensity {
		return this.density;
	}

	public updateChanges(summary: ChangesSummary): void {
		this.changes = summary;
	}

	public getChanges(): ChangesSummary {
		return { ...this.changes };
	}

	public startMission(id: string, title: string, initialPhase: string = "Phase 1 · Initializing"): void {
		this.mission = {
			id,
			title,
			phase: initialPhase,
			progressPercent: 0,
			startTime: Date.now(),
			status: "active",
		};
	}

	public updateMissionProgress(percent: number, activeSubtask?: string, phase?: string): void {
		this.mission.progressPercent = Math.min(100, Math.max(0, percent));
		if (activeSubtask !== undefined) {
			this.mission.activeSubtask = activeSubtask;
		}
		if (phase !== undefined) {
			this.mission.phase = phase;
		}
	}

	public completeMission(status: "completed" | "failed" = "completed"): void {
		this.mission.status = status;
		this.mission.endTime = Date.now();
		if (status === "completed") {
			this.mission.progressPercent = 100;
		}
	}

	public getMission(): ActiveMissionInfo {
		return { ...this.mission };
	}

	public getMissionElapsedSeconds(): number {
		const start = this.mission.startTime ?? Date.now();
		const end = this.mission.endTime ?? Date.now();
		return Math.max(0, Math.round((end - start) / 1000));
	}

	public updateChecks(passed: number, total: number): void {
		this.passedChecks = passed;
		this.totalChecks = total;
	}

	public getChecksSummary(): { passed: number; total: number } {
		return { passed: this.passedChecks, total: this.totalChecks };
	}

	public recordCheck(name: string, passed: boolean): void {
		this.totalChecks++;
		if (passed) {
			this.passedChecks++;
		}
		this.emitEvent({
			type: "test",
			label: `Check: ${name}`,
			detail: passed ? "PASSED" : "FAILED",
		});
	}

	public onEvent(listener: CockpitEventListener): () => void {
		this.eventListeners.add(listener);
		return () => {
			this.eventListeners.delete(listener);
		};
	}

	public emitEvent(event: Omit<CockpitEventItem, "timestamp"> & { timestamp?: string }): void {
		const now = new Date();
		const timeStr = event.timestamp ?? now.toTimeString().split(" ")[0];
		const fullEvent: CockpitEventItem = {
			...event,
			timestamp: timeStr,
		};

		this.pushEvent(fullEvent);

		for (const listener of this.eventListeners) {
			try {
				listener(fullEvent);
			} catch {
				// Ignore listener errors
			}
		}
	}

	public pushEvent(event: CockpitEventItem): void {
		this.events.unshift(event);
		if (this.events.length > 32) {
			this.events.pop();
		}
	}

	public getRecentEvents(): CockpitEventItem[] {
		return [...this.events];
	}

	public registerShortcut(key: string, label: string, action: () => void): void {
		this.shortcuts.set(key.toLowerCase(), { key, label, action });
	}

	public triggerShortcut(key: string): boolean {
		const binding = this.shortcuts.get(key.toLowerCase());
		if (binding) {
			binding.action();
			return true;
		}
		return false;
	}

	public listShortcuts(): ShortcutBinding[] {
		return Array.from(this.shortcuts.values());
	}

	public setAgentStatus(statusText: string, completed?: number, total?: number): void {
		this.agentStatus = statusText;
		if (completed !== undefined) this.completedSteps = completed;
		if (total !== undefined) this.totalSteps = total;
	}

	public getAgentStatus(): { status: string; completedSteps: number; totalSteps: number } {
		return {
			status: this.agentStatus,
			completedSteps: this.completedSteps,
			totalSteps: this.totalSteps,
		};
	}

	public setRecentFiles(files: RecentFileItem[]): void {
		this.recentFiles = [...files];
	}

	public getRecentFiles(): RecentFileItem[] {
		return [...this.recentFiles];
	}

	public setMemoryGraph(graph: MemoryGraphData): void {
		this.memoryGraph = { ...graph };
	}

	public getMemoryGraph(): MemoryGraphData {
		return { ...this.memoryGraph };
	}

	public setLspServers(servers: LspStatusItem[]): void {
		this.lspServers = [...servers];
	}

	public setRecentSessions(sessions: SessionHistoryItem[]): void {
		this.recentSessions = [...sessions];
	}

	public updateMetadata(options: {
		version?: string;
		modelName?: string;
		providerName?: string;
		recentSessions?: SessionHistoryItem[];
		lspServers?: LspStatusItem[];
	}): void {
		if (options.version !== undefined && options.version.length > 0) this.version = options.version;
		if (options.modelName !== undefined && options.modelName.length > 0) this.modelName = options.modelName;
		if (options.providerName !== undefined && options.providerName.length > 0)
			this.providerName = options.providerName;
		if (options.recentSessions !== undefined) this.recentSessions = [...options.recentSessions];
		if (options.lspServers !== undefined) this.lspServers = [...options.lspServers];
	}

	public syncFromWorkspaceGit(cwd: string = process.cwd(), force: boolean = false): void {
		const now = Date.now();
		if (!force && this.lastGitSyncCwd === cwd && now - this.lastGitSyncAt < 2000) {
			return;
		}
		this.lastGitSyncCwd = cwd;
		this.lastGitSyncAt = now;
		this.workspaceName = path.basename(cwd) || cwd;
		if (process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test") return;

		try {
			const statusProc = Bun.spawnSync(["git", "status", "--porcelain=v1", "-b"], {
				cwd,
				stdin: "ignore",
				stdout: "pipe",
				stderr: "pipe",
			});
			if (statusProc.exitCode !== 0) {
				this.gitBranch = "";
				return;
			}

			const rawLines = statusProc.stdout.toString().split(/\r?\n/);
			const headerLine = rawLines[0] ?? "";
			if (headerLine.startsWith("## ")) {
				const branchSpec = headerLine.slice(3).trim();
				if (branchSpec.startsWith("No commits yet on ")) {
					this.gitBranch = branchSpec.slice("No commits yet on ".length).trim();
				} else if (branchSpec.startsWith("HEAD (no branch)")) {
					this.gitBranch = "HEAD";
				} else {
					const dotIdx = branchSpec.indexOf("...");
					const spaceIdx = branchSpec.indexOf(" ");
					const endIdx =
						dotIdx >= 0 && (spaceIdx < 0 || dotIdx < spaceIdx)
							? dotIdx
							: spaceIdx >= 0
								? spaceIdx
								: branchSpec.length;
					this.gitBranch = branchSpec.slice(0, endIdx).trim();
				}
			} else {
				this.gitBranch = "";
			}

			// Do not clobber active transactional edits with raw working-tree diff
			if (this.changes.checkpointsCount > 0) {
				return;
			}

			let hasTrackedChanges = false;
			const dirtyPaths = new Set<string>();
			const filesByPath = new Map<string, RecentFileItem>();

			for (const line of rawLines.slice(1)) {
				if (line.length < 4) continue;
				const statusCode = line.slice(0, 2);
				const filePath = line.slice(3).trim();
				if (!filePath) continue;
				dirtyPaths.add(filePath);
				if (statusCode === "??") {
					filesByPath.set(filePath, { path: filePath, linesAdded: 0, linesRemoved: 0 });
				} else {
					hasTrackedChanges = true;
				}
			}

			let totalAdded = 0;
			let totalRemoved = 0;

			if (hasTrackedChanges) {
				const numstatProc = Bun.spawnSync(["git", "diff", "--numstat", "HEAD"], {
					cwd,
					stdin: "ignore",
					stdout: "pipe",
					stderr: "pipe",
				});
				if (numstatProc.exitCode === 0) {
					const raw = numstatProc.stdout.toString();
					for (const line of raw.split(/\r?\n/)) {
						if (!line.trim()) continue;
						const parts = line.split("\t");
						if (parts.length < 3) continue;
						const added = parts[0] === "-" ? 0 : Number.parseInt(parts[0], 10) || 0;
						const removed = parts[1] === "-" ? 0 : Number.parseInt(parts[1], 10) || 0;
						const filePath = parts.slice(2).join("\t");
						totalAdded += added;
						totalRemoved += removed;
						filesByPath.set(filePath, { path: filePath, linesAdded: added, linesRemoved: removed });
					}
				}
			}

			for (const filePath of dirtyPaths) {
				if (!filesByPath.has(filePath)) {
					filesByPath.set(filePath, { path: filePath, linesAdded: 0, linesRemoved: 0 });
				}
			}

			this.changes = {
				totalAdded,
				totalRemoved,
				modifiedCount: dirtyPaths.size,
				checkpointsCount: 0,
			};
			this.recentFiles = Array.from(filesByPath.values()).slice(0, 6);
		} catch {
			// Git unavailable or directory unreadable; leave clean non-git state
		}
	}

	public syncFromTodos(
		phases: ReadonlyArray<{ name: string; tasks: ReadonlyArray<{ content: string; status: string }> }>,
		title?: string,
	): void {
		const allTasks = phases.flatMap(phase => phase.tasks);
		if (allTasks.length === 0) {
			if (this.mission.id === "tasks") {
				this.mission = {
					id: "idle",
					title: "Ready for instructions",
					phase: "Idle",
					progressPercent: 0,
					startTime: this.mission.startTime ?? Date.now(),
					status: "active",
				};
				this.activitySteps = [];
				this.completedSteps = 0;
				this.totalSteps = 0;
			}
			return;
		}

		let completed = 0;
		for (const t of allTasks) {
			if (t.status === "completed" || t.status === "done") completed++;
		}
		const progressPercent = Math.round((completed / allTasks.length) * 100);
		const activePhase = phases.find(p => p.tasks.some(t => t.status === "in_progress" || t.status === "active"));
		const currentPhase = activePhase ?? phases.find(p => p.tasks.some(t => t.status === "pending")) ?? phases[0];
		const activeTask = allTasks.find(t => t.status === "in_progress" || t.status === "active");

		this.mission = {
			id: "tasks",
			title: title ?? currentPhase.name,
			phase: `${phases.length} ${phases.length === 1 ? "phase" : "phases"}`,
			progressPercent,
			activeSubtask: activeTask?.content,
			startTime: this.mission.startTime ?? Date.now(),
			status: completed === allTasks.length ? "completed" : "active",
		};
		this.activitySteps = allTasks.slice(0, 8).map(t => ({
			label: t.content,
			status:
				t.status === "completed" || t.status === "done"
					? "completed"
					: t.status === "in_progress" || t.status === "active"
						? "active"
						: "pending",
		}));
		this.completedSteps = completed;
		this.totalSteps = allTasks.length;
	}

	public async syncFromEditEngine(engine: {
		getChangesSummary(): Promise<ChangesSummary>;
		getDetailedDiff?(): Promise<FileChangeDiff[]>;
	}): Promise<void> {
		const summary = await engine.getChangesSummary();
		this.updateChanges(summary);

		if (typeof engine.getDetailedDiff === "function") {
			try {
				const diffs = await engine.getDetailedDiff();
				this.recentFiles = diffs.map(d => ({
					path: d.path,
					linesAdded: d.linesAdded,
					linesRemoved: d.linesRemoved,
				}));
			} catch {
				// Fallback to existing
			}
		}
	}

	public syncFromMenteEmTeia(store: {
		exportGraphSnapshot?(): {
			nodes: Array<{ id: string; name: string; kind: string }>;
			edges: Array<{ id: string; sourceId: string; targetId: string; relation: string }>;
		};
	}): void {
		if (typeof store.exportGraphSnapshot === "function") {
			try {
				const snapshot = store.exportGraphSnapshot();
				this.memoryGraph = {
					nodes: snapshot.nodes.map(n => ({ id: n.id, label: n.name, kind: n.kind })),
					edges: snapshot.edges.map(e => ({ source: e.sourceId, target: e.targetId, label: e.relation })),
				};
			} catch {
				// Fallback
			}
		}
	}

	public syncFromOrchestrator(run: OrchestratorRun | null): void {
		if (!run) {
			this.mission = {
				id: "idle",
				title: "No active orchestrator mission",
				phase: "Idle",
				progressPercent: 0,
				status: "active",
			};
			this.activitySteps = [{ label: "Awaiting /orchestrator plan", status: "pending" }];
			this.agentStatus = "Idle";
			this.completedSteps = 0;
			this.totalSteps = 0;
			return;
		}

		const workers = Object.values(run.workers);
		const completedWorkers = workers.filter(w => w.status === "completed").length;
		const totalWorkers = workers.length;
		const progressPercent =
			run.phase === "COMMITTED" ? 100 : totalWorkers > 0 ? Math.round((completedWorkers / totalWorkers) * 100) : 0;

		const activeWorker = workers.find(
			w => w.status === "running" || w.status === "steered" || w.status === "verifying" || w.status === "repaired",
		);
		const missionStatus: ActiveMissionInfo["status"] =
			run.phase === "COMMITTED"
				? "completed"
				: run.phase === "ABORTED" || run.phase === "BLOCKED"
					? "failed"
					: "active";

		const waveNum = Math.min(run.currentWaveIndex + 1, Math.max(1, run.waves.length));
		this.mission = {
			id: run.id,
			title: run.goal,
			phase: `Wave ${waveNum}/${Math.max(1, run.waves.length)} · ${run.phase}`,
			progressPercent,
			activeSubtask: activeWorker ? `@${activeWorker.role}: ${activeWorker.title}` : undefined,
			startTime: run.createdAt,
			endTime: missionStatus === "active" ? undefined : run.updatedAt,
			status: missionStatus,
		};

		if (run.waves.length > 1) {
			this.activitySteps = run.waves.map(wave => ({
				label: `Wave #${wave.index} (${wave.workerIds.length}w · ${wave.status})`,
				status:
					wave.status === "completed"
						? "completed"
						: wave.status === "running" || wave.status === "verifying"
							? "active"
							: "pending",
			}));
		} else {
			this.activitySteps = workers.map(w => ({
				label: `@${w.role}: ${w.title}`,
				status:
					w.status === "completed"
						? "completed"
						: w.status === "running" ||
							  w.status === "steered" ||
							  w.status === "verifying" ||
							  w.status === "repaired"
							? "active"
							: "pending",
			}));
		}

		this.completedSteps = completedWorkers;
		this.totalSteps = Math.max(1, totalWorkers);
		this.agentStatus = `${run.phase} (${completedWorkers}/${totalWorkers})`;

		const verifications = run.waves
			.map(w => w.verification)
			.filter((v): v is NonNullable<typeof v> => v !== undefined);
		if (verifications.length > 0) {
			let passed = 0;
			let total = 0;
			for (const v of verifications) {
				if (v.tddProofs.length > 0) {
					for (const p of v.tddProofs) {
						passed += p.passedCount;
						total += p.totalCount;
					}
				} else {
					total += 1;
					if (v.passed) passed += 1;
				}
			}
			this.passedChecks = passed;
			this.totalChecks = total;
		}
	}

	// ==========================================
	// 1. HEADER SUPERIOR
	// ==========================================
	public renderHeader(_width: number): string[] {
		return [];
	}

	// ==========================================
	// 2. SIDEBAR LATERAL
	// ==========================================
	public renderSidebar(width: number, height: number = 25): string[] {
		const w = Math.max(15, width);
		const lines: string[] = [];

		// Authentic TUI Shark Logo (stackedlol/ascii-sharks from welcome surface)
		if (w >= 56 && height >= 32) {
			for (const line of REST_FRAME) {
				lines.push(padToWidth(truncateToWidth(line, w), w));
			}
		} else {
			// Compact focal rows of the authentic ASCII shark so live model, branch, sessions & LSP remain visible
			for (const line of REST_FRAME.slice(5, 13)) {
				lines.push(padToWidth(truncateToWidth(line, w), w));
			}
		}

		// Wordmark & Real Runtime Telemetry
		lines.push(padToWidth(`${style.bold(style.cyan("OMSK"))} ${style.dim(`· Oh My Shark v${this.version}`)}`, w));
		const modelDisplay = this.providerName ? `${this.modelName} · ${this.providerName}` : this.modelName;
		lines.push(padToWidth(`${style.success("●")} ${truncateToWidth(modelDisplay, Math.max(6, w - 3))}`, w));
		const workspaceDisplay = this.gitBranch ? `${this.workspaceName} (${this.gitBranch})` : this.workspaceName;
		lines.push(
			padToWidth(`${style.cyan("⎇")} ${style.dim(truncateToWidth(workspaceDisplay, Math.max(6, w - 3)))}`, w),
		);
		lines.push(padToWidth(style.borderBlue("─".repeat(w - 2)), w));

		// Quick Tips
		if (this.config.showTips) {
			lines.push(padToWidth(style.yellow("💡 Quick Tips:"), w));
			const tip = this.quickTips[0] ?? "Run /diff, /tasks, /events or /cockpit cycle";
			const tipParts = tip.split(" [NEW]");
			const tipBody = tipParts[0];
			const hasNew = tip.includes("[NEW]");
			const tipFormatted = hasNew ? `${tipBody} ${style.warning(style.bold("[NEW]"))}` : tipBody;

			// Word wrap tip across lines
			const words = tipFormatted.split(" ");
			let curTipLine = "";
			for (const word of words) {
				if (visibleWidth(curTipLine + (curTipLine ? " " : "") + word) <= w - 2) {
					curTipLine = curTipLine ? curTipLine + " " + word : word;
				} else {
					if (curTipLine) lines.push(padToWidth(curTipLine, w));
					curTipLine = word;
				}
			}
			if (curTipLine) lines.push(padToWidth(curTipLine, w));
			lines.push(padToWidth(style.borderBlue("─".repeat(w - 2)), w));
		}

		// Recent Sessions
		lines.push(padToWidth(style.cyan("🕒 Recent Sessions:"), w));
		if (this.recentSessions.length === 0) {
			lines.push(padToWidth(style.dim("  No recent sessions"), w));
		} else {
			for (const session of this.recentSessions.slice(0, 4)) {
				const activeIcon = session.active ? style.cyan("⊕") : style.dim("○");
				const name = truncateToWidth(session.name, Math.max(5, w - 12));
				const time = style.dim(session.timeAgo);
				lines.push(padToWidth(`${activeIcon} ${name} ${time}`, w));
			}
		}
		lines.push(padToWidth(style.borderBlue("─".repeat(w - 2)), w));

		// LSP Servers
		lines.push(padToWidth(style.cyan("🧩 LSP Servers:"), w));
		if (this.lspServers.length === 0) {
			lines.push(padToWidth(style.dim("  No active LSP servers"), w));
		} else {
			for (const server of this.lspServers.slice(0, 3)) {
				const dot =
					server.status === "ready"
						? style.success("●")
						: server.status === "connecting"
							? style.warning("●")
							: server.status === "error"
								? style.error("●")
								: style.dim("●");
				const text = `${dot} ${server.name} ${style.dim(`(${server.language})`)}`;
				lines.push(padToWidth(truncateToWidth(text, w - 2), w));
			}
		}

		while (lines.length < height) {
			lines.push(" ".repeat(w));
		}

		return lines.slice(0, height);
	}

	// ==========================================
	// 3. TOP TITLE BAR & DENSITY SELECTOR
	// ==========================================
	public renderTopTitleBar(_width: number): string[] {
		return [];
	}

	// ==========================================
	// 4. THE 3 TOP CARDS (Mission, Changes, Checks)
	// ==========================================
	public renderMissionCard(width: number): string[] {
		const w = Math.max(18, width);
		const innerW = w - 4;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const header = `${style.cyan("🚀 Mission")}`;
		const title = style.bold(truncateToWidth(this.mission.title, innerW));
		const phase = `${style.dim(`Phase: ${this.mission.phase}`)} ${style.borderBlue("·")} ${style.cyan(`Active (${this.mission.progressPercent}%)`)}`;

		// Horizontal Progress Bar
		const barWidth = Math.max(8, innerW - 6);
		const filledChars = Math.round((this.mission.progressPercent / 100) * barWidth);
		const emptyChars = Math.max(0, barWidth - filledChars);
		const progressBar =
			style.cyan("━".repeat(filledChars)) +
			style.dim("─".repeat(emptyChars)) +
			` ${style.cyan(`${this.mission.progressPercent}%`)}`;

		return [
			borderTop,
			style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │"),
			style.borderBlue("│ ") + padToWidth(title, innerW) + style.borderBlue(" │"),
			style.borderBlue("│ ") + padToWidth(phase, innerW) + style.borderBlue(" │"),
			style.borderBlue("│ ") + padToWidth(progressBar, innerW) + style.borderBlue(" │"),
			borderBottom,
		];
	}

	public renderChangesCard(width: number): string[] {
		const w = Math.max(16, width);
		const innerW = w - 2;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const header = `${style.blue("🔮 Changes")}`;
		const linesDiff = `${style.success(`+${this.changes.totalAdded} lines`)}  ${style.error(`-${this.changes.totalRemoved} lines`)}`;
		const ckptLabel =
			this.changes.checkpointsCount === 1 ? "1 checkpoint" : `${this.changes.checkpointsCount} checkpoints`;
		const summary = style.dim(`(${this.changes.modifiedCount} files, ${ckptLabel})`);

		return [
			borderTop,
			style.borderBlue("│") + padToWidth(` ${header}`, innerW) + style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(` ${linesDiff}`, innerW) + style.borderBlue("│"),
			style.borderBlue("│") +
				padToWidth(innerW >= visibleWidth(summary) + 1 ? ` ${summary}` : summary, innerW) +
				style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(" ", innerW) + style.borderBlue("│"),
			borderBottom,
		];
	}

	public renderChecksCard(width: number): string[] {
		const w = Math.max(14, width);
		const innerW = w - 2;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const header = `${style.success("✔ Checks")}`;
		let statusLine = "";
		let detailLine = "";

		if (this.totalChecks === 0) {
			statusLine = style.dim("No checks executed");
			detailLine = style.dim("Awaiting validation");
		} else if (this.passedChecks === this.totalChecks) {
			statusLine = style.bold(style.success(`✔ ${this.passedChecks}/${this.totalChecks} passed`));
			detailLine = style.success("All checks healthy");
		} else {
			statusLine = style.bold(style.warning(`▲ ${this.passedChecks}/${this.totalChecks} passed`));
			detailLine = style.warning("Some checks pending");
		}

		return [
			borderTop,
			style.borderBlue("│") + padToWidth(` ${header}`, innerW) + style.borderBlue("│"),
			style.borderBlue("│") +
				padToWidth(innerW >= visibleWidth(statusLine) + 1 ? ` ${statusLine}` : statusLine, innerW) +
				style.borderBlue("│"),
			style.borderBlue("│") +
				padToWidth(innerW >= visibleWidth(detailLine) + 1 ? ` ${detailLine}` : detailLine, innerW) +
				style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(" ", innerW) + style.borderBlue("│"),
			borderBottom,
		];
	}

	public renderCardsRow(width: number): string[] {
		const safeWidth = Math.max(40, width);
		const card1W = Math.floor(safeWidth * 0.44);
		const card2W = Math.floor(safeWidth * 0.32);
		const card3W = Math.max(12, safeWidth - card1W - card2W - 2);

		const c1 = this.renderMissionCard(card1W);
		const c2 = this.renderChangesCard(card2W);
		const c3 = this.renderChecksCard(card3W);

		const maxH = Math.max(c1.length, c2.length, c3.length);
		const rows: string[] = [];

		for (let i = 0; i < maxH; i++) {
			const line1 = padToWidth(c1[i] ?? "", card1W);
			const line2 = padToWidth(c2[i] ?? "", card2W);
			const line3 = padToWidth(c3[i] ?? "", card3W);
			rows.push(`${line1} ${line2} ${line3}`);
		}

		return rows;
	}

	// ==========================================
	// 5. LIVE EVENT STREAM & PROVENANCE
	// ==========================================
	public renderEventStream(width: number, maxLines: number = 6): string[] {
		const safeWidth = Math.max(25, width);
		const innerW = safeWidth - 4;
		const borderTop = style.borderBlue(`╭${"─".repeat(safeWidth - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(safeWidth - 2)}╯`);

		const header = `${style.cyan("〰 LIVE EVENT STREAM & PROVENANCE")}`;
		const lines: string[] = [borderTop, style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │")];

		if (this.events.length === 0) {
			lines.push(
				style.borderBlue("│ ") + padToWidth(style.dim("No events recorded yet"), innerW) + style.borderBlue(" │"),
			);
		} else {
			const visibleEvents = this.events.slice(0, maxLines);
			for (const ev of visibleEvents) {
				const checkMark = ev.type === "error" ? style.error("✖") : style.success("✔");
				const time = style.dim(ev.timestamp);
				const badge =
					ev.type === "checkpoint"
						? style.warning(style.bold("CKPT"))
						: ev.type === "edit"
							? style.success(style.bold("EDIT"))
							: ev.type === "test"
								? style.blue(style.bold("TEST"))
								: ev.type === "error"
									? style.error(style.bold("ERR!"))
									: style.cyan(style.bold("EVNT"));

				const label = truncateToWidth(ev.label, Math.floor(innerW * 0.45));
				const detail = ev.detail ? style.dim(truncateToWidth(ev.detail, Math.floor(innerW * 0.35))) : "";

				const evContent = `${checkMark}  ${time}   ${badge}   ${label}   ${detail}`;
				lines.push(style.borderBlue("│ ") + padToWidth(evContent, innerW) + style.borderBlue(" │"));
			}
		}

		lines.push(borderBottom);
		return lines;
	}

	// ==========================================
	// 6. BARRA DE ATALHOS
	// ==========================================
	public renderShortcutBar(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const shortcuts = [`[/diff] Changes`, `[/tasks] Tasks`, `[/events] Events`, `[/cockpit cycle] Density`];
		const text = shortcuts.map(s => style.cyan(s)).join("   ");
		const border = style.borderBlue("─".repeat(safeWidth));
		return [padToWidth(` ${text}`, safeWidth), border];
	}

	// ==========================================
	// 7. PAINÉIS INFERIORES (Progress, Memory, Files)
	// ==========================================
	public renderProgressPanel(width: number): string[] {
		const w = Math.max(18, width);
		const innerW = w - 4;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const header = style.cyan("⊞ Progress & Activity");
		const donutGauge = [
			style.cyan("  ╭───╮"),
			style.bold(style.cyan(` │${padToWidth(String(this.mission.progressPercent) + "%", 4)}│`)),
			style.cyan("  ╰───╯"),
		];

		const stepRows: string[] = [];
		if (this.activitySteps.length === 0) {
			stepRows.push(
				`${style.success("✔")} ${truncateToWidth(this.agentStatus || "Ready", Math.max(4, innerW - 12))}`,
			);
			if (this.gitBranch) {
				stepRows.push(`${style.cyan("⎇")} ${truncateToWidth(this.gitBranch, Math.max(4, innerW - 12))}`);
			}
			const dirtyLabel = `${this.changes.modifiedCount} ${this.changes.modifiedCount === 1 ? "modified file" : "modified files"}`;
			stepRows.push(`${style.dim("○")} ${truncateToWidth(dirtyLabel, Math.max(4, innerW - 12))}`);
		} else {
			for (const step of this.activitySteps.slice(0, 4)) {
				const icon =
					step.status === "completed"
						? style.success("✔")
						: step.status === "active"
							? style.blue("▶")
							: style.dim("○");
				const label = truncateToWidth(step.label, Math.max(4, innerW - 12));
				stepRows.push(`${icon} ${label}`);
			}
		}

		const rows: string[] = [borderTop, style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │")];

		const maxH = Math.max(donutGauge.length, stepRows.length);
		for (let i = 0; i < maxH; i++) {
			const gauge = donutGauge[i] ?? "       ";
			const step = stepRows[i] ?? "";
			const rowContent = `${gauge}  ${step}`;
			rows.push(style.borderBlue("│ ") + padToWidth(rowContent, innerW) + style.borderBlue(" │"));
		}

		rows.push(borderBottom);
		return rows;
	}

	public renderMemoryGraphPanel(width: number): string[] {
		const w = Math.max(18, width);
		const innerW = w - 4;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const nodeCount = this.memoryGraph.nodes.length;
		const edgeCount = this.memoryGraph.edges.length;
		const header = style.cyan(`Memory Graph (${nodeCount}n/${edgeCount}e)`);
		const diagram: string[] = [];

		if (nodeCount === 0) {
			if (this.recentFiles.length > 0) {
				const hubLabel = truncateToWidth(this.gitBranch || this.workspaceName, Math.max(8, innerW - 4));
				diagram.push(style.cyan(style.bold(`◈ ${hubLabel}`)));
				for (const f of this.recentFiles.slice(0, 2)) {
					const shortPath = path.basename(f.path);
					diagram.push(
						`${style.borderBlue("├─")} ${style.dim(truncateToWidth(shortPath, Math.max(6, innerW - 4)))}`,
					);
				}
				diagram.push(style.dim("No Teia memory nodes yet"));
			} else {
				diagram.push(style.dim("No graph nodes indexed yet"));
				diagram.push(style.dim(`Workspace: ${truncateToWidth(this.workspaceName, Math.max(4, innerW - 11))}`));
				diagram.push(
					style.dim(
						this.gitBranch
							? `Branch: ${truncateToWidth(this.gitBranch, Math.max(4, innerW - 8))}`
							: "Teia memory ready",
					),
				);
			}
		} else {
			const nodeById = new Map<string, MemoryGraphNode>();
			const degree = new Map<string, number>();
			for (const node of this.memoryGraph.nodes) {
				nodeById.set(node.id, node);
				degree.set(node.id, 0);
			}
			for (const edge of this.memoryGraph.edges) {
				degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
				degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
			}
			let hub = this.memoryGraph.nodes[0];
			let bestDeg = degree.get(hub.id) ?? 0;
			for (const node of this.memoryGraph.nodes) {
				const d = degree.get(node.id) ?? 0;
				if (d > bestDeg) {
					bestDeg = d;
					hub = node;
				}
			}

			const neighborRows: Array<{ label: string; relation?: string }> = [];
			for (const edge of this.memoryGraph.edges) {
				if (edge.source === hub.id) {
					const target = nodeById.get(edge.target);
					if (target) neighborRows.push({ label: target.label, relation: edge.label });
				} else if (edge.target === hub.id) {
					const source = nodeById.get(edge.source);
					if (source) neighborRows.push({ label: source.label, relation: edge.label });
				}
			}

			if (neighborRows.length === 0) {
				for (const node of this.memoryGraph.nodes) {
					if (node.id !== hub.id) {
						neighborRows.push({ label: node.label, relation: node.kind });
					}
				}
			}

			const maxLabel = Math.max(6, Math.floor((innerW - 8) / 2));
			if (neighborRows.length >= 2 && innerW >= 24) {
				const top = neighborRows[0];
				const left = neighborRows[1];
				const right = neighborRows[2];
				diagram.push(style.dim(`   ${truncateToWidth(top.label, innerW - 4)}`));
				diagram.push(style.borderBlue("      │"));
				if (right) {
					const leftText = style.blue(truncateToWidth(left.label, maxLabel));
					const centerText = style.cyan(style.bold(truncateToWidth(hub.label, maxLabel)));
					const rightText = style.white(truncateToWidth(right.label, maxLabel));
					diagram.push(
						`${leftText} ${style.borderBlue("──")} ${centerText} ${style.borderBlue("──")} ${rightText}`,
					);
				} else {
					diagram.push(
						`${style.blue(truncateToWidth(left.label, maxLabel))} ${style.borderBlue("──")} ${style.cyan(style.bold(truncateToWidth(hub.label, maxLabel)))}`,
					);
				}
				const extra = neighborRows[3];
				if (extra) {
					diagram.push(style.borderBlue("      │"));
					const relPrefix = extra.relation ? `${extra.relation}: ` : "";
					diagram.push(style.yellow(truncateToWidth(`${relPrefix}${extra.label}`, innerW)));
				}
			} else {
				diagram.push(style.cyan(style.bold(truncateToWidth(hub.label, innerW))));
				for (const neighbor of neighborRows.slice(0, 4)) {
					const rel = neighbor.relation ? ` (${neighbor.relation})` : "";
					diagram.push(
						`${style.borderBlue("├─")} ${truncateToWidth(`${neighbor.label}${rel}`, Math.max(4, innerW - 3))}`,
					);
				}
			}
		}

		const rows: string[] = [borderTop, style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │")];

		for (const line of diagram.slice(0, 6)) {
			rows.push(style.borderBlue("│ ") + padToWidth(truncateToWidth(line, innerW), innerW) + style.borderBlue(" │"));
		}

		while (rows.length < 8) {
			rows.push(style.borderBlue("│ ") + padToWidth(" ", innerW) + style.borderBlue(" │"));
		}

		rows.push(borderBottom);
		return rows;
	}

	public renderRecentFilesPanel(width: number): string[] {
		const w = Math.max(18, width);
		const innerW = w - 4;
		const borderTop = style.borderBlue(`╭${"─".repeat(w - 2)}╮`);
		const borderBottom = style.borderBlue(`╰${"─".repeat(w - 2)}╯`);

		const header = style.cyan("Recent Files");
		const rows: string[] = [borderTop, style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │")];

		if (this.recentFiles.length === 0) {
			rows.push(
				style.borderBlue("│ ") + padToWidth(style.dim("Clean working tree"), innerW) + style.borderBlue(" │"),
			);
			rows.push(
				style.borderBlue("│ ") + padToWidth(style.dim("No modified files"), innerW) + style.borderBlue(" │"),
			);
		} else {
			for (const file of this.recentFiles.slice(0, 4)) {
				const fileIcon = "📄";
				const diff = `${style.success(`+${file.linesAdded}`)} ${style.error(`-${file.linesRemoved}`)}`;
				const prefix = ` ${fileIcon} `;
				const diffLen = visibleWidth(diff);
				const availForPath = Math.max(4, innerW - diffLen - visibleWidth(prefix) - 1);
				const rawPath = file.path;
				let displayPath = rawPath;
				if (visibleWidth(rawPath) > availForPath) {
					if (availForPath > 8 && rawPath.includes("/")) {
						const parts = rawPath.split("/");
						const filePart = parts[parts.length - 1];
						displayPath = truncateToWidth(`.../${filePart}`, availForPath);
					} else {
						displayPath = truncateToWidth(rawPath, availForPath);
					}
				}
				const spaceCount = Math.max(1, innerW - visibleWidth(`${prefix}${displayPath}`) - diffLen);
				const spacing = " ".repeat(spaceCount);
				const fileLine = `${prefix}${displayPath}${spacing}${diff}`;
				rows.push(style.borderBlue("│") + padToWidth(fileLine, innerW) + style.borderBlue("│"));
			}
		}

		while (rows.length < 8) {
			rows.push(style.borderBlue("│ ") + padToWidth(" ", innerW) + style.borderBlue(" │"));
		}

		rows.push(borderBottom);
		return rows;
	}

	public renderLowerPanelsRow(width: number): string[] {
		const safeWidth = Math.max(40, width);

		const showProgress = this.config.showProgress;
		const showMemory = this.config.showMemoryGraph;
		const showFiles = this.config.showRecentFiles;

		const activePanels: Array<"progress" | "memory" | "files"> = [];
		if (showProgress) activePanels.push("progress");
		if (showMemory) activePanels.push("memory");
		if (showFiles) activePanels.push("files");

		if (activePanels.length === 0) {
			return [];
		}

		if (activePanels.length === 3 && safeWidth >= 95) {
			const col1W = Math.floor(safeWidth * 0.35);
			const col2W = Math.floor(safeWidth * 0.35);
			const col3W = Math.max(12, safeWidth - col1W - col2W - 2);

			const p1 = this.renderProgressPanel(col1W);
			const p2 = this.renderMemoryGraphPanel(col2W);
			const p3 = this.renderRecentFilesPanel(col3W);

			const maxH = Math.max(p1.length, p2.length, p3.length);
			const rows: string[] = [];

			for (let i = 0; i < maxH; i++) {
				const line1 = padToWidth(p1[i] ?? "", col1W);
				const line2 = padToWidth(p2[i] ?? "", col2W);
				const line3 = padToWidth(p3[i] ?? "", col3W);
				rows.push(`${line1} ${line2} ${line3}`);
			}

			return rows;
		}

		if (activePanels.length >= 2) {
			const panelsToRender =
				activePanels.length === 3
					? safeWidth >= 56
						? ["progress", "memory"]
						: ["progress"]
					: activePanels.slice(0, 2);

			if (panelsToRender.length === 2) {
				const col1W = Math.floor(safeWidth * 0.5) - 1;
				const col2W = Math.max(16, safeWidth - col1W - 1);

				const p1 =
					panelsToRender[0] === "progress"
						? this.renderProgressPanel(col1W)
						: panelsToRender[0] === "memory"
							? this.renderMemoryGraphPanel(col1W)
							: this.renderRecentFilesPanel(col1W);

				const p2 =
					panelsToRender[1] === "files"
						? this.renderRecentFilesPanel(col2W)
						: panelsToRender[1] === "memory"
							? this.renderMemoryGraphPanel(col2W)
							: this.renderProgressPanel(col2W);

				const maxH = Math.max(p1.length, p2.length);
				const rows: string[] = [];
				for (let i = 0; i < maxH; i++) {
					const line1 = padToWidth(p1[i] ?? "", col1W);
					const line2 = padToWidth(p2[i] ?? "", col2W);
					rows.push(`${line1} ${line2}`);
				}
				return rows;
			}
		}

		const singleW = safeWidth;
		const primary = activePanels[0];
		if (primary === "progress") return this.renderProgressPanel(singleW);
		if (primary === "memory") return this.renderMemoryGraphPanel(singleW);
		return this.renderRecentFilesPanel(singleW);
	}
	// ==========================================
	// 8. BARRA INFERIOR DE STATUS
	// ==========================================
	public renderBottomStatus(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const agentDot = style.success("●");
		const agentText = `${agentDot} ${style.bold("Agent:")} ${style.cyan(this.agentStatus)}`;
		const stepsText = `${style.dim(`${this.completedSteps}/${this.totalSteps} steps completed`)}`;

		// Bar in center
		const barBudget = Math.max(6, Math.min(26, Math.floor(safeWidth * 0.25)));
		const filled = this.totalSteps > 0 ? Math.round((this.completedSteps / this.totalSteps) * barBudget) : 0;
		const empty = Math.max(0, barBudget - filled);
		const bar = style.cyan("━".repeat(filled)) + style.dim("─".repeat(empty));

		const densityLabel = `${this.density[0].toUpperCase()}${this.density.slice(1)}`;
		const densityPill = style.activePill(` ${densityLabel} `);
		const rightHints = `${densityPill} ${style.borderBlue("│")} ${style.dim("/cockpit ? for help")}`;

		const leftContent = `${agentText} ${style.borderBlue("│")} ${stepsText}   ${bar}`;
		const leftLen = visibleWidth(leftContent);
		const rightLen = visibleWidth(rightHints);

		if (leftLen + rightLen + 2 <= safeWidth) {
			const space = " ".repeat(Math.max(1, safeWidth - leftLen - rightLen));
			return [`${leftContent}${space}${rightHints}`];
		}
		return [truncateToWidth(`${agentText} | ${stepsText} | [${densityLabel}]`, safeWidth)];
	}

	// ==========================================
	// 9. LAYOUT GLOBAL RESPONSIVO (Full Cockpit)
	// ==========================================
	public renderFullCockpit(termWidth: number, termHeight?: number): string[] {
		const width = Math.max(20, termWidth);
		const height = termHeight ?? (typeof process !== "undefined" && process.stdout?.rows ? process.stdout.rows : 35);

		const effectiveDensity = this.resolveEffectiveDensity(width, height);
		if (effectiveDensity === "compact") {
			return this.renderCompact(width);
		}

		const compactHeight = this.config.autoHeight && height <= 26;
		const streamLines =
			this.config.eventStreamLines > 0
				? compactHeight
					? Math.min(2, this.config.eventStreamLines)
					: this.config.eventStreamLines
				: 0;

		const sidebarInfo = this.resolveSidebarWidth(width);

		if (!sidebarInfo.show) {
			const lines: string[] = [];

			if (width >= 60) {
				lines.push(...this.renderCardsRow(width));
			} else {
				lines.push(...this.renderMissionCard(width));
				lines.push(...this.renderChangesCard(width));
				lines.push(...this.renderChecksCard(width));
			}

			if (streamLines > 0) {
				lines.push(...this.renderEventStream(width, streamLines));
			}

			if (this.config.showShortcuts && width >= 40) {
				lines.push(...this.renderShortcutBar(width));
			}

			if (!compactHeight && width >= 45) {
				const lowerLines = this.renderLowerPanelsRow(width);
				if (lowerLines.length > 0) {
					lines.push(...lowerLines);
				}
			}

			lines.push(...this.renderBottomStatus(width));
			return lines;
		}

		const sidebarW = sidebarInfo.width;
		const mainW = Math.max(30, width - sidebarW - 2);

		const mainLines: string[] = [];

		if (mainW >= 60) {
			mainLines.push(...this.renderCardsRow(mainW));
		} else {
			mainLines.push(...this.renderMissionCard(mainW));
			mainLines.push(...this.renderChangesCard(mainW));
			mainLines.push(...this.renderChecksCard(mainW));
		}

		if (streamLines > 0) {
			mainLines.push(...this.renderEventStream(mainW, streamLines));
		}

		if (this.config.showShortcuts) {
			mainLines.push(...this.renderShortcutBar(mainW));
		}

		if (!compactHeight) {
			const lowerLines = this.renderLowerPanelsRow(mainW);
			if (lowerLines.length > 0) {
				mainLines.push(...lowerLines);
			}
		}

		const sidebarLines = this.renderSidebar(sidebarW, Math.max(mainLines.length, 21));
		const combinedLines: string[] = [];

		for (let i = 0; i < Math.max(mainLines.length, sidebarLines.length); i++) {
			const sLine = padToWidth(sidebarLines[i] ?? "", sidebarW);
			const mLine = mainLines[i] ?? "";
			combinedLines.push(`${sLine} ${style.borderBlue("│")} ${mLine}`);
		}

		const statusLines = this.renderBottomStatus(width);

		return [...combinedLines, style.borderBlue("─".repeat(width)), ...statusLines];
	}

	// ==========================================
	// 10. COMPACT / STANDARD / ADVANCED (Backward-Compat)
	// ==========================================
	public render(termWidth: number): string[] {
		const width = Math.max(20, termWidth - 2);

		const density = this.config.density === "auto" ? this.resolveEffectiveDensity(width) : this.density;

		if (width <= 35 || density === "compact") {
			return this.renderCompact(width);
		}

		if (density === "standard") {
			return this.renderStandard(width);
		}

		return this.renderAdvanced(width);
	}

	private renderCompact(width: number): string[] {
		const prefix = width > 45 ? style.bold(style.cyan("OMSK / COCKPIT")) : style.bold(style.cyan("OMSK"));
		const missionStr = style.muted(`[${this.mission.id}]`);
		const diffStr = style.success(`+${this.changes.totalAdded}`) + " " + style.error(`-${this.changes.totalRemoved}`);
		const checksStr = style.dim(`${this.passedChecks}/${this.totalChecks}`);

		if (width <= 30) {
			const line = `${prefix} │ ${diffStr} │ ${checksStr}`;
			return [truncateToWidth(line, width)];
		}

		const line = `${prefix} │ ${missionStr} ${truncateToWidth(this.mission.title, 20)} │ ${diffStr} │ ${checksStr}`;
		return [truncateToWidth(line, width)];
	}

	private renderStandard(width: number): string[] {
		const innerWidth = Math.max(10, width - 2);
		const borderHoriz = "─".repeat(innerWidth);
		const title = ` Workspace: ${this.workspaceName} `;
		const bannerPrefix = `╭─ OMSK / DEEP SEA COMMAND ─`;
		const topBorder =
			bannerPrefix.length + title.length < innerWidth
				? style.cyan(
						`${bannerPrefix}─${title}${"─".repeat(Math.max(0, innerWidth - bannerPrefix.length - title.length - 1))}╮`,
					)
				: style.cyan(`╭─ OMSK / DEEP SEA COMMAND ${borderHoriz.slice(26)}╮`);

		const bottom = style.cyan(`╰${borderHoriz}╯`);

		const missionHeader = style.bold(style.cyan(` MISSION: [${this.mission.id}] `)) + style.muted(this.mission.title);
		const subtaskStr = this.mission.activeSubtask ? ` · ${this.mission.activeSubtask}` : "";
		const phaseInfo = style.dim(`   Status: ${this.mission.phase}${subtaskStr} (${this.mission.progressPercent}%)`);

		const changesInfo =
			style.bold(" CHANGES: ") +
			style.success(`+${this.changes.totalAdded} lines `) +
			style.error(`-${this.changes.totalRemoved} lines `) +
			style.dim(`(${this.changes.modifiedCount} files, ${this.changes.checkpointsCount} ckpts)`);

		const checksInfo =
			style.bold(" CHECKS: ") +
			(this.totalChecks === 0
				? style.dim("None pending")
				: this.passedChecks === this.totalChecks
					? style.success(`✔ ${this.passedChecks}/${this.totalChecks} passed`)
					: style.warning(`▲ ${this.passedChecks}/${this.totalChecks} passing`));

		return [
			topBorder,
			truncateToWidth(`│ ${missionHeader}`, width - 1) + "│",
			truncateToWidth(`│ ${phaseInfo}`, width - 1) + "│",
			truncateToWidth(`│ ${changesInfo}`, width - 1) + "│",
			truncateToWidth(`│ ${checksInfo}`, width - 1) + "│",
			bottom,
		];
	}

	private renderAdvanced(width: number): string[] {
		const standardLines = this.renderStandard(width);
		const lines = standardLines.slice(0, standardLines.length - 1);

		const streamHeader = style.bold(style.cyan(" LIVE EVENT STREAM & PROVENANCE:"));
		lines.push(truncateToWidth(`│ ${streamHeader}`, width - 1) + "│");

		if (this.events.length === 0) {
			lines.push(truncateToWidth(`│   ${style.dim("No events recorded yet")}`, width - 1) + "│");
		} else {
			for (const ev of this.events.slice(0, 4)) {
				const time = style.dim(`[${ev.timestamp}]`);
				const badge =
					ev.type === "edit"
						? style.success("EDIT")
						: ev.type === "test"
							? style.blue("TEST")
							: ev.type === "checkpoint"
								? style.warning("CKPT")
								: ev.type === "error"
									? style.error("ERR!")
									: style.dim("TOOL");
				const detail = ev.detail ? ` - ${style.dim(ev.detail)}` : "";
				const evLine = `│   ${time} ${badge} ${style.muted(ev.label)}${detail}`;
				lines.push(truncateToWidth(evLine, width - 1) + "│");
			}
		}

		const shortcutLabels = Array.from(this.shortcuts.values())
			.slice(0, 4)
			.map(s => `[${s.key}] ${s.label}`)
			.join("  ");
		const hotkeys = style.dim(` ${shortcutLabels} `);
		lines.push(truncateToWidth(`│ ${hotkeys}`, width - 1) + "│");
		lines.push(style.cyan(`╰${"─".repeat(Math.max(10, width - 2))}╯`));

		return lines;
	}
}
export function syncCockpitFromSettings(cockpit: DeepSeaCockpit): void {
	cockpit.setConfig({
		density: getSettingSafe("cockpit.density", DEFAULT_COCKPIT_CONFIG.density),
		sidebar: getSettingSafe("cockpit.sidebar", DEFAULT_COCKPIT_CONFIG.sidebar),
		eventStreamLines: getSettingSafe("cockpit.eventStreamLines", DEFAULT_COCKPIT_CONFIG.eventStreamLines),
		showTips: getSettingSafe("cockpit.showTips", DEFAULT_COCKPIT_CONFIG.showTips),
		showMemoryGraph: getSettingSafe("cockpit.showMemoryGraph", DEFAULT_COCKPIT_CONFIG.showMemoryGraph),
		showRecentFiles: getSettingSafe("cockpit.showRecentFiles", DEFAULT_COCKPIT_CONFIG.showRecentFiles),
		showProgress: getSettingSafe("cockpit.showProgress", DEFAULT_COCKPIT_CONFIG.showProgress),
		showShortcuts: getSettingSafe("cockpit.showShortcuts", DEFAULT_COCKPIT_CONFIG.showShortcuts),
		autoHeight: getSettingSafe("cockpit.autoHeight", DEFAULT_COCKPIT_CONFIG.autoHeight),
	});
}

let activeCockpit: DeepSeaCockpit | null = null;

export function getDeepSeaCockpit(options?: DeepSeaCockpitOptions): DeepSeaCockpit {
	if (!activeCockpit || options) {
		activeCockpit = new DeepSeaCockpit(options);
	}
	syncCockpitFromSettings(activeCockpit);
	return activeCockpit;
}

export type WelcomeCockpitInput = {
	version: string;
	modelName: string;
	providerName: string;
	recentSessions: Array<{ name: string; timeAgo: string }>;
	lspServers: Array<{ name: string; fileTypes: string[]; status: "connected" | "error" | "connecting" }>;
	termWidth: number;
	termHeight: number;
	layoutMode?: string;
};

let welcomeCockpitRenderer: ((input: WelcomeCockpitInput) => string[]) | null = null;

export function getWelcomeCockpitRenderer(): ((input: WelcomeCockpitInput) => string[]) | null {
	return welcomeCockpitRenderer;
}

/**
 * Registers the OMSK Deep Sea Cockpit renderer.
 */
export function registerWelcomeCockpitRenderer(): void {
	welcomeCockpitRenderer = input => {
		if (!activeCockpit) {
			activeCockpit = new DeepSeaCockpit({
				version: input.version,
				modelName: input.modelName,
				providerName: input.providerName,
				recentSessions: input.recentSessions.map(s => ({ name: s.name, timeAgo: s.timeAgo })),
				lspServers: input.lspServers.map(l => ({
					name: l.name,
					language: l.fileTypes[0] ?? "Code",
					status: l.status,
				})),
			});
		} else {
			activeCockpit.updateMetadata({
				version: input.version,
				modelName: input.modelName,
				providerName: input.providerName,
				recentSessions: input.recentSessions.map(s => ({ name: s.name, timeAgo: s.timeAgo })),
				lspServers: input.lspServers.map(l => ({
					name: l.name,
					language: l.fileTypes[0] ?? "Code",
					status: l.status,
				})),
			});
		}
		syncCockpitFromSettings(activeCockpit);
		const cwd = process.cwd();
		activeCockpit.syncFromWorkspaceGit(cwd);
		try {
			const teiaDbPath = path.join(cwd, ".omsk", "teia.db");
			if (fs.existsSync(teiaDbPath)) {
				activeCockpit.syncFromMenteEmTeia(getMenteEmTeiaStore());
			}
		} catch {
			// Skip memory graph sync if store cannot be opened read-only
		}
		if (input.layoutMode === "compact") {
			activeCockpit.setDensity("compact");
			return activeCockpit.render(input.termWidth);
		}
		return activeCockpit.renderFullCockpit(input.termWidth, input.termHeight);
	};
}
