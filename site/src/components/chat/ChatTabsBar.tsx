import { MessageSquare, Plus, X, Layers } from "lucide-react";
import { Icon } from "../ui/Icon";
import type { ChatSession } from "./ChatSidebar";

interface ChatTabsBarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onCloseSession: (id: string) => void;
  onOpenSectionsWindow: () => void;
}

/**
 * Barra Horizontal de Abas de Seções de Chat (Estilo Abas de Navegador / IDE)
 * Permite ao usuário manter várias seções de conversa abertas simultaneamente e alternar com um clique.
 */
export function ChatTabsBar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onCloseSession,
  onOpenSectionsWindow,
}: ChatTabsBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#968244]/40 bg-[#060913] px-2 py-1 select-none overflow-x-auto scrollbar-styled">
      {/* Lista de Abas de Seções */}
      <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto py-0.5">
        {sessions.map((sess) => {
          const isActive = sess.id === activeSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => onSelectSession(sess.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 max-w-[200px] border ${
                isActive
                  ? "bg-[#0C152B] border-[var(--espectro-ciano)] text-[var(--espectro-ciano)] font-bold shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                  : "bg-[#090D1A]/70 border-white/5 text-[#94A3B8] hover:text-white hover:bg-[#0E1528] hover:border-[#968244]/40"
              }`}
              title={sess.title}
            >
              <Icon
                icon={MessageSquare}
                size="sm"
                className={isActive ? "text-[var(--espectro-ciano)]" : "text-[#64748B] group-hover:text-[#94A3B8]"}
              />
              <span className="truncate">{sess.title}</span>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSession(sess.id);
                  }}
                  className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
                  title="Fechar esta seção"
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </div>
          );
        })}

        {/* Botão de Adicionar Nova Aba de Seção */}
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#94A3B8] hover:text-white transition-all cursor-pointer shrink-0"
          title="Abrir Nova Seção de Chat"
        >
          <Icon icon={Plus} size="sm" className="text-[var(--espectro-ciano)]" />
          <span className="hidden sm:inline">Nova Seção</span>
        </button>
      </div>

      {/* Botão de Janela de Gerenciamento de Seções */}
      <div className="flex items-center pl-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSectionsWindow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#968244]/15 hover:bg-[#968244]/25 border border-[#968244]/50 text-xs font-mono text-[#D4B85E] hover:text-white transition-all cursor-pointer shadow-sm"
          title="Abrir Janela de Seções de Chat (Gerenciador Visual)"
        >
          <Icon icon={Layers} size="sm" className="text-[var(--espectro-ciano)]" />
          <span className="font-semibold hidden md:inline">Janela de Seções</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-[#968244]/30 font-bold">
            {sessions.length}
          </span>
        </button>
      </div>
    </div>
  );
}
