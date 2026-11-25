import { Activity, Cpu, Lock, RefreshCw, Sliders } from "lucide-react";
import type { RpcSharkEventRecord, RpcSharkStatusSnapshot } from "../../../shared/rpc-types";
import { cx, formatClock } from "../../lib/format";
import { Badge, Button, ProgressBar } from "../common";
import { SwitchTrack } from "../common/SwitchTrack";

const DENSITY_OPTIONS = ["auto", "compact", "standard", "advanced"] as const;
const SIDEBAR_MODES = ["auto", "visible", "collapsed", "hidden"] as const;

const LAYOUT_TOGGLES = [
	{ key: "showTips", label: "Show tactical tips" },
	{ key: "showMemoryGraph", label: "Show Mente em Teia summary" },
	{ key: "showRecentFiles", label: "Show recent modified files" },
	{ key: "showProgress", label: "Show active mission progress" },
	{ key: "showShortcuts", label: "Show cockpit shortcuts" },
	{ key: "autoHeight", label: "Auto-size cockpit height" },
] as const;

export interface SharkCockpitTabProps {
	status: RpcSharkStatusSnapshot | null;
	events: RpcSharkEventRecord[];
	cockpitConfig: Record<string, unknown>;
	loading: boolean;
	onRefreshEvents: () => Promise<void>;
	onUpdateConfig: (patch: Record<string, unknown>) => Promise<void>;
}

