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
			className="bg-[#9E9A8C] p-2.5 rounded-[4px] border-2 border-[#7A7669] shadow-[inset_3px_3px_6px_#141618] select-none font-mono"
			role="region"
			aria-label="Teclado Numérico Mecânico de 21 Teclas"
		>
			<div className="flex justify-between items-center mb-1.5 text-[9px] text-[#2B2D2F] font-bold">
				<span>SUB-ROTINAS DO CHASSI (21 MACROS)</span>
				<span className="text-[#3A3832]">MATRIZ 3x7</span>
			</div>

			{/* Grade de 21 Teclas Físicas */}
			<div className="grid grid-cols-7 gap-1.5">
				{keysMatrix.flat().map((keyItem, index) => {
					const isPressed = activeKey === `${keyItem.id}_${index}`;
					return (
						<button
							key={`${keyItem.id}_${index}`}
							type="button"
							onMouseDown={() => handlePress(`${keyItem.id}_${index}`, keyItem.label)}
							className={`h-9 w-full flex flex-col items-center justify-center rounded-[2px] transition-transform active:translate-y-0.5 ${
								isPressed
									? "bg-[#8F8B7D] shadow-[inset_2px_2px_3px_#5A574E]"
									: "bg-[#D6D2C4] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-2px_-2px_0px_#8F8B7D,2px_3px_0px_#5A574E,2px_4px_5px_rgba(0,0,0,0.4)] hover:bg-[#ECEAE2]"
							}`}
							title={keyItem.desc}
						>
							<span className="text-[11px] font-bold text-[#3A3832] leading-tight font-sans">
								{keyItem.num}
							</span>
							<span className="text-[7px] text-[#5A574E] font-mono tracking-tighter truncate max-w-full px-0.5">
								{keyItem.label}
							</span>
						</button>
					);
				})}
			</div>

			{/* Sliders de Temperatura T e Top-P */}
			<div className="mt-2.5 pt-2 border-t border-[#7A7669] grid grid-cols-2 gap-3 text-[9px] text-[#2B2D2F]">
				<div>
					<div className="flex justify-between mb-0.5">
						<span>TEMPERATURA (T)</span>
						<span className="font-bold text-[#141618]">{temperature.toFixed(2)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={temperature}
						onChange={(e) => onChangeTemperature?.(parseFloat(e.target.value))}
						className="w-full accent-[#00F0FF] bg-[#2B2D2F] h-1.5 rounded appearance-none cursor-pointer"
					/>
				</div>

				<div>
					<div className="flex justify-between mb-0.5">
						<span>AMOSTRAGEM (TOP-P)</span>
						<span className="font-bold text-[#141618]">{topP.toFixed(2)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={topP}
						onChange={(e) => onChangeTopP?.(parseFloat(e.target.value))}
						className="w-full accent-[#D4B85E] bg-[#2B2D2F] h-1.5 rounded appearance-none cursor-pointer"
					/>
				</div>
			</div>
		</div>
	);
}
