/**
 * Theme picker: searchable overlay of the GUI's named themes, "system", and
 * the custom themes in ~/.omp/gui/themes (gui#38). Each card shows a live
 * swatch preview from the theme's token set. Selecting a theme applies it
 * live (inline `--omsk-*` tokens), persists the choice, and keeps the legacy
 * dark/light/system store coherent so the App effect and the settings window
 * stay in sync. A custom theme file that cannot be used is listed with why.
 * "New theme" and a custom row's pencil open the theme editor.
 */

import { AlertTriangle, Check, FolderOpen, Monitor, Palette, Pencil, RotateCcw, Search, Sliders } from "lucide-react";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
	clearColorOverrides,
	type ManualColorOverrides,
	readColorOverrides,
	saveColorOverrides,
} from "../../lib/color-overrides";
import { describeError } from "../../lib/errors";
import { cx, shortenPath } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { isImeKeyEvent } from "../../lib/ime";
import {
	applyThemeByName,
	customTheme,
	getPersistedThemeSelection,
	isCustomThemeSelection,
	resolveTokenColor,
	THEMES,
	type ThemeDefinition,
	type ThemeName,
	type ThemeSelection,
} from "../../lib/themes";
import { useCustomThemesStore } from "../../stores/custom-themes";
import { toast } from "../../stores/toast";
import { useUiStore } from "../../stores/ui";
import { Button, Modal } from "../common";

const SWATCH_KEYS = [
	"--omsk-accent",
	"--omsk-syntax-string",
	"--omsk-syntax-function",
	"--omsk-syntax-number",
] as const;

interface ThemeEntry {
	selection: ThemeSelection;
	label: string;
	description: string;
	/** null for "system", which has no fixed palette. */
	theme: ThemeDefinition | null;
	custom?: boolean;
	/** A custom theme's token entries that were left out. */
	skipped?: string[];
}

/**
 * Where the list opens when the chosen theme has no row (its file is broken
 * or gone): on its notice, until a key moves the cursor or a search starts.
 */
type NoticeLanding = "none" | "pending" | "landed";

/** Scrolls the chosen theme's notice into view once it is pending and rendered. */
function landOnNotice(landing: RefObject<NoticeLanding>, list: HTMLElement | null): void {
	if (landing.current !== "pending") return;
	const notice = list?.querySelector("[data-chosen-theme]");
	if (!notice) return;
	landing.current = "landed";
	notice.scrollIntoView({ block: "nearest" });
}

