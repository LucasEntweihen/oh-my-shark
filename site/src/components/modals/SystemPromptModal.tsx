import { useState } from "react";
import { Sliders, Sparkles, X, RotateCcw } from "lucide-react";
import { Icon } from "../ui/Icon";

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle: string;
  globalPrompt: string;
  sessionPrompt: string;
  onSave: (globalPrompt: string, sessionPrompt: string) => void;
}

const PROMPT_PRESETS = [
  {
    name: "Engenheiro Sênior & Direto",
    desc: "Respostas concisas, zero código supérfluo, foco em tipagem estrita e elegância.",
    prompt:
      "Você é um engenheiro sênior de software rigoroso. Responda em português com precisão técnica. Nunca use abstrações desnecessárias. Privilegie clareza, zero cópias desnecessárias de dados e tipagem estrita.",
  },
  {
    name: "Arquiteto Sistêmico / Shark Lead",
    desc: "Visão holística, planejamento cirúrgico e divisão de tarefas em lote.",
    prompt:
      "Você é o Shark Lead Orchestrator. Foque em visão sistêmica, contratos claros de dados, análise de riscos e arquitetura escalável.",
  },
  {
    name: "Didático & Explicativo",
    desc: "Explicativo, com analogias claras e passo a passo detalhado.",
    prompt:
      "Você é um tutor paciente e profundo. Explique os conceitos passo a passo com exemplos práticos, analogias claras e contexto histórico ou filológico quando relevante.",
  },
];

/**
 * Modal de Controle do Prompt de Sistema da IA (Global e Por Sessão)
 * Atende ao requisito do usuário:
 * - controlar o prompt de sistema da IA
 * - criar um prompt de sistema para cada chat/sessão
 */
export function SystemPromptModal({
  isOpen,
  onClose,
  chatTitle,
  globalPrompt,
  sessionPrompt,
  onSave,
}: SystemPromptModalProps) {
  const [activeTab, setActiveTab] = useState<"session" | "global">("session");
  const [currentSessionPrompt, setCurrentSessionPrompt] = useState(sessionPrompt);
  const [currentGlobalPrompt, setCurrentGlobalPrompt] = useState(globalPrompt);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(currentGlobalPrompt, currentSessionPrompt);
    onClose();
  };

  const applyPreset = (presetText: string) => {
    if (activeTab === "session") {
      setCurrentSessionPrompt(presetText);
    } else {
      setCurrentGlobalPrompt(presetText);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl overflow-hidden superficie-elevada flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeScale 0.2s ease-out" }}
      >
        {/* Cabeçalho */}
        <div className="p-4 border-b border-[var(--cor-borda)] flex items-center justify-between bg-[var(--cor-superficie)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--cor-campo)] flex items-center justify-center text-[var(--espectro-violeta)]">
              <Icon icon={Sliders} size="sm" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--texto-principal)]">
                Diretrizes & Prompt de Sistema da IA
              </h3>
              <p className="text-xs text-[var(--texto-terciario)]">
                Instruções fundamentais que regem o comportamento e tom da IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        {/* Abas: Específico da Sessão vs Global */}
        <div className="flex border-b border-[var(--cor-borda)] bg-[var(--cor-superficie)]/50 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("session")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "session"
                ? "border-[var(--espectro-violeta)] text-[var(--texto-principal)] font-bold"
                : "border-transparent text-[var(--texto-terciario)] hover:text-[var(--texto-secundario)]"
            }`}
          >
            Neste Chat: <span className="font-semibold text-[var(--espectro-ciano)] truncate max-w-40 inline-block align-bottom">{chatTitle}</span>
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "global"
                ? "border-[var(--espectro-violeta)] text-[var(--texto-principal)] font-bold"
                : "border-transparent text-[var(--texto-terciario)] hover:text-[var(--texto-secundario)]"
            }`}
          >
            Padrão Global do Sistema
          </button>
        </div>

        {/* Corpo do Editor */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === "session" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--texto-secundario)]">
                  Prompt Específico Desta Sessão
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentSessionPrompt("")}
                  className="text-[10px] text-[var(--texto-terciario)] hover:text-[var(--cor-erro)] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon icon={RotateCcw} size="sm" /> Limpar
                </button>
              </div>
              <textarea
                rows={7}
                value={currentSessionPrompt}
                onChange={(e) => setCurrentSessionPrompt(e.target.value)}
                placeholder="Insira diretrizes exclusivas para esta conversa (ex: 'Atue como um revisor de segurança...', 'Foque em SQL e PostgreSQL...')"
                className="w-full text-xs p-3 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] text-[var(--texto-principal)] placeholder:text-[var(--texto-placeholder)] focus:outline-none focus:border-[var(--espectro-violeta)] leading-relaxed resize-none font-mono"
              />
              <p className="text-[10px] text-[var(--texto-terciario)] mt-1">
                Sobrescreve ou refina o comportamento da IA exclusivamente dentro deste chat.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--texto-secundario)]">
                  Prompt de Sistema Base (Global)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentGlobalPrompt(
                      "Você é o CosmoSky AI, um assistente de engenharia de software de altíssimo nível. Responda em português brasileiro com clareza cirúrgica, rigor técnico e elegância."
                    )
                  }
                  className="text-[10px] text-[var(--texto-terciario)] hover:text-[var(--espectro-ciano)] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon icon={RotateCcw} size="sm" /> Restaurar Padrão
                </button>
              </div>
              <textarea
                rows={7}
                value={currentGlobalPrompt}
                onChange={(e) => setCurrentGlobalPrompt(e.target.value)}
                placeholder="Instruções aplicadas a todos os novos chats criados..."
                className="w-full text-xs p-3 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] text-[var(--texto-principal)] placeholder:text-[var(--texto-placeholder)] focus:outline-none focus:border-[var(--espectro-violeta)] leading-relaxed resize-none font-mono"
              />
              <p className="text-[10px] text-[var(--texto-terciario)] mt-1">
                Define a personalidade raiz de todas as instâncias e novos chats.
              </p>
            </div>
          )}

          {/* Presets Rápidos */}
          <div className="pt-2 border-t border-[var(--cor-borda)]">
            <span className="text-[11px] font-semibold text-[var(--texto-secundario)] flex items-center gap-1.5 mb-2">
              <Icon icon={Sparkles} size="sm" className="text-[var(--espectro-amarelo)]" />
              Predefinições Rápidas de Prompt
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROMPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset.prompt)}
                  className="p-2.5 rounded-xl border border-[var(--cor-borda)] bg-[var(--cor-campo)]/60 hover:bg-[var(--cor-campo)] hover:border-[var(--espectro-violeta)]/50 transition-all text-left flex flex-col justify-between gap-1 cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-[var(--texto-principal)] group-hover:text-[var(--espectro-violeta)] transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-[var(--texto-terciario)] line-clamp-2 leading-relaxed">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-3 border-t border-[var(--cor-borda)] bg-[var(--cor-superficie)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--texto-terciario)] font-mono">
            Configurações salvas localmente
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--espectro-violeta)] to-[var(--espectro-azul)] text-white hover:opacity-90 shadow-md transition-all cursor-pointer"
            >
              Aplicar Diretrizes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
