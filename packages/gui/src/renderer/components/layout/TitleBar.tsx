import {
	ChevronRight,
	Command,
	Database,
	FolderOpen,
	Gauge,
	GitBranch,
	Info,
	Menu,
	MoreHorizontal,
	Palette,
	PanelLeft,
	PanelRight,
	ScrollText,
	Share2,
	Volume2,
	VolumeX,
	Wrench,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SessionStats } from "../../../shared/rpc-types";
import { useSessionList } from "../../hooks/use-session-list";
import { useWorkingTreeChangeCount } from "../../hooks/use-working-tree-changes";
import { basename, cx, formatCost, formatDuration, formatPercent, formatTokens } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { isImeKeyEvent } from "../../lib/ime";
import { onEscape } from "../../lib/keymap";
import { isRecording, subscribeRecording, toggleRecording } from "../../lib/recording";
import { sessionDisplayTitle } from "../../lib/session-title";
import { useTabRpc } from "../../lib/tab-rpc";
import { headerHasAppMenu } from "../../lib/window-chrome";
import { useAgentPagesStore, useShownAgentPage } from "../../stores/agent-pages";
import { useMessagesStore } from "../../stores/messages";
import { type SessionStore, useSessionStore } from "../../stores/session";
import { sessionRuntimeStore, useRuntimeTabId } from "../../stores/session-runtime-context";
import { useSidebarPrefs } from "../../stores/sidebar-prefs";
import { useActiveTabKind } from "../../stores/tabs";
import { toast } from "../../stores/toast";
import { useToolsStore } from "../../stores/tools";
import { useUiStore } from "../../stores/ui";
import { AgentCrumbs, AgentTitleFacts, AgentTitleStatus } from "../agents/AgentTitle";
import { ContextMenu, type ContextMenuAnchor, type ContextMenuItem } from "../common/ContextMenu";
import { WorkspaceDialog } from "../dialogs/WorkspaceDialog";
import { NotificationBell } from "./NotificationBell";
import { sessionCacheHitPercent, sessionExecutionDurationMs } from "./session-metrics";

/**
 * Native desktop toolbar. Session controls stay here; model and execution
 * controls live beside the composer where they affect the next message.
 */
