import { Menu, Sliders, HardDrive, Plus } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";
import { ModelSelector } from "../ui/ModelSelector";
import type { ModelSpec } from "../../types/models";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  currentModelId: string;
  onSelectModel: (model: ModelSpec) => void;
  onOpenSystemPrompt: () => void;
  onOpenFolderManager: () => void;
  onNewSession: () => void;
  activeFolderName: string;
  hasCustomPrompt: boolean;
  isGenerating: boolean;
}

/**
 * Barra Superior / Header do Chat (DESIGN.md Sec 5.4)
 * - Identidade visual Aurora
 * - Seletor gráfico de modelo estilo Claude
 * - Acesso direto às configurações de Prompt de Sistema e Pastas Locais
 * - Ações essenciais sempre acessíveis sem depender de hover
 */
export function ChatHeader({
  onToggleSidebar,
  currentModelId,
  onSelectModel,
  onOpenSystemPrompt,
  onOpenFolderManager,
  onNewSession,
  activeFolderName,
  hasCustomPrompt,
  isGenerating,
}: ChatHeaderProps) {
  return (
    <header className="h-16 border-b border-[var(--cor-borda)] bg-[var(--cor-superficie)]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Lado Esquerdo: Toggle de Sidebar e Brand / Novo Chat */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
          title="Alternar barra lateral de conversas"
          aria-label="Alternar barra lateral"
        >
          <Icon icon={Menu} size="md" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <AuroraCore size={22} estado={isGenerating ? "processando" : "ocioso"} />
          <span className="font-semibold text-sm text-[var(--texto-principal)] tracking-tight">
            Aurora
          </span>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] border border-transparent hover:border-[var(--cor-borda)] transition-all cursor-pointer"
        >
          <Icon icon={Plus} size="sm" className="text-[var(--espectro-ciano)]" />
          <span>Novo</span>
        </button>
      </div>

      {/* Centro: Seletor Gráfico de Modelo Estilo Claude */}
      <div className="flex items-center justify-center">
        <ModelSelector
          currentModelId={currentModelId}
          onSelectModel={onSelectModel}
        />
      </div>

      {/* Lado Direito: Pastas Locais e Prompt de Sistema */}
      <div className="flex items-center gap-1.5">
        {/* Botão de Diretório Local */}
        <button
          type="button"
          onClick={onOpenFolderManager}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--cor-borda)] bg-[var(--cor-campo)] text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:border-[var(--cor-borda-foco)] transition-all cursor-pointer"
          title={`Pasta local conectada: ${activeFolderName}`}
        >
          <Icon icon={HardDrive} size="sm" className="text-[var(--espectro-ciano)]" />
          <span className="font-mono text-[11px] truncate max-w-24">
            {activeFolderName}
          </span>
        </button>

        {/* Botão de Prompt de Sistema */}
        <button
          type="button"
          onClick={onOpenSystemPrompt}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
            hasCustomPrompt
              ? "border-[var(--espectro-violeta)]/50 bg-[var(--espectro-violeta)]/10 text-[var(--texto-principal)] font-medium shadow-[0_0_8px_rgba(167,139,250,0.15)]"
              : "border-[var(--cor-borda)] bg-[var(--cor-campo)] text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:border-[var(--cor-borda-foco)]"
          }`}
          title="Configurar prompt de sistema da IA"
        >
          <Icon
            icon={Sliders}
            size="sm"
            className={hasCustomPrompt ? "text-[var(--espectro-violeta)]" : ""}
          />
          <span className="hidden md:inline font-semibold">Prompt</span>
          {hasCustomPrompt && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--espectro-violeta)] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}
