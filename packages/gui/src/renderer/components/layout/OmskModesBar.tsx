import { Flame, Gauge, Sparkles, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { describeError } from "../../lib/errors";
import { cx } from "../../lib/format";
import { useTabRpc } from "../../lib/tab-rpc";
import { useComposerStore } from "../../stores/composer";
import { useSessionStore } from "../../stores/session";
import { useSharkStore } from "../../stores/shark";
import { toast } from "../../stores/toast";

export interface OmskModeSpec {
	id: string;
	label: string;
	wireKeyword: string;
	color: string;
	description: string;
}

export const OMSK_MAGIC_MODES: readonly OmskModeSpec[] = [
	{
		id: "promaxthink",
		label: "promaxthink",
		wireKeyword: "promaxthink",
		color: "#FF4D8D",
		description: "Maximum reasoning depth + adversarial self-verification",
	},
	{
		id: "ultrathink",
		label: "ultrathink",
		wireKeyword: "ultrathink",
		color: "#E879F9",
		description: "Deep multi-step reasoning effort",
	},
	{
		id: "orchestrate",
		label: "orchestrate",
		wireKeyword: "orchestrate",
		color: "#A855F7",
		description: "Multi-agent wave orchestration notice",
	},
	{
		id: "workflowz",
		label: "workflowz",
		wireKeyword: "workflowz",
		color: "#F59E0B",
		description: "Parallel task + eval kernel workflow",
	},
	{
		id: "deepseaneuron",
		label: "deepseaneuron",
		wireKeyword: "deepseaneuron",
		color: "#38BDF8",
		description: "High token signal density & neural precision",
	},
	{
		id: "fastthinkworkerz",
		label: "fastthinkworkerz",
		wireKeyword: "fastthinkworkerz",
		color: "#FACC15",
		description: "Low-latency fast worker execution",
	},
	{
		id: "xlr8",
		label: "xlr8",
		wireKeyword: "xlr8",
		color: "#00E5FF",
		description: "Hyperspeed acceleration (clicks while streaming dispatch /xlr8 steer)",
	},
	{
		id: "doomania",
		label: "/doomania",
		wireKeyword: "doomania",
		color: "#00E676",
		description: "Critical, creative & pragmatic multi-perspective mode",
	},
	{
		id: "vibecoding",
		label: "vibecoding",
		wireKeyword: "vibecoding",
		color: "#FB923C",
		description: "Wave disjointness, <=350 line modular files & TDD gates",
	},
	{
		id: "chillax",
		label: "chillax",
		wireKeyword: "chillax",
		color: "#67E8F9",
		description: "Direct concise path with minimal reasoning overhead",
	},
	{
		id: "jevify",
		label: "jevify",
		wireKeyword: "jevify",
		color: "#C084FC",
		description: "Bulk classification via eval kernel judge()",
	},
] as const;

const MODE_BY_ID = new Map(OMSK_MAGIC_MODES.map(mode => [mode.id, mode]));

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasModeToken(text: string, modeId: string): boolean {
	const spec = MODE_BY_ID.get(modeId);
	if (!spec) return false;
	const token = escapeRegex(spec.wireKeyword);
	const pattern = new RegExp(`(^|\\s)(?:\\/)?${token}(?=\\s|$)`, "i");
	return pattern.test(text);
}

function tokenForMode(modeId: string, xlr8Basic: boolean): string {
	const spec = MODE_BY_ID.get(modeId);
	if (!spec) return modeId;
	if (modeId === "xlr8" && xlr8Basic) return "xlr8 --basic";
	return spec.wireKeyword;
}

export function toggleModeInDraft(draft: string, modeId: string, enable: boolean, xlr8Basic: boolean): string {
	const spec = MODE_BY_ID.get(modeId);
	if (!spec) return draft;
	if (enable) {
		if (hasModeToken(draft, modeId)) return draft;
		const prefix = tokenForMode(modeId, xlr8Basic);
		const trimmedStart = draft.replace(/^\s+/, "");
		return trimmedStart ? `${prefix} ${trimmedStart}` : `${prefix} `;
	}
	const escaped = escapeRegex(spec.wireKeyword);
	const removal =
		modeId === "xlr8"
			? new RegExp(`(^|\\s)(?:\\/)?${escaped}(?:\\s+--basic)?(?=\\s|$)`, "gi")
			: new RegExp(`(^|\\s)(?:\\/)?${escaped}(?=\\s|$)`, "gi");
	return draft.replace(removal, (_m, lead: string) => (lead ? " " : "")).replace(/^\s+/, "");
}

export function syncXlr8BasicInDraft(draft: string, nextBasic: boolean): string {
	if (!hasModeToken(draft, "xlr8")) return draft;
	if (nextBasic) {
		return draft.replace(/(^|\s)(\/?xlr8)(?!\s+--basic)(?=\s|$)/gi, "$1$2 --basic");
	}
	return draft.replace(/(^|\s)(\/?xlr8)\s+--basic(?=\s|$)/gi, "$1$2");
}

/**
 * Normalizes `/doomania` to standalone `doomania` (required by agent-session
 * magic keyword boundaries) and prepends any active OMSK mode tokens missing
 * from non-slash user prompts.
 */
export function applyOmskModesToMessage(message: string, activeModes: readonly string[], xlr8Basic: boolean): string {
	let normalized = message.replace(/(^|\s)\/doomania(?=\s|$)/gi, "$1doomania").trim();
	const isRealSlashCommand = normalized.startsWith("/");
	if (isRealSlashCommand || activeModes.length === 0) return normalized;

	const missingPrefixes: string[] = [];
	for (const modeId of activeModes) {
		if (!hasModeToken(normalized, modeId)) {
			missingPrefixes.push(tokenForMode(modeId, xlr8Basic));
		} else if (modeId === "xlr8" && xlr8Basic && !/\s--basic(?=\s|$)/i.test(normalized)) {
			normalized = syncXlr8BasicInDraft(normalized, true);
		}
	}
	if (missingPrefixes.length === 0) return normalized;
	return normalized ? `${missingPrefixes.join(" ")} ${normalized}` : missingPrefixes.join(" ");
}

export function OmskModesBar({ disabled = false }: { disabled?: boolean }) {
	const rpc = useTabRpc();
	const isStreaming = useSessionStore(s => s.isStreaming);
	const status = useSessionStore(s => s.status);
	const draft = useComposerStore(s => s.draft);
	const setDraft = useComposerStore(s => s.setDraft);
	const activeModes = useSharkStore(s => s.activeModes);
	const xlr8Basic = useSharkStore(s => s.xlr8Basic);
	const toggleMode = useSharkStore(s => s.toggleMode);
	const toggleXlr8Basic = useSharkStore(s => s.toggleXlr8Basic);

	const xlr8Active = activeModes.includes("xlr8") || hasModeToken(draft, "xlr8");

	const handleModeClick = async (mode: OmskModeSpec) => {
		if (disabled) return;
		if (mode.id === "xlr8" && isStreaming) {
			if (status !== "ready") {
				toast({ variant: "warning", message: "Sidecar is not ready to steer." });
				return;
			}
			const steerText = xlr8Basic ? "/xlr8 --basic" : "/xlr8";
			try {
				const res = await rpc.steer(steerText);
				if (!res.success) throw new Error(res.error);
				toast({
					variant: "success",
					title: "XLR8 Steer",
					message: `Dispatched in-flight ${steerText}`,
				});
			} catch (cause) {
				toast({ variant: "error", title: "XLR8 Steer Failed", message: describeError(cause) });
			}
			return;
		}

		const currentlyActive = activeModes.includes(mode.id);
		toggleMode(mode.id);
		setDraft(current => toggleModeInDraft(current, mode.id, !currentlyActive, xlr8Basic));
	};

	const handleToggleBasic = () => {
		if (disabled) return;
		const nextBasic = !xlr8Basic;
		toggleXlr8Basic();
		setDraft(current => syncXlr8BasicInDraft(current, nextBasic));
	};

	return (
		<div
			aria-label="OMSK Magic Modes"
			className="omsk-modes-strip flex items-center gap-1 overflow-x-auto border-b border-[var(--omsk-border-muted)] px-3 py-1.5"
			data-omsk-modes-bar=""
		>
			<span className="mr-0.5 flex shrink-0 items-center gap-1 text-omsk-xxs font-semibold tracking-wider text-[var(--omsk-dim)] uppercase">
				<Sparkles size={11} className="text-[var(--omsk-accent)]" />
				OMSK
			</span>
			{OMSK_MAGIC_MODES.map(mode => {
				const isActive = activeModes.includes(mode.id) || hasModeToken(draft, mode.id);
				const isXlr8Steer = mode.id === "xlr8" && isStreaming;
				const style = { "--omsk-pill-color": mode.color } as CSSProperties;
				return (
					<button
						key={mode.id}
						type="button"
						disabled={disabled}
						aria-pressed={isActive}
						title={isXlr8Steer ? `Steer in-flight: ${xlr8Basic ? "/xlr8 --basic" : "/xlr8"}` : mode.description}
						onClick={() => void handleModeClick(mode)}
						style={style}
						className={cx(
							"omsk-mode-pill omsk-pressable flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-omsk-xxs font-medium disabled:opacity-45",
							isActive || isXlr8Steer
								? "omsk-mode-pill--active"
								: "border-[var(--omsk-border-muted)] bg-transparent text-[var(--omsk-muted)] hover:border-[var(--omsk-border-strong)] hover:text-[var(--omsk-text)]",
						)}
					>
						{mode.id === "xlr8" ? (
							<Zap size={11} strokeWidth={1.7} />
						) : mode.id === "promaxthink" ? (
							<Flame size={11} strokeWidth={1.7} />
						) : mode.id === "deepseaneuron" ? (
							<Gauge size={11} strokeWidth={1.7} />
						) : null}
						<span>{mode.label}</span>
						{isXlr8Steer && <span className="text-omsk-xxs opacity-85">steer</span>}
					</button>
				);
			})}
			<button
				type="button"
				disabled={disabled}
				aria-pressed={xlr8Basic}
				title="Toggle --basic solo autonomous flag for xlr8 (disconnects from subagents)"
				onClick={handleToggleBasic}
				style={{ "--omsk-pill-color": "#00E5FF" } as CSSProperties}
				className={cx(
					"omsk-mode-pill omsk-pressable shrink-0 rounded-full border px-2 py-0.5 font-mono text-omsk-xxs font-semibold disabled:opacity-45",
					xlr8Basic
						? "omsk-mode-pill--active"
						: xlr8Active
							? "border-[var(--omsk-border-accent)] bg-transparent text-[var(--omsk-accent)]"
							: "border-dashed border-[var(--omsk-border-muted)] bg-transparent text-[var(--omsk-dim)] hover:text-[var(--omsk-text)]",
				)}
			>
				--basic
			</button>
		</div>
	);
}
