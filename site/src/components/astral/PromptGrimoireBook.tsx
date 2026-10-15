import { useState } from "react";
import { mechanicalSynth } from "../../audio/mechanicalSynth";

interface PromptGrimoireBookProps {
	onAcceptMission?: (promptText: string) => void;
	onClose?: () => void;
	initialPrompt?: string;
}

export function PromptGrimoireBook({
	onAcceptMission,
	onClose,
	initialPrompt = "Refatorar e otimizar módulos do repositório utilizando pi-ast e pi-builtins com máxima segurança.",
}: PromptGrimoireBookProps) {
	const [activeTab, setActiveTab] = useState<"DESC" | "OBJ" | "REC" | "MISSÕES">("DESC");
	const [selectedArchitect] = useState("Arquiteto Chefe (OMSK Lead)");
	const [selectedMission, setSelectedMission] = useState("Refatoração do Motor Orbital");
	const [promptText, setPromptText] = useState(initialPrompt);

	const missionsList = [
		{ id: "m1", title: "Refatoração do Motor Orbital", desc: "Higienizar dead code e otimizar chamadas AST." },
		{ id: "m2", title: "Auditoria Crítica de Segurança", desc: "Investigar vulnerabilidades com o doomania-critico." },
		{ id: "m3", title: "Geração de Testes Unitários", desc: "Criar cobertura de testes para rotinas novas." },
		{ id: "m4", title: "Compressão Semântica de Contexto", desc: "Compactar histórico sem perder invariantes." },
	];

	const handleAccept = () => {
		mechanicalSynth.playTelemetryBeacon();
		onAcceptMission?.(promptText);
	};

	const handleTabChange = (tab: "DESC" | "OBJ" | "REC" | "MISSÕES") => {
		mechanicalSynth.playKeyClick();
		setActiveTab(tab);
	};

	return (
		<div
			className="w-full h-full bg-[#161816] p-2 flex items-center justify-center select-none font-mono"
			role="region"
			aria-label="Grimório de Prompts e Missões"
		>
			{/* Livro Aberto em Pergaminho (DESIGN.md Sec. 13.5 & Sec. 2.3) */}
			<div className="w-full max-w-4xl h-full max-h-[500px] bg-[#2B5B84] p-2 rounded shadow-2xl flex border-2 border-[#161816] relative">
				{/* Aba Esquerda Externa */}
				<div className="w-6 flex flex-col justify-center items-center space-y-3 bg-[#1A3854] text-[#E4F0D0] text-[9px] font-bold rounded-l py-2 border-r border-[#2B5B84]">
					<button
						type="button"
						onClick={() => handleTabChange("MISSÕES")}
						className={`writing-vertical hover:text-white transition-colors ${
							activeTab === "MISSÕES" ? "text-[#00F0FF]" : ""
						}`}
						style={{ writingMode: "vertical-rl" }}
					>
						M I S S Õ E S
					</button>
				</div>

				{/* Miolo do Livro (2 Páginas Abertas com Lombada Central) */}
				<div className="flex-1 grid grid-cols-2 bg-[#E4F0D0] text-[#1A2118] border border-[#2B5B84] rounded-sm overflow-hidden shadow-inner">
					{/* Página Esquerda: Fonte e Lista de Missões */}
					<div className="p-3 border-r border-[#968244]/40 flex flex-col justify-between overflow-y-auto">
						<div>
							<div className="border-b border-[#2B5B84]/40 pb-1 mb-2">
								<span className="text-[11px] font-bold text-[#2B5B84] uppercase tracking-wider">
									FONTE // ORIGEM DO PROMPT
								</span>
								<div className="mt-1 bg-[#F4F8EC] border border-[#2B5B84] p-1 text-[10px] text-[#1A2118] font-bold">
									► {selectedArchitect}
								</div>
							</div>

							<div>
								<span className="text-[11px] font-bold text-[#2B5B84] uppercase tracking-wider block mb-1">
									MISSÕES ATIVAS
								</span>
								<div className="space-y-1">
									{missionsList.map((m) => (
										<button
											key={m.id}
											type="button"
											onClick={() => {
												setSelectedMission(m.title);
												setPromptText(m.desc);
												mechanicalSynth.playKeyClick();
											}}
											className={`w-full text-left p-1 text-[9px] border transition-colors ${
												selectedMission === m.title
													? "bg-[#4E9A26] text-white border-[#2C568C] font-bold"
													: "bg-[#F4F8EC] text-[#1A2118] border-[#9E9876] hover:bg-[#EAEFE0]"
											}`}
										>
											{m.title}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="text-[8px] text-[#4A5644] pt-2 border-t border-[#968244]/30">
							ESTAÇÃO ORBITAL OMSK // MANIFESTO DE INSTRUÇÕES
						</div>
					</div>

					{/* Página Direita: Descrição do Prompt e Botão [ Aceitar Missão ] */}
					<div className="p-3 flex flex-col justify-between overflow-y-auto bg-[#F4F8EC]">
						<div>
							<div className="border-b border-[#2B5B84]/40 pb-1 mb-2 flex justify-between items-center">
								<span className="text-[11px] font-bold text-[#2B5B84] uppercase tracking-wider">
									DESCRIÇÃO DA TAREFA
								</span>
								<span className="text-[8px] text-[#4E9A26] font-bold">● PRONTO PARA EXECUÇÃO</span>
							</div>

							<textarea
								value={promptText}
								onChange={(e) => setPromptText(e.target.value)}
								className="w-full h-48 bg-[#E4F0D0] border border-[#968244] p-2 text-[10px] text-[#1A2118] resize-none focus:outline-none focus:border-[#2B5B84] font-mono leading-relaxed shadow-inner"
								placeholder="Descreva a missão do agente..."
							/>
						</div>

						{/* Botão [ Aceitar missão ] (DESIGN.md Sec. 2.3) */}
						<div className="pt-2 border-t border-[#2B5B84]/30 flex justify-between items-center">
							<span className="text-[8px] text-[#4A5644]">
								STATUS: AGUARDANDO ORDEM
							</span>

							<button
								type="button"
								onClick={handleAccept}
								className="px-4 py-1.5 bg-[#4E9A26] hover:bg-[#3D7C1E] text-white text-[11px] font-bold tracking-wider rounded border border-[#2B5B84] shadow-md transition-all active:scale-95"
							>
								[ ACEITAR MISSÃO ]
							</button>
						</div>
					</div>
				</div>

				{/* Abas Direitas Externas (DESC, OBJ, REC, X) */}
				<div className="w-7 flex flex-col justify-between items-center bg-[#1A3854] text-[#E4F0D0] text-[9px] font-bold rounded-r py-2 border-l border-[#2B5B84]">
					<div className="space-y-4 flex flex-col items-center">
						<button
							type="button"
							onClick={() => handleTabChange("DESC")}
							className={`hover:text-white ${activeTab === "DESC" ? "text-[#00F0FF]" : ""}`}
						>
							DESC
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("OBJ")}
							className={`hover:text-white ${activeTab === "OBJ" ? "text-[#00F0FF]" : ""}`}
						>
							OBJ
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("REC")}
							className={`hover:text-white ${activeTab === "REC" ? "text-[#00F0FF]" : ""}`}
						>
							REC
						</button>
					</div>

					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="text-[#EF4444] hover:text-white font-bold p-1"
							title="Fechar Grimório"
						>
							✕
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
