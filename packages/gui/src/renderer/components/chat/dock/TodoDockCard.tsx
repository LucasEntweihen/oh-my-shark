/**
 * Todo dock card: the live todo list rendered in the center dock above the
 * composer (previously the workspace drawer's todo tab). Phases as
 * collapsible sections, status badges, inline edit on double-click, drag
 * reorder via @dnd-kit, persisted through the set_todos RPC. Renders nothing
 * when the session has no todos and no reminder pending.
 */

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	AlertCircle,
	AlertTriangle,
	Check,
	CheckCircle2,
	ChevronRight,
	Circle,
	GripVertical,
	ListTodo,
	Pencil,
	X,
	XCircle,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { TodoPhase, TodoTask } from "../../../../shared/rpc-types";
import { useT } from "../../../lib/i18n";
import { isImeKeyEvent } from "../../../lib/ime";
import { onEscape } from "../../../lib/keymap";
import { type OptimisticTarget, optimisticWrite } from "../../../lib/optimistic";
import { useTabRpc } from "../../../lib/tab-rpc";
import { sessionRuntimeStore, useRuntimeTabId } from "../../../stores/session-runtime-context";
import { toast } from "../../../stores/toast";
import { type TodoStore, type UiTodoPhase, type UiTodoTask, useTodoStore } from "../../../stores/todo";
import { anchorFromEvent, ContextMenu, type ContextMenuAnchor, type ContextMenuItem } from "../../common/ContextMenu";
import { DockCard } from "./DockCard";
import { buildTodoDockSummary } from "./dock-summary";
import { useWorkspaceDockFocus } from "./WorkspaceDockFocus";

const STATUS_LABEL_KEY: Record<TodoTask["status"], string> = {
	pending: "todoPanel.status.pending",
	in_progress: "todoPanel.status.inProgress",
	completed: "todoPanel.status.completed",
	abandoned: "todoPanel.status.abandoned",
};

/**
 * Abandoned is a verdict about a task, not a step on the way to done, so it
 * stays out of the click loop: it is set from the row's context menu, and a
 * click on an abandoned task returns it to pending.
 */
const STATUS_CYCLE: TodoTask["status"][] = ["pending", "in_progress", "completed"];

function nextStatus(current: TodoTask["status"]): TodoTask["status"] {
	return STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length] ?? "pending";
}

function TodoStatusIcon({ status }: { status: TodoTask["status"] }) {
	if (status === "in_progress") {
		return <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--omsk-link)]" />;
	}
	if (status === "completed") {
		return <CheckCircle2 aria-hidden="true" className="text-[var(--omsk-muted)]" size={15} />;
	}
	if (status === "abandoned") {
		return <AlertCircle aria-hidden="true" className="text-[var(--omsk-error)]" size={15} />;
	}
	return <Circle aria-hidden="true" className="text-[var(--omsk-dim)]" size={15} strokeDasharray="2.5 2.5" />;
}

function todoPayload(phases: UiTodoPhase[]): TodoPhase[] {
	return phases.map(phase => ({
		name: phase.name,
		tasks: phase.tasks.map(task => ({ content: task.content, status: task.status })),
	}));
}

interface SortableTaskRowProps {
	task: UiTodoTask;
	phaseId: string;
	onPatch: (phaseId: string, taskId: string, patch: Partial<UiTodoTask>) => void;
}

