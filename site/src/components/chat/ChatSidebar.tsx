import { Plus, MessageSquare, Trash2, X, HardDrive, Download } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  modelId: string;
  thinkingLevelId: string;
  systemPrompt: string;
  folderId: string;
  messageCount: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenFolderManager: () => void;
  onOpenDownloadModal?: () => void;
  activeFolderName: string;
}

/**
 * Barra lateral de navegação multi-sessão e histórico (DESIGN.md Sec 5.1 e 10)
 * - Suporta criação de chats e sessões diferentes
 * - Atalho para download do aplicativo desktop nativo (.exe)
 * - Recolhível e responsiva para telas pequenas
 * - Estética limpa sobre veludo escuro
 */
export function ChatSidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenFolderManager,
  onOpenDownloadModal,
  activeFolderName,
}: ChatSidebarProps) {
  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[var(--cor-superficie)] border-r border-[var(--cor-borda)] flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Topo da Sidebar: Brand e Nova Sessão */}
        <div className="p-4 border-b border-[var(--cor-borda)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AuroraCore size={24} />
            <span className="font-semibold text-sm tracking-tight text-[var(--texto-principal)]">
              CosmoSky
            </span>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)]"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        {/* Botão de Novo Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--cor-borda)] hover:border-[var(--cor-borda-foco)] bg-[var(--cor-campo)] hover:bg-[var(--cor-superficie-elevada)] text-xs font-semibold text-[var(--texto-principal)] shadow-sm transition-all cursor-pointer group active:scale-98"
          >
            <Icon
              icon={Plus}
              size="sm"
              className="text-[var(--espectro-ciano)] group-hover:rotate-90 transition-transform duration-200"
            />
            <span>Nova Conversa</span>
          </button>
        </div>

        {/* Lista de Sessões / Chats */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--texto-terciario)]">
            Conversas Recentes
          </div>

          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--cor-campo)] text-[var(--texto-principal)] font-medium border border-[var(--espectro-ciano)]/40 shadow-sm"
                    : "text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)]/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    icon={MessageSquare}
                    size="sm"
                    className={
                      isActive
                        ? "text-[var(--espectro-ciano)]"
                        : "text-[var(--texto-terciario)] group-hover:text-[var(--texto-secundario)]"
                    }
                  />
                  <div className="truncate">
                    <span className="truncate block">{sess.title}</span>
                    <span className="text-[10px] text-[var(--texto-terciario)] block font-mono">
                      {sess.updatedAt}
                    </span>
                  </div>
                </div>

                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--texto-terciario)] hover:text-[var(--cor-erro)] transition-opacity rounded"
                    title="Excluir conversa"
                  >
                    <Icon icon={Trash2} size="sm" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: App Download e Pasta Local */}
        <div className="p-3 border-t border-[var(--cor-borda)] bg-[var(--cor-fundo)]/30 space-y-2">
          {onOpenDownloadModal && (
            <button
              type="button"
              onClick={onOpenDownloadModal}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-[var(--espectro-ciano)] bg-[var(--espectro-ciano)]/10 hover:bg-[var(--espectro-ciano)]/20 border border-[var(--espectro-ciano)]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Icon icon={Download} size="sm" />
                <span>App Desktop (.exe)</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--espectro-ciano)]/20 text-[var(--espectro-ciano)]">
                v0.0.27
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFolderManager}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
            title="Gerenciar pastas do computador"
          >
            <div className="flex items-center gap-2 truncate">
              <Icon icon={HardDrive} size="sm" className="text-[var(--espectro-ciano)]" />
              <div className="text-left truncate">
                <span className="text-[9px] uppercase font-mono block text-[var(--texto-terciario)]">
                  Pasta Local
                </span>
                <span className="text-xs font-medium text-[var(--texto-secundario)] truncate block">
                  {activeFolderName}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
