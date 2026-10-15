import type { ReactNode } from "react";
import { mechanicalSynth } from "../../audio/mechanicalSynth";

interface MainCRTViewportProps {
	activeMode: 1 | 2 | 3 | 4;
	onSelectMode: (mode: 1 | 2 | 3 | 4) => void;
	children: ReactNode;
}

export function MainCRTViewport({
	activeMode,
	onSelectMode,
	children,
}: MainCRTViewportProps) {
	const modes = [
		{ id: 1 as const, label: "1. FRACTAL & BIOSFERA" },
		{ id: 2 as const, label: "2. DOMO PLANETÁRIO" },
		{ id: 3 as const, label: "3. BÚSSOLA & AGENTES" },
		{ id: 4 as const, label: "4. GRIMÓRIO" },
	];

	const handleModeClick = (id: 1 | 2 | 3 | 4) => {
		mechanicalSynth.playKeyClick();
		onSelectMode(id);
	};

	return (
		<div
			className="flex-1 flex flex-col bg-[#C8C4B8] border-2 border-[#ECEAE2] p-2 rounded-[6px] shadow-[inset_2px_2px_0px_#ECEAE2,inset_-2px_-2px_0px_#7A7669,0px_4px_8px_rgba(0,0,0,0.45)] overflow-hidden font-mono select-none"
			role="region"
			aria-label="Monitor CRT Principal Multimodo"
		>
			{/* Moldura Superior Bege com Parafusos e Serigrafia Industrial (DESIGN.md Sec. 2.1) */}
			<div className="flex justify-between items-center mb-1.5 px-1 text-[10px] text-[#3A3832] font-bold">
				{/* Parafuso Esquerdo + Marcação */}
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full border border-[#7A7669] bg-[#B8B4A6] flex items-center justify-center text-[7px] shadow-inner">
						+
					</span>
					<span className="font-sans font-bold tracking-widest text-[#2B2D2F]">ASTRA-IA</span>
					<span className="text-[7.5px] bg-[#9E9A8C] text-[#ECEAE2] px-1 py-0.5 rounded ml-1">
						CRT-MULTIMODO 4:3
					</span>
				</div>

				{/* Seletor dos 4 Modos Operacionais */}
				<div className="flex space-x-1">
					{modes.map((m) => {
						const isSelected = activeMode === m.id;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => handleModeClick(m.id)}
								className={`px-2 py-0.5 rounded-[2px] text-[8px] font-bold border transition-all ${
									isSelected
										? "bg-[#2B2D2F] text-[#00F0FF] border-[#00F0FF] shadow-[inset_1px_1px_2px_#141618]"
										: "bg-[#D6D2C4] text-[#3A3832] border-[#7A7669] hover:bg-[#ECEAE2] shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
								}`}
							>
								{m.label}
							</button>
						);
					})}
				</div>

				{/* Parafuso Direito + Inscrição do Chassi */}
				<div className="flex items-center gap-1.5">
					<span className="text-[8px] tracking-wider text-[#5A574E]">UNIDADE ORBITAL 02-60</span>
					<span className="w-2.5 h-2.5 rounded-full border border-[#7A7669] bg-[#B8B4A6] flex items-center justify-center text-[7px] shadow-inner">
						+
					</span>
				</div>
			</div>

			{/* Cavidade Interna Escura do Tubo CRT (Borracha / Metal Escuro #2B2D2F e #141618) */}
			<div className="flex-1 bg-[#020307] border-4 border-[#2B2D2F] rounded-[8px] overflow-hidden relative shadow-[inset_0_0_24px_rgba(0,0,0,0.9),0_0_0_1px_#141618]">
				{/* Conteúdo Renderizado (Modo 1, 2, 3 ou 4) */}
				<div className="w-full h-full relative z-10">{children}</div>

				{/* Linhas de Varredura Scanlines Analógicas */}
				<div
					className="absolute inset-0 pointer-events-none opacity-15 z-20"
					style={{
						backgroundImage:
							"repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)",
					}}
				/>

				{/* Reflexo de Vidro Curvo CRT (Curvature Glare) */}
				<div
					className="absolute inset-0 pointer-events-none opacity-20 z-20"
					style={{
						background:
							"radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 45%, transparent 65%)",
						mixBlendMode: "screen",
					}}
				/>
			</div>

			{/* Barra Inferior da Moldura com Parafusos de Fixação */}
			<div className="flex justify-between items-center mt-1 px-1 text-[8px] text-[#5A574E]">
				<span className="w-2.5 h-2.5 rounded-full border border-[#7A7669] bg-[#B8B4A6] flex items-center justify-center text-[7px] shadow-inner">
					+
				</span>
				<span>ESTAÇÃO ORBITAL // ALINHAMENTO GEOMÉTRICO 1.31:1</span>
				<span className="w-2.5 h-2.5 rounded-full border border-[#7A7669] bg-[#B8B4A6] flex items-center justify-center text-[7px] shadow-inner">
					+
				</span>
			</div>
		</div>
	);
}
