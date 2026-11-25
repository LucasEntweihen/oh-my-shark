/**
 * Shared building blocks for the Workspace drawer (Changes / Files / Logs):
 * one toolbar rhythm, one search field, one empty state, one file label and
 * one collapsible diff card, so the three views read as a single surface.
 */

import { ChevronRight, type LucideIcon, Search, X } from "lucide-react";
import { type MouseEvent, type ReactNode, useMemo } from "react";
import { type DiffLine, DiffView, parseDiff } from "../../lib/diff";
import { basename, cx, dirname } from "../../lib/format";
import { useT } from "../../lib/i18n";

/** The row directly under the drawer header: controls left, actions right. */
export function PanelToolbar({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cx("flex h-11 shrink-0 items-center gap-1.5 px-3", className)}>{children}</div>;
}

export function ToolbarIconButton({
	label,
	onClick,
	disabled,
	pressed,
	children,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	pressed?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			aria-pressed={pressed}
			disabled={disabled}
			onClick={onClick}
			className={cx(
				"omsk-pressable flex size-7 shrink-0 items-center justify-center rounded-md text-(--omsk-muted) hover:bg-(--omsk-selected-bg) hover:text-(--omsk-text) disabled:pointer-events-none disabled:opacity-40",
				pressed && "bg-(--omsk-selected-bg) text-(--omsk-text)",
			)}
		>
			{children}
		</button>
	);
}

/** Filter field with a leading icon and an inline clear control. */
export function PanelSearch({
	value,
	onChange,
	label,
	placeholder,
	title,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	label: string;
	placeholder?: string;
	title?: string;
	className?: string;
}) {
	const t = useT();
	return (
		<div className={cx("omsk-panel-search relative min-w-0 flex-1", className)}>
			<Search
				aria-hidden="true"
				size={13}
				className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-(--omsk-dim)"
			/>
			<input
				aria-label={label}
				placeholder={placeholder ?? label}
				title={title}
				value={value}
				onChange={event => onChange(event.target.value)}
				onKeyDown={event => {
					if (event.key === "Escape" && value) {
						event.stopPropagation();
						onChange("");
					}
				}}
				className={cx(
					"h-7 w-full rounded-md border border-transparent bg-(--omsk-selected-bg) pl-7.5 text-omsk-sm text-(--omsk-text) outline-none placeholder:text-(--omsk-dim) focus:border-(--omsk-input-focus-border) focus:bg-(--omsk-input-bg)",
					value ? "pr-7" : "pr-2",
				)}
			/>
			{value && (
				<button
					type="button"
					aria-label={t("logPanel.clearSearch")}
					onClick={() => onChange("")}
					className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-(--omsk-dim) hover:text-(--omsk-text)"
				>
					<X size={12} />
				</button>
			)}
		</div>
	);
}

