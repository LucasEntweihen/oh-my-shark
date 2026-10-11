import { useState } from "react";
import { Key, X, Check, ShieldAlert } from "lucide-react";
import { Icon } from "../ui/Icon";
import { configureOmskProvider } from "../../lib/omsk-api";

interface ConfigureProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProviders: string[];
}

const COMMON_PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", placeholder: "sk-ant-api03-..." },
  { id: "openai", name: "OpenAI (GPT / Codex)", placeholder: "sk-proj-..." },
  { id: "google", name: "Google (Gemini)", placeholder: "AIzaSy..." },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-v1-..." },
  { id: "deepseek", name: "DeepSeek", placeholder: "sk-..." },
  { id: "groq", name: "Groq", placeholder: "gsk_..." },
  { id: "ollama", name: "Ollama (Local)", placeholder: "http://localhost:11434" },
];

/**
 * Modal para Configurar Provedores e Chaves de API Reais no OMSK
 */
export function ConfigureProviderModal({
  isOpen,
  onClose,
  onSuccess,
  existingProviders,
}: ConfigureProviderModalProps) {
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [customProvider, setCustomProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const providerToUse = selectedProvider === "custom" ? customProvider.trim().toLowerCase() : selectedProvider;
    if (!providerToUse || !apiKey.trim()) {
      setErrorMsg("Preencha o provedor e a chave de API.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await configureOmskProvider(providerToUse, apiKey.trim());
    setIsSubmitting(false);

    if (res.ok) {
      setSuccessMsg(`Provedor ${providerToUse} configurado no OMSK com sucesso!`);
      setApiKey("");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || "Falha ao salvar provedor no backend OMSK.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl overflow-hidden superficie-elevada"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="p-5 border-b border-[var(--cor-borda)] flex items-center justify-between bg-[var(--cor-superficie)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] flex items-center justify-center text-[var(--espectro-ciano)]">
              <Icon icon={Key} size="sm" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--texto-principal)]">
                Configurar Provedores OMSK
              </h3>
              <p className="text-[11px] text-[var(--texto-terciario)]">
                Armazenado com segurança local no seu <code className="font-mono">~/.omsk</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--texto-secundario)] block mb-1.5">
              Selecione o Provedor
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] text-[var(--texto-principal)] focus:outline-none focus:border-[var(--espectro-ciano)] cursor-pointer"
            >
              {COMMON_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {existingProviders.includes(p.id) ? "✓ (Já ativo)" : ""}
                </option>
              ))}
              <option value="custom">Outro provedor personalizado...</option>
            </select>
          </div>

          {selectedProvider === "custom" && (
            <div>
              <label className="text-xs font-semibold text-[var(--texto-secundario)] block mb-1.5">
                Nome do Provedor (ID)
              </label>
              <input
                type="text"
                placeholder="ex: mistral, together, fireworks..."
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] text-[var(--texto-principal)] focus:outline-none focus:border-[var(--espectro-ciano)] font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[var(--texto-secundario)] block mb-1.5">
              Chave de API (API Key)
            </label>
            <input
              type="password"
              placeholder={COMMON_PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder || "Chave de API secreta..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] text-[var(--texto-principal)] focus:outline-none focus:border-[var(--espectro-ciano)] font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[var(--cor-erro)]/10 border border-[var(--cor-erro)]/30 text-[var(--cor-erro)] text-xs flex items-center gap-2">
              <Icon icon={ShieldAlert} size="sm" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-[var(--espectro-verde)]/10 border border-[var(--espectro-verde)]/30 text-[var(--espectro-verde)] text-xs flex items-center gap-2 font-medium">
              <Icon icon={Check} size="sm" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cor-borda)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-[var(--texto-secundario)] hover:text-[var(--texto-principal)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--espectro-ciano)] text-[#04070E] hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Autenticando..." : "Salvar no OMSK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
