import { CheckCircle2, Download, FolderOpen, RefreshCw, RotateCcw, ServerCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { UpdateStatus } from "../../../shared/ipc-types";
import type { RpcOmpUpdateResult } from "../../../shared/rpc-types";
import { describeError } from "../../lib/errors";
import { useT } from "../../lib/i18n";
import { useTabRpc } from "../../lib/tab-rpc";
import { useSessionStore } from "../../stores/session";
import { useUpdaterStore } from "../../stores/updater";
import { Button, Spinner } from "../common";
import { SettingsPageIntro } from "./SettingsPageIntro";

function appLatest(status: UpdateStatus): string {
	if ("version" in status) return status.version;
	return "—";
}

export type UpdateOverviewState = "checking" | "healthy" | "attention" | "error";

function appUpdateAvailable(status: UpdateStatus): boolean {
	return status.state === "available" || status.state === "downloading" || status.state === "downloaded";
}

/** Derive the honest aggregate state shown by the updates header. */
export function updateOverviewState(
	status: UpdateStatus,
	core: RpcOmpUpdateResult | undefined,
	coreError: string | undefined,
	checking: boolean,
): UpdateOverviewState {
	if (checking || status.state === "idle" || status.state === "checking") return "checking";
	if (status.state === "error" || coreError) return "error";
	if (!core) return "checking";
	if (appUpdateAvailable(status) || core.updateAvailable) return "attention";
	return "healthy";
}

export function UpdatesSettingsPage() {
	const tabRpc = useTabRpc();
	const t = useT();
	const sidecarReady = useSessionStore(state => state.status) === "ready";
	const status = useUpdaterStore(state => state.status);
	const setStatus = useUpdaterStore(state => state.setStatus);
	const [guiVersion, setGuiVersion] = useState<string>();
	const [core, setCore] = useState<RpcOmpUpdateResult>();
	const [checking, setChecking] = useState(false);
	const [coreError, setCoreError] = useState<string>();

	const check = useCallback(async () => {
		setChecking(true);
		setCoreError(undefined);
		const [appResult, coreResult] = await Promise.allSettled([
			window.omsk.updater.check(),
			sidecarReady ? tabRpc.getOmpUpdate() : Promise.resolve(null),
		]);
		setStatus(
			appResult.status === "fulfilled"
				? appResult.value
				: {
						state: "error",
						message: appResult.reason instanceof Error ? appResult.reason.message : String(appResult.reason),
					},
		);
		if (coreResult.status === "fulfilled" && coreResult.value !== null && coreResult.value.success) {
			setCore(coreResult.value.data as RpcOmpUpdateResult);
		} else {
			setCoreError(
				!sidecarReady
					? t("common.notConnected")
					: coreResult.status === "rejected"
						? String(coreResult.reason)
						: coreResult.value === null || coreResult.value.success
							? t("updates.core.checkFailed")
							: coreResult.value.error,
			);
		}
		setChecking(false);
	}, [setStatus, sidecarReady, t, tabRpc.getOmpUpdate]);

	useEffect(() => {
		void window.omsk.updater.version().then(setGuiVersion);
		void check();
	}, [check]);

	const coreUpdateAvailable = core?.updateAvailable === true;
	const overview = updateOverviewState(status, core, coreError, checking);
	const errorMessage = [status.state === "error" ? status.message : undefined, coreError]
		.filter(Boolean)
		.map(describeError)
		.join(" · ");

	return (
		<div>
			<SettingsPageIntro className="mb-5" description={t("updates.subtitle")} />

			<div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-(--omsk-border-muted) px-3 py-2.5">
				{overview === "checking" ? (
					<Spinner size="sm" />
				) : overview === "healthy" ? (
					<CheckCircle2 className="text-(--omsk-success)" size={15} />
				) : (
					<ServerCog
						className={overview === "error" ? "text-(--omsk-error)" : "text-(--omsk-warning)"}
						size={15}
					/>
				)}
				<div className="min-w-0 flex-1">
					<div className="text-omsk-md font-medium text-(--omsk-text)">
						{overview === "healthy"
							? t("updates.systemHealthy")
							: overview === "attention"
								? t("updates.systemAttention")
								: overview === "error"
									? t("updates.systemError")
									: t("updates.systemChecking")}
					</div>
					<div className="mt-0.5 text-omsk-xs text-(--omsk-dim)">{t("updates.deliveryNote")}</div>
				</div>
				<Button
					icon={checking ? <Spinner size="sm" /> : <RefreshCw size={13} />}
					disabled={checking}
					onClick={check}
					size="sm"
				>
					{t("updates.checkAll")}
				</Button>
			</div>

			<div className="divide-y divide-(--omsk-border-muted) overflow-hidden rounded-lg border border-(--omsk-border-muted)">
				<section className="updates-row items-center gap-3 px-4 py-3">
					<div className="updates-icon flex size-8 items-center justify-center text-(--omsk-muted)">
						<Download size={15} />
					</div>
					<div className="updates-copy min-w-0">
						<h3 className="text-omsk-md font-semibold text-(--omsk-text)">{t("updates.gui.name")}</h3>
						<p className="mt-0.5 text-omsk-xs text-(--omsk-dim)">{t("updates.gui.description")}</p>
						{status.state === "downloaded" && status.mode === "manual" && (
							<p className="mt-1 text-omsk-xs text-(--omsk-muted)">{t("updater.manualInstructions")}</p>
						)}
					</div>
					<div className="updates-current">
						<div className="text-omsk-xxs text-(--omsk-dim)">{t("updates.current")}</div>
						<div className="mt-1 font-mono text-omsk-sm text-(--omsk-text)">{guiVersion ?? "—"}</div>
					</div>
					<div className="updates-latest">
						<div className="text-omsk-xxs text-(--omsk-dim)">{t("updates.latest")}</div>
						<div className="mt-1 font-mono text-omsk-sm text-(--omsk-text)">
							{guiVersion ? appLatest(status) : "—"}
						</div>
					</div>
					<div className="updates-action justify-self-end">
						{status.state === "available" && (
							<Button
								icon={<Download size={13} />}
								onClick={() => void window.omsk.updater.download()}
								size="sm"
								variant="primary"
							>
								{status.mode === "manual" ? t("updater.downloadInstaller") : t("updater.download")}
							</Button>
						)}
						{status.state === "downloading" && (
							<span className="text-omsk-sm text-(--omsk-muted)">{status.percent}%</span>
						)}
						{status.state === "downloaded" && (
							<Button
								icon={status.mode === "manual" ? <FolderOpen size={13} /> : <RotateCcw size={13} />}
								onClick={() => void window.omsk.updater.apply()}
								size="sm"
								variant="primary"
							>
								{status.mode === "manual" ? t("updater.openInstaller") : t("updater.restart")}
							</Button>
						)}
						{(status.state === "idle" || status.state === "checking") && (
							<span className="flex items-center gap-1.5 text-omsk-sm text-(--omsk-muted)">
								<Spinner size="sm" /> {t("updates.checking")}
							</span>
						)}
						{status.state === "error" && (
							<span className="text-omsk-sm text-(--omsk-error)">{t("updates.checkFailed")}</span>
						)}
						{status.state === "not-available" && (
							<span className="text-omsk-sm text-(--omsk-success)">{t("updates.upToDate")}</span>
						)}
					</div>
				</section>

				<section className="updates-row items-center gap-3 px-4 py-3">
					<div className="updates-icon flex size-8 items-center justify-center text-(--omsk-muted)">
						<ServerCog size={15} />
					</div>
					<div className="updates-copy min-w-0">
						<h3 className="text-omsk-md font-semibold text-(--omsk-text)">{t("updates.core.name")}</h3>
						<p className="mt-0.5 text-omsk-xs text-(--omsk-dim)">{t("updates.core.description")}</p>
					</div>
					<div className="updates-current">
						<div className="text-omsk-xxs text-(--omsk-dim)">{t("updates.current")}</div>
						<div className="mt-1 font-mono text-omsk-sm text-(--omsk-text)">{core?.currentVersion ?? "—"}</div>
					</div>
					<div className="updates-latest">
						<div className="text-omsk-xxs text-(--omsk-dim)">{t("updates.latest")}</div>
						<div className="mt-1 font-mono text-omsk-sm text-(--omsk-text)">{core?.latestVersion ?? "—"}</div>
					</div>
					<div
						className={`updates-action justify-self-end text-omsk-sm ${
							coreError
								? "text-(--omsk-error)"
								: !core || checking
									? "text-(--omsk-muted)"
									: coreUpdateAvailable
										? "text-(--omsk-warning)"
										: "text-(--omsk-success)"
						}`}
					>
						{coreError
							? t("updates.checkFailed")
							: !core || checking
								? t("updates.checking")
								: coreUpdateAvailable
									? t("updates.coreBundledPending")
									: t("updates.upToDate")}
					</div>
				</section>
			</div>
			{errorMessage && <p className="mt-3 text-omsk-sm text-(--omsk-error)">{errorMessage}</p>}
		</div>
	);
}
