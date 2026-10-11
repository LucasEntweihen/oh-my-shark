import { useState, useRef, useEffect } from "react";
import { Sparkles, Check, ChevronDown, Cpu, Key, RefreshCw } from "lucide-react";
import { Icon } from "./Icon";
import type { OmskModel } from "../../lib/omsk-api";

interface ModelSelectorProps {
  currentModel: OmskModel | null;
  models: OmskModel[];
  providers: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  onSelectModel: (model: OmskModel) => void;
  onConfigureProvider: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

/**
 * Seletor de Modelo e Provedor 100% REAL do OMSK estilo Claude
 * Mostra estritamente os provedores autenticados e modelos carregados no ModelRegistry.
 */
export function ModelSelector({
  currentModel,
  models,
  providers,
  selectedProvider,
  onSelectProvider,
  onSelectModel,
  onConfigureProvider,
  onRefresh,
  isLoading = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredModels = selectedProvider === "all"
    ? models
    : models.filter((m) => m.provider.toLowerCase() === selectedProvider.toLowerCase());

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
        <span className="font-semibold tracking-tight truncate max-w-44">
          {currentModel ? currentModel.name : "Carregando modelos OMSK..."}
        </span>
        {currentModel && (
          <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[var(--espectro-violeta)]/15 text-[var(--espectro-violeta)] border border-[var(--espectro-violeta)]/30 uppercase">
            {currentModel.provider}
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

      {/* Popover Gráfico Rico com Provedores e Modelos Reais */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-96 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl z-50 overflow-hidden superficie-elevada"
          style={{ animation: "fadeScale 0.16s ease-out" }}
        >
          {/* Topo: Provedores Reais */}
          <div className="p-3 border-b border-[var(--cor-borda)] bg-[var(--cor-superficie)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--texto-secundario)] uppercase tracking-wider flex items-center gap-1.5">
                <Icon icon={Cpu} size="sm" />
                Provedores Autenticados
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="p-1 rounded-lg text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)]"
                  title="Recarregar catálogo OMSK"
                >
                  <Icon icon={RefreshCw} size="sm" className={isLoading ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onConfigureProvider();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono text-[var(--espectro-ciano)] hover:bg-[var(--espectro-ciano)]/10 border border-[var(--espectro-ciano)]/30"
                  title="Configurar novo provedor ou chave de API"
                >
                  <Icon icon={Key} size="sm" /> + Chave
                </button>
              </div>
            </div>

            {/* Abas / Pílulas de Provedores Reais */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-styled">
              <button
                type="button"
                onClick={() => onSelectProvider("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedProvider === "all"
                    ? "bg-[var(--texto-principal)] text-[var(--cor-fundo)] font-bold shadow-sm"
                    : "bg-[var(--cor-campo)] text-[var(--texto-terciario)] hover:text-[var(--texto-principal)]"
                }`}
              >
                Todos ({models.length})
              </button>
              {providers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSelectProvider(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedProvider.toLowerCase() === p.toLowerCase()
                      ? "bg-[var(--espectro-ciano)] text-[#0B0F19] font-bold shadow-sm"
                      : "bg-[var(--cor-campo)] text-[var(--texto-terciario)] hover:text-[var(--texto-principal)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Modelos Reais */}
          <div className="p-1.5 max-h-88 overflow-y-auto space-y-1">
            {filteredModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--texto-terciario)]">
                Nenhum modelo disponível para este provedor.
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = currentModel?.id === model.id && currentModel?.provider === model.provider;
                return (
                  <button
                    key={`${model.provider}/${model.id}`}
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
                        <span className="text-xs font-semibold text-[var(--texto-principal)]">
                          {model.name}
                        </span>
                        {model.reasoning && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--espectro-amarelo)]/15 text-[var(--espectro-amarelo)] border border-[var(--espectro-amarelo)]/30 font-mono">
                            Thinking
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Icon icon={Check} size="sm" className="text-[var(--espectro-verde)]" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--texto-terciario)] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--cor-fundo)] uppercase">
                        {model.provider}
                      </span>
                      <span>•</span>
                      <span>{Math.round(model.contextWindow / 1000)}k contexto</span>
                      {model.thinking.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--espectro-amarelo)]">{model.thinking.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
