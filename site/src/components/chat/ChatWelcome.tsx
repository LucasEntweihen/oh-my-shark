import { Sparkles, Terminal, Code, Cpu, ShieldCheck, Download, Monitor } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";

interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenFolderManager: () => void;
  onOpenDownloadModal: () => void;
  activeFolderName: string;
}

const STARTER_SUGGESTIONS = [
  {
    icon: Code,
    title: "Analisar Arquitetura e Tipagem",
    desc: "Inspecionar interfaces TypeScript, eliminar 'any' e simplificar módulos.",
    prompt: "Revise a arquitetura de tipos deste projeto e proponha melhorias com tipagem estrita sem 'any'.",
  },
  {
    icon: Terminal,
    title: "Executar com Modo /xlr8",
    desc: "Acelerar linha de raciocínio e gerar código conciso com máxima velocidade.",
    prompt: "/xlr8 Crie um script minimalista de alto desempenho para processar dados locais.",
  },
  {
    icon: ShieldCheck,
    title: "Auditoria com @security-sentinel",
    desc: "Examinar inputs, sanitização de dados e potenciais vetores de injeção.",
    prompt: "@security-sentinel Analise o fluxo de entrada de dados procurando brechas de segurança.",
  },
  {
    icon: Cpu,
    title: "Raciocínio com promaxthink",
    desc: "Ativar passe adversarial de auto-verificação para problemas complexos.",
    prompt: "promaxthink Resolva o balanceamento de carga e deduza os invariantes matemáticos da solução.",
  },
];

/**
 * Tela Inicial de Boas-Vindas sem mensagens (DESIGN.md Sec 5.2)
 * - Núcleo Aurora em tamanho moderado com halo de luz controlado
 * - Título curto e direto: "O que vamos explorar hoje?"
 * - Banner de Download Desktop em destaque
 * - Sugestões de início práticas, limpas e clicáveis
 */
export function ChatWelcome({
  onSelectPrompt,
  onOpenDownloadModal,
}: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center my-auto py-8 px-4 text-center max-w-2xl mx-auto">
      {/* Núcleo Aurora com Presença Visual */}
      <div className="mb-5 relative group">
        <AuroraCore size={56} />
        <div className="absolute inset-0 rounded-full bg-[var(--espectro-azul)]/20 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      </div>

      {/* Título de Boas-Vindas Oficial */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--texto-principal)] mb-2">
        O que vamos explorar hoje?
      </h2>

      <p className="text-xs sm:text-sm text-[var(--texto-secundario)] max-w-md leading-relaxed mb-6">
        Converse normalmente, selecione modelos de ponta, ajuste níveis de raciocínio ou invoque comandos e especialistas diretamente.
      </p>

      {/* Card em Destaque para Download do App .EXE */}
      <div className="w-full mb-6 p-4 rounded-2xl border border-[var(--espectro-ciano)]/30 bg-gradient-to-r from-[var(--cor-campo)] via-[var(--cor-superficie)] to-[var(--cor-campo)] flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--espectro-ciano)]/10 text-[var(--espectro-ciano)] flex items-center justify-center shrink-0">
            <Icon icon={Monitor} size="base" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--texto-principal)]">
                Aplicativo Desktop Oficial
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--espectro-ciano)]/15 text-[var(--espectro-ciano)] font-bold">
                .EXE
              </span>
            </div>
            <p className="text-[11px] text-[var(--texto-terciario)] mt-0.5">
              Execute no seu Windows como app nativo com todos os comandos do omsk.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDownloadModal}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--espectro-ciano)] hover:bg-[var(--espectro-ciano)]/90 text-[#04070E] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:scale-105 cursor-pointer shrink-0 active:scale-95"
        >
          <Icon icon={Download} size="sm" strokeWidth={2.2} />
          <span>Baixar .exe</span>
        </button>
      </div>

      {/* Cartões de Sugestão de Início */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {STARTER_SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-3.5 rounded-2xl border border-[var(--cor-borda)] bg-[var(--cor-superficie)] hover:bg-[var(--cor-campo)] hover:border-[var(--cor-borda-foco)] transition-all cursor-pointer flex flex-col justify-between gap-2 group active:scale-98 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-[var(--cor-campo)] flex items-center justify-center text-[var(--espectro-ciano)] group-hover:scale-105 transition-transform">
                <Icon icon={item.icon} size="sm" />
              </div>
              <Icon
                icon={Sparkles}
                size="sm"
                className="text-[var(--texto-terciario)] group-hover:text-[var(--espectro-amarelo)] transition-colors opacity-0 group-hover:opacity-100"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--texto-principal)] group-hover:text-[var(--espectro-ciano)] transition-colors">
                {item.title}
              </h3>
              <p className="text-[11px] text-[var(--texto-terciario)] mt-0.5 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
