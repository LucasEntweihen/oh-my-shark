/**
 * Knowledge tab: exactly what omsk brings into every task for this project —
 * the person's notes, the summary omsk rebuilt from past sessions, and the
 * lessons it captured — with the token budget they share.
 */
import { BookOpen, ChevronRight, Lightbulb, Pin, RefreshCw, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { RpcMemoryListEntry, RpcMemoryOverview } from "../../../shared/rpc-types";
import { cx } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { MarkdownRenderer } from "../../lib/markdown";
import { toast } from "../../stores/toast";
import { Button } from "../common";
import { AddNote, MemoryEntryRow, useArmed } from "./MemoryEntries";
import { compactTokens, groupSources } from "./memory-model";
import type { MemoryProject } from "./use-memory-project";

/** Notes the agent accepts per project (MAX_MEMORY_NOTES). */
const MAX_NOTES = 50;

function BudgetMeter({ overview }: { overview: RpcMemoryOverview }) {
	const t = useT();
	const { tokens } = overview.injection;
	const used = tokens.notes + tokens.summary + tokens.learned;
	const budget = Math.max(tokens.budget, 1);
	const segments = [
		{ id: "notes", tokens: tokens.notes, className: "bg-(--omsk-accent)", label: t("memory.meter.notes") },
		{
			id: "summary",
			tokens: tokens.summary,
			className: "bg-(--omsk-text-secondary)",
			label: t("memory.meter.summary"),
		},
		{ id: "lessons", tokens: tokens.learned, className: "bg-(--omsk-warning)", label: t("memory.meter.lessons") },
	];
	return (
		<div className="flex min-w-44 flex-col items-end gap-1.5">
			<span className="text-omsk-xs tabular-nums text-(--omsk-muted)">
				{t("memory.meter.label", { used: compactTokens(used), budget: compactTokens(tokens.budget) })}
			</span>
			<div
				aria-label={t("memory.meter.label", { used: compactTokens(used), budget: compactTokens(tokens.budget) })}
				className="flex h-1.5 w-44 gap-px overflow-hidden rounded-full bg-(--omsk-border-muted)"
				role="img"
			>
				{segments.map(segment =>
					segment.tokens > 0 ? (
						<span
							className={cx("h-full first:rounded-l-full", segment.className)}
							key={segment.id}
							style={{ width: `${Math.min(100, (segment.tokens / budget) * 100)}%` }}
							title={`${segment.label} · ${compactTokens(segment.tokens)}`}
						/>
					) : null,
				)}
			</div>
			<div className="flex gap-2.5 text-omsk-xxs text-(--omsk-dim)">
				{segments.map(segment => (
					<span className="flex items-center gap-1" key={segment.id}>
						<span className={cx("size-1.5 rounded-full", segment.className)} />
						{segment.label}
					</span>
				))}
			</div>
		</div>
	);
}

function Section({
	icon,
	title,
	count,
	aside,
	children,
}: {
	icon: ReactNode;
	title: string;
	count?: string;
	aside?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<header className="flex items-center gap-2 px-2">
				<span className="text-(--omsk-dim)">{icon}</span>
				<h3 className="text-omsk-sm font-semibold tracking-wide text-(--omsk-text-secondary) uppercase">{title}</h3>
				{count && <span className="text-omsk-xs tabular-nums text-(--omsk-dim)">{count}</span>}
				<span className="flex-1" />
				{aside}
			</header>
			{children}
		</section>
	);
}

function OverBudget() {
	const t = useT();
	return (
		<span
			className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full border border-(--omsk-border-muted) px-1.5 align-middle text-omsk-xxs font-medium text-(--omsk-dim)"
			title={t("memory.lessons.overBudgetHint")}
		>
			{t("memory.lessons.overBudget")}
		</span>
	);
}

function SummaryEmpty({
	overview,
	onUpdate,
	updating,
}: {
	overview: RpcMemoryOverview;
	onUpdate: () => void;
	updating: boolean;
}) {
	const t = useT();
	const groups = groupSources(overview.sources);
	const ready = groups.pending.filter(source => source.state === "queued").length;
	const waiting = groups.pending.filter(source => source.state === "waiting").length;
	let body: string;
	if (updating) body = t("memory.summary.emptyReading");
	else if (ready > 0) body = t("memory.summary.emptyReady", { count: ready, plural: ready === 1 ? "" : "s" });
	else if (waiting > 0)
		body = t("memory.summary.emptyWaiting", {
			count: waiting,
			plural: waiting === 1 ? "" : "s",
			hours: overview.limits.idleHours,
		});
	else body = t("memory.summary.emptyNone", { hours: overview.limits.idleHours });
	return (
		<div className="omsk-card flex items-start gap-3 px-4 py-3.5">
			<Sparkles aria-hidden="true" className="mt-0.5 shrink-0 text-(--omsk-dim)" size={15} />
			<div className="min-w-0 flex-1">
				<p className="text-omsk-md text-(--omsk-text)">{t("memory.summary.emptyTitle")}</p>
				<p className="mt-0.5 text-omsk-sm leading-relaxed text-(--omsk-muted)">{body}</p>
			</div>
			{!updating && (ready > 0 || waiting > 0) && (
				<Button className="shrink-0" icon={<RefreshCw size={12} />} onClick={onUpdate} size="sm">
					{t("memory.update.label")}
				</Button>
			)}
		</div>
	);
}

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<div>
			<button
				aria-expanded={open}
				className="flex items-center gap-1.5 rounded-md px-2 py-1 text-omsk-sm text-(--omsk-muted) transition-colors hover:text-(--omsk-text)"
				onClick={() => setOpen(value => !value)}
				type="button"
			>
				<ChevronRight
					aria-hidden="true"
					className={cx("transition-transform duration-(--omsk-motion-fast)", open && "rotate-90")}
					size={13}
				/>
				{title}
			</button>
			{open && <div className="mt-2 flex flex-col gap-3 pl-2">{children}</div>}
		</div>
	);
}

