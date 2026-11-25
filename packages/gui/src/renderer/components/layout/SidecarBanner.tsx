/**
 * Global sidecar status banner. Shows when the agent process is not usable:
 * failed, exited, crash-looping through its restart attempts, or "ready" but
 * failing health checks. Restart attempts are amber progress reporting; the
 * rest is an error with a restart action.
 */

import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { describeError } from "../../lib/errors";
import { useT } from "../../lib/i18n";
import { useSessionStore } from "../../stores/session";
import { useUiStore } from "../../stores/ui";

export function SidecarBanner() {
	const t = useT();
	const status = useSessionStore(s => s.status);
	const cwd = useSessionStore(s => s.cwd);
	const sidecarError = useUiStore(s => s.sidecarError);
	const sidecarRestart = useUiStore(s => s.sidecarRestart);
	const sidecarDismissed = useUiStore(s => s.sidecarDismissed);
	const clearSidecarError = useUiStore(s => s.clearSidecarError);
	const dismissSidecarBanner = useUiStore(s => s.dismissSidecarBanner);

	const restarting = status === "restarting";
	// Show banner when the sidecar is down, respawning itself, or a health check
	// failed on a nominally "ready" process.
	const show = restarting || status === "error" || status === "exited" || sidecarError !== null;
	if (!show || sidecarDismissed) return null;

	const progress =
		sidecarRestart === null
			? null
			: restarting
				? t("sidecar.attempt", { attempt: sidecarRestart.attempt, maxAttempts: sidecarRestart.maxAttempts })
				: status === "error"
					? t("sidecar.exhausted", { maxAttempts: sidecarRestart.maxAttempts })
					: null;
	const reason =
		sidecarError ??
		(status === "error"
			? t("sidecar.failedStart")
			: status === "exited"
				? t("sidecar.exited")
				: restarting
					? t("sidecar.restartingTitle")
					: t("sidecar.notResponding"));

	return (
		<div
			role="status"
			className={`flex items-center gap-3 border-b px-4 py-2.5 ${
				restarting
					? "border-[var(--omsk-warning)]/30 bg-[var(--omsk-warning-dim)]"
					: "border-[var(--omsk-error)]/30 bg-[var(--omsk-error)]/10"
			}`}
		>
			{restarting ? (
				<RefreshCw size={16} className="shrink-0 animate-spin text-[var(--omsk-warning)]" />
			) : (
				<AlertTriangle size={16} className="shrink-0 text-[var(--omsk-error)]" />
			)}
			<div className="min-w-0 flex-1">
				<div
					className={`text-omsk-md font-medium ${
						restarting ? "text-[var(--omsk-warning)]" : "text-[var(--omsk-error)]"
					}`}
				>
					{restarting ? t("sidecar.restartingTitle") : t("sidecar.title")}
				</div>
				<div className="truncate text-omsk-sm text-[var(--omsk-muted)]" title={reason}>
					{progress ? `${progress} — ${describeError(reason)}` : describeError(reason)}
				</div>
				{cwd && <div className="text-omsk-xs text-[var(--omsk-dim)]">{t("sidecar.project", { cwd })}</div>}
			</div>
			<button
				type="button"
				onClick={() => {
					clearSidecarError();
					void window.omsk.sidecar.restart();
				}}
				className="omsk-pressable flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--omsk-border-muted)] px-2.5 py-1 text-omsk-sm font-medium text-[var(--omsk-text)] hover:bg-[var(--omsk-selected-bg)]"
			>
				<RefreshCw size={11} />
				{t("sidecar.restart")}
			</button>
			<button
				type="button"
				onClick={dismissSidecarBanner}
				aria-label={t("common.close")}
				className="omsk-pressable flex shrink-0 items-center justify-center rounded-md p-1 text-[var(--omsk-dim)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)]"
			>
				<X size={12} />
			</button>
		</div>
	);
}
