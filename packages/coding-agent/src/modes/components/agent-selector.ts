import { type SelectItem, SelectList, type SgrMouseEvent, Text } from "@oh-my-pi/pi-tui";
import {
	AGENT_CONTEXT_RECOMMENDATIONS,
	AGENT_STRONG_REFERENCES,
	DEFAULT_AGENT_PROFILES,
	type AgentProfile,
	buildTerminalDotsFace,
} from "../../avatar";
import { getSelectListTheme, theme, type ThemeColor } from "../theme/theme";
import { OverlayPanel, PanelDivider } from "./overlay-box";
import { routeSelectListMouseWithTopBorder } from "./select-list-mouse-routing";

export interface AgentSelectorCallbacks {
	onSelect: (agent: AgentProfile) => void;
	onCancel: () => void;
}

/**
 * Interactive terminal menu for manual agent selection based on context.
 * Features Bible Strong Avatar preview, context recommendations, and shortcuts.
 */
export class AgentSelectorComponent extends OverlayPanel {
	#selectList: SelectList;
	#previewText: Text;
	#agents: AgentProfile[];
	#onSelectCallback: (agent: AgentProfile) => void;

	constructor(callbacks: AgentSelectorCallbacks, activeAgentId = "shark-lead") {
		super("Selecionar Agente Manualmente (Bible Strong Avatars)");

		this.#agents = DEFAULT_AGENT_PROFILES;
		this.#onSelectCallback = callbacks.onSelect;

		const agentsById = new Map<string, AgentProfile>();
		const items: SelectItem[] = this.#agents.map((agent, index) => {
			agentsById.set(agent.id, agent);
			const contextHint = AGENT_CONTEXT_RECOMMENDATIONS[agent.id] ?? agent.description;
			const isCurrent = agent.id === activeAgentId;
			return {
				value: agent.id,
				label: `${index + 1}. @${agent.id} — ${agent.title}`,
				description: isCurrent ? `[ATIVO] · ${contextHint}` : contextHint,
			};
		});

		this.#selectList = new SelectList(items, Math.min(items.length, 6), getSelectListTheme());

		const initialIndex = this.#agents.findIndex(a => a.id === activeAgentId);
		if (initialIndex >= 0) {
			this.#selectList.setSelectedIndex(initialIndex);
		}

		this.#previewText = new Text();
		this.#updatePreview(this.#agents[initialIndex >= 0 ? initialIndex : 0]!);

		this.#selectList.onSelectionChange = item => {
			const agent = agentsById.get(item.value);
			if (agent) {
				this.#updatePreview(agent);
			}
		};

		this.#selectList.onSelect = item => {
			const agent = agentsById.get(item.value);
			if (agent) {
				this.#onSelectCallback(agent);
			}
		};

		this.#selectList.onCancel = callbacks.onCancel;

		this.addChild(this.#selectList);
		this.addChild(new PanelDivider());
		this.addChild(this.#previewText);
	}

	#updatePreview(agent: AgentProfile): void {
		const surfaceType = agent.avatar.body.primary.type;
		const bodyColor = agent.avatar.colors.body;
		const eyeColor = agent.avatar.colors.eyes;
		const faceLines = buildTerminalDotsFace(surfaceType, "neutral", bodyColor, eyeColor);
		const strongRef = AGENT_STRONG_REFERENCES[agent.id] ?? "";
		const contextHint = AGENT_CONTEXT_RECOMMENDATIONS[agent.id] ?? agent.description;

		const fg = (color: ThemeColor, text: string): string => {
			try {
				if (theme?.fg) return theme.fg(color, text);
			} catch {}
			return text;
		};

		const lines = [
			`${faceLines[0]}   ${fg("accent", `[${agent.name}]`)} (${agent.title})`,
			`${faceLines[1]}   ${fg("muted", `Superfície: ${surfaceType.toUpperCase()} · Cor: ${bodyColor}`)}`,
			`${faceLines[2]}   ${fg("success", `Contexto ideal: ${contextHint}`)}`,
			`${faceLines[3]}   ${strongRef ? fg("warning", `Referência Strong: ${strongRef}`) : fg("dim", `Lema: "${agent.personality.catchphrase ?? ""}"`)}`,
			`${faceLines[4]}   ${fg("dim", `Personalidade: ${agent.personality.tone} · Enter para confirmar`)}`,
			`${faceLines[5]}   ${fg("dim", `Dica: Teclas 1 a 5 selecionam direto · Esc para cancelar`)}`,
		];

		this.#previewText.setText(lines.join("\n"));
	}

	handleInput(keyData: string): void {
		// Quick number shortcuts 1-5
		const num = Number.parseInt(keyData, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= this.#agents.length) {
			const agent = this.#agents[num - 1];
			if (agent) {
				this.#onSelectCallback(agent);
				return;
			}
		}

		this.#selectList.handleInput(keyData);
	}

	routeMouse(event: SgrMouseEvent, line: number, col: number): void {
		routeSelectListMouseWithTopBorder(this.#selectList, event, line, col);
	}
}
