/**
 * Update banner for both staged automatic updates and verified manual macOS
 * installers. Manual mode keeps the DMG replacement steps visible after the
 * installer opens in Finder.
 */
import { AlertTriangle, Download, FolderOpen, RefreshCw, X } from "lucide-react";
import { describeError } from "../../lib/errors";
import { useT } from "../../lib/i18n";
import { useUpdaterStore } from "../../stores/updater";
import { Button } from "../common";

function formatBytes(bytes: number): string {
	if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
	if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
	return `${bytes} B`;
}

export function UpdateBanner() {
	const t = useT();
	const status = useUpdaterStore(s => s.status);
	const dismissed = useUpdaterStore(s => s.dismissed);
	const dismiss = useUpdaterStore(s => s.dismiss);
	const dismissError = useUpdaterStore(s => s.dismissError);

	if (status.state === "available") {
		if (dismissed.version === status.version) return null;
		return (
			<div className="flex items-center gap-2 border-b border-(--omsk-border-muted) bg-transparent px-3 py-1.5 text-omsk-md">
				<Download size={13} className="shrink-0 text-(--omsk-accent)" />
				<span className="min-w-0 flex-1 truncate text-(--omsk-text)">
					{t("updater.available", { version: status.version })}
				</span>
				<Button size="sm" onClick={() => void window.omp.updater.download()}>
					{status.mode === "manual" ? t("updater.downloadInstaller") : t("updater.download")}
				</Button>
				<button
					type="button"
					aria-label={t("updater.dismiss")}
					className="shrink-0 text-(--omsk-dim) hover:text-(--omsk-text)"
					onClick={() => dismiss(status.version)}
				>
					<X size={13} />
				</button>
			</div>
		);
	}

	if (status.state === "downloading") {
		return (
			<div className="flex items-center gap-2 border-b border-(--omsk-border-muted) bg-transparent px-3 py-1.5 text-omsk-md">
				<Download size={13} className="shrink-0 text-(--omsk-accent)" />
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex justify-between text-(--omsk-text)">
						<span>{status.mode === "manual" ? t("updater.downloadingInstaller") : t("updater.downloading")}</span>
						<span className="tabular-nums text-(--omsk-dim)">
							{status.percent}% · {formatBytes(status.transferred)}/{formatBytes(status.total)}
						</span>
					</div>
					<div
						className="h-1 overflow-hidden rounded-full bg-(--omsk-bg-primary)" // surface-ok: progress bar track
					>
						<div
							className="omsk-progress-width h-full bg-(--omsk-accent)"
							style={{ width: `${status.percent}%` }}
						/>
					</div>
				</div>
			</div>
		);
	}

	if (status.state === "downloaded") {
		if (status.mode === "manual") {
			return (
				<div className="flex items-center gap-2 border-b border-(--omsk-border-muted) bg-transparent px-3 py-2 text-omsk-md">
					<FolderOpen size={13} className="shrink-0 text-(--omsk-success)" />
					<div className="min-w-0 flex-1">
						<div className="text-(--omsk-text)">{t("updater.installerReady", { version: status.version })}</div>
						<div className="mt-0.5 text-omsk-xs text-(--omsk-dim)">{t("updater.manualInstructions")}</div>
					</div>
					<Button size="sm" onClick={() => void window.omp.updater.apply()}>
						{t("updater.openInstaller")}
					</Button>
				</div>
			);
		}
		return (
			<div className="flex items-center gap-2 border-b border-(--omsk-border-muted) bg-transparent px-3 py-1.5 text-omsk-md">
				<RefreshCw size={13} className="shrink-0 text-(--omsk-success)" />
				<span className="min-w-0 flex-1 truncate text-(--omsk-text)">
					{t("updater.ready", { version: status.version })}
				</span>
				<Button size="sm" onClick={() => void window.omp.updater.apply()}>
					{t("updater.restart")}
				</Button>
			</div>
		);
	}

	if (status.state === "error" && status.showInBanner !== false) {
		// A dismissed failure stays hidden until a check actually succeeds again, so
		// the four-hourly poll can't resurrect a banner the user already closed.
		if (dismissed.error) return null;
		return (
			<div className="flex items-center gap-2 border-b border-(--omsk-border-muted) bg-transparent px-3 py-1.5 text-omsk-md">
				<AlertTriangle size={13} className="shrink-0 text-(--omsk-error)" />
				<span className="min-w-0 flex-1 text-(--omsk-error)">{describeError(status.message)}</span>
				<Button size="sm" onClick={() => void window.omp.updater.check()}>
					{t("updater.retry")}
				</Button>
				<button
					type="button"
					aria-label={t("updater.dismissFailure")}
					className="shrink-0 text-(--omsk-dim) hover:text-(--omsk-text)"
					onClick={dismissError}
				>
					<X size={13} />
				</button>
			</div>
		);
	}

	return null;
}
