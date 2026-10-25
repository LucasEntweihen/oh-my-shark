import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  ArrowUp,
  Square,
  Sparkles,
  Command,
  FileCode,
  X,
  Bot,
  Zap,
} from "lucide-react";
import { Icon } from "../ui/Icon";
import { fetchAvailableCommands } from "../../lib/omsk-api";

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: "image" | "file";
  previewUrl?: string;
}

export interface CommandSuggestion {
  name: string;
  type: "command" | "agent" | "skill";
  desc: string;
}

interface MessageComposerProps {
  onSendMessage: (
    content: string,
    attachments: AttachedFile[],
    specialMode?: string
  ) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  activeFolderName: string;
  onOpenFolderManager: () => void;
}

const INITIAL_COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  // Slash Commands Core
  { name: "/doomania", type: "command", desc: "Painel de deliberação tripla (Crítico, Permissivo, Criativo) com alto rigor" },
  { name: "/model", type: "command", desc: "Consulta ou chaveia o modelo de IA ativo para esta sessão" },
  { name: "/thinking", type: "command", desc: "Ajusta o nível de raciocínio profundo (minimal, low, medium, high, max)" },
  { name: "/clear", type: "command", desc: "Limpa o contexto da conversa na sessão mantendo as configurações" },
  { name: "/compact", type: "command", desc: "Compacta manualmente o contexto da conversa com racionalização semântica" },
  { name: "/tools", type: "command", desc: "Lista todas as ferramentas disponíveis no runtime do OMSK" },
  { name: "/taskmanager", type: "command", desc: "Abre o painel gráfico Kanban de tarefas em tempo real" },
  { name: "/learner-proj", type: "command", desc: "Varredura holística e aprendizado profundo de todo o projeto" },
  { name: "/cleanup", type: "command", desc: "Varre e limpa arquivos temporários, logs órfãos e resíduos" },
  { name: "/fix-issues", type: "command", desc: "Investiga e resolve pendências e alertas do repositório" },
  { name: "/stats", type: "command", desc: "Exibe telemetria de heap, CPU e throughput em tempo real" },
  { name: "/git", type: "command", desc: "Abre o status git, visualizador de diffs e commits" },
  { name: "/session", type: "command", desc: "Exibe informações estruturais e estatísticas da sessão atual" },
  { name: "/todo", type: "command", desc: "Gerencia a lista de tarefas e dependências da sessão" },
  { name: "/usage", type: "command", desc: "Exibe consumo de tokens e limites de cota do provedor" },
  { name: "/plan", type: "command", desc: "Alterna modo de planejamento autônomo antes da execução" },
  { name: "/vibe", type: "command", desc: "Alterna modo vibecoding para prototipação e velocidade extrema" },
  { name: "/goal", type: "command", desc: "Define um objetivo autônomo persistente para a sessão" },
  { name: "/fast", type: "command", desc: "Ativa tier prioritário de baixa latência no provedor" },
  { name: "/help", type: "command", desc: "Exibe a central de ajuda com todos os comandos disponíveis" },

  // Agentes do Ecossistema OMSK
  { name: "@code-architect", type: "agent", desc: "Especialista em TypeScript estrito, Bun, Rust e engenharia de software" },
  { name: "@security-sentinel", type: "agent", desc: "Auditor cético para encontrar brechas, injeções e vulnerabilidades" },
  { name: "@shark-lead", type: "agent", desc: "Coordenador estratégico para arquitetura e divisão de tarefas" },
  { name: "@theological-scholar", type: "agent", desc: "Pesquisador lexicográfico de grego, hebraico e números de Strong" },
  { name: "@agent-muu9908f", type: "agent", desc: "Agente executor focado e de alta precisão técnica" },
  { name: "@doomania-critico", type: "agent", desc: "Juiz cético com poder de veto para riscos e incorreções" },
  { name: "@doomania-permissivo", type: "agent", desc: "Arquiteto pragmático do caminho mais enxuto e direto" },
  { name: "@doomania-criativo", type: "agent", desc: "Especialista em inovações de alto valor e melhorias estruturais" },

  // Skills & Contratos de Raciocínio
  { name: "promaxthink", type: "skill", desc: "Hiper-raciocínio 5x mais complexo com auto-verificação adversarial" },
  { name: "ultrathink", type: "skill", desc: "Libera o nível máximo disponível de pensamento do modelo" },
  { name: "deepseaneuron", type: "skill", desc: "Compressão e racionalização semântica extrema de tokens" },
  { name: "workflowz", type: "skill", desc: "Workpool determinístico multi-agente e barreiras assíncronas" },
  { name: "orchestrate", type: "skill", desc: "Decomposição hierárquica e despacho concorrente de tarefas" },
];

/**
 * Campo de Entrada & Compositor de Mensagem (DESIGN.md Sec 5.5 e 14.2)
 */