const SortableTaskRow = memo(function SortableTaskRow({ task, phaseId, onPatch }: SortableTaskRowProps) {
	const t = useT();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(task.content);
	const [statusMenu, setStatusMenu] = useState<ContextMenuAnchor>();
	const statusItems: ContextMenuItem[] = [
		{
			danger: true,
			id: "abandoned",
			icon: XCircle,
			label: t("todoPanel.markAbandoned"),
			onSelect: () => {
				setStatusMenu(undefined);
				onPatch(phaseId, task.id, { status: "abandoned" });
			},
		},
	];
	const commit = () => {
		const content = draft.trim();
		setEditing(false);
		if (content && content !== task.content) onPatch(phaseId, task.id, { content });
		else setDraft(task.content);
	};

	return (
		<div
			className={`group flex min-h-8 items-start gap-1.5 rounded-md px-1 py-1.5 text-omsk-md leading-relaxed transition-colors ${
				isDragging ? "z-10 bg-(--omsk-selected-bg) shadow-md shadow-black/30" : "hover:bg-(--omsk-bg-tertiary)"
			}`}
			ref={setNodeRef}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
					: undefined,
				transition,
			}}
		>
			<button
				aria-label={t("todoPanel.reorder")}
				className="grid size-6 shrink-0 cursor-grab place-items-center text-(--omsk-dim) opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
				{...attributes}
				{...listeners}
				type="button"
			>
				<GripVertical size={12} />
			</button>
			<button
				aria-label={t("todoPanel.statusAria", {
					status: t(STATUS_LABEL_KEY[task.status] ?? "todoPanel.status.pending"),
				})}
				className="omsk-pressable flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
				onClick={() => onPatch(phaseId, task.id, { status: nextStatus(task.status) })}
				onContextMenu={event => setStatusMenu(anchorFromEvent(event))}
				title={t("todoPanel.cycleHint")}
				type="button"
			>
				<TodoStatusIcon status={task.status} />
			</button>
			{statusMenu && (
				<ContextMenu
					items={statusItems}
					onClose={() => setStatusMenu(undefined)}
					x={statusMenu.x}
					y={statusMenu.y}
				/>
			)}
			{editing ? (
				<div
					className="flex min-w-0 flex-1 flex-wrap items-start justify-end gap-1"
					onBlur={event => {
						if (!event.currentTarget.contains(event.relatedTarget)) commit();
					}}
				>
					<textarea
						autoFocus
						aria-label={t("todoPanel.edit")}
						className="min-h-8 w-full min-w-0 resize-y rounded-md border border-(--omsk-border-accent) bg-(--omsk-input-bg) px-2 py-1 text-omsk-md text-(--omsk-text) [field-sizing:content] focus:outline-none"
						rows={2}
						onChange={event => setDraft(event.target.value)}
						onKeyDown={event => {
							if (isImeKeyEvent(event)) return;
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								commit();
							}
							onEscape(event, () => {
								setDraft(task.content);
								setEditing(false);
							});
						}}
						value={draft}
					/>
					<button aria-label={t("common.save")} className="text-(--omsk-success)" onClick={commit} type="button">
						<Check size={12} />
					</button>
					<button
						aria-label={t("common.cancel")}
						className="text-(--omsk-muted)"
						onClick={() => {
							setDraft(task.content);
							setEditing(false);
						}}
						type="button"
					>
						<X size={12} />
					</button>
				</div>
			) : (
				<>
					<span
						className={`min-w-0 flex-1 whitespace-pre-wrap wrap-anywhere ${
							task.status === "abandoned"
								? "text-(--omsk-dim) line-through"
								: task.status === "completed"
									? "text-(--omsk-muted)"
									: "text-(--omsk-text)"
						}`}
						onDoubleClick={() => {
							setDraft(task.content);
							setEditing(true);
						}}
						title={task.content}
					>
						{task.content}
					</span>
					<button
						aria-label={t("todoPanel.edit")}
						className="grid size-6 shrink-0 place-items-center rounded text-(--omsk-dim) opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-(--omsk-text)"
						onClick={() => {
							setDraft(task.content);
							setEditing(true);
						}}
						type="button"
					>
						<Pencil size={11} />
					</button>
				</>
			)}
		</div>
	);
});

