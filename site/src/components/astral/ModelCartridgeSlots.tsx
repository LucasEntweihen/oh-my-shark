import { mechanicalSynth } from "../../audio/mechanicalSynth";

interface ModelCartridgeSlotsProps {
	activeSlot?: number;
	onSelectSlot?: (slot: number) => void;
	currentModelName?: string;
}

export function ModelCartridgeSlots({
	activeSlot = 1,
	onSelectSlot,
	currentModelName = "Claude 3.5 Sonnet",
}: ModelCartridgeSlotsProps) {
	const slots = [
		{ id: 1, label: "SLOT 1: RACIOCÍNIO PRINCIPAL", model: currentModelName, led: "#00F0FF" },
		{ id: 2, label: "SLOT 2: SMALL-MODEL RÁPIDO", model: "DeepSeek / Gemini-Flash", led: "#8B5CF6" },
		{ id: 3, label: "SLOT 3: COMPILADOR & SANDBOX", model: "Rust pi-builtins / Bun", led: "#10B981" },
	];

	const handleSlotClick = (id: number) => {
		mechanicalSynth.playKeyClick();
		onSelectSlot?.(id);
	};

	return (
		<div
			className="w-full bg-[#B8B4A6] border-2 border-[#7A7669] p-2 rounded-[4px] shadow-[inset_1px_1px_0px_#ECEAE2,0_2px_4px_rgba(0,0,0,0.25)] font-mono select-none"
			role="region"
			aria-label="Cartuchos de Modelo LLM"
		>
			<div className="text-[10px] font-bold text-[#3A3832] mb-1.5 flex justify-between items-center tracking-wider">
				<span>GAVETAS DE CARTUCHO LLM</span>
				<span className="text-[8px] bg-[#9E9A8C] text-[#ECEAE2] px-1 py-0.5 rounded">UNID 02-60</span>
			</div>

			<div className="space-y-1.5">
				{slots.map((slot) => {
					const isActive = activeSlot === slot.id;
					return (
						<button
							key={slot.id}
							type="button"
							onClick={() => handleSlotClick(slot.id)}
							className={`w-full text-left p-1.5 border transition-all relative ${
								isActive
									? "bg-[#2B2D2F] border-[#968244] shadow-[inset_2px_2px_4px_#141618]"
									: "bg-[#C8C4B8] border-[#7A7669] hover:bg-[#D6D2C4] shadow-[inset_1px_1px_0px_#ECEAE2]"
							}`}
						>
							<div className="flex items-center justify-between">
								<span
									className={`text-[9px] font-bold truncate ${
										isActive ? "text-[#D4B85E]" : "text-[#3A3832]"
									}`}
								>
									{slot.label}
								</span>
								<span
									className="w-2 h-2 rounded-sm shadow-sm inline-block"
									style={{
										backgroundColor: isActive ? slot.led : "#4A473E",
										boxShadow: isActive ? `0 0 6px ${slot.led}` : "none",
									}}
								/>
							</div>
							<div
								className={`text-[8px] truncate mt-0.5 ${
									isActive ? "text-[#E6F4FA]" : "text-[#5A574E]"
								}`}
							>
								{slot.model}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
