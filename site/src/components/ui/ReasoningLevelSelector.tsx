import { Brain, Zap } from "lucide-react";
import { Icon } from "./Icon";
import type { OmskModel } from "../../lib/omsk-api";

interface ReasoningLevelSelectorProps {
  model: OmskModel | null;
  currentLevelId: string;
  onSelectLevel: (levelId: string) => void;
}

/**
 * Seletor GRÁFICO (não textual) de Nível de Raciocínio (Thinking Level)
 * - Mapeia os níveis suportados pelo modelo real do OMSK (ex: minimal, low, medium, high, max)
 * - Exibe barras de energia visual interativas conforme ICON_SYSTEM.md e DESIGN.md
 */
export function ReasoningLevelSelector({
  model,
  currentLevelId,
  onSelectLevel,
}: ReasoningLevelSelectorProps) {
  if (!model || !model.reasoning || !model.thinking || model.thinking.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--cor-borda)] bg-[var(--cor-campo)]/40 text-[var(--texto-terciario)] text-xs">
        <Icon icon={Zap} size="sm" className="text-[var(--texto-terciario)] opacity-60" />
        <span className="font-mono text-[11px]">Raciocínio nativo direto (Sem esforço configurável)</span>
        <div className="flex items-center gap-1 opacity-40 ml-1">
          <div className="w-1.5 h-3 rounded-full bg-[var(--texto-terciario)]" />
        </div>
      </div>
    );
  }

  const thinkingOptions = model.thinking.map((level, idx) => {
    let bars = 1;
    let label = level;
    let desc = "Esforço básico";

    if (level === "minimal") {
      bars = 1;
      label = "Mínimo";
      desc = "Poucos segundos de inferência";
    } else if (level === "low") {
      bars = 2;
      label = "Rápido (Low)";
      desc = "Reflexão ágil de apoio";
    } else if (level === "medium") {
      bars = 3;
      label = "Equilibrado (Medium)";
      desc = "Raciocínio analítico estruturado";
    } else if (level === "high") {
      bars = 4;
      label = "Profundo (High)";
      desc = "Exploração exaustiva e provas";
    } else if (level === "max") {
      bars = 4;
      label = "Máximo (Max)";
      desc = "Teto absoluto de reflexão";
    } else {
      bars = idx + 1;
    }

    return { id: level, label, desc, bars };
  });

  const activeOption = thinkingOptions.find((o) => o.id === currentLevelId) || thinkingOptions[0];

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-campo)]/80">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-[var(--texto-secundario)] font-medium">
          <Icon icon={Brain} size="sm" className="text-[var(--espectro-amarelo)]" />
          <span>Espectro de Raciocínio Real (OMSK)</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[var(--espectro-amarelo)] uppercase tracking-wider">
          {activeOption.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {thinkingOptions.map((opt) => {
          const isActive = opt.id === currentLevelId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectLevel(opt.id)}
              className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden active:scale-95 ${
                isActive
                  ? "bg-[var(--cor-superficie-elevada)] border-[var(--espectro-amarelo)]/60 shadow-[0_0_12px_rgba(252,211,77,0.15)]"
                  : "bg-[var(--cor-superficie)]/50 border-[var(--cor-borda)] hover:border-[var(--cor-borda-foco)] hover:bg-[var(--cor-superficie)]"
              }`}
              title={opt.desc}
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((barIdx) => {
                  const isFilled = barIdx <= opt.bars;
                  return (
                    <div
                      key={barIdx}
                      className={`h-3 w-1.5 rounded-full transition-all ${
                        isFilled
                          ? isActive
                            ? "bg-gradient-to-t from-[var(--espectro-laranja)] to-[var(--espectro-amarelo)] shadow-sm"
                            : "bg-[var(--texto-secundario)]"
                          : "bg-white/5"
                      }`}
                    />
                  );
                })}
              </div>

              <div>
                <div
                  className={`text-xs font-semibold ${
                    isActive ? "text-[var(--texto-principal)]" : "text-[var(--texto-secundario)]"
                  }`}
                >
                  {opt.label}
                </div>
                <div className="text-[10px] text-[var(--texto-terciario)] line-clamp-1">
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
