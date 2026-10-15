interface TopMemoryStrip12Props {
	tps?: number;
	latencyMs?: number;
	memoryKb?: number;
	activeSubagentsCount?: number;
	compressionRatio?: number;
	isGenerating?: boolean;
}

export function TopMemoryStrip12({
	tps = 42.5,
	latencyMs = 12,
	memoryKb = 48200,
	activeSubagentsCount = 3,
	compressionRatio = 42,
	isGenerating = false,
}: TopMemoryStrip12Props) {
	const cells = [
		{ label: "MÓD-01", val: isGenerating ? "EXECUÇÃO" : "PRONTO", alert: isGenerating },
		{ label: "VELOC", val: `${tps.toFixed(1)} kT/s`, alert: false },
		{ label: "LATÊNCIA", val: `${latencyMs}ms`, alert: false },
		{ label: "RAM-HEAP", val: `${(memoryKb / 1024).toFixed(1)}M`, alert: false },
		{ label: "FROTA-IA", val: `${activeSubagentsCount} SONDAS`, alert: false },
		{ label: "COMPRESS", val: `${compressionRatio}%`, alert: false },
		{ label: "PI-AST", val: "SÍNCRONO", alert: false },
		{ label: "BUILTINS", val: "60+ RUST", alert: false },
		{ label: "DOOMANIA", val: "TRÍADE OK", alert: false },
		{ label: "TTSR-SNAP", val: "ATIVO", alert: false },
		{ label: "LSPV-DIAG", val: "0 ANOMAL", alert: false },
		{ label: "ORBITAL", val: "SÍNCRONA", alert: false },
	];

	return (
		<div
			className="h-9 w-full bg-[#020307] border-b-2 border-[#968244] grid grid-cols-12 gap-1 px-1 py-1 select-none font-mono text-[10px]"
			role="region"
			aria-label="Faixa de Telemetria de Missão (12 Células)"
		>
			{cells.map((cell) => (
				<div
					key={cell.label}
					className="bg-[#071E42] border border-[#968244] px-1.5 py-0.5 flex flex-col justify-between overflow-hidden shadow-sm"
				>
					<span className="text-[#D4B85E] text-[8px] tracking-wider uppercase truncate">
						{cell.label}
					</span>
					<span
						className={`text-[9px] font-bold truncate flex items-center gap-1 ${
							cell.alert ? "text-[#E62229] animate-pulse" : "text-[#5CE1E6]"
						}`}
					>
						<span
							className={`w-1 h-1 rounded-full ${
								cell.alert ? "bg-[#E62229]" : "bg-[#00A838]"
							}`}
						/>
						{cell.val}
					</span>
				</div>
			))}
		</div>
	);
}
