import { useState } from "react";

interface TopCommandMenuBarProps {
	workspaceName?: string;
	gitBranch?: string;
	activeModelName?: string;
	isAudioMuted?: boolean;
	onToggleAudio?: () => void;
	onOpenSettings?: () => void;
	onOpenHelp?: () => void;
	onNewSession?: () => void;
	activeMode?: string;
	onSelectMode?: (mode: 1 | 2 | 3 | 4) => void;
}

export function TopCommandMenuBar({
	workspaceName = "oh-my-shark",
	gitBranch = "main*",
	activeModelName = "OMSK-Core",
	isAudioMuted = false,
	onToggleAudio,
	onOpenSettings,
	onOpenHelp,
	onNewSession,
	activeMode = "Deck 1",
	onSelectMode,
}: TopCommandMenuBarProps) {
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

	const menuItems = [
		{ id: "arquivo", label: "Arquivo", actions: [{ label: "Nova Missão / Conversa", fn: onNewSession }] },
		{ id: "configuracoes", label: "Configurações", actions: [{ label: "Ajustar Parâmetros", fn: onOpenSettings }] },
		{
			id: "visao",
			label: "Visão",
			actions: [
				{ label: "1. Deck Principal (Fractal & Biosfera)", fn: () => onSelectMode?.(1) },
				{ label: "2. Domo do Exoplaneta (Telemetria)", fn: () => onSelectMode?.(2) },
				{ label: "3. Radar Bússola & Pioneiros", fn: () => onSelectMode?.(3) },
				{ label: "4. Grimório de Missões", fn: () => onSelectMode?.(4) },
			],
		},
		{ id: "esquadrao", label: "Esquadrão IA", actions: [{ label: "Ver Tríade Doomania", fn: () => onSelectMode?.(3) }] },
		{ id: "arsenal", label: "Arsenal MCP", actions: [{ label: "Inspecionar Ferramentas", fn: () => onSelectMode?.(3) }] },
		{ id: "ajuda", label: "Ajuda", actions: [{ label: "Manual de Operação", fn: onOpenHelp }] },
	];

	return (
		<nav
			className="h-6 w-full bg-[#161816] text-[#A8D8EA] text-[11px] font-mono flex items-center justify-between px-2 select-none border-b-2 border-[#489638] relative z-40"
			role="menubar"
			aria-label="Barra de Comandos Estelares"
		>
			{/* Menus em PT-BR */}
			<div className="flex items-center space-x-1">
				<span className="text-[#00F0FF] font-bold tracking-wider mr-2 flex items-center gap-1">
					<span>🦈</span>
					<span>OMSK ORBITAL</span>
				</span>

				{menuItems.map((item) => (
					<div key={item.id} className="relative">
						<button
							type="button"
							onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
							className="px-2 py-0.5 hover:bg-[#2B5B84] hover:text-white rounded text-[#E4F0D0] transition-colors"
						>
							{item.label}
						</button>

						{activeDropdown === item.id && (
							<div
								className="absolute top-full left-0 mt-0.5 bg-[#0B0F1F] border border-[#968244] shadow-lg py-1 min-w-[200px] z-50 text-[11px]"
								onMouseLeave={() => setActiveDropdown(null)}
							>
								{item.actions.map((act) => (
									<button
										key={act.label}
										type="button"
										onClick={() => {
											act.fn?.();
											setActiveDropdown(null);
										}}
										className="w-full text-left px-3 py-1 hover:bg-[#14468C] text-[#E6F4FA] block transition-colors"
									>
										{act.label}
									</button>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Telemetria do Workspace & Áudio */}
			<div className="flex items-center space-x-3 text-[10px] text-[#94A3B8]">
				<span className="text-[#D4B85E] flex items-center gap-1">
					<span className="text-[#00A838]">●</span>
					<span>MODO: {activeMode}</span>
				</span>

				<span>📁 {workspaceName} ({gitBranch})</span>
				<span className="text-[#5CE1E6]">🧠 {activeModelName}</span>

				{onToggleAudio && (
					<button
						type="button"
						onClick={onToggleAudio}
						className="px-1.5 py-0.5 hover:bg-[#2B2D2F] rounded text-[#E4F0D0] border border-[#4A473E] transition-colors"
						title={isAudioMuted ? "Desmutar Áudio Mecânico" : "Mutar Áudio Mecânico"}
					>
						{isAudioMuted ? "🔇 MUDO" : "🔊 SOM"}
					</button>
				)}
			</div>
		</nav>
	);
}
