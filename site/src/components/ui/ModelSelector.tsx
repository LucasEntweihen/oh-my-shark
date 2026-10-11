import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, ChevronDown, Cpu } from "lucide-react";
import { Icon } from "./Icon";
import { AVAILABLE_MODELS, type ModelSpec } from "../../types/models";

interface ModelSelectorProps {
  currentModelId: string;
  onSelectModel: (model: ModelSpec) => void;
}

/**
 * Seletor de Modelo de IA limpo, gráfico e intuitivo como no app do Claude
 * Inspirado nas diretrizes do DESIGN.md (Sec 4 e 5.4) e ICON_SYSTEM.md
 */
export function ModelSelector({ currentModelId, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === currentModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botão de Trigger Estilo Claude */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--cor-borda)] bg-[var(--cor-campo)] hover:bg-[var(--cor-superficie-elevada)] text-[var(--texto-principal)] transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-95"
        style={{ transitionDuration: "var(--duracao-rapida)" }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Icon icon={Sparkles} size="sm" className="text-[var(--espectro-ciano)]" />
        <span className="font-semibold tracking-tight">{selectedModel.name}</span>
        {selectedModel.badge && (
          <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[var(--espectro-violeta)]/15 text-[var(--espectro-violeta)] border border-[var(--espectro-violeta)]/30">
            {selectedModel.badge}
          </span>
        )}
        <Icon
          icon={ChevronDown}
          size="sm"
          className={`text-[var(--texto-terciario)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Gráfico Rico */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-80 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl z-50 overflow-hidden superficie-elevada"
          style={{ animation: "fadeScale 0.16s ease-out" }}
        >
          <div className="p-3 border-b border-[var(--cor-borda)] bg-[var(--cor-superficie)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--texto-secundario)] uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon={Cpu} size="sm" />
              Escolha seu Modelo
            </span>
            <span className="text-[10px] text-[var(--texto-terciario)] font-mono">
              {AVAILABLE_MODELS.length} disponíveis
            </span>
          </div>

          <div className="p-1.5 max-h-88 overflow-y-auto space-y-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === selectedModel.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--cor-campo)] border border-[var(--espectro-azul)]/40 shadow-inner"
                      : "hover:bg-[var(--cor-campo)]/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--texto-principal)]">
                        {model.name}
                      </span>
                      {model.hasThinking && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--espectro-amarelo)]/15 text-[var(--espectro-amarelo)] border border-[var(--espectro-amarelo)]/30 font-mono">
                          Raciocínio
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Icon icon={Check} size="sm" className="text-[var(--espectro-verde)]" />
                    )}
                  </div>

                  <p className="text-xs text-[var(--texto-secundario)] line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--texto-terciario)] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--cor-fundo)]">
                      {model.provider}
                    </span>
                    <span>•</span>
                    <span>{model.contextWindow}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