export function ThemePickerDialog() {
	const t = useT();
	const open = useUiStore(s => s.themePickerOpen);
	const close = useUiStore(s => s.closeThemePicker);
	const setTheme = useUiStore(s => s.setTheme);
	const openThemeEditor = useUiStore(s => s.openThemeEditor);

	const customDir = useCustomThemesStore(s => s.dir);
	const customEntries = useCustomThemesStore(s => s.entries);

	const [query, setQuery] = useState("");
	const [current, setCurrent] = useState<ThemeSelection>("sharkOcean");
	const [active, setActive] = useState(0);
	const [customizerOpen, setCustomizerOpen] = useState(false);
	const [overrides, setOverrides] = useState<ManualColorOverrides>(() => readColorOverrides());
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const landingRef = useRef<NoticeLanding>("none");

	const entries = useMemo<ThemeEntry[]>(
		() => [
			{ selection: "system", label: t("themePicker.system"), description: t("themePicker.systemDesc"), theme: null },
			// Locale keys mirror each stable built-in theme id.
			...(Object.keys(THEMES) as ThemeName[]).map(name => ({
				selection: name,
				label: t(`themePicker.theme.${name}.label`),
				description: t(`themePicker.theme.${name}.description`),
				theme: THEMES[name],
			})),
			...customEntries.flatMap(entry =>
				entry.theme
					? [
							{
								selection: entry.selection,
								label: entry.theme.label,
								description: entry.theme.description || t("themePicker.custom.from", { file: entry.fileName }),
								theme: entry.theme,
								custom: true,
								skipped: entry.skipped,
							},
						]
					: [],
			),
		],
		[t, customEntries],
	);
	const entriesRef = useRef(entries);
	entriesRef.current = entries;
	const broken = customEntries.filter(entry => !entry.theme);
	// The chosen custom theme's file is gone or broken: say what is on screen instead.
	const chosenId = isCustomThemeSelection(current) && customDir !== null ? current.slice("custom:".length) : null;
	const chosenFile = chosenId === null || /\.json$/i.test(chosenId) ? chosenId : `${chosenId}.json`;
	const chosenMissing = chosenFile !== null && !customEntries.some(entry => entry.selection === current);
	const chosenNote = isCustomThemeSelection(current)
		? t(customTheme(current) ? "themePicker.custom.keptLastGood" : "themePicker.custom.fallback")
		: "";

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return entries;
		return entries.filter(e => e.label.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
	}, [entries, query]);
	const firstCustom = filtered.findIndex(entry => entry.custom);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setQuery("");
		setActive(0);
		setOverrides(readColorOverrides());
		landingRef.current = "none";
		void getPersistedThemeSelection().then(sel => {
			if (cancelled) return;
			setCurrent(sel);
			// Read once per open: the custom list changing underneath keeps the cursor where it is.
			const index = entriesRef.current.findIndex(e => e.selection === sel);
			if (index < 0 && isCustomThemeSelection(sel)) landingRef.current = "pending";
			setActive(Math.max(0, index));
			// Reopened on the same theme, nothing re-renders, so the effect below would not run.
			requestAnimationFrame(() => landOnNotice(landingRef, listRef.current));
		});
		requestAnimationFrame(() => inputRef.current?.focus());
		return () => {
			cancelled = true;
		};
	}, [open]);

	const select = (entry: ThemeEntry) => {
		const sel = entry.selection;
		applyThemeByName(sel);
		setTheme(entry.theme ? entry.theme.scheme : "system");
		setCurrent(sel);
		toast({ variant: "success", message: t("themePicker.applied", { name: entry.label }) });
		close();
	};

	const onKey = (e: React.KeyboardEvent) => {
		if (isImeKeyEvent(e)) return;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") landingRef.current = "none";
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive(i => Math.min(filtered.length - 1, i + 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive(i => Math.max(0, i - 1));
		} else if (e.key === "Enter") {
			// A focused button (a theme row, Edit, New theme, Open folder) answers Enter itself.
			if (e.target !== inputRef.current) return;
			e.preventDefault();
			const entry = filtered[active];
			if (entry) select(entry);
		}
	};

	useEffect(() => {
		if (landingRef.current !== "none") return;
		listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
	}, [active]);

	// The notice renders once the theme files are in, so this checks after every render until it lands.
	useEffect(() => landOnNotice(landingRef, listRef.current));

	return (
		<Modal
			open={open}
			onClose={close}
			chromeless
			ariaLabel={t("themePicker.aria")}
			size="picker"
			placement="top"
			bodyClassName="p-0"
		>
			<div onKeyDown={onKey}>
				<div className="flex items-center gap-2 border-b border-[var(--omsk-border-muted)] px-4 py-3">
					<Search size={15} className="shrink-0 text-[var(--omsk-dim)]" />
					<input
						ref={inputRef}
						value={query}
						onChange={e => {
							landingRef.current = "none";
							setQuery(e.target.value);
							setActive(0);
						}}
						placeholder={t("themePicker.search")}
						className="w-full bg-transparent text-omsk-lg text-[var(--omsk-text)] outline-none placeholder:text-[var(--omsk-dim)]"
					/>
					<Button
						size="sm"
						variant={customizerOpen ? "primary" : "secondary"}
						aria-pressed={customizerOpen}
						onClick={() => setCustomizerOpen(prev => !prev)}
					>
						<Sliders size={13} />
						{t("themePicker.customizer.toggle")}
					</Button>
				</div>
				{customizerOpen && (
					<div className="border-b border-[var(--omsk-border-muted)] px-4 py-3">
						<div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-2">
							{(
								[
									{ key: "accent", label: t("themePicker.customizer.accent"), fallback: "#38bdf8" },
									{ key: "bgPrimary", label: t("themePicker.customizer.bgPrimary"), fallback: "#0a0c10" },
									{ key: "textPrimary", label: t("themePicker.customizer.textPrimary"), fallback: "#f1f5f9" },
									{ key: "oceanTop", label: t("themePicker.customizer.oceanTop"), fallback: "#092136" },
									{ key: "oceanBottom", label: t("themePicker.customizer.oceanBottom"), fallback: "#03070e" },
									{ key: "sharkColor", label: t("themePicker.customizer.sharkColor"), fallback: "#38bdf8" },
								] as const
							).map(field => {
								const val = overrides[field.key] ?? field.fallback;
								return (
									<label
										key={field.key}
										className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--omsk-border-muted)] px-2.5 py-1.5 text-omsk-xs text-[var(--omsk-muted)] hover:border-[var(--omsk-border)]"
									>
										<span className="truncate">{field.label}</span>
										<input
											type="color"
											value={val}
											onChange={event => {
												const next = { ...overrides, [field.key]: event.target.value };
												setOverrides(next);
												saveColorOverrides(next);
											}}
											className="h-5 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
										/>
									</label>
								);
							})}
						</div>
						<div className="mt-2.5 flex flex-wrap items-center gap-4">
							<label className="flex flex-1 items-center gap-2 text-omsk-xs text-[var(--omsk-muted)]">
								<span className="shrink-0">{t("themePicker.customizer.glassBlur")}</span>
								<input
									type="range"
									min={0}
									max={20}
									value={overrides.glassBlur ?? 7}
									onChange={event => {
										const next = { ...overrides, glassBlur: Number(event.target.value) };
										setOverrides(next);
										saveColorOverrides(next);
									}}
									className="w-full accent-[var(--omsk-accent)]"
								/>
							</label>
							<label className="flex flex-1 items-center gap-2 text-omsk-xs text-[var(--omsk-muted)]">
								<span className="shrink-0">{t("themePicker.customizer.glassOpacity")}</span>
								<input
									type="range"
									min={20}
									max={85}
									value={overrides.glassOpacity ?? 54}
									onChange={event => {
										const next = { ...overrides, glassOpacity: Number(event.target.value) };
										setOverrides(next);
										saveColorOverrides(next);
									}}
									className="w-full accent-[var(--omsk-accent)]"
								/>
							</label>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setOverrides({});
									clearColorOverrides();
								}}
							>
								<RotateCcw size={12} />
								{t("themePicker.customizer.reset")}
							</Button>
						</div>
					</div>
				)}
				<div ref={listRef} className="omsk-command-list overflow-y-auto p-2">
					{filtered.length === 0 && (
						<div className="px-3 py-8 text-center text-omsk-lg text-[var(--omsk-dim)]">
							{t("themePicker.empty")}
						</div>
					)}
					{filtered.map((entry, i) => {
						const theme = entry.theme;
						const isSystem = theme === null;
						const isCurrent = entry.selection === current;
						const row = (
							<button
								key={entry.selection}
								type="button"
								data-index={i}
								aria-pressed={isCurrent}
								onClick={() => select(entry)}
								onMouseEnter={() => setActive(i)}
								className={cx(
									"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
									entry.custom && "pr-11",
									i === active ? "bg-[var(--omsk-selected-bg)]" : "hover:bg-[var(--omsk-bg-tertiary)]",
								)}
							>
								<span
									aria-hidden="true"
									className="flex h-14 w-24 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border"
									style={{
										background: theme
											? resolveTokenColor(theme, "--omsk-bg-primary")
											: "var(--omsk-input-bg)",
										borderColor: theme ? resolveTokenColor(theme, "--omsk-border") : "var(--omsk-border)",
										color: theme ? resolveTokenColor(theme, "--omsk-text") : "var(--omsk-text)",
									}}
								>
									{isSystem ? (
										<span className="flex h-full w-full items-center justify-center text-[var(--omsk-dim)]">
											<Monitor size={15} />
										</span>
									) : (
										<>
											<span className="font-display text-omsk-xl font-medium">Aa</span>
											<span className="flex gap-1">
												{SWATCH_KEYS.map(key => (
													<span
														key={key}
														className="h-1.5 w-3 rounded-full"
														style={{ background: resolveTokenColor(theme!, key) }}
													/>
												))}
											</span>
										</>
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-2 text-omsk-lg font-medium text-[var(--omsk-text)]">
										{entry.label}
										{isCurrent && <Check size={14} className="text-[var(--omsk-accent)]" />}
									</span>
									<span className="block text-omsk-md leading-relaxed text-[var(--omsk-muted)]">
										{entry.description}
									</span>
									{entry.skipped && entry.skipped.length > 0 && (
										<span className="block truncate text-omsk-sm text-[var(--omsk-warning)]">
											{t("themePicker.custom.skipped", {
												count: entry.skipped.length,
												plural: entry.skipped.length === 1 ? "y" : "ies",
												names: entry.skipped.join(", "),
											})}
										</span>
									)}
								</span>
							</button>
						);
						const selection = entry.selection;
						const item =
							entry.custom && isCustomThemeSelection(selection) ? (
								<div key={selection} className="group relative">
									{row}
									<button
										type="button"
										data-edit-theme={selection}
										onClick={() => openThemeEditor(selection)}
										aria-label={t("themePicker.custom.edit", { name: entry.label })}
										title={t("themePicker.custom.edit", { name: entry.label })}
										className={cx(
											"absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-[var(--omsk-muted)] transition-opacity hover:bg-[var(--omsk-bg-tertiary)] hover:text-[var(--omsk-text)] focus-visible:opacity-100",
											i === active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
										)}
									>
										<Pencil size={13} />
									</button>
								</div>
							) : (
								row
							);
						if (i !== firstCustom) return item;
						return [
							<div
								key="custom-heading"
								className="px-3 pt-3 pb-1 text-omsk-xs font-medium tracking-wide text-[var(--omsk-dim)] uppercase"
							>
								{t("themePicker.custom.heading")}
							</div>,
							item,
						];
					})}
					{!query.trim() &&
						broken.map(entry => (
							<div
								key={entry.selection}
								data-custom-theme-problem={entry.problem}
								data-chosen-theme={entry.selection === current || undefined}
								className="flex items-start gap-3 px-3 py-2 text-omsk-md text-[var(--omsk-muted)]"
							>
								<AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--omsk-warning)]" />
								<span className="min-w-0 break-words">
									{t(`themePicker.custom.problem.${entry.problem}`, {
										file: entry.fileName,
										detail: entry.detail ?? "",
									})}
									{entry.selection === current && (
										<span className="block text-[var(--omsk-text-secondary)]">{chosenNote}</span>
									)}
								</span>
							</div>
						))}
					{!query.trim() && chosenMissing && (
						<div
							data-custom-theme-problem="missing"
							data-chosen-theme
							className="flex items-start gap-3 px-3 py-2 text-omsk-md text-[var(--omsk-muted)]"
						>
							<AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--omsk-warning)]" />
							<span className="min-w-0 break-words">
								{t("themePicker.custom.missing", { file: chosenFile ?? "" })}
							</span>
						</div>
					)}
				</div>
				<div className="flex items-center gap-3 border-t border-[var(--omsk-border-muted)] px-4 py-2.5">
					<span className="min-w-0 flex-1 text-omsk-sm text-[var(--omsk-dim)]">
						{t("themePicker.custom.hint", { dir: customDir ? shortenPath(customDir) : "~/.omsk/gui/themes" })}
					</span>
					<Button size="sm" variant="secondary" onClick={() => openThemeEditor()}>
						<Palette size={13} />
						{t("themePicker.custom.create")}
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							void window.omp.themes
								.openFolder()
								.then(result => {
									if (!result.ok)
										toast({
											variant: "error",
											message: t("themePicker.custom.openFailed", { error: describeError(result.error) }),
										});
								})
								.catch(cause =>
									toast({
										variant: "error",
										message: t("themePicker.custom.openFailed", { error: describeError(cause) }),
									}),
								);
						}}
					>
						<FolderOpen size={13} />
						{t("themePicker.custom.openFolder")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