export function TitleBar() {
	const tabRpc = useTabRpc();
	const t = useT();
	const tabId = useRuntimeTabId();
	// A shown subagent page puts its agent in the breadcrumb and its facts in the slots.
	const pageAgentId = useShownAgentPage(tabId);
	const sessionId = useSessionStore(s => s.sessionId);
	const sessionName = useSessionStore(s => s.sessionName);
	const cwd = useSessionStore(s => s.cwd);
	const status = useSessionStore(s => s.status);
	const isStreaming = useSessionStore(s => s.isStreaming);
	const advisorStatus = useSessionStore(s => s.advisorStatus);
	const recording = useSyncExternalStore(subscribeRecording, isRecording);
	const isCompacting = useSessionStore(s => s.isCompacting);
	// A manual compaction or handoff sends no agent event; its request marks the tab busy.
	const manualMaintenance = useSessionStore(s => s.manualMaintenance);
	const statsPulse = useSessionStore(s => s.statsPulse);
	const isChat = useActiveTabKind() === "chat";

	const planModeEnabled = useSessionStore(s => s.planModeEnabled);
	const awaitingModelSince = useSessionStore(s => s.awaitingModelSince);
	const messages = useMessagesStore(s => s.messages);
	const streamingMessage = useMessagesStore(s => s.streamingMessage);
	const tools = useToolsStore(s => s.activeTools);
	const sidebarVisible = useUiStore(s => s.sidebarVisible);
	const toggleSidebar = useUiStore(s => s.toggleSidebar);
	const panelVisible = useUiStore(s => s.panelVisible);
	const togglePanel = useUiStore(s => s.togglePanel);
	const openCommandPalette = useUiStore(s => s.openCommandPalette);
	const openThemePicker = useUiStore(s => s.openThemePicker);
	const soundEffects = useUiStore(s => s.soundEffects);
	const setSoundEffects = useUiStore(s => s.setSoundEffects);
	const openUsage = useUiStore(s => s.openUsage);
	const openStatsDashboard = useUiStore(s => s.openStatsDashboard);
	const openImportDialog = useUiStore(s => s.openImportDialog);
	const openContextReport = useUiStore(s => s.openContextReport);
	const openActiveTools = useUiStore(s => s.openActiveTools);
	const openShareSession = useUiStore(s => s.openShareSession);
	const openSessionInfo = useUiStore(s => s.openSessionInfo);
	const openBranchPicker = useUiStore(s => s.openBranchPicker);
	const openSessionTree = useUiStore(s => s.openSessionTree);
	const openLogs = useUiStore(s => s.openLogs);
	const { sessions } = useSessionList("local");
	const projectAlias = useSidebarPrefs(s => s.groupAliases[cwd]);
	const projectName = !isChat && cwd ? (projectAlias ?? (basename(cwd) || cwd)) : t("titlebar.openProject");

	const [editingName, setEditingName] = useState(false);
	const [workspaceOpen, setWorkspaceOpen] = useState(false);
	const [actionsMenu, setActionsMenu] = useState<ContextMenuAnchor | null>(null);
	const [draft, setDraft] = useState("");
	const [stats, setStats] = useState<SessionStats | null>(null);
	const [now, setNow] = useState(() => Date.now());
	const nameInputRef = useRef<HTMLInputElement>(null);
	const statsMessageCount = messages.length;
	// A settled transcript append and a fresh sidecar snapshot are the two things
	// that can move these figures. Mid-run appends come several times a turn, so
	// only the pulse may re-queue a stats command there — the serial command queue
	// has to stay free for the agent's own traffic.
	const statsTrigger = isStreaming ? `streaming:${statsPulse}` : `idle:${statsMessageCount}:${statsPulse}`;
	const prevSessionRef = useRef<string | null>(null);

	useEffect(() => {
		if (editingName) nameInputRef.current?.select();
	}, [editingName]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: the settled transcript and the snapshot pulse both refresh the cost figures even when the session ID is stable.
	useEffect(() => {
		if (!sessionId || status !== "ready") {
			setStats(null);
			prevSessionRef.current = null;
			return;
		}
		// Cross-session staleness is the bug: session A's tokens/cost must never
		// display over session B. Within ONE session, keeping the previous read
		// while the refetch is in flight beats a clear-refetch flicker on every
		// message append; the session-id guard rejects mismatched responses.
		if (prevSessionRef.current !== sessionId) setStats(null);
		prevSessionRef.current = sessionId;
		// Compaction rewrites the journal, so a reading taken mid-shake is noise.
		// Streaming is no longer a reason to freeze the figures — the pulse paces it.
		if (isCompacting) return;
		let cancelled = false;
		const requestedSessionId = sessionId;
		const originSession = sessionRuntimeStore<SessionStore>(tabId, "session") ?? useSessionStore;
		void tabRpc
			.getSessionStats()
			.then(response => {
				if (!cancelled && response.success && originSession.getState().sessionId === requestedSessionId) {
					setStats(response.data as SessionStats);
				}
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [sessionId, statsTrigger, status, tabRpc.getSessionStats, tabId, isCompacting]);

	const hasRunningTool = [...tools.values()].some(tool => tool.endTime === null);
	useEffect(() => {
		setNow(Date.now());
		if (!isStreaming && !hasRunningTool) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [hasRunningTool, isStreaming]);

	const current = sessions.find(s => s.id === sessionId);
	// Same display-title contract as the tab strip and sidebar: an explicit name,
	// then the generated title, then the first prompt — so the header never says
	// "New session" while the tab beside it already shows the conversation.
	const displayName = sessionName || (current ? sessionDisplayTitle(current, "") : "") || t("sidebar.newSession");
	const visibleStats = stats?.sessionId === sessionId ? stats : null;
	const cacheHit = sessionCacheHitPercent(visibleStats);
	const usedTokens = visibleStats ? (visibleStats.history?.totalTokens ?? visibleStats.tokens.total) : 0;
	const executionDuration = sessionExecutionDurationMs({
		messages,
		streamingMessage,
		tools,
		awaitingModelSince,
		isStreaming,
		now,
	});

	const usedCost = visibleStats ? (visibleStats.history?.cost ?? visibleStats.cost) : 0;
	const advisorCost = advisorStatus?.cost ?? 0;
	const metricParts = [
		usedTokens > 0 ? t("titlebar.metric.tokensShort", { count: formatTokens(usedTokens) }) : null,
		usedCost > 0 ? formatCost(usedCost, usedCost < 1 ? 3 : 2) : null,
		executionDuration > 0 ? formatDuration(executionDuration) : null,
	].filter((part): part is string => part !== null);
	const metricsTitle = [
		`${t(visibleStats?.history ? "titlebar.metric.historyTokens" : "titlebar.metric.tokens")}: ${visibleStats ? formatTokens(usedTokens) : "—"}`,
		`${t(visibleStats?.history ? "titlebar.metric.historyCost" : "titlebar.metric.cost")}: ${visibleStats ? formatCost(usedCost, 4) : "—"}`,
		advisorCost > 0 ? `${t("advisor.badge.cost")}: ${formatCost(advisorCost, 4)}` : null,
		`${t("titlebar.metric.cacheHit")}: ${formatPercent(cacheHit, 0)}`,
		`${t("titlebar.metric.duration")}: ${formatDuration(executionDuration)}`,
	]
		.filter((line): line is string => line !== null)
		.join("\n");
	const changeCount = useWorkingTreeChangeCount(!isChat);
	const reviewLabel =
		changeCount && changeCount > 0
			? t("titlebar.review.changes", { count: changeCount, plural: changeCount === 1 ? "" : "s" })
			: t("titlebar.togglePanel");

	const commitName = () => {
		const name = draft.trim();
		setEditingName(false);
		if (!name || name === displayName) return;
		const originSession = sessionRuntimeStore<SessionStore>(tabId, "session") ?? useSessionStore;
		const originId = originSession.getState().sessionId;
		void tabRpc
			.setSessionName(name)
			.then(response => {
				if (response.success) {
					if (originSession.getState().sessionId === originId) originSession.setState({ sessionName: name });
				} else toast({ variant: "error", title: t("titlebar.renameFailed"), message: response.error });
			})
			.catch(error => {
				toast({ variant: "error", title: t("titlebar.renameFailed"), message: String(error) });
			});
	};

	const iconButton =
		"no-drag omsk-pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--omsk-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)]";
	const working = isStreaming || isCompacting || manualMaintenance != null;
	const statusActive = working || status === "starting" || status === "restarting";
	const statusLabel = working
		? t("titlebar.status.working")
		: status === "ready"
			? t("titlebar.status.ready")
			: status === "starting"
				? t("titlebar.status.connecting")
				: status === "error" || status === "exited" || status === "restarting"
					? t(`titlebar.status.${status}`)
					: status;
	const statusColor = working
		? "var(--omsk-accent)"
		: status === "ready"
			? "var(--omsk-dim)"
			: status === "error" || status === "exited"
				? "var(--omsk-error)"
				: "var(--omsk-warning)";

	const actionMenuItems: ContextMenuItem[] = [
		{
			id: "import",
			label: t("cmd.import"),
			description: t("cmd.import.desc"),
			icon: FolderOpen,
			onSelect: () => {
				setActionsMenu(null);
				openImportDialog();
			},
		},
		{
			id: "branch",
			label: t("cmd.branch"),
			description: t("cmd.branch.desc"),
			icon: GitBranch,
			onSelect: () => {
				setActionsMenu(null);
				openBranchPicker();
			},
		},
		{
			id: "tree",
			label: t("cmd.tree"),
			description: t("cmd.tree.desc"),
			disabled: isChat,
			icon: GitBranch,
			onSelect: () => {
				setActionsMenu(null);
				openSessionTree();
			},
		},
		{
			id: "session-info",
			label: t("cmd.session"),
			description: t("cmd.session.desc"),
			icon: Info,
			onSelect: () => {
				setActionsMenu(null);
				openSessionInfo();
			},
		},
		{
			id: "share",
			label: t("cmd.share"),
			description: t("cmd.share.desc"),
			icon: Share2,
			onSelect: () => {
				setActionsMenu(null);
				openShareSession();
			},
		},
		{
			id: "context",
			label: t("cmd.context"),
			description: t("cmd.context.desc"),
			icon: Gauge,
			onSelect: () => {
				setActionsMenu(null);
				openContextReport();
			},
		},
		{
			id: "tools",
			label: t("cmd.tools"),
			description: t("cmd.tools.desc"),
			icon: Wrench,
			onSelect: () => {
				setActionsMenu(null);
				openActiveTools();
			},
		},
		{
			id: "usage",
			label: t("cmd.usage"),
			description: t("cmd.usage.desc"),
			icon: Gauge,
			onSelect: () => {
				setActionsMenu(null);
				openUsage();
			},
		},
		{
			id: "stats",
			label: t("cmd.stats"),
			description: t("cmd.stats.desc"),
			icon: Database,
			onSelect: () => {
				setActionsMenu(null);
				openStatsDashboard();
			},
		},
		{
			id: "logs",
			label: t("cmd.logs"),
			description: t("cmd.logs.desc"),
			icon: ScrollText,
			onSelect: () => {
				setActionsMenu(null);
				openLogs();
			},
		},
	];

	return (
		<header className="omsk-titlebar drag-region flex h-10 min-w-0 shrink-0 items-center gap-1 overflow-hidden bg-[var(--omsk-titlebar-bg)] px-2.5">
			{headerHasAppMenu() && (
				<button
					type="button"
					aria-label={t("titlebar.appMenu")}
					onClick={event => {
						const { left, bottom } = event.currentTarget.getBoundingClientRect();
						window.omp.windowChrome.showAppMenu({ x: left, y: bottom });
					}}
					title={t("titlebar.appMenu")}
					className={iconButton}
				>
					<Menu size={18} />
				</button>
			)}
			<button
				type="button"
				aria-label={t("titlebar.toggleSidebar")}
				onClick={toggleSidebar}
				title={t("titlebar.toggleSidebar")}
				className={iconButton}
			>
				<PanelLeft size={18} className={cx(sidebarVisible && "text-[var(--omsk-text)]")} />
			</button>
			{/* The sidebar carries the labelled Command Center entry; this shortcut
			    only stands in for it while the sidebar is hidden. */}
			{!sidebarVisible && (
				<button
					type="button"
					aria-label={t("titlebar.commands")}
					title={t("titlebar.commands")}
					onClick={openCommandPalette}
					className={iconButton}
				>
					<Command aria-hidden="true" size={16} />
				</button>
			)}

			<div className="omsk-titlebar-identity no-drag flex min-w-0 items-center gap-1.5">
				<button
					className="omsk-pressable flex min-w-0 max-w-48 shrink-0 items-center gap-2 truncate rounded-lg px-2 py-1.5 text-omsk-lg font-medium text-[var(--omsk-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)] disabled:cursor-not-allowed disabled:text-[var(--omsk-dim)]"
					disabled={isStreaming}
					onClick={() => setWorkspaceOpen(true)}
					title={
						isStreaming
							? t("titlebar.abortHint")
							: !isChat && cwd
								? `${t("titlebar.openProject")} — ${projectName}`
								: t("titlebar.openProject")
					}
					type="button"
				>
					<FolderOpen className="shrink-0" size={15} />
					<span className="omsk-titlebar-project-name truncate">{projectName}</span>
				</button>
				<ChevronRight size={14} className="text-[var(--omsk-dim)]" />
				{editingName ? (
					<input
						ref={nameInputRef}
						value={draft}
						onChange={event => setDraft(event.target.value)}
						onBlur={commitName}
						onKeyDown={event => {
							if (isImeKeyEvent(event)) return;
							if (event.key === "Enter") commitName();
							onEscape(event, () => setEditingName(false));
						}}
						className="min-w-0 max-w-56 rounded-lg border border-[var(--omsk-input-focus-border)] bg-[var(--omsk-input-bg)] px-2.5 py-1.5 text-omsk-lg font-medium text-[var(--omsk-text)] outline-none"
					/>
				) : (
					<button
						type="button"
						title={pageAgentId ? t("agents.title.showConversation") : t("titlebar.rename")}
						onClick={() => {
							if (pageAgentId && tabId) {
								useAgentPagesStore.getState().show(tabId, null);
								return;
							}
							setDraft(sessionName ?? "");
							setEditingName(true);
						}}
						className={cx(
							"omsk-pressable min-w-0 max-w-72 truncate rounded-lg px-2 py-1.5 text-omsk-lg hover:bg-[var(--omsk-selected-bg)]",
							pageAgentId
								? "font-medium text-[var(--omsk-muted)] hover:text-[var(--omsk-text)]"
								: "font-semibold text-[var(--omsk-text)]",
						)}
					>
						{displayName}
					</button>
				)}
				{pageAgentId && tabId && <AgentCrumbs agentId={pageAgentId} tabId={tabId} />}
			</div>

			{pageAgentId ? (
				<AgentTitleStatus agentId={pageAgentId} />
			) : (
				<div className="omsk-titlebar-status no-drag flex shrink-0 items-center gap-1.5 px-1 text-omsk-sm font-medium text-[var(--omsk-muted)]">
					<span
						role="img"
						aria-label={statusLabel}
						title={statusLabel}
						className={cx("omsk-signal-light", statusActive && "omsk-signal-light--active")}
						style={{ color: statusColor }}
					/>
					<span className="omsk-titlebar-status-label">{statusLabel}</span>
				</div>
			)}

			{planModeEnabled && (
				<span
					className="no-drag shrink-0 rounded-full border border-[var(--omsk-border-accent)] bg-[var(--omsk-accent-dim)] px-2 py-1 text-omsk-xs font-semibold text-[var(--omsk-accent)]"
					title={t("titlebar.planMode")}
				>
					{t("titlebar.plan")}
				</span>
			)}

			{recording && (
				<button
					type="button"
					className="no-drag flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--omsk-error)] px-2 py-1 text-omsk-xs font-semibold text-[var(--omsk-error)]"
					title={t("record.stopHint")}
					onClick={() => void toggleRecording()}
				>
					<span className="omsk-rec-dot inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--omsk-error)]" />
					{t("record.badge")}
				</button>
			)}

			<div className="flex-1" />

			{/* One quiet readout: only figures that carry information are printed
			    (a row of zeros is noise); the full breakdown is in the tooltip. */}
			{pageAgentId && <AgentTitleFacts agentId={pageAgentId} />}
			{!pageAgentId && metricParts.length > 0 && (
				<span
					className="omsk-session-metrics no-drag flex shrink-0 items-center gap-1.5 px-1.5 text-omsk-sm tabular-nums text-[var(--omsk-dim)]"
					title={metricsTitle}
				>
					{metricParts.map((part, index) => (
						<span className="flex items-center gap-1.5" key={part}>
							{index > 0 && <span aria-hidden="true">·</span>}
							{part}
						</span>
					))}
				</span>
			)}
			<button
				type="button"
				aria-label={soundEffects ? t("titlebar.soundOn") : t("titlebar.soundOff")}
				aria-pressed={soundEffects}
				title={soundEffects ? t("titlebar.soundOn") : t("titlebar.soundOff")}
				onClick={() => setSoundEffects(!soundEffects)}
				className={iconButton}
			>
				{soundEffects ? (
					<Volume2 aria-hidden="true" size={16} strokeWidth={1.65} />
				) : (
					<VolumeX aria-hidden="true" size={16} strokeWidth={1.65} />
				)}
			</button>
			<button
				type="button"
				aria-label={t("titlebar.theme")}
				title={t("titlebar.theme")}
				onClick={openThemePicker}
				className={iconButton}
			>
				<Palette aria-hidden="true" size={16} strokeWidth={1.65} />
			</button>
			<NotificationBell className={iconButton} />
			<button
				type="button"
				aria-label={t("titlebar.actions")}
				aria-expanded={actionsMenu !== null}
				aria-haspopup="menu"
				title={t("titlebar.actions")}
				onClick={event => {
					const rect = event.currentTarget.getBoundingClientRect();
					setActionsMenu({
						x: Number.isFinite(rect.left) ? rect.left : 8,
						y: (Number.isFinite(rect.bottom) ? rect.bottom : 40) + 4,
					});
				}}
				className={iconButton}
			>
				<MoreHorizontal aria-hidden="true" size={16} strokeWidth={1.65} />
			</button>
			{actionsMenu && (
				<ContextMenu
					x={actionsMenu.x}
					y={actionsMenu.y}
					onClose={() => setActionsMenu(null)}
					items={actionMenuItems}
				/>
			)}
			{/* The review drawer's entry says why it is worth opening: how many
			    files the checkout has changed. */}
			<button
				type="button"
				aria-label={reviewLabel}
				aria-pressed={panelVisible}
				onClick={togglePanel}
				title={reviewLabel}
				className={cx(
					"omsk-review-toggle no-drag omsk-pressable flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2.5 text-[var(--omsk-muted)] hover:border-[var(--omsk-border-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)]",
					panelVisible &&
						"border-[var(--omsk-border-accent)]/40 bg-[var(--omsk-selected-bg)] text-[var(--omsk-text)]",
				)}
			>
				<PanelRight size={16} strokeWidth={1.65} />
				{changeCount != null && changeCount > 0 && (
					<span className="omsk-review-count font-mono text-omsk-sm tabular-nums" aria-hidden="true">
						{changeCount > 99 ? "99+" : changeCount}
					</span>
				)}
			</button>
			<WorkspaceDialog open={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />
		</header>
	);
}