export function MessageComposer({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  activeFolderName,
  onOpenFolderManager,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>(INITIAL_COMMAND_SUGGESTIONS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega comandos reais do backend do OMSK
  useEffect(() => {
    let mounted = true;
    fetchAvailableCommands().then((res) => {
      if (mounted && res.ok && res.commands.length > 0) {
        const dynamicCmds: CommandSuggestion[] = res.commands.map((c) => ({
          name: c.name,
          type: "command",
          desc: c.description,
        }));
        setSuggestions((prev) => {
          const names = new Set(prev.map((s) => s.name));
          const additions = dynamicCmds.filter((c) => !names.has(c.name));
          return [...prev, ...additions];
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-crescimento do textarea (máximo de 200px conforme DESIGN.md Sec 5.5)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 200)}px`;
    }
  }, [content]);

  // Monitora digitação para acionar sugestões de comandos / ou agentes @
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Checa se o último token é um comando / ou mencão @
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1] || "";

    if (lastWord.startsWith("/") || lastWord.startsWith("@")) {
      setFilterQuery(lastWord.toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleApplySuggestion = (sug: CommandSuggestion) => {
    const words = content.split(/\s+/);
    words.pop();
    const prefix = words.length > 0 ? words.join(" ") + " " : "";
    const newContent = `${prefix}${sug.name} `;
    setContent(newContent);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }
    if (!content.trim() && attachments.length === 0) return;
    onSendMessage(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachedFile[] = Array.from(files).map((f, i) => {
      const isImg = f.type.startsWith("image/");
      return {
        id: `${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        type: isImg ? "image" : "file",
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.name.toLowerCase().includes(filterQuery)
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Menu Flutuante de Comandos, Skills e Agentes */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute bottom-full left-0 mb-3 w-88 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl p-1.5 z-40 overflow-hidden superficie-elevada"
          style={{ animation: "fadeScale 0.14s ease-out" }}
        >
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--texto-terciario)] border-b border-[var(--cor-borda)] flex items-center justify-between">
            <span>Comandos, Agentes & Skills</span>
            <Icon icon={Sparkles} size="sm" className="text-[var(--espectro-amarelo)]" />
          </div>
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredSuggestions.map((sug) => (
              <button
                key={sug.name}
                type="button"
                onClick={() => handleApplySuggestion(sug)}
                className="w-full text-left p-2 rounded-xl hover:bg-[var(--cor-campo)] transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--cor-superficie)] flex items-center justify-center text-[var(--texto-secundario)] group-hover:text-[var(--texto-principal)]">
                    {sug.type === "agent" && <Icon icon={Bot} size="sm" />}
                    {sug.type === "command" && <Icon icon={Command} size="sm" />}
                    {sug.type === "skill" && <Icon icon={Zap} size="sm" />}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[var(--texto-principal)] group-hover:text-[var(--espectro-ciano)]">
                      {sug.name}
                    </span>
                    <p className="text-[10px] text-[var(--texto-terciario)] line-clamp-1">
                      {sug.desc}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--cor-borda)] text-[var(--texto-terciario)]">
                  {sug.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa Principal do Compositor */}
      <div className="rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-campo)] focus-within:border-[var(--cor-borda-foco)] focus-within:shadow-[0_0_0_3px_rgba(96,165,250,0.12)] transition-all flex flex-col p-2.5">
        {/* Barra Superior de Anexos Visuais */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 p-2 mb-2 overflow-x-auto border-b border-[var(--cor-borda)]/60">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--cor-superficie-elevada)] border border-[var(--cor-borda)] text-xs group shrink-0"
              >
                {att.type === "image" && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-6 h-6 rounded object-cover border border-white/10"
                  />
                ) : (
                  <Icon icon={FileCode} size="sm" className="text-[var(--espectro-azul)]" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[var(--texto-principal)] max-w-28 truncate">
                    {att.name}
                  </span>
                  <span className="text-[9px] text-[var(--texto-terciario)] font-mono">
                    {att.size}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full hover:bg-[var(--cor-campo)] text-[var(--texto-terciario)] hover:text-[var(--cor-erro)] transition-colors cursor-pointer"
                >
                  <Icon icon={X} size="sm" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea de Edição */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta, chame comandos (/), agentes (@) ou skills..."
          rows={1}
          className="w-full bg-transparent text-[var(--texto-principal)] placeholder:text-[var(--texto-placeholder)] text-sm resize-none outline-none leading-relaxed px-2 py-1 font-sans"
        />

        {/* Barra Inferior com Controles e Ações */}
        <div className="flex items-center justify-between pt-2 px-1">
          {/* Lado Esquerdo: Ações Rápidas de Contexto */}
          <div className="flex items-center gap-1.5">
            {/* Input oculto para anexos */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Botão de Anexo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-superficie-elevada)] transition-colors cursor-pointer flex items-center gap-1"
              title="Anexar imagens ou arquivos"
            >
              <Icon icon={Paperclip} size="sm" />
            </button>

            {/* Referência à Pasta Local Ativa */}
            <button
              type="button"
              onClick={onOpenFolderManager}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-superficie-elevada)] border border-transparent hover:border-[var(--cor-borda)] transition-all cursor-pointer"
              title="Clique para alternar pasta do computador"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--espectro-ciano)]" />
              <span className="truncate max-w-32">{activeFolderName}</span>
            </button>
          </div>

          {/* Lado Direito: Botão Enviar / Parar (Morphing conforme ICON_SYSTEM Sec 4.1) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={!isGenerating && !content.trim() && attachments.length === 0}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isGenerating
                  ? "bg-[var(--cor-erro)] text-white hover:opacity-90 shadow-lg shadow-red-500/20"
                  : "bg-gradient-to-r from-[var(--espectro-ciano)] to-[var(--espectro-azul)] text-black hover:opacity-90 shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              title={isGenerating ? "Parar Geração (Esc)" : "Enviar Mensagem (Enter)"}
            >
              <Icon icon={isGenerating ? Square : ArrowUp} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
