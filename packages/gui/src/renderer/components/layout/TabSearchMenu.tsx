/**
 * Searchable list of the window's tabs (gui#30), opened from the strip's "all
 * tabs" button to reach chips scrolled out of view, and from a chip's "Split
 * with…" to pick the partner. A split pair is one row, like its merged chip.
 */

import { Check, Columns2, GitBranch, MessageCircle, Pin, RotateCcw, Rows2, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionKind } from "../../../shared/ipc-types";
import { cx } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { isImeKeyEvent } from "../../lib/ime";
import { onEscape } from "../../lib/keymap";
import type { SplitAxis } from "../../stores/tabs";

export interface TabSearchEntry {
	/** The tab a pick selects. */
	tabId: string;
	/** One title per tab: two for a pair, in pane order. */
	labels: string[];
	/** Workspace names, searched along with the titles. */
	detail: string;
	/** Set for a pair: how its panes sit. */
	axis?: SplitAxis;
	current: boolean;
	kind?: SessionKind;
	worktree?: boolean;
	pinned?: boolean;
	running?: boolean;
	shortcutHint?: string;
}

type TabFilter = "all" | "agent" | "chat" | "running";

export function TabSearchMenu({
	x,
	y,
	title,
	entries,
	hasClosedTabs,
	onReopenClosed,
	onPick,
	onClose,
}: {
	/** Viewport coordinates for the menu's top-left corner. */
	x: number;
	y: number;
	title?: string;
	entries: readonly TabSearchEntry[];
	hasClosedTabs?: boolean;
	onReopenClosed?: () => void;
	onPick: (tabId: string) => void;
	onClose: () => void;
}) {
	const t = useT();
	const menuRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<TabFilter>("all");
	const [activeIndex, setActiveIndex] = useState(0);
	const [pos, setPos] = useState({ left: x, top: y });

	const matches = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return entries.filter(entry => {
			if (filter === "agent" && entry.kind === "chat") return false;
			if (filter === "chat" && entry.kind !== "chat") return false;
			if (filter === "running" && !entry.running) return false;
			if (!needle) return true;
			return [...entry.labels, entry.detail].some(text => text.toLowerCase().includes(needle));
		});
	}, [entries, filter, query]);

	useLayoutEffect(() => {
		const menu = menuRef.current;
		if (!menu) return;
		const left = Math.min(x, window.innerWidth - (menu.offsetWidth || 0) - 8);
		const top = Math.min(y, window.innerHeight - (menu.offsetHeight || 0) - 8);
		setPos({ left: Math.max(8, left), top: Math.max(8, top) });
	}, [x, y]);

	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	useEffect(() => {
		const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const onDown = (event: PointerEvent) => {
			if (!menuRef.current?.contains(event.target as globalThis.Node | null)) onCloseRef.current();
		};
		document.addEventListener("pointerdown", onDown);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			if (restore?.isConnected) restore.focus();
		};
	}, []);

	useEffect(() => {
		menuRef.current
			?.querySelector<HTMLElement>(`[data-tab-search-index="${activeIndex}"]`)
			?.scrollIntoView?.({ block: "nearest" });
	}, [activeIndex]);

	const pick = (entry: TabSearchEntry | undefined) => {
		if (!entry) return;
		onClose();
		onPick(entry.tabId);
	};

	const filters: ReadonlyArray<{ id: TabFilter; label: string }> = [
		{ id: "all", label: t("tabs.filter.all") },
		{ id: "agent", label: t("tabs.filter.agent") },
		{ id: "chat", label: t("tabs.filter.chat") },
		{ id: "running", label: t("tabs.filter.running") },
	];

	return createPortal(
		<div
			ref={menuRef}
			role="dialog"
			aria-label={title ?? t("tabs.allTabs")}
			style={{ left: pos.left, top: pos.top }}
			onKeyDown={event => {
				if (isImeKeyEvent(event)) return;
				if (onEscape(event, onClose)) {
					event.stopPropagation();
					return;
				}
				if (event.key === "Tab") {
					event.preventDefault();
					onClose();
				} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
					event.preventDefault();
					if (matches.length === 0) return;
					const delta = event.key === "ArrowDown" ? 1 : -1;
					setActiveIndex(current => (current + delta + matches.length) % matches.length);
				} else if (event.key === "Enter") {
					event.preventDefault();
					pick(matches[activeIndex]);
				}
			}}
			className="omsk-pop-in fixed z-50 flex max-h-[min(30rem,74vh)] w-84 flex-col overflow-hidden rounded-xl border border-[var(--omsk-border)] bg-[var(--omsk-bg-elevated)] shadow-xl backdrop-blur-md"
		>
			{title && <div className="truncate px-3 pt-2.5 text-omsk-xs font-medium text-[var(--omsk-dim)]">{title}</div>}
			<label className="flex shrink-0 items-center gap-2 border-b border-[var(--omsk-border-muted)] px-3 py-2">
				<Search aria-hidden size={13} strokeWidth={1.65} className="shrink-0 text-[var(--omsk-dim)]" />
				<input
					autoFocus
					value={query}
					onChange={event => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					placeholder={t("tabs.search")}
					aria-label={t("tabs.search")}
					className="min-w-0 flex-1 bg-transparent text-omsk-md text-[var(--omsk-text)] outline-none placeholder:text-[var(--omsk-dim)]"
				/>
			</label>
			{entries.length > 2 && (
				<div className="flex shrink-0 items-center gap-1 border-b border-[var(--omsk-border-muted)] px-2.5 py-1.5">
					{filters.map(item => (
						<button
							key={item.id}
							type="button"
							aria-pressed={filter === item.id}
							onClick={() => {
								setFilter(item.id);
								setActiveIndex(0);
							}}
							className={cx(
								"omsk-pressable rounded-md px-2 py-0.5 text-omsk-xs font-medium",
								filter === item.id
									? "bg-[var(--omsk-selected-bg)] text-[var(--omsk-accent)]"
									: "text-[var(--omsk-dim)] hover:text-[var(--omsk-text)]",
							)}
						>
							{item.label}
						</button>
					))}
				</div>
			)}
			<div role="listbox" aria-label={title ?? t("tabs.allTabs")} className="min-h-0 overflow-y-auto py-1">
				{matches.length === 0 ? (
					<div className="px-3 py-3 text-omsk-sm text-[var(--omsk-dim)]">{t("tabs.searchEmpty")}</div>
				) : (
					matches.map((entry, index) => {
						const PairIcon = entry.axis === "rows" ? Rows2 : Columns2;
						return (
							<div
								key={entry.tabId}
								role="option"
								tabIndex={-1}
								aria-selected={index === activeIndex}
								data-tab-search-index={index}
								onPointerMove={() => setActiveIndex(index)}
								onClick={() => pick(entry)}
								onKeyDown={() => {}}
								className={cx(
									"mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-omsk-md",
									index === activeIndex ? "bg-[var(--omsk-selected-bg)]" : "",
								)}
							>
								{entry.axis ? (
									<PairIcon aria-hidden size={12} className="shrink-0 text-[var(--omsk-accent)]" />
								) : entry.pinned ? (
									<Pin aria-hidden size={11} className="shrink-0 text-[var(--omsk-accent)]" />
								) : entry.worktree ? (
									<GitBranch aria-hidden size={11} className="shrink-0 text-[var(--omsk-accent)]" />
								) : entry.kind === "chat" ? (
									<MessageCircle aria-hidden size={11} className="shrink-0 text-[var(--omsk-muted)]" />
								) : (
									<span
										aria-hidden
										className={cx(
											"h-1.5 w-1.5 shrink-0 rounded-full",
											entry.running ? "bg-[var(--omsk-accent)]" : "bg-[var(--omsk-dim)]/40",
										)}
									/>
								)}
								<span className="flex min-w-0 flex-1 flex-col leading-tight">
									<span className="flex min-w-0 items-center gap-1.5 text-[var(--omsk-text)]">
										{entry.labels.map((label, labelIndex) => (
											<span key={label + String(labelIndex)} className="flex min-w-0 items-center gap-1.5">
												{labelIndex > 0 && (
													<span aria-hidden className="text-[var(--omsk-dim)]">
														│
													</span>
												)}
												<span className="truncate">{label}</span>
											</span>
										))}
									</span>
									<span className="truncate text-omsk-xs text-[var(--omsk-dim)]">{entry.detail}</span>
								</span>
								{entry.shortcutHint && (
									<kbd className="shrink-0 rounded border border-[var(--omsk-border-muted)] px-1 font-mono text-omsk-xxs text-[var(--omsk-dim)]">
										{entry.shortcutHint}
									</kbd>
								)}
								{entry.current && (
									<Check
										aria-label={t("tabs.current")}
										size={13}
										className="shrink-0 text-[var(--omsk-accent)]"
									/>
								)}
							</div>
						);
					})
				)}
			</div>
			{hasClosedTabs && onReopenClosed && (
				<div className="border-t border-[var(--omsk-border-muted)] p-1.5">
					<button
						type="button"
						onClick={() => {
							onClose();
							onReopenClosed();
						}}
						className="omsk-pressable flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-omsk-sm font-medium text-[var(--omsk-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)]"
					>
						<RotateCcw size={12} strokeWidth={1.65} />
						<span>{t("tabs.menu.reopenClosed")}</span>
					</button>
				</div>
			)}
		</div>,
		document.body,
	);
}
