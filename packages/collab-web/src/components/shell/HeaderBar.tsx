import { LogOut, PanelRight, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import type { GuestSnapshot } from "../../lib/client";
import { fmtPercent } from "../../lib/format";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderBarProps {
	snapshot: GuestSnapshot;
	subCount: number;
	railOpen: boolean;
	sharkOpen?: boolean;
	ttsEnabled?: boolean;
	agencyMode?: "code" | "research" | "bible";
	onSelectAgencyMode?(mode: "code" | "research" | "bible"): void;
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
	agencyMode = "code",
	onSelectAgencyMode,
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
				<span
					className="sh-title"
					title={title}
					style={{ fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)", fontWeight: 700 }}
				>
					🦈 {title}
				</span>
				{/* Agency Mode Selector (DESIGN.md section 3.1) */}
				<div
					style={{
						display: "inline-flex",
						background: "rgba(0,0,0,0.3)",
						borderRadius: "6px",
						padding: "2px",
						border: "1px solid var(--border, #2A3245)",
					}}
				>
					<button
						type="button"
						onClick={() => onSelectAgencyMode?.("code")}
						style={{
							background: agencyMode === "code" ? "var(--neon-cyan, #00F0FF)" : "transparent",
							color: agencyMode === "code" ? "#070B14" : "var(--text-muted, #94A3B8)",
							border: "none",
							borderRadius: "4px",
							fontSize: "0.72rem",
							fontWeight: 600,
							padding: "3px 8px",
							cursor: "pointer",
						}}
					>
						Code Mode
					</button>
					<button
						type="button"
						onClick={() => onSelectAgencyMode?.("research")}
						style={{
							background: agencyMode === "research" ? "var(--abyssal-purple, #8A2BE2)" : "transparent",
							color: agencyMode === "research" ? "#FFFFFF" : "var(--text-muted, #94A3B8)",
							border: "none",
							borderRadius: "4px",
							fontSize: "0.72rem",
							fontWeight: 600,
							padding: "3px 8px",
							cursor: "pointer",
						}}
					>
						Research Mode
					</button>
					<button
						type="button"
						onClick={() => onSelectAgencyMode?.("bible")}
						style={{
							background: agencyMode === "bible" ? "var(--aged-gold, #D4AF37)" : "transparent",
							color: agencyMode === "bible" ? "#000000" : "var(--text-muted, #94A3B8)",
							border: "none",
							borderRadius: "4px",
							fontSize: "0.72rem",
							fontWeight: 600,
							padding: "3px 8px",
							cursor: "pointer",
						}}
					>
						Bible Mode
					</button>
				</div>
			</div>
			{/* Global status indicator (DESIGN.md section 3.1) */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					fontSize: "0.75rem",
					color: "var(--neon-cyan, #00F0FF)",
					fontFamily: "var(--font-mono, monospace)",
				}}
			>
				<span
					style={{
						width: "8px",
						height: "8px",
						borderRadius: "50%",
						background: "var(--ok, #10B981)",
						display: "inline-block",
						boxShadow: "0 0 8px #10B981",
					}}
				/>
				<span>{subCount + 1} Agentes Ativos · Consumo: 48 t/s</span>
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
