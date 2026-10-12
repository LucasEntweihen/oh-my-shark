import { useState } from "react";
import { Copy, Check, RotateCcw, FileText } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";
import { ThoughtViewer } from "./ThoughtViewer";
import type { AttachedFile } from "./MessageComposer";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  thought?: string;
  timestamp: string;
  attachments?: AttachedFile[];
  modelName?: string;
  isGenerating?: boolean;
}

interface MessageItemProps {
  message: Message;
  onRetry?: () => void;
}

/**
 * Item individual de mensagem (DESIGN.md Sec 5.3, 5.6 e 14.3)
 * - Mensagens do usuário em superfície cinza escuro discreta com anexos
 * - Mensagens da IA fluidas, com visualizador de pensamento e ações discretas
 */
export function MessageItem({ message, onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-3 w-full">
        <div
          className="rounded-2xl px-4 py-3 bg-[var(--cor-usuario)] text-[var(--texto-principal)] max-w-[85%] sm:max-w-xl text-sm leading-relaxed border border-white/5 shadow-sm"
          style={{ borderRadius: "20px 4px 20px 20px" }}
        >
          {/* Anexos do usuário se existirem */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-white/10">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/30 text-xs text-[var(--texto-secundario)]"
                >
                  {att.type === "image" && att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5">
                      <Icon icon={FileText} size="sm" />
                      <span className="font-mono text-[11px] truncate max-w-28">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <span className="text-[10px] text-[var(--texto-terciario)] font-mono mt-1 mr-1">
          {message.timestamp}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 my-4 w-full max-w-4xl">
      {/* Avatar / Núcleo Aurora */}
      <div className="pt-0.5">
        <AuroraCore
          size={28}
          estado={message.isGenerating ? "processando" : "ocioso"}
        />
      </div>

      {/* Conteúdo da Resposta da IA */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[var(--texto-principal)]">
            CosmoSky
          </span>
          {message.modelName && (
            <span className="text-[10px] font-mono text-[var(--texto-terciario)] px-1.5 py-0.2 rounded bg-[var(--cor-campo)] border border-[var(--cor-borda)]">
              {message.modelName}
            </span>
          )}
          <span className="text-[10px] text-[var(--texto-terciario)] font-mono">
            {message.timestamp}
          </span>
        </div>

        {/* Visualizador do Pensamento / Traço de Raciocínio */}
        {message.thought && (
          <ThoughtViewer
            thought={message.thought}
            isGenerating={message.isGenerating}
          />
        )}

        {/* Texto da Mensagem */}
        <div className="text-sm text-[var(--texto-principal)] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {message.isGenerating && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--espectro-ciano)] animate-pulse align-middle" />
          )}
        </div>

        {/* Barra Discreta de Ações Secundárias */}
        {!message.isGenerating && message.content && (
          <div className="flex items-center gap-2 mt-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
              title="Copiar resposta"
            >
              <Icon icon={copied ? Check : Copy} size="sm" className={copied ? "text-[var(--espectro-verde)]" : ""} />
              <span className="text-[11px]">{copied ? "Copiado" : "Copiar"}</span>
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
                title="Tentar novamente"
              >
                <Icon icon={RotateCcw} size="sm" />
                <span className="text-[11px]">Regenerar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
