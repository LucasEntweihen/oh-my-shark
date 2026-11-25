import { getFormattingLocale } from "../../../lib/i18n";
import { useTabRpc } from "../../../lib/tab-rpc";
/**
 * Interactive Marketplaces tab body: add-marketplace form plus per-marketplace
 * cards with catalog refresh, inline-confirmed removal, and a lazy-expanded
 * available-plugins list with install/upgrade/uninstall row actions.
 *
 * Every mutation rides marketplace_action and refetches only after any required
 * origin-tab restart settles. No optimistic derivation of plugin counts or
 * install state, and no dependency on available_commands_update ordering.
 */

import { Check, ChevronDown, ChevronRight, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { RpcMarketplaceInfo, RpcMarketplacePluginInfo } from "../../../../shared/rpc-types";
import { describeError } from "../../../lib/errors";
import { useT } from "../../../lib/i18n";
import { isImeKeyEvent } from "../../../lib/ime";
import {
	capturePluginActivationOrigin,
	handlePluginActivation,
	isPluginActivationOriginActive,
} from "../../../lib/plugin-activation";
import { Badge, Button, Spinner } from "../../common";
import { shortenSource } from "../inventory-utils";
import { OPENAI_MARKETPLACE } from "../plugins/catalog-model";
import { CopyableError } from "./ErrorNote";
import {
	availablePluginActions,
	classifyMarketplaceSource,
	extractCacheTimestamp,
	type MarketplacePluginAction,
} from "./marketplace-source";
import { listAvailablePlugins, mutationError } from "./rpc-result";

// ============================================================================
// Add marketplace form
// ============================================================================

export function AddMarketplaceForm({ onAdded, ready = true }: { onAdded: () => Promise<void>; ready?: boolean }) {
	const tabRpc = useTabRpc();
	const t = useT();
	const [source, setSource] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async (): Promise<void> => {
		if (!ready) return;
		const trimmed = source.trim();
		// Client-side parity with the agent's classifySource: a bare name is
		// rejected inline before the RPC fires (same rule order, same verdict).
		if (classifyMarketplaceSource(trimmed) === null) {
			setError(t("marketplace.sourceInvalid"));
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const res = await tabRpc.marketplaceAction({ action: "add", source: trimmed });
			const failure = mutationError(res, t("marketplace.unknownError"));
			if (failure !== null) {
				setError(failure);
				return;
			}
			setSource("");
			await onAdded();
		} catch (cause) {
			setError(describeError(cause));
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-(--omsk-border-muted) bg-transparent px-3 py-2.5">
			<span className="text-omsk-md font-medium text-(--omsk-text)">{t("marketplace.addTitle")}</span>
			<div className="flex items-start gap-2">
				<input
					aria-label={t("marketplace.addTitle")}
					className="min-w-0 flex-1 rounded-md border border-(--omsk-input-border) bg-(--omsk-input-bg) px-2.5 py-1.5 font-mono text-omsk-sm text-(--omsk-text) placeholder:text-(--omsk-dim) focus:border-(--omsk-input-focus-border) focus:outline-none disabled:opacity-50"
					disabled={busy || !ready}
					onChange={event => {
						setSource(event.target.value);
						setError(null);
					}}
					onKeyDown={event => {
						if (isImeKeyEvent(event)) return;
						if (event.key === "Enter") void submit();
					}}
					placeholder={t("marketplace.sourcePlaceholder")}
					spellCheck={false}
					type="text"
					value={source}
				/>
				<Button
					disabled={source.trim() === "" || busy || !ready}
					icon={<Plus size={12} />}
					loading={busy}
					onClick={() => void submit()}
					size="sm"
					title={!ready ? t("invPanel.notConnected") : undefined}
				>
					{t("marketplace.add")}
				</Button>
			</div>
			<span className="text-omsk-xs leading-snug text-(--omsk-dim)">{t("marketplace.sourceHint")}</span>
			{error && <CopyableError copyLabel={t("marketplace.copyError")} message={error} />}
		</div>
	);
}

// ============================================================================
// Available plugin row
// ============================================================================

function AvailablePluginRow({
	plugin,
	busyAction,
	anyBusy,
	confirmingInstall,
	onAction,
	onConfirmInstall,
	onCancelInstall,
}: {
	plugin: RpcMarketplacePluginInfo;
	/** This row's in-flight action (its button shows the spinner). */
	busyAction: MarketplacePluginAction | null;
	/** Another row's action is in flight — one mutation per marketplace at a time. */
	anyBusy: boolean;
	/** Install clicked but not yet confirmed — the Install button swaps to confirm/cancel. */
	confirmingInstall: boolean;
	onAction: (pluginName: string, action: MarketplacePluginAction) => void;
	onConfirmInstall: (pluginName: string) => void;
	onCancelInstall: () => void;
}) {
	const t = useT();
	const repository = plugin.repository;
	const homepage = plugin.homepage;
	return (
		<div className="flex items-center gap-3 rounded-md border border-(--omsk-border-muted) bg-transparent px-2.5 py-2">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-omsk-md font-medium text-(--omsk-text)">{plugin.name}</span>
					{plugin.version && (
						<span className="text-omsk-xs tabular-nums text-(--omsk-dim)">v{plugin.version}</span>
					)}
					{plugin.installed && <Badge variant="success">{t("marketplace.installed")}</Badge>}
				</div>
				{plugin.description && (
					<span className="text-omsk-sm leading-snug text-(--omsk-dim)">{plugin.description}</span>
				)}
				{confirmingInstall && (
					<span className="text-omsk-xs text-(--omsk-muted)">{t("marketplace.installConfirmHint")}</span>
				)}
				{(plugin.author ||
					plugin.license ||
					plugin.category ||
					repository ||
					homepage ||
					(plugin.tags?.length ?? 0) > 0) && (
					<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-omsk-xs text-(--omsk-dim)">
						{plugin.author && <span>{plugin.author}</span>}
						{plugin.license && <span>{plugin.license}</span>}
						{plugin.category && <span>{plugin.category}</span>}
						{plugin.tags?.map(tag => (
							<span key={tag}>#{tag}</span>
						))}
						{repository && (
							<button
								className="underline decoration-(--omsk-border-muted) underline-offset-2 hover:text-(--omsk-text)"
								onClick={() => void window.omp.system.openExternal(repository)}
								title={repository}
								type="button"
							>
								{t("marketplace.repository")}
							</button>
						)}
						{homepage && (
							<button
								className="underline decoration-(--omsk-border-muted) underline-offset-2 hover:text-(--omsk-text)"
								onClick={() => void window.omp.system.openExternal(homepage)}
								title={homepage}
								type="button"
							>
								{t("marketplace.homepage")}
							</button>
						)}
					</div>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				{confirmingInstall ? (
					<span className="flex shrink-0 items-center gap-0.5">
						<button
							aria-label={t("marketplace.installConfirm")}
							className="omsk-pressable flex h-6 w-6 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--omsk-error)_35%,transparent)] bg-transparent text-(--omsk-error) disabled:opacity-40"
							disabled={anyBusy}
							onClick={() => onConfirmInstall(plugin.name)}
							title={t("marketplace.installConfirm")}
							type="button"
						>
							<Check size={12} />
						</button>
						<button
							aria-label={t("common.cancel")}
							className="omsk-pressable flex h-6 w-6 items-center justify-center rounded-md text-(--omsk-muted) hover:bg-(--omsk-bg-tertiary) disabled:opacity-40"
							disabled={anyBusy}
							onClick={onCancelInstall}
							title={t("common.cancel")}
							type="button"
						>
							<X size={12} />
						</button>
					</span>
				) : (
					availablePluginActions(plugin.installed).map(action => (
						<Button
							className={action === "uninstall" ? "text-(--omsk-error)" : undefined}
							disabled={anyBusy}
							key={action}
							loading={busyAction === action}
							onClick={() => onAction(plugin.name, action)}
							size="sm"
							variant={action === "install" ? "secondary" : "ghost"}
						>
							{t(`marketplace.${action}`)}
						</Button>
					))
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Marketplace card
// ============================================================================

export function MarketplaceCard({
	marketplace,
	reload,
	ready = true,
}: {
	marketplace: RpcMarketplaceInfo;
	/** Refetch get_marketplaces (card data: name, source, plugin count, cache note). */
	reload: () => Promise<void>;
	ready?: boolean;
}) {
	const tabRpc = useTabRpc();
	const t = useT();
	const [expanded, setExpanded] = useState(false);
	const [available, setAvailable] = useState<RpcMarketplacePluginInfo[] | null>(null);
	const [listLoading, setListLoading] = useState(false);
	const [listError, setListError] = useState<string | null>(null);
	const [busyAction, setBusyAction] = useState<"update" | "remove" | null>(null);
	const [confirmingRemove, setConfirmingRemove] = useState(false);
	const [cardError, setCardError] = useState<string | null>(null);
	const [pluginBusy, setPluginBusy] = useState<{ name: string; action: MarketplacePluginAction } | null>(null);
	const [pluginErrors, setPluginErrors] = useState<Readonly<Record<string, string>>>({});
	const [confirmInstall, setConfirmInstall] = useState<string | null>(null);

	/** list_available — lazy on first expand, then cached in component state. */
	const fetchAvailable = useCallback(async (): Promise<void> => {
		if (!ready) return;
		setListLoading(true);
		setListError(null);
		try {
			const res = await tabRpc.marketplaceAction({
				action: "list_available",
				marketplace: marketplace.name,
			});
			const result = listAvailablePlugins(res, t("marketplace.unknownError"));
			if (result.ok) {
				setAvailable(result.plugins);
			} else {
				setListError(describeError(result.error));
			}
		} catch (cause) {
			setListError(describeError(cause));
		} finally {
			setListLoading(false);
		}
	}, [marketplace.name, ready, t, tabRpc.marketplaceAction]);

	const toggleExpanded = (): void => {
		if (!ready) return;
		const next = !expanded;
		setExpanded(next);
		if (next && available === null && !listLoading) void fetchAvailable();
	};

	/** Catalog refresh — long-running (clone/fetch), spinner for the duration. */
	const refreshCatalog = async (): Promise<void> => {
		if (!ready) return;
		setBusyAction("update");
		setCardError(null);
		try {
			const res = await tabRpc.marketplaceAction({ action: "update", marketplace: marketplace.name });
			const failure = mutationError(res, t("marketplace.unknownError"));
			if (failure !== null) {
				setCardError(failure);
				return;
			}
			// The catalog changed — refresh both the card (count/cache note) and,
			// when expanded, the available list (versions may have moved).
			if (expanded) await fetchAvailable();
			await reload();
		} catch (cause) {
			setCardError(describeError(cause));
		} finally {
			setBusyAction(null);
		}
	};

	const removeMarketplace = async (): Promise<void> => {
		if (!ready) return;
		setBusyAction("remove");
		setCardError(null);
		try {
			const res = await tabRpc.marketplaceAction({ action: "remove", marketplace: marketplace.name });
			const failure = mutationError(res, t("marketplace.unknownError"));
			if (failure !== null) {
				setCardError(failure);
				setConfirmingRemove(false);
				return;
			}
			await reload();
		} catch (cause) {
			setCardError(describeError(cause));
			setConfirmingRemove(false);
		} finally {
			setBusyAction(null);
		}
	};

	const runPluginAction = (pluginName: string, action: MarketplacePluginAction): void => {
		if (!ready) return;
		// The catalog wire carries no omp manifest, so the GUI cannot know
		// pre-install whether a plugin ships executable entry points — confirm
		// every install (metadata is visible on the row).
		if (action === "install") {
			setConfirmInstall(pluginName);
			return;
		}
		void executePluginAction(pluginName, action);
	};

	const executePluginAction = async (pluginName: string, action: MarketplacePluginAction): Promise<void> => {
		if (!ready) return;
		const origin = capturePluginActivationOrigin();
		if (!origin) {
			setPluginErrors(prev => ({ ...prev, [pluginName]: t("pluginActivation.routePending") }));
			return;
		}
		setConfirmInstall(prev => (prev === pluginName ? null : prev));
		setPluginBusy({ name: pluginName, action });
		setPluginErrors(prev => {
			if (!(pluginName in prev)) return prev;
			const rest = { ...prev };
			delete rest[pluginName];
			return rest;
		});
		try {
			const res = await tabRpc.marketplaceAction({
				action,
				marketplace: marketplace.name,
				plugin: pluginName,
			});
			const failure = mutationError(res, t("marketplace.unknownError"));
			if (failure !== null) {
				if (isPluginActivationOriginActive(origin)) {
					setPluginErrors(prev => ({ ...prev, [pluginName]: failure }));
				}
				return;
			}
			const data = res.data as { activation?: string } | undefined;
			await handlePluginActivation(
				data?.activation,
				{
					pluginId: `${pluginName}@${marketplace.name}`,
					expected: action === "uninstall" ? "disabled" : "enabled",
				},
				origin,
			);
			if (!isPluginActivationOriginActive(origin)) return;
			await fetchAvailable();
			await reload();
		} catch (cause) {
			if (isPluginActivationOriginActive(origin)) {
				setPluginErrors(prev => ({ ...prev, [pluginName]: describeError(cause) }));
			}
		} finally {
			setPluginBusy(null);
		}
	};

	const cacheTimestamp = extractCacheTimestamp(marketplace);
	const cacheNote =
		cacheTimestamp !== null
			? t("marketplace.lastUpdated", { time: new Date(cacheTimestamp).toLocaleString(getFormattingLocale()) })
			: t("marketplace.cacheNote");

	return (
		<div className="overflow-hidden rounded-lg border border-(--omsk-border-muted) bg-transparent">
			<div className="flex items-center gap-2 px-3 py-2.5">
				<button
					aria-expanded={expanded}
					aria-label={t("marketplace.browse")}
					className="omsk-pressable shrink-0 rounded p-0.5 text-(--omsk-dim) hover:text-(--omsk-text)"
					disabled={!ready}
					onClick={toggleExpanded}
					title={!ready ? t("invPanel.notConnected") : t("marketplace.browse")}
					type="button"
				>
					{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
				</button>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-omsk-lg font-medium text-(--omsk-text)">
							{marketplace.name === OPENAI_MARKETPLACE ? t("plugins.openAiMarketplace") : marketplace.name}
						</span>
						{marketplace.pluginCount !== undefined ? (
							<Badge variant="default">
								{t("invPanel.marketplaces.pluginCount", { count: marketplace.pluginCount })}
							</Badge>
						) : (
							<Badge variant="muted">{t("invPanel.marketplaces.notFetched")}</Badge>
						)}
						{/* Catalogs are cache-backed — the note is always visible; the
						    timestamp rides along when the wire carries one. */}
						<span className="text-omsk-xs text-(--omsk-dim)">{cacheNote}</span>
					</div>
					<div className="flex items-center gap-3 text-omsk-sm text-(--omsk-dim)">
						<span className="truncate font-mono" title={marketplace.source}>
							{shortenSource(marketplace.source)}
						</span>
					</div>
				</div>
				<button
					aria-label={t("marketplace.refresh")}
					className="omsk-pressable flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--omsk-muted) hover:bg-(--omsk-selected-bg) hover:text-(--omsk-accent) disabled:opacity-40"
					disabled={busyAction !== null || !ready}
					onClick={() => void refreshCatalog()}
					title={!ready ? t("invPanel.notConnected") : t("marketplace.refresh")}
					type="button"
				>
					{busyAction === "update" ? <Spinner size="sm" /> : <RefreshCw size={12} />}
				</button>
				{confirmingRemove ? (
					<span className="flex shrink-0 items-center gap-0.5">
						<button
							aria-label={t("marketplace.removeConfirm")}
							className="omsk-pressable flex h-6 w-6 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--omsk-error)_35%,transparent)] bg-transparent text-(--omsk-error) disabled:opacity-40"
							disabled={busyAction !== null || !ready}
							onClick={() => void removeMarketplace()}
							title={!ready ? t("invPanel.notConnected") : t("marketplace.removeConfirm")}
							type="button"
						>
							{busyAction === "remove" ? <Spinner size="sm" /> : <Check size={12} />}
						</button>
						<button
							aria-label={t("common.cancel")}
							className="omsk-pressable flex h-6 w-6 items-center justify-center rounded-md text-(--omsk-muted) hover:bg-(--omsk-selected-bg) disabled:opacity-40"
							disabled={busyAction !== null || !ready}
							onClick={() => setConfirmingRemove(false)}
							title={t("common.cancel")}
							type="button"
						>
							<X size={12} />
						</button>
					</span>
				) : (
					<button
						aria-label={t("marketplace.remove")}
						className="omsk-pressable flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--omsk-muted) hover:bg-(--omsk-tool-error-bg) hover:text-(--omsk-error) disabled:opacity-40"
						disabled={busyAction !== null || !ready}
						onClick={() => setConfirmingRemove(true)}
						title={!ready ? t("invPanel.notConnected") : t("marketplace.remove")}
						type="button"
					>
						<Trash2 size={12} />
					</button>
				)}
			</div>
			{cardError && (
				<CopyableError className="mx-3 mb-2" copyLabel={t("marketplace.copyError")} message={cardError} />
			)}
			{expanded && (
				<div className="flex flex-col gap-2 border-t border-(--omsk-border-muted) px-3 py-2.5">
					{available === null && listLoading ? (
						<div className="flex items-center justify-center py-4">
							<Spinner label={t("common.loading")} />
						</div>
					) : available === null && listError !== null ? (
						<>
							<CopyableError copyLabel={t("marketplace.copyError")} message={listError} />
							<div>
								<Button
									icon={<RefreshCw size={12} />}
									disabled={!ready}
									onClick={() => void fetchAvailable()}
									size="sm"
									title={!ready ? t("invPanel.notConnected") : t("invPanel.retry")}
									variant="ghost"
								>
									{t("invPanel.retry")}
								</Button>
							</div>
						</>
					) : available !== null && available.length === 0 ? (
						<div className="py-2 text-center text-omsk-sm text-(--omsk-dim)">
							{t("marketplace.availableEmpty")}
						</div>
					) : (
						<>
							{(available ?? []).map(plugin => (
								<div className="flex flex-col gap-1.5" key={plugin.name}>
									<AvailablePluginRow
										anyBusy={pluginBusy !== null || !ready}
										busyAction={pluginBusy?.name === plugin.name ? pluginBusy.action : null}
										confirmingInstall={confirmInstall === plugin.name}
										onAction={runPluginAction}
										onCancelInstall={() => setConfirmInstall(null)}
										onConfirmInstall={name => void executePluginAction(name, "install")}
										plugin={plugin}
									/>
									{pluginErrors[plugin.name] && (
										<CopyableError
											copyLabel={t("marketplace.copyError")}
											message={pluginErrors[plugin.name]}
										/>
									)}
								</div>
							))}
							{listLoading && (
								<div className="flex items-center gap-2 text-omsk-xs text-(--omsk-dim)">
									<Spinner size="sm" />
									{t("common.loading")}
								</div>
							)}
							{listError && <CopyableError copyLabel={t("marketplace.copyError")} message={listError} />}
						</>
					)}
				</div>
			)}
		</div>
	);
}
