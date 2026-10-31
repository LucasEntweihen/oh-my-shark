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
import type { ChangesSummary } from "../edit/transactional-engine";

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
}

export type CockpitEventListener = (event: CockpitEventItem) => void;

export interface ShortcutBinding {
	key: string;
	label: string;
	action: () => void;
}

export interface DeepSeaCockpitOptions {
	density?: CockpitDensity;
	workspaceName?: string;
	mission?: ActiveMissionInfo;
	changes?: ChangesSummary;
	passedChecks?: number;
	totalChecks?: number;
	recentEvents?: CockpitEventItem[];
}

const ANSI_REGEX = /\u001B\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
	return text.replace(ANSI_REGEX, "");
}

export function visibleWidth(text: string): number {
	return stripAnsi(text).length;
}

function truncateToWidth(text: string, maxWidth: number): string {
	if (maxWidth <= 0) return "";
	if (visibleWidth(text) <= maxWidth) {
		return text;
	}
	const plain = stripAnsi(text);
	if (plain.length <= maxWidth) {
		return text;
	}
	return plain.slice(0, Math.max(0, maxWidth - 1)) + "…";
}

const style = {
	bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
	dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
	accent: (s: string) => `\x1b[36m${s}\x1b[39m`,
	success: (s: string) => `\x1b[32m${s}\x1b[39m`,
	warning: (s: string) => `\x1b[33m${s}\x1b[39m`,
	error: (s: string) => `\x1b[31m${s}\x1b[39m`,
	muted: (s: string) => `\x1b[90m${s}\x1b[39m`,
};

export class DeepSeaCockpit {
	private density: CockpitDensity;
	private workspaceName: string;
	private mission: ActiveMissionInfo;
	private changes: ChangesSummary;
	private passedChecks: number;
	private totalChecks: number;
	private events: CockpitEventItem[];
	private eventListeners: Set<CockpitEventListener> = new Set();
	private shortcuts: Map<string, ShortcutBinding> = new Map();

	constructor(options: DeepSeaCockpitOptions = {}) {
		this.density = options.density ?? "standard";
		this.workspaceName = options.workspaceName ?? "OMSK Workspace";
		this.mission = options.mission ?? {
			id: "MISSION-01",
			title: "Adaptive Engineering & Execution",
			phase: "Phase 1 of 1 · Active",
			progressPercent: 100,
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
		this.events = options.recentEvents ?? [];

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

	/**
	 * Subscribes to real-time events published to the cockpit.
	 * Returns an unsubscribe callback.
	 */
	public onEvent(listener: CockpitEventListener): () => void {
		this.eventListeners.add(listener);
		return () => {
			this.eventListeners.delete(listener);
		};
	}

	/**
	 * Emits a real-time event to the cockpit and notifies all active listeners.
	 */
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
		if (this.events.length > 16) {
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

	public async syncFromEditEngine(engine: { getChangesSummary(): Promise<ChangesSummary> }): Promise<void> {
		const summary = await engine.getChangesSummary();
		this.updateChanges(summary);
	}

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
			? style.bold(style.accent("OMSK / COCKPIT"))
			: style.bold(style.accent("OMSK"));
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
			? style.accent(`${bannerPrefix}─${title}${"─".repeat(Math.max(0, innerWidth - bannerPrefix.length - title.length - 1))}╮`)
			: style.accent(`╭─ OMSK / DEEP SEA COMMAND ${borderHoriz.slice(26)}╮`);

		const bottom = style.accent(`╰${borderHoriz}╯`);

		const missionHeader = style.bold(style.accent(` MISSION: [${this.mission.id}] `)) + style.muted(this.mission.title);
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

		const streamHeader = style.bold(style.accent(" LIVE EVENT STREAM & PROVENANCE:"));
		lines.push(truncateToWidth(`│ ${streamHeader}`, width - 1) + "│");

		if (this.events.length === 0) {
			lines.push(truncateToWidth(`│   ${style.dim("No events recorded yet")}`, width - 1) + "│");
		} else {
			for (const ev of this.events.slice(0, 4)) {
				const time = style.dim(`[${ev.timestamp}]`);
				const badge = ev.type === "edit"
					? style.success("EDIT")
					: ev.type === "test"
						? style.accent("TEST")
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
		lines.push(style.accent(`╰${"─".repeat(Math.max(10, width - 2))}╯`));

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