/** Centered, quiet empty/edge state: icon, one line of title, optional hint and action. */
export function PanelEmpty({
	icon: Icon,
	title,
	hint,
	tone = "muted",
	action,
}: {
	icon: LucideIcon;
	title: ReactNode;
	hint?: ReactNode;
	tone?: "muted" | "success" | "error";
	action?: ReactNode;
}) {
	return (
		<div className="omsk-panel-empty flex flex-col items-center gap-2 px-6 py-12 text-center">
			<span
				aria-hidden="true"
				className={cx(
					"mb-1 flex size-9 items-center justify-center rounded-full bg-(--omsk-selected-bg)",
					tone === "success"
						? "text-(--omsk-success)"
						: tone === "error"
							? "text-(--omsk-error)"
							: "text-(--omsk-muted)",
				)}
			>
				<Icon size={17} strokeWidth={1.75} />
			</span>
			<p className="text-omsk-md font-medium text-(--omsk-text)">{title}</p>
			{hint && <p className="max-w-72 break-words text-omsk-sm leading-relaxed text-(--omsk-dim)">{hint}</p>}
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}

/** The file name gets first use of the available width; the folder uses what remains. */
export function FileLabel({ path, oldPath, className }: { path: string; oldPath?: string; className?: string }) {
	const base = basename(path) || path;
	const dir = dirname(path);
	const folder = dir === "/" || dir === "." ? (path.startsWith("/") && base !== path ? "/" : "") : dir;
	return (
		<span
			className={cx("flex min-w-0 items-baseline gap-1.5 overflow-hidden", className)}
			title={oldPath ? `${oldPath} → ${path}` : path}
		>
			<span className="max-w-full shrink-0 truncate text-(--omsk-text)">{base}</span>
			{(folder || oldPath) && (
				<span className="min-w-0 truncate text-omsk-xs text-(--omsk-dim)">{oldPath ? `${oldPath} →` : folder}</span>
			)}
		</span>
	);
}

export function DiffStat({ adds, removes, className }: { adds: number; removes: number; className?: string }) {
	return (
		<span className={cx("flex shrink-0 items-center gap-1.5 font-mono text-omsk-xs tabular-nums", className)}>
			<span className="text-(--omsk-diff-added)">+{adds}</span>
			<span className="text-(--omsk-diff-removed)">−{removes}</span>
		</span>
	);
}

export type GitChangeKind = "added" | "modified" | "deleted" | "renamed" | "untracked" | "conflict";

/** Porcelain XY status → one display kind (index side wins, worktree fills in). */
export function gitChangeKind(status: string): GitChangeKind {
	if (status === "??") return "untracked";
	if (status.includes("U") || status === "AA" || status === "DD") return "conflict";
	const code = status.trim()[0] ?? "M";
	if (code === "A" || code === "C") return "added";
	if (code === "D") return "deleted";
	if (code === "R") return "renamed";
	return "modified";
}

const CHANGE_LETTER: Record<GitChangeKind, string> = {
	added: "A",
	modified: "M",
	deleted: "D",
	renamed: "R",
	untracked: "U",
	conflict: "!",
};

const CHANGE_COLOR: Record<GitChangeKind, string> = {
	added: "text-(--omsk-diff-added)",
	untracked: "text-(--omsk-diff-added)",
	modified: "text-(--omsk-warning)",
	deleted: "text-(--omsk-diff-removed)",
	renamed: "text-(--omsk-accent)",
	conflict: "text-(--omsk-error)",
};

export function ChangeBadge({ kind }: { kind: GitChangeKind }) {
	const t = useT();
	const label = t(`diffPanel.status.${kind}`);
	return (
		<span
			role="img"
			aria-label={label}
			title={label}
			className={cx("w-3 shrink-0 text-center font-mono text-omsk-xs font-semibold", CHANGE_COLOR[kind])}
		>
			{CHANGE_LETTER[kind]}
		</span>
	);
}

/**
 * One file in a change list: a sticky header row that toggles an inline body.
 * The header never reflows when the body opens, so a list of cards scans like
 * a table and expands like a document.
 */
export function DiffFileCard({
	expanded,
	onToggle,
	leading,
	label,
	trailing,
	children,
	onContextMenu,
}: {
	expanded: boolean;
	onToggle: () => void;
	leading?: ReactNode;
	label: ReactNode;
	trailing?: ReactNode;
	children?: ReactNode;
	/** Right-click (or the context-menu key) on the header. */
	onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}) {
	return (
		<div className="omsk-diff-card" data-expanded={expanded}>
			<button
				type="button"
				aria-expanded={expanded}
				onClick={onToggle}
				onContextMenu={onContextMenu}
				className="omsk-diff-card-header flex h-8 w-full min-w-0 items-center gap-2 px-3 text-left text-omsk-sm"
			>
				<ChevronRight
					aria-hidden="true"
					size={13}
					className={cx("omsk-disclosure-chevron shrink-0 text-(--omsk-dim)", expanded && "rotate-90")}
				/>
				{leading}
				<span className="min-w-0 flex-1">{label}</span>
				{trailing}
			</button>
			{expanded && <div className="omsk-diff-card-body">{children}</div>}
		</div>
	);
}

/** Pair remove/add runs into side-by-side rows for split view. */
function toSplitRows(lines: DiffLine[]): { left: DiffLine | null; right: DiffLine | null }[] {
	const rows: { left: DiffLine | null; right: DiffLine | null }[] = [];
	let removes: DiffLine[] = [];
	let adds: DiffLine[] = [];
	const flush = () => {
		const width = Math.max(removes.length, adds.length);
		for (let i = 0; i < width; i++) rows.push({ left: removes[i] ?? null, right: adds[i] ?? null });
		removes = [];
		adds = [];
	};
	for (const line of lines) {
		if (line.type === "remove") {
			if (adds.length > 0) flush();
			removes.push(line);
		} else if (line.type === "add") {
			adds.push(line);
		} else {
			if (removes.length > 0 || adds.length > 0) flush();
			rows.push({ left: line, right: line });
		}
	}
	if (removes.length > 0 || adds.length > 0) flush();
	return rows;
}

const SPLIT_LINE_CLASS: Record<DiffLine["type"], string> = {
	add: "bg-[color-mix(in_srgb,var(--omsk-diff-added)_10%,transparent)] text-(--omsk-diff-added)",
	remove: "bg-[color-mix(in_srgb,var(--omsk-diff-removed)_10%,transparent)] text-(--omsk-diff-removed)",
	context: "text-(--omsk-diff-context)",
};

function SplitDiff({ diff }: { diff: string }) {
	const rows = useMemo(() => toSplitRows(parseDiff(diff)), [diff]);
	return (
		<div className="grid grid-cols-2 divide-x divide-(--omsk-border-muted) overflow-x-auto font-mono text-omsk-xs leading-[1.4]">
			{(["left", "right"] as const).map(side => (
				<div className="min-w-0 overflow-x-auto" key={side}>
					{rows.map((row, index) => {
						const line = row[side];
						const number = side === "left" ? line?.oldLine : line?.newLine;
						return (
							<div
								className={cx("flex whitespace-pre px-2", line ? SPLIT_LINE_CLASS[line.type] : "")}
								key={index}
							>
								<span
									aria-hidden
									className="mr-2 inline-block w-[4ch] shrink-0 select-none text-right opacity-50"
								>
									{line && number !== undefined ? number : ""}
								</span>
								<span>{line ? line.content || " " : " "}</span>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}

/** A diff in the user's chosen layout. */
export function DiffBody({ diff, filePath, split }: { diff: string; filePath?: string; split: boolean }) {
	return split ? <SplitDiff diff={diff} /> : <DiffView diff={diff} filePath={filePath} className="py-1" />;
}

/** Added/removed line counts of a unified diff. */
export function countDiffLines(diff: string): { adds: number; removes: number } {
	let adds = 0;
	let removes = 0;
	for (const line of parseDiff(diff)) {
		if (line.type === "add") adds++;
		else if (line.type === "remove") removes++;
	}
	return { adds, removes };
}
