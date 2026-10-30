/**
 * Deep Sea Command Cockpit TUI Component for Oh My Shark (OMSK).
 * Reinvents the terminal interface from a flat chat log into an interactive engineering cockpit:
 * - Active Mission Tracking (task status, phase progression)
 * - Changes & Checkpoint Monitor (+/- lines, rollback availability)
 * - Validation & Checks Guard (LSP, compiler, tests)
 * - Real-time Event Stream
 * - Three adaptive densities: "compact", "standard", "advanced"
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
}

export interface CockpitEventItem {
	timestamp: string;
	label: string;
	detail?: string;
	type: "edit" | "test" | "checkpoint" | "tool" | "error";
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

function stripAnsi(text: string): string {
	return text.replace(ANSI_REGEX, "");
}

function visibleWidth(text: string): number {
	return stripAnsi(text).length;
}

function truncateToWidth(text: string, maxWidth: number): string {
	if (visibleWidth(text) <= maxWidth) {
		return text;
	}
	const plain = stripAnsi(text);
	if (plain.length <= maxWidth) {
		return text;
	}
	return plain.slice(0, Math.max(0, maxWidth - 1)) + "…";
}

// Fallback styling helpers if theme isn't fully loaded
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

	constructor(options: DeepSeaCockpitOptions = {}) {
		this.density = options.density ?? "standard";
		this.workspaceName = options.workspaceName ?? "OMSK Workspace";
		this.mission = options.mission ?? {
			id: "MISSION-01",
			title: "Adaptive Engineering & Execution",
			phase: "Phase 1 of 1 · Active",
			progressPercent: 100,
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
	}

	public setDensity(density: CockpitDensity): void {
		this.density = density;
	}

	public updateChanges(summary: ChangesSummary): void {
		this.changes = summary;
	}

	public updateMission(mission: ActiveMissionInfo): void {
		this.mission = mission;
	}

	public updateChecks(passed: number, total: number): void {
		this.passedChecks = passed;
		this.totalChecks = total;
	}

	public pushEvent(event: CockpitEventItem): void {
		this.events.unshift(event);
		if (this.events.length > 8) {
			this.events.pop();
		}
	}

	public render(termWidth: number): string[] {
		const width = Math.max(30, termWidth - 2);

		if (this.density === "compact") {
			return this.renderCompact(width);
		}

		if (this.density === "standard") {
			return this.renderStandard(width);
		}

		return this.renderAdvanced(width);
	}

	private renderCompact(width: number): string[] {
		const prefix = style.bold(style.accent("OMSK / COCKPIT"));
		const missionStr = style.muted(`[${this.mission.id}] ${this.mission.title}`);
		const diffStr = style.success(`+${this.changes.totalAdded}`) + " " + style.error(`-${this.changes.totalRemoved}`);
		const checksStr = style.dim(`Checks: ${this.passedChecks}/${this.totalChecks}`);

		const line = `${prefix} │ ${missionStr} │ ${diffStr} │ ${checksStr}`;
		return [truncateToWidth(line, width)];
	}

	private renderStandard(width: number): string[] {
		const borderHoriz = "─".repeat(Math.max(10, width - 2));
		const top = style.accent(`╭─ OMSK / DEEP SEA COMMAND ── Workspace: ${this.workspaceName} ${borderHoriz.slice(35)}╮`);
		const bottom = style.accent(`╰${borderHoriz}╯`);

		const missionHeader = style.bold(style.accent(` MISSION: [${this.mission.id}] `)) + style.muted(this.mission.title);
		const phaseInfo = style.dim(`   Status: ${this.mission.phase} (${this.mission.progressPercent}%)`);
		
		const changesInfo = style.bold(" CHANGES: ") +
			style.success(`+${this.changes.totalAdded} lines `) +
			style.error(`-${this.changes.totalRemoved} lines `) +
			style.dim(`(${this.changes.modifiedCount} files, ${this.changes.checkpointsCount} checkpoints)`);

		const checksInfo = style.bold(" CHECKS: ") +
			(this.totalChecks === 0
				? style.dim("None pending")
				: this.passedChecks === this.totalChecks
					? style.success(`✔ ${this.passedChecks}/${this.totalChecks} passed`)
					: style.warning(`▲ ${this.passedChecks}/${this.totalChecks} passing`));

		return [
			top,
			truncateToWidth(`│ ${missionHeader}`, width - 1) + "│",
			truncateToWidth(`│ ${phaseInfo}`, width - 1) + "│",
			truncateToWidth(`│ ${changesInfo}`, width - 1) + "│",
			truncateToWidth(`│ ${checksInfo}`, width - 1) + "│",
			bottom,
		];
	}

	private renderAdvanced(width: number): string[] {
		const standardLines = this.renderStandard(width);
		// Remove bottom border to append live event stream
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
							: style.dim("EVNT");
				const detail = ev.detail ? ` - ${style.dim(ev.detail)}` : "";
				const evLine = `│   ${time} ${badge} ${style.muted(ev.label)}${detail}`;
				lines.push(truncateToWidth(evLine, width - 1) + "│");
			}
		}

		const hotkeys = style.dim(" [Ctrl+P] Commands  [Ctrl+J] Tasks  [Ctrl+D] Diff  [Ctrl+L] Events ");
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
