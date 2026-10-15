import { useState } from "react";
import { mechanicalSynth } from "../../audio/mechanicalSynth";

interface OrbitalCompassAndPioneersProps {
	tps?: number;
	onSpawnSubagent?: (persona: "criativo" | "critico" | "permissivo") => void;
}

export function OrbitalCompassAndPioneers({
	tps = 42.5,
	onSpawnSubagent,
}: OrbitalCompassAndPioneersProps) {
	const [activePersona, setActivePersona] = useState<"criativo" | "critico" | "permissivo">("criativo");

	const handlePersonaSelect = (persona: "criativo" | "critico" | "permissivo") => {
		setActivePersona(persona);
		mechanicalSynth.playKeyClick();
		onSpawnSubagent?.(persona);
	};

	return (
		<div
			className="w-full h-full bg-[#161816] text-[#E4F0D0] p-3 font-mono grid grid-cols-12 gap-3 select-none overflow-y-auto"
			role="region"
			aria-label="Navegador Estelar e Esquadrão de Agentes"
		>
			{/* Coluna Esquerda: Bússola Orbital Circular */}
			<div className="col-span-5 flex flex-col items-center justify-center p-2 bg-[#020307] border-2 border-[#489638] rounded">
				<div className="text-[10px] text-[#D4B85E] font-bold mb-1">RADAR BÚSSOLA ORBITAL</div>

				{/* Radar Circular N, S, L, O com orelhas */}
				<div className="relative w-48 h-48 flex items-center justify-center">
					<svg viewBox="0 0 300 300" className="w-full h-full">
						{/* Círculo Principal da Bússola */}
						<circle cx="150" cy="145" r="114" fill="#0A180E" stroke="#489638" strokeWidth="8" />

						{/* Orelha Esquerda 0.0 kT/s (DESIGN.md Sec. 13.4) */}
						<path
							d="M 62 224 L 40 246 A 8 8 0 0 0 40 258 L 54 272 A 8 8 0 0 0 66 272 L 88 244 Z"
							fill="#162816"
							stroke="#489638"
							strokeWidth="2"
						/>
						<text x="60" y="260" fill="#E4F0D0" fontSize="12" fontFamily="monospace" transform="rotate(-30 60 260)">
							{tps.toFixed(1)} kT
						</text>

						{/* Orelha Direita (Agulha) */}
						<path
							d="M 238 224 L 260 246 A 8 8 0 0 1 260 258 L 246 272 A 8 8 0 0 1 234 272 L 212 244 Z"
							fill="#162816"
							stroke="#489638"
							strokeWidth="2"
						/>

						{/* Letras Cardeais N, S, L, O */}
						<text x="150" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold">N</text>
						<text x="150" y="250" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold">S</text>
						<text x="245" y="152" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold">L</text>
						<text x="55" y="152" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold">O</text>

						{/* Continentes de Código Verdes */}
						<path d="M 110 110 Q 140 90, 160 120 T 190 140 Q 170 170, 130 160 Z" fill="#4EA832" opacity="0.8" />
						<path d="M 80 150 Q 100 130, 110 170 T 90 190 Z" fill="#4EA832" opacity="0.8" />

						{/* Caravela / Sonda Espacial 12x12px */}
						<g transform="translate(142, 137)">
							<polygon points="6,0 12,12 0,12" fill="#00F0FF" />
							<rect x="5" y="4" width="2" height="6" fill="#FFFFFF" />
						</g>
					</svg>
				</div>

				<div className="text-[9px] text-[#A8D8EA] mt-1 text-center">
					SONDA ATIVA // NAVEGANDO REPOSITÓRIO LOCAL
				</div>
			</div>

			{/* Coluna Direita: Pioneiros (Tríade Doomania e Inventário MCP) */}
			<div className="col-span-7 flex flex-col justify-between space-y-2 bg-[#0B0F1F] p-2.5 border-2 border-[#968244] rounded">
				{/* Cabeçalho Pioneiros */}
				<div className="border-b border-[#968244] pb-1 flex justify-between items-center">
					<span className="text-[12px] font-bold text-[#D4B85E] tracking-wider underline">
						PIONEIROS // ESQUADRÃO DE AGENTES
					</span>
					<span className="text-[9px] text-[#94A3B8]">Época Estelar, d. 17, 2500</span>
				</div>

				{/* Tríade Doomania */}
				<div className="grid grid-cols-3 gap-1.5">
					<button
						type="button"
						onClick={() => handlePersonaSelect("criativo")}
						className={`p-1.5 border text-left rounded text-[9px] transition-all ${
							activePersona === "criativo"
								? "bg-[#8B5CF6]/30 border-[#8B5CF6] text-white"
								: "bg-[#141618] border-[#4A473E] text-[#94A3B8] hover:bg-[#2B2D2F]"
						}`}
					>
						<div className="font-bold text-[#8B5CF6]">🌠 CRIATIVO</div>
						<div className="text-[8px]">Arquitetura &amp; Expansão</div>
					</button>

					<button
						type="button"
						onClick={() => handlePersonaSelect("critico")}
						className={`p-1.5 border text-left rounded text-[9px] transition-all ${
							activePersona === "critico"
								? "bg-[#EF4444]/30 border-[#EF4444] text-white"
								: "bg-[#141618] border-[#4A473E] text-[#94A3B8] hover:bg-[#2B2D2F]"
						}`}
					>
						<div className="font-bold text-[#EF4444]">🛡️ CRÍTICO</div>
						<div className="text-[8px]">Segurança &amp; Auditoria</div>
					</button>

					<button
						type="button"
						onClick={() => handlePersonaSelect("permissivo")}
						className={`p-1.5 border text-left rounded text-[9px] transition-all ${
							activePersona === "permissivo"
								? "bg-[#10B981]/30 border-[#10B981] text-white"
								: "bg-[#141618] border-[#4A473E] text-[#94A3B8] hover:bg-[#2B2D2F]"
						}`}
					>
						<div className="font-bold text-[#10B981]">⚡ PERMISSIVO</div>
						<div className="text-[8px]">Ação &amp; Baixo Atrito</div>
					</button>
				</div>

				{/* Atributos da Sonda */}
				<div className="bg-[#161816] p-2 border border-[#489638] rounded text-[9px] space-y-0.5">
					<div className="flex justify-between">
						<span className="text-[#94A3B8]">Raciocínio Lógico:</span>
						<span className="text-[#5CE1E6] font-bold">5 / 5 ★</span>
					</div>
					<div className="flex justify-between">
						<span className="text-[#94A3B8]">Janela de Contexto:</span>
						<span className="text-[#D4B85E] font-bold">4 / 5 ★ (200k)</span>
					</div>
					<div className="flex justify-between">
						<span className="text-[#94A3B8]">Velocidade de Geração:</span>
						<span className="text-[#10B981] font-bold">5 / 5 ★</span>
					</div>
					<div className="flex justify-between">
						<span className="text-[#94A3B8]">Integridade da Máquina:</span>
						<span className="text-[#00A838] font-bold">EXCELENTE</span>
					</div>
				</div>

				{/* Receptáculos de Equipamento MCP */}
				<div className="border-t border-[#4A473E] pt-1">
					<div className="text-[9px] text-[#D4B85E] mb-1">EQUIPAMENTO TÁTICO MCP (BUILTINS)</div>
					<div className="grid grid-cols-3 gap-2">
						<div className="bg-[#141618] border border-[#7A7669] p-1 text-center rounded">
							<span className="text-[8px] text-[#94A3B8] block">MÃO-E</span>
							<span className="text-[10px] text-[#00F0FF]">⚡ pi-ast</span>
						</div>
						<div className="bg-[#141618] border border-[#7A7669] p-1 text-center rounded">
							<span className="text-[8px] text-[#94A3B8] block">MÃO-D</span>
							<span className="text-[10px] text-[#10B981]">🔧 builtins</span>
						</div>
						<div className="bg-[#141618] border border-[#7A7669] p-1 text-center rounded">
							<span className="text-[8px] text-[#94A3B8] block">ESCUDO</span>
							<span className="text-[10px] text-[#8B5CF6]">🛡️ ask-tool</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
