import { Download, Monitor, ExternalLink, Check, Copy } from "lucide-react";
import { useState } from "react";
import { Icon } from "../ui/Icon";

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal e Central de Download da Aplicação Desktop Executável (.exe)
 * Permite ao usuário baixar o aplicativo diretamente pelo navegador no Vercel/Web.
 */
export function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [copied, setCopied] = useState(false);
  const version = "v0.0.32";
  const releaseTag = "omsk-v0.0.32";
  const exeFileName = "CosmoSky-windows-x64.exe";
  const exeDownloadUrl = `https://github.com/LucasEntweihen/oh-my-shark/releases/download/${releaseTag}/${exeFileName}`;
  const quickInstallCommand = `irm https://github.com/LucasEntweihen/oh-my-shark/releases/download/omsk-v0.0.32/install.ps1 | iex`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(quickInstallCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-[var(--cor-borda)] bg-[var(--cor-superficie-elevada)] shadow-2xl overflow-hidden superficie-elevada"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Banner do Modal com Espectro Cromático */}
        <div className="relative p-6 border-b border-[var(--cor-borda)] bg-[var(--cor-superficie)] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--espectro-azul)]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--cor-campo)] border border-[var(--cor-borda)] flex items-center justify-center text-[var(--espectro-ciano)] shadow-inner">
                <Icon icon={Monitor} size="base" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[var(--texto-principal)]">
                    CosmoSky Desktop (.exe)
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[var(--espectro-ciano)]/15 text-[var(--espectro-ciano)] border border-[var(--espectro-ciano)]/30">
                    {version} .exe
                  </span>
                </div>
                <p className="text-xs text-[var(--texto-terciario)] mt-0.5">
                  Executável nativo completo com todas as funções e tecnologia do terminal
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--texto-terciario)] hover:text-[var(--texto-principal)] hover:bg-[var(--cor-campo)] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 space-y-5">
          {/* Botão de Download Direto .EXE */}
          <div className="flex flex-col gap-2">
            <a
              href={exeDownloadUrl}
              download={exeFileName}
              className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[var(--espectro-ciano)] via-[var(--espectro-azul)] to-[var(--espectro-violeta)] text-[#04070E] font-bold shadow-[0_0_25px_rgba(0,229,255,0.25)] hover:shadow-[0_0_35px_rgba(0,229,255,0.45)] hover:scale-[1.01] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center text-[#04070E]">
                  <Icon icon={Download} size="base" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75">
                    Download Imediato para Windows
                  </span>
                  <span className="text-sm font-extrabold block">
                    Baixar {exeFileName}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/10">
                Executável Autônomo
              </span>
            </a>

            <div className="flex items-center justify-between px-1 text-[11px] text-[var(--texto-terciario)] font-mono">
              <span>Binário compilado SHA-256 verificado</span>
              <a
                href={`https://github.com/LucasEntweihen/oh-my-shark/releases/tag/${releaseTag}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--espectro-ciano)] hover:underline flex items-center gap-1"
              >
                Release oficial no GitHub <Icon icon={ExternalLink} size="sm" />
              </a>
            </div>
          </div>

          {/* Destaque das Capacidades da Janela Nativa */}
          <div className="p-3.5 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie)]/50 space-y-2">
            <span className="text-xs font-semibold text-[var(--texto-secundario)] block">
              Recursos integrados no executável desktop:
            </span>
            <ul className="text-xs text-[var(--texto-terciario)] space-y-1.5 list-disc list-inside">
              <li>
                <span className="text-[var(--texto-principal)] font-medium">Exata mesma interface gráfica</span>: chats múltiplos, visualizador de pensamento, seletores gráficos de raciocínio.
              </li>
              <li>
                <span className="text-[var(--texto-principal)] font-medium">Motor nativo omsk</span>: integração completa com os comandos de terminal, slash commands (<code className="font-mono text-[10px]">/taskmanager</code>, <code className="font-mono text-[10px]">/xlr8</code>, etc.) e ferramentas do sistema.
              </li>
              <li>
                <span className="text-[var(--texto-principal)] font-medium">Pastas locais sem fricção</span>: acesso direto aos seus projetos do computador em <code className="font-mono text-[10px]">~/.omsk</code>.
              </li>
            </ul>
          </div>

          {/* Opção de Instalação Automática via Terminal (One-Liner) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--texto-terciario)] font-mono text-[11px]">
                Ou instale pelo PowerShell (adiciona ao PATH automaticamente):
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-mono text-[var(--texto-secundario)] hover:text-[var(--espectro-ciano)] transition-colors cursor-pointer"
              >
                <Icon icon={copied ? Check : Copy} size="sm" className={copied ? "text-[var(--espectro-verde)]" : ""} />
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--cor-fundo)] border border-[var(--cor-borda)] font-mono text-[11px] text-[var(--espectro-ciano)] overflow-x-auto select-all">
              {quickInstallCommand}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-[var(--cor-borda)] bg-[var(--cor-superficie)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--texto-terciario)] font-mono">
            Zero telemetria • 100% autônomo e local
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--cor-campo)] hover:bg-[var(--cor-campo)]/80 text-[var(--texto-principal)] border border-[var(--cor-borda)] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
