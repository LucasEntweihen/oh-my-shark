import { Menu, Sliders, HardDrive, Plus, Download } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";
import { ModelSelector } from "../ui/ModelSelector";
import type { OmskModel } from "../../lib/omsk-api";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  currentModel: OmskModel | null;
  models: OmskModel[];
  providers: string[];
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  onSelectModel: (model: OmskModel) => void;
  onConfigureProvider: () => void;
  onRefreshModels: () => void;
  isLoadingModels?: boolean;
  onOpenSystemPrompt: () => void;
  onOpenFolderManager: () => void;
  onOpenDownloadModal: () => void;
  onNewSession: () => void;
  activeFolderName: string;
  hasCustomPrompt: boolean;
  isGenerating: boolean;
}

/**
 * Barra Superior / Header do Chat (DESIGN.md Sec 5.4)
 * - Identidade visual Aurora
 * - Seletor gráfico de modelos reais do OMSK com provedores
 * - Botão para download do CLI Windows oficial
 * - Acesso direto às configurações de Prompt de Sistema e Pastas Locais
 */
export function ChatHeader({
  onToggleSidebar,
  currentModel,
  models,
  providers,
  selectedProvider,
  onSelectProvider,
  onSelectModel,
  onConfigureProvider,
  onRefreshModels,
  isLoadingModels = false,
  onOpenSystemPrompt,
  onOpenFolderManager,
  onOpenDownloadModal,
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
            CosmoSky
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

      {/* Centro: Seletor Gráfico de Modelo Real do OMSK */}
      <div className="flex items-center justify-center">
        <ModelSelector
          currentModel={currentModel}
          models={models}
          providers={providers}
          selectedProvider={selectedProvider}
          onSelectProvider={onSelectProvider}
          onSelectModel={onSelectModel}
          onConfigureProvider={onConfigureProvider}
          onRefresh={onRefreshModels}
          isLoading={isLoadingModels}
        />
      </div>

      {/* Ação do CLI Windows, diretórios locais e prompt de sistema */}
      <div className="flex items-center gap-2">
        {/* Download do executável CLI publicado */}
        <button
          type="button"
          onClick={onOpenDownloadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--espectro-ciano)]/20 to-[var(--espectro-azul)]/20 border border-[var(--espectro-ciano)]/40 hover:border-[var(--espectro-ciano)] text-[var(--texto-principal)] hover:text-[var(--espectro-ciano)] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)] cursor-pointer active:scale-95"
          title="Baixar OhMyShark CLI (.exe para Windows x64)"
        >
          <Icon icon={Download} size="sm" className="text-[var(--espectro-ciano)]" />
          <span className="hidden sm:inline">Baixar CLI</span>
          <span className="sm:hidden font-mono">.exe</span>
        </button>

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
