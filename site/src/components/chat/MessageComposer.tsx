import { useState, useRef, useEffect, useMemo } from "react";
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
  CheckCircle2,
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
  canonicalKey: string; // chave canônica sem / ou @ para busca universal
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

const RAW_COMMAND_SUGGESTIONS = [
  // Slash Commands Core & Modos Especiais OMSK
  { name: "/fastthinkworkerz", canonicalKey: "fastthinkworkerz", type: "command", desc: "Aceleração radical de entrega, baixa latência e execução sem deliberações supérfluas" },
  { name: "/doomania", canonicalKey: "doomania", type: "command", desc: "Painel de deliberação tripla (Crítico, Permissivo, Criativo) com alto rigor" },
  { name: "/vibecoding", canonicalKey: "vibecoding", type: "command", desc: "Vibe Coding Toolkit: wave planner, quality gate 350 linhas, prompts e tools canônicos" },
  { name: "/wave", canonicalKey: "wave", type: "command", desc: "Despacho em ondas paralelas com arquivos estritamente disjuntos e commits serializados" },
  { name: "/sec-review", canonicalKey: "sec-review", type: "command", desc: "Auditoria diferencial de segurança e varredura de vulnerabilidades" },
  { name: "/vibe", canonicalKey: "vibe", type: "command", desc: "Alterna modo vibecoding para prototipação e velocidade extrema" },
  { name: "/xlr8", canonicalKey: "xlr8", type: "command", desc: "Modo aceleração máxima de pipeline com prefetch de contexto" },
  { name: "/deepseaneuron", canonicalKey: "deepseaneuron", type: "command", desc: "Compressão e racionalização semântica extrema de tokens em rede neural" },
  { name: "/model", canonicalKey: "model", type: "command", desc: "Consulta ou chaveia o modelo de IA ativo para esta sessão" },
  { name: "/thinking", canonicalKey: "thinking", type: "command", desc: "Ajusta o nível de raciocínio profundo (minimal, low, medium, high, max)" },
  { name: "/clear", canonicalKey: "clear", type: "command", desc: "Limpa o contexto da conversa na sessão mantendo as configurações" },
  { name: "/compact", canonicalKey: "compact", type: "command", desc: "Compacta manualmente o contexto da conversa com racionalização semântica" },
  { name: "/tools", canonicalKey: "tools", type: "command", desc: "Lista todas as ferramentas disponíveis no runtime do OMSK" },
  { name: "/taskmanager", canonicalKey: "taskmanager", type: "command", desc: "Abre o painel gráfico Kanban de tarefas em tempo real" },
  { name: "/learner-proj", canonicalKey: "learner-proj", type: "command", desc: "Varredura holística e aprendizado profundo de todo o projeto" },
  { name: "/cleanup", canonicalKey: "cleanup", type: "command", desc: "Varre e limpa arquivos temporários, logs órfãos e resíduos" },
  { name: "/fix-issues", canonicalKey: "fix-issues", type: "command", desc: "Investiga e resolve pendências e alertas do repositório" },
  { name: "/stats", canonicalKey: "stats", type: "command", desc: "Exibe telemetria de heap, CPU e throughput em tempo real" },
  { name: "/git", canonicalKey: "git", type: "command", desc: "Abre o status git, visualizador de diffs e commits" },
  { name: "/session", canonicalKey: "session", type: "command", desc: "Exibe informações estruturais e estatísticas da sessão atual" },
  { name: "/todo", canonicalKey: "todo", type: "command", desc: "Gerencia a lista de tarefas e dependências da sessão" },
  { name: "/usage", canonicalKey: "usage", type: "command", desc: "Exibe consumo de tokens e limites de cota do provedor" },
  { name: "/plan", canonicalKey: "plan", type: "command", desc: "Alterna modo de planejamento autônomo antes da execução" },
  { name: "/goal", canonicalKey: "goal", type: "command", desc: "Define um objetivo autônomo persistente para a sessão" },
  { name: "/fast", canonicalKey: "fast", type: "command", desc: "Ativa tier prioritário de baixa latência no provedor" },
  { name: "/help", canonicalKey: "help", type: "command", desc: "Exibe a central de ajuda com todos os comandos disponíveis" },

  // Agentes do Ecossistema OMSK
  { name: "@code-architect", canonicalKey: "code-architect", type: "agent", desc: "Especialista em TypeScript estrito, Bun, Rust e engenharia de software" },
  { name: "@security-sentinel", canonicalKey: "security-sentinel", type: "agent", desc: "Auditor cético para encontrar brechas, injeções e vulnerabilidades" },
  { name: "@shark-lead", canonicalKey: "shark-lead", type: "agent", desc: "Coordenador estratégico para arquitetura e divisão de tarefas" },
  { name: "@theological-scholar", canonicalKey: "theological-scholar", type: "agent", desc: "Pesquisador lexicográfico de grego, hebraico e números de Strong" },
  { name: "@agent-muu9908f", canonicalKey: "agent-muu9908f", type: "agent", desc: "Agente executor focado e de alta precisão técnica" },
  { name: "@doomania-critico", canonicalKey: "doomania-critico", type: "agent", desc: "Juiz cético com poder de veto para riscos e incorreções" },
  { name: "@doomania-permissivo", canonicalKey: "doomania-permissivo", type: "agent", desc: "Arquiteto pragmático do caminho mais enxuto e direto" },
  { name: "@doomania-criativo", canonicalKey: "doomania-criativo", type: "agent", desc: "Especialista em inovações de alto valor e melhorias estruturais" },

  // Skills & Contratos de Raciocínio
  { name: "promaxthink", canonicalKey: "promaxthink", type: "skill", desc: "Hiper-raciocínio 5x mais complexo com auto-verificação adversarial" },
  { name: "ultrathink", canonicalKey: "ultrathink", type: "skill", desc: "Libera o nível máximo disponível de pensamento do modelo" },
  { name: "deepseaneuron", canonicalKey: "deepseaneuron", type: "skill", desc: "Compressão e racionalização semântica extrema de tokens" },
  { name: "workflowz", canonicalKey: "workflowz", type: "skill", desc: "Workpool determinístico multi-agente e barreiras assíncronas" },
  { name: "orchestrate", canonicalKey: "orchestrate", type: "skill", desc: "Decomposição hierárquica e despacho concorrente de tarefas" },
] as const;

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
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>(
    RAW_COMMAND_SUGGESTIONS as unknown as CommandSuggestion[]
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega comandos reais do backend do OMSK
  useEffect(() => {
    let mounted = true;
    fetchAvailableCommands().then((res) => {
      if (mounted && res.ok && res.commands.length > 0) {
        const dynamicCmds: CommandSuggestion[] = res.commands.map((c) => ({
          name: c.name.startsWith("/") ? c.name : `/${c.name}`,
          canonicalKey: c.name.replace(/^[/@]/, "").toLowerCase(),
          type: "command",
          desc: c.description,
        }));
        setSuggestions((prev) => {
          const names = new Set(prev.map((s) => s.canonicalKey));
          const additions = dynamicCmds.filter((c) => !names.has(c.canonicalKey));
          return [...prev, ...additions];
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-crescimento do textarea (máximo de 200px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 200)}px`;
    }
  }, [content]);

  // Detector inteligente de comandos especiais e keywords mesmo SEM "/" ou "@"
  const detectedSpecialCommand = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return null;

    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/^[/@]/, "") || "";
    const matched = suggestions.find(
      (s) => s.canonicalKey === firstWord
    );
    if (matched) return matched;

    // Procura por keywords mágicos no corpo da mensagem (ex: fastthinkworkerz, doomania, vibecoding)
    const magicKeywords = ["fastthinkworkerz", "vibecoding", "doomania", "xlr8", "deepseaneuron", "promaxthink", "ultrathink"];
    const foundMagic = magicKeywords.find((kw) => trimmed.toLowerCase().includes(kw));
    if (foundMagic) {
      return suggestions.find((s) => s.canonicalKey === foundMagic) || {
        name: `/${foundMagic}`,
        canonicalKey: foundMagic,
        type: "command" as const,
        desc: `Modo de execução especial ativo: ${foundMagic}`,
      };
    }

    return null;
  }, [content, suggestions]);

  // Monitora digitação para acionar sugestões mesmo SEM "/" ou "@"
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Extrai o último token digitado
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1] || "";
    const cleanWord = lastWord.replace(/^[/@]/, "").toLowerCase();

    // Se começa com / ou @ OU se tem mais de 2 letras e combina com o início de algum comando especial
    if (lastWord.startsWith("/") || lastWord.startsWith("@")) {
      setFilterQuery(cleanWord);
      setShowSuggestions(true);
    } else if (cleanWord.length >= 2) {
      const hasMatch = suggestions.some((s) =>
        s.canonicalKey.startsWith(cleanWord) || s.canonicalKey.includes(cleanWord)
      );
      if (hasMatch) {
        setFilterQuery(cleanWord);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
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
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Envio inteligente normalizando comandos especiais mesmo que digitados SEM "/" ou "@"
  const handleSend = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }
    const rawTrimmed = content.trim();
    if (!rawTrimmed && attachments.length === 0) return;

    let finalContent = rawTrimmed;
    let specialMode: string | undefined = undefined;

    if (rawTrimmed) {
      const words = rawTrimmed.split(/\s+/);
      const firstWord = words[0];
      const cleanFirstWord = firstWord.replace(/^[/@]/, "").toLowerCase();

      // Encontra se a primeira palavra corresponde a um comando ou agente
      const matched = suggestions.find((s) => s.canonicalKey === cleanFirstWord);

      if (matched) {
        specialMode = matched.canonicalKey;
        // Se foi digitado sem prefixo (/ ou @), adiciona o prefixo canônico correspondente
        if (!firstWord.startsWith("/") && !firstWord.startsWith("@")) {
          const prefix = matched.type === "agent" ? "@" : "/";
          words[0] = `${prefix}${matched.canonicalKey}`;
          finalContent = words.join(" ");
        }
      } else if (cleanFirstWord === "fastthinkworkerz" || rawTrimmed.toLowerCase().includes("fastthinkworkerz")) {
        specialMode = "fastthinkworkerz";
      }
    }

    onSendMessage(finalContent, attachments, specialMode);
    setContent("");
    setAttachments([]);
    setShowSuggestions(false);
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
    s.canonicalKey.includes(filterQuery) || s.name.toLowerCase().includes(filterQuery)
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Menu Flutuante de Comandos, Skills e Agentes (reconhece COM ou SEM '/') */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute bottom-full left-0 mb-3 w-96 rounded-2xl border-2 border-[#968244]/80 bg-[#070b14] shadow-2xl p-2 z-40 overflow-hidden superficie-elevada"
          style={{ animation: "fadeScale 0.14s ease-out" }}
        >
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] border-b border-[#968244]/40 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Icon icon={Sparkles} size="sm" className="text-[var(--espectro-ciano)]" />
              <span>Comandos & Agentes (Reconhecimento Universal)</span>
            </span>
            <span className="text-[9px] text-[#D4B85E] font-bold">Sem necessidade de '/'</span>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-1 scrollbar-styled">
            {filteredSuggestions.map((sug) => (
              <button
                key={sug.name}
                type="button"
                onClick={() => handleApplySuggestion(sug)}
                className="w-full text-left p-2 rounded-xl hover:bg-[#0E1528] transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-[#968244]/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#0F172A] border border-white/5 flex items-center justify-center text-[#94A3B8] group-hover:text-[var(--espectro-ciano)] shrink-0">
                    {sug.type === "agent" && <Icon icon={Bot} size="sm" />}
                    {sug.type === "command" && <Icon icon={Command} size="sm" />}
                    {sug.type === "skill" && <Icon icon={Zap} size="sm" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-[var(--espectro-ciano)]">
                        {sug.name}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-[#94A3B8]">
                        ou {sug.canonicalKey}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] truncate max-w-[220px]">
                      {sug.desc}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#D4B85E] shrink-0 border border-white/5">
                  {sug.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa Principal do Compositor */}
      <div className="rounded-2xl border-2 border-[#968244]/70 bg-[#05070E] focus-within:border-[var(--espectro-ciano)] focus-within:shadow-[0_0_20px_rgba(0,229,255,0.18)] transition-all flex flex-col p-2.5">
        {/* Banner de Reconhecimento Ativo de Comando Especial */}
        {detectedSpecialCommand && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0C1B33] via-[#091528] to-[#0C1B33] border border-[var(--espectro-ciano)]/50 flex items-center justify-between text-xs animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--espectro-ciano)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--espectro-ciano)]" />
              </span>
              <span className="font-mono text-[11px] text-[#94A3B8]">
                Comando Especial Reconhecido:
              </span>
              <span className="font-mono font-bold text-[var(--espectro-ciano)] bg-[var(--espectro-ciano)]/10 px-1.5 py-0.5 rounded border border-[var(--espectro-ciano)]/30">
                {detectedSpecialCommand.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#D4B85E] flex items-center gap-1">
              <Icon icon={CheckCircle2} size="sm" className="text-green-400" />
              <span>Ativo automaticamente</span>
            </span>
          </div>
        )}

        {/* Barra Superior de Anexos Visuais */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 p-2 mb-2 overflow-x-auto border-b border-white/10">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0B132B] border border-[#968244]/40 text-xs group shrink-0"
              >
                {att.type === "image" && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-6 h-6 rounded object-cover border border-white/10"
                  />
                ) : (
                  <Icon icon={FileCode} size="sm" className="text-[var(--espectro-ciano)]" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white max-w-28 truncate">
                    {att.name}
                  </span>
                  <span className="text-[9px] text-[#94A3B8] font-mono">
                    {att.size}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full hover:bg-white/10 text-[#94A3B8] hover:text-red-400 transition-colors cursor-pointer"
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
          placeholder="Digite sua mensagem, comando (ex: doomania, fastthinkworkerz, clear, stats) ou agente..."
          rows={1}
          className="w-full bg-transparent text-white placeholder:text-[#64748B] text-sm resize-none outline-none leading-relaxed px-2 py-1 font-sans"
        />

        {/* Barra Inferior com Controles e Ações */}
        <div className="flex items-center justify-between pt-2 px-1 border-t border-white/5 mt-1">
          {/* Lado Esquerdo: Ações Rápidas de Contexto */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Anexar imagens ou arquivos"
            >
              <Icon icon={Paperclip} size="sm" />
            </button>

            <button
              type="button"
              onClick={onOpenFolderManager}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono text-[#94A3B8] hover:text-white hover:bg-white/10 border border-transparent hover:border-[#968244]/40 transition-all cursor-pointer"
              title="Clique para alternar pasta do computador"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--espectro-ciano)]" />
              <span className="truncate max-w-32">{activeFolderName}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSuggestions(!showSuggestions);
                setFilterQuery("");
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-mono text-[#D4B85E] hover:text-white hover:bg-white/10 border border-[#968244]/30 transition-all cursor-pointer"
              title="Ver todos os comandos especiais disponíveis"
            >
              <Icon icon={Command} size="sm" />
              <span>Comandos</span>
            </button>
          </div>

          {/* Lado Direito: Botão Enviar / Parar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={!isGenerating && !content.trim() && attachments.length === 0}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isGenerating
                  ? "bg-red-500 text-white hover:opacity-90 shadow-lg shadow-red-500/20"
                  : "bg-gradient-to-r from-[var(--espectro-ciano)] to-[var(--espectro-azul)] text-black font-bold hover:opacity-90 shadow-lg shadow-cyan-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
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
