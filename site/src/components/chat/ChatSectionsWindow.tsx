import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  Clock,
  Cpu,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Icon } from "../ui/Icon";
import type { ChatSession } from "./ChatSidebar";

interface ChatSectionsWindowProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  activeModelName?: string;
}

/**
 * Janela de Gerenciamento de Seções de Chat (Multi-Sessões / Janela Flutuante)
 * Permite ao usuário navegar, abrir, renomear, duplicar e gerenciar diferentes seções de conversa.
 */
export function ChatSectionsWindow({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onDuplicateSession,
  onRenameSession,
  activeModelName = "OMSK-Core",
}: ChatSectionsWindowProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border-2 border-[#968244]/80 bg-[#070b14] shadow-2xl flex flex-col overflow-hidden text-[#E2E8F0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Janela de Seções */}
        <div className="px-6 py-4 border-b border-[#968244]/40 bg-[#0B132B]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--espectro-ciano)]/15 border border-[var(--espectro-ciano)]/40 flex items-center justify-center text-[var(--espectro-ciano)]">
              <Icon icon={Layers} size="md" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-white flex items-center gap-2">
                <span>Janela de Seções de Chat</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-[var(--espectro-ciano)]/20 text-[var(--espectro-ciano)] border border-[var(--espectro-ciano)]/30">
                  {sessions.length} seções ativas
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Abra, alterne, duplique ou gerencie suas conversas simultâneas do Oh My Shark
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewSession();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--espectro-ciano)] to-[var(--espectro-azul)] text-black font-semibold text-xs hover:opacity-90 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Icon icon={Plus} size="sm" />
              <span>Nova Seção</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar Janela (Esc)"
            >
              <Icon icon={X} size="md" />
            </button>
          </div>
        </div>

        {/* Barra de Filtro Rápido */}
        <div className="px-6 py-3 border-b border-[#968244]/30 bg-[#05070E] flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Filtrar seções pelo título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 text-xs rounded-xl bg-[#0F172A] border border-[#968244]/40 text-white placeholder-[#64748B] focus:outline-none focus:border-[var(--espectro-ciano)]"
          />
          <div className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-2">
            <Icon icon={Cpu} size="sm" className="text-[var(--espectro-ciano)]" />
            <span>Modelo Ativo: <strong className="text-white">{activeModelName}</strong></span>
          </div>
        </div>

        {/* Grade de Seções de Chat */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 scrollbar-styled">
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between group ${
                  isActive
                    ? "bg-[#0B1528] border-[var(--espectro-ciano)] shadow-[0_0_15px_rgba(0,229,255,0.15)] ring-1 ring-[var(--espectro-ciano)]/50"
                    : "bg-[#090D1A] border-[#968244]/40 hover:border-[#968244] hover:bg-[#0E1529]"
                }`}
              >
                {/* Cabeçalho do Card da Seção */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-[var(--espectro-ciano)] text-black"
                          : "bg-white/5 text-[#94A3B8] group-hover:text-white"
                      }`}
                    >
                      <Icon icon={MessageSquare} size="sm" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(session.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="text-xs px-2 py-0.5 rounded bg-black/60 border border-[var(--espectro-ciano)] text-white focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(session.id)}
                            className="p-1 rounded text-green-400 hover:bg-green-500/20"
                          >
                            <Icon icon={Check} size="sm" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="text-sm font-semibold text-white truncate max-w-[200px] cursor-pointer hover:text-[var(--espectro-ciano)]"
                            onClick={() => {
                              onSelectSession(session.id);
                              onClose();
                            }}
                          >
                            {session.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleStartRename(session.id, session.title)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#94A3B8] hover:text-white transition-opacity"
                            title="Renomear título"
                          >
                            <Icon icon={Edit2} size="sm" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Icon icon={Clock} size="sm" />
                          {session.updatedAt}
                        </span>
                        {session.messageCount > 0 && (
                          <span>• {session.messageCount} mensagens</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--espectro-ciano)]/20 text-[var(--espectro-ciano)] border border-[var(--espectro-ciano)]/30">
                      Aberta Agora
                    </span>
                  )}
                </div>

                {/* Rodapé de Ações do Card */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-[#94A3B8] truncate max-w-[150px]">
                    ID: {session.id}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateSession(session.id)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicar Seção de Chat"
                    >
                      <Icon icon={Copy} size="sm" />
                    </button>

                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir Seção"
                      >
                        <Icon icon={Trash2} size="sm" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[var(--espectro-ciano)] text-black hover:opacity-90"
                          : "bg-white/10 text-white hover:bg-[var(--espectro-ciano)] hover:text-black"
                      }`}
                    >
                      <span>{isActive ? "Em Foco" : "Abrir"}</span>
                      <Icon icon={ExternalLink} size="sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Janela */}
        <div className="px-6 py-3 border-t border-[#968244]/40 bg-[#0B132B]/80 flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-mono text-[11px]">
            Dica: você também pode alternar seções pelas abas no topo da área de conversa.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
