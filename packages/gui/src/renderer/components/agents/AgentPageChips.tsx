/**
 * Child chips of a session tab (plan/24 §3.2): one per open subagent page,
 * right after the parent chip, pinned pages first and the preview last. A
 * preview chip sets its title in italic; double-click keeps it open.
 */

import { Columns2, CornerDownRight, X } from "lucide-react";
import { useRef } from "react";
import { cx } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { type AgentPage, useAgentPagesStore } from "../../stores/agent-pages";
import { subagentPrimaryLabel } from "../panels/subagent-graph";
import { AgentSignal, useActivityLabel } from "./AgentPage";
import { subagentActivity } from "./agent-activity";
import { useTabSubagent } from "./use-agent-tree";

const EMPTY: AgentPage[] = [];

export function AgentPageChips({
	tabId,
	parentLabel,
	tabActive,
}: {
	tabId: string;
	parentLabel: string;
	tabActive: boolean;
}) {
	const pages = useAgentPagesStore(state => state.pages[tabId] ?? EMPTY);
	const shown = useAgentPagesStore(state => state.shown[tabId] ?? null);
	const beside = useAgentPagesStore(state => state.beside[tabId] ?? null);
	return pages.map(page => (
		<AgentPageChip
			beside={beside === page.agentId}
			key={page.agentId}
			page={page}
			parentLabel={parentLabel}
			selected={tabActive && shown === page.agentId}
			tabActive={tabActive}
			tabId={tabId}
		/>
	));
}

function AgentPageChip({
	tabId,
	page,
	parentLabel,
	selected,
	beside,
	tabActive,
}: {
	tabId: string;
	page: AgentPage;
	parentLabel: string;
	selected: boolean;
	beside: boolean;
	tabActive: boolean;
}) {
	const t = useT();
	const activityLabel = useActivityLabel();
	const live = useTabSubagent(tabId, page.agentId);
	const lastSeen = useRef(live);
	if (live) lastSeen.current = live;
	const agent = live ?? lastSeen.current;
	const title = agent ? subagentPrimaryLabel(agent) : page.agentId;
	const activity = agent ? subagentActivity(agent) : "stopped";
	const state = agent ? activityLabel(agent) : "";
	const pages = useAgentPagesStore.getState;
	const visible = beside && tabActive;

	return (
		<div
			aria-label={t("agents.chip.label", { parent: parentLabel, title, state })}
			aria-selected={selected}
			className={cx(
				"no-drag group relative flex h-8 w-auto min-w-0 max-w-52 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg pr-2 pl-2 text-omsk-md select-none",
				selected
					? "bg-[var(--omsk-selected-bg)] font-medium text-[var(--omsk-text)]"
					: visible
						? "bg-[var(--omsk-selected-bg)]/55 text-[var(--omsk-text)] ring-1 ring-inset ring-[var(--omsk-border)]"
						: "text-[var(--omsk-muted)] hover:bg-[var(--omsk-sidebar-item-hover)] hover:text-[var(--omsk-text)]",
			)}
			id={`omsk-tab-${tabId}-agent-${page.agentId}`}
			onAuxClick={event => {
				if (event.button === 1) pages().close(tabId, page.agentId);
			}}
			onClick={() => pages().show(tabId, page.agentId)}
			onDoubleClick={() => pages().pin(tabId, page.agentId)}
			onKeyDown={event => {
				if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
					event.preventDefault();
					pages().show(tabId, page.agentId);
				}
			}}
			role="tab"
			tabIndex={selected ? 0 : -1}
			title={`${parentLabel} › ${title}`}
		>
			{beside ? (
				<Columns2 aria-hidden className="shrink-0 text-[var(--omsk-dim)]" size={11} />
			) : (
				<CornerDownRight aria-hidden className="shrink-0 text-[var(--omsk-dim)]" size={12} />
			)}
			<AgentSignal activity={activity} />
			<span className={cx("min-w-0 flex-1 truncate", !page.pinned && "italic")} data-tab-title>
				{title}
			</span>
			<button
				aria-label={t("agents.page.closePage")}
				className={cx(
					"omsk-pressable -mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--omsk-dim)] hover:bg-[var(--omsk-bg-primary)] hover:text-[var(--omsk-text)]",
					selected || visible ? "flex" : "hidden group-hover:flex",
				)}
				onClick={event => {
					event.stopPropagation();
					pages().close(tabId, page.agentId);
				}}
				title={t("agents.page.closePage")}
				type="button"
			>
				<X size={11} />
			</button>
		</div>
	);
}
