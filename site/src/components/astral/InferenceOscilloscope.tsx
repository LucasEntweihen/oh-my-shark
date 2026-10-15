interface InferenceOscilloscopeProps {
	tps?: number;
	tokenCount?: number;
	isGenerating?: boolean;
}

export function InferenceOscilloscope({
	tps = 42.5,
	tokenCount = 1240,
	isGenerating = false,
}: InferenceOscilloscopeProps) {
	return (
		<div
			className="h-40 w-full bg-[#14468C] border-2 border-[#968244] rounded-[6px] relative overflow-hidden select-none p-1.5 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]"
			role="region"
			aria-label="Osciloscópio de Inferência CRT"
		>
			{/* Grade Milimétrica do Osciloscópio */}
			<svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<pattern id="oscGrid" width="16" height="16" patternUnits="userSpaceOnUse">
						<path d="M 16 0 L 0 0 0 16" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#oscGrid)" />
			</svg>

			{/* Cabeçalho do Osciloscópio */}
			<div className="flex justify-between items-center text-[9px] font-mono text-[#E6F4FA] relative z-10 border-b border-[#5CE1E6]/30 pb-0.5">
				<span className="font-bold tracking-wider text-[#5CE1E6]">OSCILOSCÓPIO // TOKENS/S</span>
				<span className="flex items-center gap-1 text-[#D4B85E]">
					<span className={isGenerating ? "inline-block w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" : "inline-block w-1.5 h-1.5 rounded-full bg-[#00A838]"} />
					{tps.toFixed(1)} kT/s
				</span>
			</div>

			{/* Curva Exponencial SVG (DESIGN.md Sec. 13.2: M 36 118 C 68 112, 108 96, 148 72) */}
			<div className="h-24 w-full relative flex items-center justify-center">
				<svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
					<path
						d="M 20 120 C 60 115, 110 95, 180 30"
						fill="none"
						stroke={isGenerating ? "#00F0FF" : "#FFFFFF"}
						strokeWidth="2.5"
						strokeDasharray={isGenerating ? "6 2" : "none"}
						className={isGenerating ? "animate-pulse" : ""}
					/>
					{/* Ponto focal ativo */}
					<circle cx="180" cy="30" r="4" fill="#00F0FF" className={isGenerating ? "animate-ping" : ""} />
					<circle cx="180" cy="30" r="2.5" fill="#FFFFFF" />
				</svg>
			</div>

			{/* Rodapé de Estatísticas */}
			<div className="flex justify-between items-center text-[8px] font-mono text-[#A8D8EA] relative z-10 pt-1 border-t border-[#5CE1E6]/20">
				<span>AMOSTRA: {tokenCount} TOKENS</span>
				<span className="text-[#00F0FF]">CONVERGÊNCIA: 99.8%</span>
			</div>

			{/* Linhas de Varredura Scanlines */}
			<div
				className="absolute inset-0 pointer-events-none opacity-20"
				style={{
					backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 2px)",
				}}
			/>
		</div>
	);
}