export function KnowledgeView({
	overview,
	project,
	onUpdate,
	updating,
}: {
	overview: RpcMemoryOverview;
	project: MemoryProject;
	onUpdate: () => void;
	updating: boolean;
}) {
	const t = useT();
	const { armed, arm } = useArmed();
	const { injection } = overview;
	const notesFull = overview.notes.length >= MAX_NOTES;

	const keepAsNote = async (lesson: RpcMemoryListEntry) => {
		const added = await project.edit({ kind: "note", action: "add", text: lesson.text });
		if (!added?.ok) {
			if (added) toast({ variant: "warning", message: t(`memory.edit.${added.reason}`) });
			return;
		}
		await project.edit({ kind: "lesson", action: "delete", line: lesson.line });
		toast({ variant: "success", message: t("memory.lessons.kept") });
	};

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-6 py-5">
			<div className="flex items-start justify-between gap-6">
				<div className="min-w-0">
					<h2 className="text-omsk-lg font-semibold text-(--omsk-text)">{t("memory.knowledge.title")}</h2>
					<p className="mt-1 text-omsk-sm leading-relaxed text-(--omsk-muted)">{t("memory.knowledge.caption")}</p>
				</div>
				<BudgetMeter overview={overview} />
			</div>

			<Section
				count={overview.notes.length > 0 ? `${overview.notes.length}/${MAX_NOTES}` : undefined}
				icon={<Pin size={13} />}
				title={t("memory.notes.title")}
			>
				<div className="px-2">
					<AddNote full={notesFull} onAdd={text => project.edit({ kind: "note", action: "add", text })} />
				</div>
				{overview.notes.length > 0 ? (
					<ul className="flex flex-col">
						{overview.notes.map((note, index) => (
							<MemoryEntryRow
								armed={armed === `note:${note.line}`}
								dimmed={index >= injection.notesIncluded}
								entry={note}
								key={note.line}
								kind="note"
								marker={index >= injection.notesIncluded ? <OverBudget /> : undefined}
								onArm={() => arm(`note:${note.line}`)}
								onDelete={() => project.edit({ kind: "note", action: "delete", line: note.line })}
								onSave={text => project.edit({ kind: "note", action: "update", line: note.line, text })}
							/>
						))}
					</ul>
				) : (
					<p className="px-2 text-omsk-sm text-(--omsk-dim)">{t("memory.notes.empty")}</p>
				)}
			</Section>

			<Section
				aside={
					injection.summaryTruncated && overview.summary ? (
						<span className="text-omsk-xs text-(--omsk-dim)" title={t("memory.summary.truncatedHint")}>
							{t("memory.summary.truncated")}
						</span>
					) : undefined
				}
				icon={<BookOpen size={13} />}
				title={t("memory.summary.title")}
			>
				{overview.summary ? (
					<div className="omsk-card px-4 py-3 text-omsk-md">
						<MarkdownRenderer content={overview.summary} />
					</div>
				) : (
					<SummaryEmpty onUpdate={onUpdate} overview={overview} updating={updating} />
				)}
			</Section>

			{overview.lessons.length > 0 && (
				<Section
					count={String(overview.lessons.length)}
					icon={<Lightbulb size={13} />}
					title={t("memory.lessons.title")}
				>
					<p className="-mt-1 px-2 text-omsk-xs text-(--omsk-dim)">{t("memory.lessons.caption")}</p>
					<ul className="flex flex-col">
						{overview.lessons.map((lesson, index) => (
							<MemoryEntryRow
								armed={armed === `lesson:${lesson.line}`}
								dimmed={index >= injection.lessonsIncluded}
								entry={lesson}
								extraActions={[
									{
										id: "keep",
										label: t("memory.lessons.keep"),
										icon: <Pin size={13} />,
										onClick: () => void keepAsNote(lesson),
									},
								]}
								key={lesson.line}
								kind="lesson"
								marker={index >= injection.lessonsIncluded ? <OverBudget /> : undefined}
								onArm={() => arm(`lesson:${lesson.line}`)}
								onDelete={() => project.edit({ kind: "lesson", action: "delete", line: lesson.line })}
								onSave={text =>
									project.edit({
										kind: "lesson",
										action: "update",
										line: lesson.line,
										text,
										context: lesson.context,
									})
								}
							/>
						))}
					</ul>
				</Section>
			)}

			{(overview.full || overview.playbooks.length > 0) && (
				<Disclosure title={t("memory.full.title", { count: overview.playbooks.length })}>
					<p className="text-omsk-xs text-(--omsk-dim)">{t("memory.full.caption")}</p>
					{overview.full && (
						<div className="omsk-card max-h-96 overflow-y-auto px-4 py-3 text-omsk-sm">
							<MarkdownRenderer content={overview.full} />
						</div>
					)}
					{overview.playbooks.map(playbook => (
						<Disclosure key={playbook.name} title={playbook.description || playbook.name}>
							<div className="omsk-card max-h-80 overflow-y-auto px-4 py-3 text-omsk-sm">
								<MarkdownRenderer content={playbook.content} />
							</div>
						</Disclosure>
					))}
				</Disclosure>
			)}
		</div>
	);
}
