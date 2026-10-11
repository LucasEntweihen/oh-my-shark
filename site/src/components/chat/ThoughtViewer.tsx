import { useState } from "react";
import { Brain, ChevronDown, ChevronRight, Sparkles, Terminal } from "lucide-react";
import { Icon } from "../ui/Icon";

interface ThoughtViewerProps {
  thought: string;
  isGenerating?: boolean;
}

/**
 * Visualizador da Melhor Forma de Pensamento da IA (Thinking Process / Reasoning Trace)
 * - Exibe a linha de raciocínio interno da IA de maneira fluida e expansível
 * - Respeita o DESIGN.md (sinais de interface, tipografia mono, estética veludo escuro)
 */
export function ThoughtViewer({ thought, isGenerating = false }: ThoughtViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thought) return null;

  return (
    <div className="mb-3 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)]/70 overflow-hidden transition-all text-xs">
      {/* Botão de Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[var(--cor-campo)]/50 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[var(--espectro-amarelo)]/10 text-[var(--espectro-amarelo)] flex items-center justify-center">
            <Icon icon={Brain} size="sm" />
          </div>
          <span className="font-semibold text-[var(--texto-secundario)] group-hover:text-[var(--texto-principal)] transition-colors flex items-center gap-1.5">
            Processo de Raciocínio da IA
            {isGenerating && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--espectro-amarelo)] font-mono animate-pulse">
                <Sparkles size={11} /> pensando...
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[var(--texto-terciario)]">
          <span className="text-[10px] font-mono">
            {thought.length} caracteres
          </span>
          <Icon
            icon={isExpanded ? ChevronDown : ChevronRight}
            size="sm"
            className="transition-transform duration-200"
          />
        </div>
      </button>

      {/* Conteúdo Expansível do Pensamento */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[var(--cor-borda)]/60 bg-[var(--cor-fundo)]/40 font-mono text-[11px] text-[var(--texto-secundario)] leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
          <div className="flex items-center gap-1 text-[10px] text-[var(--texto-terciario)] mb-1.5 uppercase tracking-wider">
            <Icon icon={Terminal} size="sm" /> Traço de Inferência & Verificação
          </div>
          <div className="pl-2 border-l-2 border-[var(--espectro-amarelo)]/30 text-[var(--texto-principal)]/90">
            {thought}
          </div>
        </div>
      )}
    </div>
  );
}
