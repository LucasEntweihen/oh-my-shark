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
import { truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui";
import type { ChangesSummary, FileChangeDiff } from "../edit/transactional-engine";
export type CockpitDensity = "compact" | "standard" | "advanced";

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
	workspaceName?: string;
	version?: string;
	modelName?: string;
	providerName?: string;
	mission?: ActiveMissionInfo;
	changes?: ChangesSummary;
	passedChecks?: number;
	totalChecks?: number;
	recentEvents?: CockpitEventItem[];
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

function padToWidth(text: string, targetWidth: number): string {
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
	private workspaceName: string;
	private version: string;
	private modelName: string;
	private providerName: string;
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
		this.density = options.density ?? "advanced";
		this.workspaceName = options.workspaceName ?? "OMSK Workspace";
		this.version = options.version ?? "0.0.45";
		this.modelName = options.modelName ?? "gemini-2.5-pro";
		this.providerName = options.providerName ?? "Google";
		this.mission = options.mission ?? {
			id: "042",
			title: "Refactor authentication flow",
			phase: "Phase 2 · Active",
			progressPercent: 68,
			startTime: Date.now(),
			status: "active",
		};
		this.changes = options.changes ?? {
			totalAdded: 142,
			totalRemoved: 37,
			modifiedCount: 3,
			checkpointsCount: 1,
		};
		this.passedChecks = options.passedChecks ?? 0;
		this.totalChecks = options.totalChecks ?? 0;
		this.events = options.recentEvents ? [...options.recentEvents] : [];
		this.quickTips = options.quickTips ? [...options.quickTips] : [
			"Use [Ctrl+D] to view detailed changes! [NEW]",
			"Deep Sea Cockpit tracks tasks & diffs live.",
		];
		this.recentSessions = options.recentSessions ? [...options.recentSessions] : [
			{ name: "refactor-auth", timeAgo: "2h ago", active: true },
			{ name: "fix-memory-leak", timeAgo: "3h ago" },
			{ name: "add-tests", timeAgo: "1d ago" },
			{ name: "update-docs", timeAgo: "1d ago" },
		];
		this.lspServers = options.lspServers ? [...options.lspServers] : [
			{ name: "tsserver", language: "TypeScript", status: "ready" },
			{ name: "pyright", language: "Python", status: "ready" },
			{ name: "rust-analyzer", language: "Rust", status: "ready" },
		];
		this.activitySteps = options.activitySteps ? [...options.activitySteps] : [
			{ label: "Analyze code", status: "completed" },
			{ label: "Apply changes", status: "completed" },
			{ label: "Run tests...", status: "active" },
			{ label: "Finalize", status: "pending" },
		];
		this.recentFiles = options.recentFiles ? [...options.recentFiles] : [
			{ path: "auth.service.ts", linesAdded: 42, linesRemoved: 12 },
			{ path: "auth.controller.ts", linesAdded: 28, linesRemoved: 8 },
			{ path: "auth.spec.ts", linesAdded: 72, linesRemoved: 17 },
		];
		this.memoryGraph = options.memoryGraph ?? {
			nodes: [
				{ id: "1", label: "auth.service.ts", kind: "file" },
				{ id: "2", label: "AuthFlow", kind: "symbol" },
				{ id: "3", label: "Tests", kind: "test" },
				{ id: "4", label: "Security", kind: "decision" },
				{ id: "5", label: "Decision: Use JWT", kind: "decision" },
			],
			edges: [
				{ source: "1", target: "2" },
				{ source: "3", target: "2" },
				{ source: "4", target: "2" },
				{ source: "5", target: "2" },
			],
		};
		this.agentStatus = options.agentStatus ?? "Working...";
		this.completedSteps = options.completedSteps ?? 3;
		this.totalSteps = options.totalSteps ?? 4;

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

	public setDensity(density: CockpitDensity): void {
		this.density = density;
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

	public async syncFromEditEngine(engine: {
		getChangesSummary(): Promise<ChangesSummary>;
		getDetailedDiff?(): Promise<FileChangeDiff[]>;
	}): Promise<void> {
		const summary = await engine.getChangesSummary();
		this.updateChanges(summary);

		if (typeof engine.getDetailedDiff === "function") {
			try {
				const diffs = await engine.getDetailedDiff();
				this.recentFiles = diffs.map((d) => ({
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
					nodes: snapshot.nodes.map((n) => ({ id: n.id, label: n.name, kind: n.kind })),
					edges: snapshot.edges.map((e) => ({ source: e.sourceId, target: e.targetId, label: e.relation })),
				};
			} catch {
				// Fallback
			}
		}
	}

	// ==========================================
	// 1. HEADER SUPERIOR
	// ==========================================
	public renderHeader(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const sharkIcon = style.cyan("🦈 [SHARK]");
		const brand = `${sharkIcon} ${style.bold(style.white("Oh My Shark"))} ${style.dim(`v${this.version}`)}`;
		const cockpitTitle = style.cyan(style.bold("Deep Sea Cockpit"));

		const now = new Date();
		const timeStr = now.toTimeString().split(" ")[0];
		const statusDot = style.success("●");
		const rightInfo = `${statusDot} ${style.dim("Model:")} ${style.cyan(this.modelName)} ${style.borderBlue("│")} ${style.dim("Provider:")} ${style.white(this.providerName)} ${style.borderBlue("│")} ${style.dim(timeStr)}`;

		const leftContent = `${brand}   ${cockpitTitle}`;
		const leftLen = visibleWidth(leftContent);
		const rightLen = visibleWidth(rightInfo);

		let headerLine = "";
		if (leftLen + rightLen + 4 <= safeWidth) {
			const space = " ".repeat(Math.max(1, safeWidth - leftLen - rightLen));
			headerLine = `${leftContent}${space}${rightInfo}`;
		} else {
			headerLine = truncateToWidth(`${brand}  ${cockpitTitle} | ${this.modelName}`, safeWidth);
		}

		const divider = style.borderBlue("─".repeat(safeWidth));
		return [headerLine, divider];
	}

	// ==========================================
	// 2. SIDEBAR LATERAL
	// ==========================================
	public renderSidebar(width: number, height: number = 25): string[] {
		const w = Math.max(15, width);
		const lines: string[] = [];

		// Pixel Art Shark Logo (faithful to Image #1)
		lines.push(padToWidth(style.cyan("         ▄████▄   ▄"), w));
		lines.push(padToWidth(style.cyan("       ▄████████▄██"), w));
		lines.push(padToWidth(style.blue("      █████████████"), w));
		lines.push(padToWidth(style.blue("     █████") + style.white("▲▲▲▲") + style.blue("▀▀▀▀"), w));
		lines.push(padToWidth(style.blue("    ███████▀") + style.cyan("  ▄███▄"), w));
		lines.push(padToWidth(style.blue("    ████████▄ ") + style.cyan(" ▀███"), w));
		lines.push(padToWidth(style.blue("     ▀█████████▄"), w));
		lines.push(padToWidth(style.cyan("       ▀▀███████▄"), w));

		// Wordmark & Tagline
		lines.push(padToWidth(style.bold(style.cyan("OMSK")), w));
		lines.push(padToWidth(style.dim("Code. Plan. Build. Repeat."), w));
		lines.push(padToWidth(style.borderBlue("─".repeat(w - 2)), w));

		// Quick Tips
		lines.push(padToWidth(style.yellow("💡 Quick Tips:"), w));
		const tip = this.quickTips[0] ?? "Use [Ctrl+D] to view detailed changes! [NEW]";
		const tipParts = tip.split(" [NEW]");
		const tipBody = tipParts[0];
		const hasNew = tip.includes("[NEW]");
		const tipFormatted = hasNew
			? `${tipBody} ${style.warning(style.bold("[NEW]"))}`
			: tipBody;

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

		// Recent Sessions
		lines.push(padToWidth(style.cyan("🕒 Recent Sessions:"), w));
		for (const session of this.recentSessions.slice(0, 4)) {
			const activeIcon = session.active ? style.cyan("⊕") : style.dim("○");
			const name = truncateToWidth(session.name, Math.max(5, w - 12));
			const time = style.dim(session.timeAgo);
			lines.push(padToWidth(`${activeIcon} ${name} ${time}`, w));
		}
		lines.push(padToWidth(style.borderBlue("─".repeat(w - 2)), w));

		// LSP Servers
		lines.push(padToWidth(style.cyan("🧩 LSP Servers:"), w));
		for (const server of this.lspServers.slice(0, 3)) {
			const dot = server.status === "ready"
				? style.success("●")
				: server.status === "connecting"
					? style.warning("●")
					: server.status === "error"
						? style.error("●")
						: style.dim("●");
			const text = `${dot} ${server.name} ${style.dim(`(${server.language})`)}`;
			lines.push(padToWidth(truncateToWidth(text, w - 2), w));
		}

		while (lines.length < height) {
			lines.push(" ".repeat(w));
		}

		return lines.slice(0, height);
	}

	// ==========================================
	// 3. TOP TITLE BAR & DENSITY SELECTOR
	// ==========================================
	public renderTopTitleBar(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const diamond = style.cyan("◆");
		const title = `${diamond} ${style.bold(style.cyan("Deep Sea Cockpit"))} ${style.dim("—")} ${style.white(`Task #${this.mission.id}`)}`;

		const compactPill = this.density === "compact"
			? style.activePill(" Compact ")
			: style.dim("Compact");
		const standardPill = this.density === "standard"
			? style.activePill(" Standard ")
			: style.dim("Standard");
		const advancedPill = this.density === "advanced"
			? style.activePill(" Advanced ")
			: style.dim("Advanced");

		const densityPills = `${style.borderBlue("╭")} ${compactPill} ${style.borderBlue("│")} ${standardPill} ${style.borderBlue("│")} ${advancedPill} ${style.borderBlue("╯")}`;

		const leftLen = visibleWidth(title);
		const rightLen = visibleWidth(densityPills);

		if (leftLen + rightLen + 2 <= safeWidth) {
			const space = " ".repeat(Math.max(1, safeWidth - leftLen - rightLen));
			return [`${title}${space}${densityPills}`];
		}
		return [truncateToWidth(`${title}  [${this.density.toUpperCase()}]`, safeWidth)];
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
		const progressBar = style.cyan("━".repeat(filledChars)) + style.dim("─".repeat(emptyChars)) + ` ${style.cyan(`${this.mission.progressPercent}%`)}`;

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
		const ckptLabel = this.changes.checkpointsCount === 1 ? "1 checkpoint" : `${this.changes.checkpointsCount} checkpoints`;
		const summary = style.dim(`(${this.changes.modifiedCount} files, ${ckptLabel})`);

		return [
			borderTop,
			style.borderBlue("│") + padToWidth(` ${header}`, innerW) + style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(` ${linesDiff}`, innerW) + style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(innerW >= visibleWidth(summary) + 1 ? ` ${summary}` : summary, innerW) + style.borderBlue("│"),
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
			style.borderBlue("│") + padToWidth(innerW >= visibleWidth(statusLine) + 1 ? ` ${statusLine}` : statusLine, innerW) + style.borderBlue("│"),
			style.borderBlue("│") + padToWidth(innerW >= visibleWidth(detailLine) + 1 ? ` ${detailLine}` : detailLine, innerW) + style.borderBlue("│"),
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
		const lines: string[] = [
			borderTop,
			style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │"),
		];

		if (this.events.length === 0) {
			lines.push(style.borderBlue("│ ") + padToWidth(style.dim("No events recorded yet"), innerW) + style.borderBlue(" │"));
		} else {
			const visibleEvents = this.events.slice(0, maxLines);
			for (const ev of visibleEvents) {
				const checkMark = ev.type === "error"
					? style.error("✖")
					: style.success("✔");
				const time = style.dim(ev.timestamp);
				const badge = ev.type === "checkpoint"
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
		const shortcuts = [
			`[Ctrl+P] Commands`,
			`[Ctrl+J] Tasks`,
			`[Ctrl+D] Diff`,
			`[Ctrl+L] Events`,
		];
		const text = shortcuts.map((s) => style.cyan(s)).join("   ");
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
		for (const step of this.activitySteps.slice(0, 4)) {
			const icon = step.status === "completed"
				? style.success("✔")
				: step.status === "active"
					? style.blue("▶")
					: style.dim("○");
			const label = truncateToWidth(step.label, innerW - 12);
			stepRows.push(`${icon} ${label}`);
		}

		const rows: string[] = [
			borderTop,
			style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │"),
		];

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

		const header = style.cyan("Memory Graph");
		const diagram = [
			style.dim("     auth.service.ts"),
			style.borderBlue("            │"),
			`${style.blue("Tests")} ${style.borderBlue("────")} ${style.cyan(style.bold("AuthFlow"))} ${style.borderBlue("────")} ${style.white("Security")}`,
			style.borderBlue("            │"),
			style.yellow("        Decision:"),
			style.dim("         Use JWT"),
		];

		const rows: string[] = [
			borderTop,
			style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │"),
		];

		for (const line of diagram) {
			rows.push(style.borderBlue("│ ") + padToWidth(line, innerW) + style.borderBlue(" │"));
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
		const rows: string[] = [
			borderTop,
			style.borderBlue("│ ") + padToWidth(header, innerW) + style.borderBlue(" │"),
		];

		for (const file of this.recentFiles.slice(0, 4)) {
			const fileIcon = "📄";
			const diff = `${style.success(`+${file.linesAdded}`)} ${style.error(`-${file.linesRemoved}`)}`;
			const prefix = ` ${fileIcon} `;
			const availForPath = Math.max(5, innerW - visibleWidth(diff) - visibleWidth(prefix) - 1);
			const path = visibleWidth(file.path) > availForPath ? truncateToWidth(file.path, availForPath) : file.path;
			const spaceCount = Math.max(1, innerW - visibleWidth(`${prefix}${path}`) - visibleWidth(diff));
			const spacing = " ".repeat(spaceCount);
			const fileLine = `${prefix}${path}${spacing}${diff}`;
			rows.push(style.borderBlue("│") + padToWidth(fileLine, innerW) + style.borderBlue("│"));
		}

		while (rows.length < 8) {
			rows.push(style.borderBlue("│ ") + padToWidth(" ", innerW) + style.borderBlue(" │"));
		}

		rows.push(borderBottom);
		return rows;
	}

	public renderLowerPanelsRow(width: number): string[] {
		const safeWidth = Math.max(40, width);
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

	// ==========================================
	// 8. BARRA INFERIOR DE STATUS
	// ==========================================
	public renderBottomStatus(width: number): string[] {
		const safeWidth = Math.max(20, width);
		const agentDot = style.success("●");
		const agentText = `${agentDot} ${style.bold("Agent:")} ${style.cyan(this.agentStatus)}`;
		const stepsText = `${style.dim(`${this.completedSteps}/${this.totalSteps} steps completed`)}`;

		// Bar in center
		const barBudget = Math.max(6, Math.min(30, Math.floor(safeWidth * 0.3)));
		const filled = Math.round((this.completedSteps / Math.max(1, this.totalSteps)) * barBudget);
		const empty = Math.max(0, barBudget - filled);
		const bar = style.cyan("━".repeat(filled)) + style.dim("─".repeat(empty));

		const rightHints = `${style.dim("Ctrl+C to cancel")} ${style.borderBlue("│")} ${style.dim("ⓘ for help")}`;

		const leftContent = `${agentText} ${style.borderBlue("│")} ${stepsText}   ${bar}`;
		const leftLen = visibleWidth(leftContent);
		const rightLen = visibleWidth(rightHints);

		if (leftLen + rightLen + 2 <= safeWidth) {
			const space = " ".repeat(Math.max(1, safeWidth - leftLen - rightLen));
			return [`${leftContent}${space}${rightHints}`];
		}
		return [truncateToWidth(`${agentText} | ${stepsText} | ${rightHints}`, safeWidth)];
	}

	// ==========================================
	// 9. LAYOUT GLOBAL RESPONSIVO (Full Cockpit)
	// ==========================================
	public renderFullCockpit(termWidth: number, termHeight?: number): string[] {
		const width = Math.max(20, termWidth);

		// Narrow screens (< 75): stacked vertical layout
		if (width < 75) {
			return [
				...this.renderHeader(width),
				...this.renderTopTitleBar(width),
				...this.renderMissionCard(width),
				...this.renderChangesCard(width),
				...this.renderChecksCard(width),
				...this.renderEventStream(width, 3),
				...this.renderBottomStatus(width),
			];
		}

		// Header top
		const headerLines = this.renderHeader(width);

		// Wide screen: Sidebar on left (24% width, max 28), Cockpit on right (76% width)
		const sidebarW = Math.max(20, Math.min(28, Math.floor(width * 0.23)));
		const mainW = width - sidebarW - 2;

		const mainLines: string[] = [
			...this.renderTopTitleBar(mainW),
			...this.renderCardsRow(mainW),
			...this.renderEventStream(mainW, 4),
			...this.renderShortcutBar(mainW),
			...this.renderLowerPanelsRow(mainW),
		];

		const sidebarLines = this.renderSidebar(sidebarW, mainLines.length);
		const combinedLines: string[] = [];

		for (let i = 0; i < mainLines.length; i++) {
			const sLine = padToWidth(sidebarLines[i] ?? "", sidebarW);
			const mLine = mainLines[i] ?? "";
			combinedLines.push(`${sLine} ${style.borderBlue("│")} ${mLine}`);
		}

		const statusLines = this.renderBottomStatus(width);

		return [
			...headerLines,
			...combinedLines,
			style.borderBlue("─".repeat(width)),
			...statusLines,
		];
	}

	// ==========================================
	// 10. COMPACT / STANDARD / ADVANCED (Backward-Compat)
	// ==========================================
	public render(termWidth: number): string[] {
		const width = Math.max(20, termWidth - 2);

		if (width <= 35 || this.density === "compact") {
			return this.renderCompact(width);
		}

		if (this.density === "standard") {
			return this.renderStandard(width);
		}

		return this.renderAdvanced(width);
	}

	private renderCompact(width: number): string[] {
		const prefix = width > 45
			? style.bold(style.cyan("OMSK / COCKPIT"))
			: style.bold(style.cyan("OMSK"));
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
		const topBorder = bannerPrefix.length + title.length < innerWidth
			? style.cyan(`${bannerPrefix}─${title}${"─".repeat(Math.max(0, innerWidth - bannerPrefix.length - title.length - 1))}╮`)
			: style.cyan(`╭─ OMSK / DEEP SEA COMMAND ${borderHoriz.slice(26)}╮`);

		const bottom = style.cyan(`╰${borderHoriz}╯`);

		const missionHeader = style.bold(style.cyan(` MISSION: [${this.mission.id}] `)) + style.muted(this.mission.title);
		const subtaskStr = this.mission.activeSubtask ? ` · ${this.mission.activeSubtask}` : "";
		const phaseInfo = style.dim(`   Status: ${this.mission.phase}${subtaskStr} (${this.mission.progressPercent}%)`);

		const changesInfo = style.bold(" CHANGES: ") +
			style.success(`+${this.changes.totalAdded} lines `) +
			style.error(`-${this.changes.totalRemoved} lines `) +
			style.dim(`(${this.changes.modifiedCount} files, ${this.changes.checkpointsCount} ckpts)`);

		const checksInfo = style.bold(" CHECKS: ") +
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
				const badge = ev.type === "edit"
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
			.map((s) => `[${s.key}] ${s.label}`)
			.join("  ");
		const hotkeys = style.dim(` ${shortcutLabels} `);
		lines.push(truncateToWidth(`│ ${hotkeys}`, width - 1) + "│");
		lines.push(style.cyan(`╰${"─".repeat(Math.max(10, width - 2))}╯`));

		return lines;
	}
}

let activeCockpit: DeepSeaCockpit | null = null;

export function getDeepSeaCockpit(options?: DeepSeaCockpitOptions): DeepSeaCockpit {
	if (!activeCockpit || options) {
		activeCockpit = new DeepSeaCockpit(options);
	}
	return activeCockpit;
}