function PhaseSection({
	phase,
	fullPhase,
	hideHeader,
	collapsed,
	onToggle,
	onPatch,
}: {
	phase: UiTodoPhase;
	fullPhase?: UiTodoPhase;
	hideHeader: boolean;
	collapsed: boolean;
	onToggle: () => void;
	onPatch: (phaseId: string, taskId: string, patch: Partial<UiTodoTask>) => void;
}) {
	const t = useT();
	const countSource = fullPhase ?? phase;
	const done = countSource.tasks.filter(task => task.status === "completed").length;
	const total = countSource.tasks.length;

	return (
		<section className="mb-2 last:mb-0">
			{!hideHeader && (
				<button
					aria-expanded={!collapsed}
					className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-(--omsk-bg-tertiary)"
					onClick={onToggle}
					type="button"
				>
					<ChevronRight
						className="omsk-disclosure-chevron mt-0.5 shrink-0 text-(--omsk-dim)"
						size={12}
						style={{ transform: collapsed ? undefined : "rotate(90deg)" }}
					/>
					<span className="min-w-0 flex-1 wrap-anywhere text-omsk-sm font-semibold text-(--omsk-text)">
						{phase.name}
					</span>
					<span className="shrink-0 text-omsk-xs tabular-nums text-(--omsk-dim)">
						{done}/{total}
					</span>
				</button>
			)}
			{(hideHeader || !collapsed) && (
				<SortableContext items={phase.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
					<div className={hideHeader ? undefined : "ml-2 border-l border-(--omsk-border-muted) pl-1.5"}>
						{phase.tasks.map(task => (
							<SortableTaskRow key={task.id} onPatch={onPatch} phaseId={phase.id} task={task} />
						))}
						{total === 0 && (
							<div className="py-1 text-omsk-sm text-(--omsk-dim) italic">{t("todoPanel.noTasks")}</div>
						)}
					</div>
				</SortableContext>
			)}
		</section>
	);
}

export function TodoDockCard() {
	const rpc = useTabRpc();
	const tabId = useRuntimeTabId();
	const todoStore = sessionRuntimeStore<TodoStore>(tabId, "todo") ?? useTodoStore;
	const t = useT();
	const { managed, focusedCard, focusCard, clearFocus } = useWorkspaceDockFocus();
	const focused = focusedCard === "todo";
	const showFull = !managed || focused;
	const phases = useTodoStore(state => state.phases) ?? [];
	const reminderVisible = useTodoStore(state => state.reminderVisible) ?? false;
	const reminderTodos = useTodoStore(state => state.reminderTodos) ?? [];
	const clearReminder = useTodoStore(state => state.clearReminder);
	const setPhases = useTodoStore(state => state.setPhases);

	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	/* The dock edits through setPhases, which archives each change as a
	   transcript snapshot — so both the optimistic value and its rollback go
	   through it instead of assigning `phases` behind the archive's back. */
	const writes = useMemo<OptimisticTarget<TodoStore>>(
		() => ({
			getState: () => todoStore.getState(),
			setState: partial => {
				if (partial.phases) setPhases(partial.phases);
				else todoStore.setState(partial);
			},
		}),
		[setPhases, todoStore],
	);

	const applyPhases = useCallback(
		(next: UiTodoPhase[]) => {
			void optimisticWrite({
				store: writes,
				mutate: () => ({ phases: next }),
				persist: () => rpc.setTodos(todoPayload(next)),
				onFailure: message => toast({ variant: "error", title: t("todoPanel.updateFailed"), message }),
			});
		},
		[rpc, t, writes],
	);

	const patchTask = useCallback(
		(phaseId: string, taskId: string, patch: Partial<UiTodoTask>) => {
			const next = phases.map(phase =>
				phase.id !== phaseId
					? phase
					: {
							...phase,
							tasks: phase.tasks.map(task => (task.id === taskId ? { ...task, ...patch } : task)),
						},
			);
			applyPhases(next);
		},
		[phases, applyPhases],
	);

	const onDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;
			const phase = phases.find(p => p.tasks.some(task => task.id === active.id));
			if (!phase) return;
			const from = phase.tasks.findIndex(task => task.id === active.id);
			const to = phase.tasks.findIndex(task => task.id === over.id);
			if (from < 0 || to < 0) return;
			applyPhases(phases.map(p => (p.id === phase.id ? { ...p, tasks: arrayMove(p.tasks, from, to) } : p)));
		},
		[phases, applyPhases],
	);

	const togglePhase = useCallback((id: string) => {
		setCollapsed(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const taskCounts = useMemo(() => {
		const tasks = phases.flatMap(phase => phase.tasks);
		return {
			running: tasks.filter(task => task.status === "in_progress").length,
			pending: tasks.filter(task => task.status === "pending").length,
			completed: tasks.filter(task => task.status === "completed").length,
		};
	}, [phases]);
	const taskSummary =
		taskCounts.running > 0 && taskCounts.pending > 0
			? t("dock.todo.runningAndPending", taskCounts)
			: taskCounts.running > 0
				? t("dock.todo.running", taskCounts)
				: taskCounts.pending > 0
					? t("dock.todo.pending", taskCounts)
					: t("dock.todo.completed", taskCounts);
	const summary = useMemo(() => buildTodoDockSummary(phases), [phases]);
	const displayedPhases = showFull ? phases : summary.phases;

	useEffect(() => {
		if (focused && phases.length === 0 && !reminderVisible) clearFocus();
	}, [clearFocus, focused, phases.length, reminderVisible]);

	if (phases.length === 0 && !reminderVisible) return null;

	return (
		<DockCard
			badge={
				<span className="min-w-0 wrap-anywhere text-omsk-xs tabular-nums text-(--omsk-muted)">{taskSummary}</span>
			}
			expandable
			icon={ListTodo}
			id="todo"
			title={t("dock.todo")}
		>
			<div className="space-y-2 px-2.5 py-2">
				{showFull && summary.totalCount > 0 && (
					<div className="flex items-center gap-2 px-1">
						<div
							aria-label={t("dock.todo")}
							aria-valuenow={taskCounts.completed}
							aria-valuemin={0}
							aria-valuemax={summary.totalCount}
							className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-(--omsk-border-muted)"
							role="progressbar"
						>
							<div
								className="h-full rounded-full bg-(--omsk-success)"
								style={{ width: `${(taskCounts.completed / summary.totalCount) * 100}%` }}
							/>
						</div>
						<span className="shrink-0 text-omsk-xs tabular-nums text-(--omsk-muted)">
							{taskCounts.completed}/{summary.totalCount}
						</span>
					</div>
				)}
				{reminderVisible && (
					<div className="mb-1.5 flex items-start gap-2 rounded-md border border-[color-mix(in_srgb,var(--omsk-warning)_40%,transparent)] bg-transparent px-2.5 py-2">
						<AlertTriangle className="mt-px shrink-0 text-(--omsk-warning)" size={13} />
						<div className="min-w-0 flex-1 text-omsk-sm leading-snug text-(--omsk-warning)">
							<span className="font-semibold">{t("todoPanel.reminder")}</span>
							<span className="text-(--omsk-muted)">
								{` — ${t("todoPanel.reminderCount", { count: reminderTodos.length })}`}
							</span>
						</div>
						<button
							aria-label={t("todoPanel.dismissReminder")}
							className="shrink-0 text-(--omsk-warning) opacity-70 transition-opacity hover:opacity-100"
							onClick={clearReminder}
							type="button"
						>
							<X size={12} />
						</button>
					</div>
				)}
				<DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
					{displayedPhases.map(phase => (
						<PhaseSection
							collapsed={collapsed.has(phase.id)}
							fullPhase={phases.find(candidate => candidate.id === phase.id)}
							hideHeader={phases.length === 1}
							key={phase.id}
							onPatch={patchTask}
							onToggle={() => togglePhase(phase.id)}
							phase={phase}
						/>
					))}
				</DndContext>
				{managed && !focused && summary.hiddenCount > 0 && (
					<button
						className="omsk-pressable mt-1 flex w-full items-center justify-center rounded-md border border-dashed border-[var(--omsk-border-muted)] px-2 py-1.5 text-omsk-xs font-medium text-[var(--omsk-link)] hover:border-[var(--omsk-border-strong)]"
						onClick={() => focusCard("todo")}
						type="button"
					>
						{t("dock.viewAllTodos", { hidden: summary.hiddenCount, total: summary.totalCount })}
					</button>
				)}
			</div>
		</DockCard>
	);
}
