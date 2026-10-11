import { Brain, Zap } from "lucide-react";
import { Icon } from "./Icon";
import type { ModelSpec } from "../../types/models";

interface ReasoningLevelSelectorProps {
  model: ModelSpec;
  currentLevelId: string;
  onSelectLevel: (levelId: string) => void;
}

/**
 * Seletor GRÁFICO (não textual) de Nível de Raciocínio (Thinking Level)
 * - Exibe exatamente os níveis suportados pelo modelo
 * - Se o modelo não tem raciocínio, exibe de forma gráfica e elegante
 * - Barras de energia gráfica / espectral baseadas no ICON_SYSTEM e DESIGN.md
 */
export function ReasoningLevelSelector({
  model,
  currentLevelId,
  onSelectLevel,
}: ReasoningLevelSelectorProps) {
  if (!model.hasThinking || !model.thinkingLevels || model.thinkingLevels.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--cor-borda)] bg-[var(--cor-campo)]/40 text-[var(--texto-terciario)] text-xs">
        <Icon icon={Zap} size="sm" className="text-[var(--texto-terciario)] opacity-60" />
        <span className="font-mono text-[11px]">Raciocínio nativo direto</span>
        <div className="flex items-center gap-1 opacity-40 ml-1">
          <div className="w-1.5 h-3 rounded-full bg-[var(--texto-terciario)]" />
        </div>
      </div>
    );
  }

  const activeLevel =
    model.thinkingLevels.find((l) => l.id === currentLevelId) || model.thinkingLevels[0];

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-campo)]/80">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-[var(--texto-secundario)] font-medium">
          <Icon icon={Brain} size="sm" className="text-[var(--espectro-amarelo)]" />
          <span>Espectro de Raciocínio</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[var(--espectro-amarelo)] uppercase tracking-wider">
          {activeLevel.label}
        </span>
      </div>

      {/* Seletor Gráfico Visual em Pílulas Interativas com Barras */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {model.thinkingLevels.map((level) => {
          const isActive = level.id === currentLevelId;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelectLevel(level.id)}
              className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden active:scale-95 ${
                isActive
                  ? "bg-[var(--cor-superficie-elevada)] border-[var(--espectro-amarelo)]/60 shadow-[0_0_12px_rgba(252,211,77,0.15)]"
                  : "bg-[var(--cor-superficie)]/50 border-[var(--cor-borda)] hover:border-[var(--cor-borda-foco)] hover:bg-[var(--cor-superficie)]"
              }`}
              title={level.description}
            >
              {/* Indicador de Barras Gráficas (Metáfora de medidor de potência) */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((barIdx) => {
                  const isFilled = barIdx <= level.bars;
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
                  {level.label}
                </div>
                <div className="text-[10px] text-[var(--texto-terciario)] line-clamp-1">
                  {level.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
