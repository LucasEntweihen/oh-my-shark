import { useState } from "react";
import { mechanicalSynth } from "../../audio/mechanicalSynth";

interface SubroutineKeypad21Props {
	onExecuteMacro?: (macroId: string, label: string) => void;
	temperature?: number;
	onChangeTemperature?: (t: number) => void;
	topP?: number;
	onChangeTopP?: (p: number) => void;
}

export function SubroutineKeypad21({
	onExecuteMacro,
	temperature = 0.7,
	onChangeTemperature,
	topP = 0.95,
	onChangeTopP,
}: SubroutineKeypad21Props) {
	const [activeKey, setActiveKey] = useState<string | null>(null);

	const keysMatrix = [
		// Linha 1
		[
			{ num: "03", label: "LSP-DIAG", id: "lsp_diag", desc: "Checagem LSP de Tipos e Compilação" },
			{ num: "11", label: "CLEANUP", id: "cleanup", desc: "Limpeza de Código /cleanup" },
			{ num: "34", label: "GEN-TEST", id: "gen_test", desc: "Gerar e Executar Testes Unitários" },
			{ num: "28", label: "AST-SUMM", id: "ast_summ", desc: "Resumo Estrutural de Arquitetura AST" },
			{ num: "43", label: "DOOMANIA", id: "doomania", desc: "Disparar Tríade Multiagente /doomania" },
			{ num: "SL", label: "SLOT-A", id: "slot_a", desc: "Slot Customizável A" },
			{ num: "SL", label: "SLOT-B", id: "slot_b", desc: "Slot Customizável B" },
		],
		// Linha 2
		[
			{ num: "30", label: "RG-SEARCH", id: "rg_search", desc: "Varredura Rápida de Texto (rg)" },
			{ num: "39", label: "SEC-AUDIT", id: "sec_audit", desc: "Auditoria Crítica de Segurança" },
			{ num: "27", label: "FD-FILES", id: "fd_files", desc: "Localização Rápida de Arquivos (fd)" },
			{ num: "27", label: "FD-DEEP", id: "fd_deep", desc: "Busca Profunda em Arquivos Ignorados" },
			{ num: "30", label: "DIFF-REV", id: "diff_rev", desc: "Inspeção de Alterações no Git Diff" },
			{ num: "36", label: "PS-PROC", id: "ps_proc", desc: "Gestão de Processos Locais (ps/jobs)" },
			{ num: "32", label: "MODE-SW", id: "mode_sw", desc: "Comutador Modo Seguro / Permissivo" },
		],
		// Linha 3
		[
			{ num: "21", label: "GIT-PULL", id: "git_pull", desc: "Sincronização Orbital (git pull)" },
			{ num: "30", label: "BLD-CHECK", id: "bld_check", desc: "Compilação e Verificação Sintática" },
			{ num: "20", label: "CTX-COMP", id: "ctx_comp", desc: "Compressão Semântica de Contexto" },
			{ num: "00", label: "SYS-RESET", id: "sys_reset", desc: "Rollback Temporal de Disco (TTSR)" },
			{ num: "20", label: "CTX-DUMP", id: "ctx_dump", desc: "Inspecionar Memória Comprimida" },
			{ num: "32", label: "SRV-START", id: "srv_start", desc: "Iniciar Servidor em Background" },
			{ num: "30", label: "DEP-PROD", id: "dep_prod", desc: "Fluxo de Entrega /release" },
		],
	];

	const handlePress = (id: string, label: string) => {
		setActiveKey(id);
		mechanicalSynth.playKeyClick();
		onExecuteMacro?.(id, label);
		setTimeout(() => setActiveKey(null), 120);
	};

	return (
		<div
			className="bg-[#C8C4B8] p-2 rounded-[4px] border-2 border-[#ECEAE2] shadow-[inset_2px_2px_0px_#ECEAE2,inset_-2px_-2px_0px_#7A7669,0_3px_6px_rgba(0,0,0,0.35)] select-none font-mono"
			role="region"
			aria-label="Console Mecânico Inferior de Sub-rotinas e Rota Orbital"
		>
			{/* Header da Moldura com Parafusos e Serigrafia */}
			<div className="flex justify-between items-center mb-1.5 px-1 text-[10px] text-[#3A3832] font-bold">
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full border border-[#7A7669] bg-[#B8B4A6] inline-block shadow-inner" />
					<span>CONSOLE MECÂNICO DE SUB-ROTINAS</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="text-[8px] bg-[#9E9A8C] text-[#ECEAE2] px-1 py-0.5 rounded">UNIDADE 02-60</span>
					<span className="w-2 h-2 rounded-full border border-[#7A7669] bg-[#B8B4A6] inline-block shadow-inner" />
				</span>
			</div>

			{/* Grid Principal do Console: Teclado 21 Teclas (Esquerda) + Monitor Topográfico & Rota Orbital (Direita) */}
			<div className="grid grid-cols-12 gap-2">
				{/* Coluna Esquerda: Rebaixo com as 21 Teclas (8 Colunas) */}
				<div className="col-span-8 bg-[#9E9A8C] p-2 rounded-[2px] border border-[#7A7669] shadow-[inset_2px_2px_4px_#141618]">
					<div className="flex justify-between items-center mb-1 text-[8px] text-[#2B2D2F] font-bold">
						<span>MATRIZ NUMÉRICA HISTÓRICA (3x7)</span>
						<span>MACROS 00-43</span>
					</div>

					<div className="grid grid-cols-7 gap-1">
						{keysMatrix.flat().map((keyItem, index) => {
							const isPressed = activeKey === `${keyItem.id}_${index}`;
							return (
								<button
									key={`${keyItem.id}_${index}`}
									type="button"
									onMouseDown={() => handlePress(`${keyItem.id}_${index}`, keyItem.label)}
									className={`h-8 w-full flex flex-col items-center justify-center rounded-[2px] transition-transform active:translate-y-0.5 ${
										isPressed
											? "bg-[#8F8B7D] shadow-[inset_2px_2px_3px_#5A574E]"
											: "bg-[#D6D2C4] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-2px_-2px_0px_#8F8B7D,1px_2px_0px_#5A574E,1px_3px_4px_rgba(0,0,0,0.35)] hover:bg-[#ECEAE2]"
									}`}
									title={keyItem.desc}
								>
									<span className="text-[10px] font-bold text-[#3A3832] leading-none font-sans">
										{keyItem.num}
									</span>
									<span className="text-[6.5px] text-[#5A574E] font-mono tracking-tighter truncate max-w-full px-0.5 mt-0.5">
										{keyItem.label}
									</span>
								</button>
							);
						})}
					</div>

					{/* Sliders Táteis de Temperatura e Top-P */}
					<div className="mt-1.5 pt-1.5 border-t border-[#7A7669] grid grid-cols-2 gap-2 text-[8px] text-[#2B2D2F]">
						<div>
							<div className="flex justify-between mb-0.5 font-bold">
								<span>TEMP (T)</span>
								<span className="text-[#141618]">{temperature.toFixed(2)}</span>
							</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={temperature}
								onChange={(e) => onChangeTemperature?.(parseFloat(e.target.value))}
								className="w-full accent-[#00F0FF] bg-[#2B2D2F] h-1 rounded appearance-none cursor-pointer"
							/>
						</div>

						<div>
							<div className="flex justify-between mb-0.5 font-bold">
								<span>TOP-P</span>
								<span className="text-[#141618]">{topP.toFixed(2)}</span>
							</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={topP}
								onChange={(e) => onChangeTopP?.(parseFloat(e.target.value))}
								className="w-full accent-[#D4B85E] bg-[#2B2D2F] h-1 rounded appearance-none cursor-pointer"
							/>
						</div>
					</div>
				</div>

				{/* Coluna Direita: Monitor Topográfico de Asteroide + Rota Orbital (4 Colunas) */}
				<div className="col-span-4 flex flex-col justify-between space-y-1.5">
					{/* Monitor Topográfico Secundário CRT (Visual Language.jpg Sec. 2.1) */}
					<div className="bg-[#071E42] border-2 border-[#2B2D2F] p-1 rounded-[3px] shadow-[inset_0_0_8px_rgba(0,0,0,0.8)] relative overflow-hidden h-20 flex flex-col justify-between">
						<div className="flex justify-between text-[7px] text-[#5CE1E6] font-mono border-b border-[#14468C] pb-0.5">
							<span>TOPOGRAFIA 3D</span>
							<span>ASTEROIDE #0310</span>
						</div>

						{/* Wireframe Nuvem de Pontos 3D do Asteroide em SVG */}
						<div className="flex-1 flex items-center justify-center">
							<svg viewBox="0 0 100 50" className="w-full h-full opacity-80">
								<polygon points="50,5 75,18 85,38 58,45 32,42 18,25 35,10" fill="none" stroke="#5CE1E6" strokeWidth="1" />
								<line x1="50" y1="5" x2="58" y2="45" stroke="#14468C" strokeWidth="0.8" strokeDasharray="2 1" />
								<line x1="18" y1="25" x2="85" y2="38" stroke="#14468C" strokeWidth="0.8" strokeDasharray="2 1" />
								<circle cx="50" cy="5" r="1.5" fill="#FFFFFF" />
								<circle cx="75" cy="18" r="1.5" fill="#5CE1E6" />
								<circle cx="85" cy="38" r="1.5" fill="#00F0FF" />
								<circle cx="58" cy="45" r="1.5" fill="#FFFFFF" />
								<circle cx="32" cy="42" r="1.5" fill="#5CE1E6" />
								<circle cx="18" cy="25" r="1.5" fill="#FFFFFF" />
								<circle cx="35" cy="10" r="1.5" fill="#5CE1E6" />
							</svg>
						</div>

						<div className="text-[6.5px] text-[#D4B85E] text-right font-mono">
							RELEVO ROCHOSO SÍNCRONO
						</div>
					</div>

					{/* Painel ROTA ORBITAL com os 5 Botões de Ciclo de Execução */}
					<div className="bg-[#B8B4A6] border border-[#7A7669] p-1 rounded-[2px] shadow-sm">
						<div className="text-[7.5px] font-bold text-[#3A3832] mb-1 tracking-wider text-center">
							ROTA ORBITAL // CICLO DE VIDA
						</div>
						<div className="grid grid-cols-5 gap-1">
							{[
								{ id: "bld", label: "COMPILAR" },
								{ id: "gen", label: "TESTAR" },
								{ id: "sec", label: "DEPURAR" },
								{ id: "cleanup", label: "REFATOR" },
								{ id: "dep", label: "LANÇAR" },
							].map((btn) => (
								<button
									key={btn.id}
									type="button"
									onClick={() => handlePress(btn.id, btn.label)}
									className="h-6 bg-[#D6D2C4] hover:bg-[#ECEAE2] active:bg-[#8F8B7D] border border-[#7A7669] rounded-[2px] text-[6.5px] font-bold text-[#3A3832] tracking-tighter truncate flex items-center justify-center transition-all shadow-[inset_1px_1px_0px_#FFFFFF,0_1px_2px_rgba(0,0,0,0.2)]"
								>
									{btn.label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