export function SharkCockpitTab({
	status,
	events,
	cockpitConfig,
	loading,
	onRefreshEvents,
	onUpdateConfig,
}: SharkCockpitTabProps) {
	const currentDensity = typeof cockpitConfig.density === "string" ? cockpitConfig.density : "auto";
	const currentSidebar = typeof cockpitConfig.sidebar === "string" ? cockpitConfig.sidebar : "auto";
	const streamLines = typeof cockpitConfig.eventStreamLines === "number" ? cockpitConfig.eventStreamLines : 6;
	const mission = status?.cockpit.mission;

	return (
		<div className="space-y-4">
			{/* Kernel & Runtime Telemetry Strip */}
			<div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
				<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3">
					<div className="text-omsk-xxs font-semibold uppercase tracking-wide text-[var(--omsk-dim)]">
						Session & FSM State
					</div>
					<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
						<Badge variant="info" dot pulse>
							{status?.kernel.sessionState ?? "ready"}
						</Badge>
						<Badge variant="default">{status?.execution.fsmState ?? "IDLE"}</Badge>
					</div>
				</div>
				<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3">
					<div className="text-omsk-xxs font-semibold uppercase tracking-wide text-[var(--omsk-dim)]">
						Event Bus & Checks
					</div>
					<div className="mt-1.5 flex items-baseline gap-2">
						<span className="font-mono text-omsk-lg font-semibold text-[var(--omsk-text)] tabular-nums">
							{status?.kernel.eventCount ?? events.length}
						</span>
						<span className="text-omsk-xs text-[var(--omsk-muted)]">
							events · {status?.cockpit.passedChecks ?? 0}/{status?.cockpit.totalChecks ?? 0} checks
						</span>
					</div>
				</div>
				<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3">
					<div className="text-omsk-xxs font-semibold uppercase tracking-wide text-[var(--omsk-dim)]">
						Project Intelligence
					</div>
					<div className="mt-1.5 flex items-baseline gap-2">
						<span className="font-mono text-omsk-lg font-semibold text-[var(--omsk-text)] tabular-nums">
							{status?.intelligence.graphNodes ?? 0}
						</span>
						<span className="text-omsk-xs text-[var(--omsk-muted)]">
							nodes · {status?.intelligence.cachedFiles ?? 0} cached
						</span>
					</div>
				</div>
				<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3">
					<div className="text-omsk-xxs font-semibold uppercase tracking-wide text-[var(--omsk-dim)]">
						Layout & Capabilities
					</div>
					<div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-omsk-xs text-[var(--omsk-text-secondary)]">
						<Badge variant="default">{status?.layout.preset ?? "default"}</Badge>
						<span>{status?.capabilities.count ?? 0} caps</span>
					</div>
				</div>
			</div>

			{/* Active Mission */}
			{mission && (
				<div className="rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Cpu size={14} className="text-[var(--omsk-accent)]" />
							<span className="text-omsk-sm font-semibold text-[var(--omsk-text)]">{mission.title}</span>
							<Badge variant={mission.status === "failed" ? "error" : "info"}>{mission.phase}</Badge>
						</div>
						<span className="font-mono text-omsk-xs text-[var(--omsk-muted)] tabular-nums">
							{mission.progressPercent}%
						</span>
					</div>
					<ProgressBar value={mission.progressPercent} />
					{mission.activeSubtask && (
						<div className="mt-1.5 text-omsk-xs text-[var(--omsk-muted)]">{mission.activeSubtask}</div>
					)}
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Permissions & Deep Sea Cockpit Persistence */}
				<div className="space-y-4">
					<section className="rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
						<h3 className="mb-2.5 flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
							<Lock size={14} className="text-[var(--omsk-accent)]" />
							Granted Kernel Permissions
						</h3>
						{status && status.kernel.permissions.length > 0 ? (
							<div className="flex flex-wrap gap-1.5">
								{status.kernel.permissions.map(perm => (
									<Badge key={perm} variant="success">
										{perm}
									</Badge>
								))}
							</div>
						) : (
							<div className="text-omsk-xs text-[var(--omsk-dim)]">No active permissions reported yet.</div>
						)}
					</section>

					<section className="space-y-3 rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
						<h3 className="flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
							<Sliders size={14} className="text-[var(--omsk-accent)]" />
							Deep Sea Cockpit Configuration
						</h3>

						<div>
							<div className="mb-1.5 text-omsk-xs font-medium text-[var(--omsk-text-secondary)]">
								Density Mode
							</div>
							<div className="flex flex-wrap gap-1.5">
								{DENSITY_OPTIONS.map(density => (
									<button
										key={density}
										type="button"
										aria-pressed={currentDensity === density}
										onClick={() => void onUpdateConfig({ density })}
										className={cx(
											"omsk-pressable rounded-lg border px-2.5 py-1 text-omsk-xs font-medium",
											currentDensity === density
												? "border-[var(--omsk-border-accent)] bg-[var(--omsk-accent-dim)] text-[var(--omsk-accent)]"
												: "border-[var(--omsk-border-muted)] text-[var(--omsk-muted)] hover:text-[var(--omsk-text)]",
										)}
									>
										{density}
									</button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<label className="block">
								<span className="mb-1 block text-omsk-xs font-medium text-[var(--omsk-text-secondary)]">
									Sidebar Mode
								</span>
								<select
									value={currentSidebar}
									onChange={e => void onUpdateConfig({ sidebar: e.target.value })}
									className="w-full rounded-lg border border-[var(--omsk-input-border)] bg-[var(--omsk-input-bg)] px-2.5 py-1.5 text-omsk-sm text-[var(--omsk-text)]"
								>
									{SIDEBAR_MODES.map(mode => (
										<option key={mode} value={mode}>
											{mode}
										</option>
									))}
								</select>
							</label>
							<label className="block">
								<span className="mb-1 block text-omsk-xs font-medium text-[var(--omsk-text-secondary)]">
									Event Stream Lines (0–16)
								</span>
								<input
									type="number"
									min={0}
									max={16}
									value={streamLines}
									onChange={e =>
										void onUpdateConfig({
											eventStreamLines: Math.max(0, Math.min(16, Number(e.target.value) || 0)),
										})
									}
									className="w-full rounded-lg border border-[var(--omsk-input-border)] bg-[var(--omsk-input-bg)] px-2.5 py-1.5 text-omsk-sm text-[var(--omsk-text)]"
								/>
							</label>
						</div>

						<div className="space-y-1.5 pt-1">
							{LAYOUT_TOGGLES.map(item => {
								const enabled = cockpitConfig[item.key] !== false;
								return (
									<button
										key={item.key}
										type="button"
										role="switch"
										aria-checked={enabled}
										onClick={() => void onUpdateConfig({ [item.key]: !enabled })}
										className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--omsk-border-muted)] px-2.5 py-1.5 text-left text-omsk-xs text-[var(--omsk-text-secondary)] hover:border-[var(--omsk-border)]"
									>
										<span>{item.label}</span>
										<SwitchTrack on={enabled} />
									</button>
								);
							})}
						</div>
					</section>
				</div>

				{/* Live SharkEventBus Stream */}
				<section className="flex min-h-0 flex-col rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
					<div className="mb-2.5 flex items-center justify-between gap-2">
						<h3 className="flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
							<Activity size={14} className="text-[var(--omsk-accent)]" />
							Live SharkEventBus Stream ({events.length})
						</h3>
						<Button
							size="sm"
							variant="secondary"
							loading={loading}
							icon={<RefreshCw size={12} />}
							onClick={() => void onRefreshEvents()}
						>
							Refresh
						</Button>
					</div>

					{events.length === 0 ? (
						<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--omsk-border-muted)] p-6 text-omsk-xs text-[var(--omsk-dim)]">
							No kernel bus events recorded yet.
						</div>
					) : (
						<div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1 font-mono text-omsk-xs">
							{[...events].reverse().map((evt, index) => (
								<div
									key={`${evt.timestamp}-${evt.type}-${index}`}
									className="rounded-lg border border-[var(--omsk-border-muted)] bg-[var(--omsk-code-bg)] p-2"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="font-semibold text-[var(--omsk-accent)]">{evt.type}</span>
										<span className="text-omsk-xxs text-[var(--omsk-dim)]">
											{formatClock(new Date(evt.timestamp).toISOString())}
										</span>
									</div>
									{Object.keys(evt.details).length > 0 && (
										<pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-omsk-xxs text-[var(--omsk-text-secondary)]">
											{JSON.stringify(evt.details)}
										</pre>
									)}
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
