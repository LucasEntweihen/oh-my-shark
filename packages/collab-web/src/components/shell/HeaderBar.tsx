import { LogOut, PanelRight, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import type { GuestSnapshot } from "../../lib/client";
import { fmtPercent, shortenPath } from "../../lib/format";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderBarProps {
	snapshot: GuestSnapshot;
	subCount: number;
	railOpen: boolean;
	sharkOpen?: boolean;
	ttsEnabled?: boolean;
	onToggleRail(): void;
	onToggleShark?(): void;
	onToggleTts?(): void;
	onLeave(): void;
}
export function HeaderBar({
	snapshot,
	subCount,
	railOpen,
	sharkOpen,
	ttsEnabled,
	onToggleRail,
	onToggleShark,
	onToggleTts,
	onLeave,
}: HeaderBarProps): ReactNode {
	const { header, state, phase, readOnly } = snapshot;
	const title = header?.title ?? state?.sessionName ?? "session";
	const usage = state?.contextUsage;
	let pct: number | null = null;
	if (usage) {
		pct =
			usage.percent ??
			(usage.tokens != null && usage.contextWindow !== null && usage.contextWindow > 0
				? (usage.tokens / usage.contextWindow) * 100
				: null);
	}

	return (
		<header className="sh-header">
			<div className="sh-header-left">
				<span className="sh-title" title={title}>
					{title}
				</span>
				{state?.cwd && (
					<span className="sh-cwd" title={state.cwd}>
						{shortenPath(state.cwd)}
					</span>
				)}
			</div>
			<div className="sh-header-right">
				{readOnly && (
					<span className="sh-chip" title="you joined with a read-only link — watching only">
						read-only
					</span>
				)}
				{state?.model && <span className="sh-chip sh-chip-meta">{state.model.name}</span>}
				{state?.thinkingLevel && <span className="sh-chip sh-chip-meta">{state.thinkingLevel}</span>}
				{pct != null && (
					<span
						className={pct > 80 ? "sh-gauge sh-gauge-warn" : "sh-gauge"}
						title={`context · ${fmtPercent(pct)}`}
					>
						<span className="sh-gauge-track">
							<span className="sh-gauge-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
						</span>
						<span className="sh-gauge-pct">{fmtPercent(pct)}</span>
					</span>
				)}
				{state && state.participants.length > 0 && (
					<span className="sh-avatars">
						{state.participants.map((p, i) => (
							<span
								key={`${p.name}:${i}`}
								className={p.role === "host" ? "sh-avatar sh-avatar-host" : "sh-avatar"}
								title={`${p.name} · ${p.role}${p.readOnly ? " · view-only" : ""}`}
							>
								{(p.name[0] ?? "?").toUpperCase()}
							</span>
						))}
					</span>
				)}
				<span className={`sh-dot sh-dot-${phase}`} title={phase} />
				{onToggleTts && (
					<button
						type="button"
						className={ttsEnabled ? "sh-btn sh-btn-icon sh-btn-on" : "sh-btn sh-btn-icon"}
						onClick={onToggleTts}
						title={ttsEnabled ? "Voz / TTS Ativo" : "Ativar Voz / TTS"}
					>
						{ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
					</button>
				)}
				{onToggleShark && (
					<button
						type="button"
						className={sharkOpen ? "sh-btn sh-btn-icon sh-btn-on" : "sh-btn sh-btn-icon"}
						onClick={onToggleShark}
						title={sharkOpen ? "Ocultar Tubarão 3D" : "Mostrar Tubarão 3D"}
					>
						🦈
					</button>
				)}
				<ThemeToggle />
				<button
					type="button"
					className={railOpen ? "sh-btn sh-btn-icon sh-btn-on" : "sh-btn sh-btn-icon"}
					onClick={onToggleRail}
					title={railOpen ? "hide agents" : "show agents"}
				>
					<PanelRight size={14} />
					{subCount > 0 && <span className="sh-badge">{subCount}</span>}
				</button>
				<button type="button" className="sh-btn sh-btn-icon" onClick={onLeave} title="leave session">
					<LogOut size={14} />
				</button>
			</div>
		</header>
	);
}
