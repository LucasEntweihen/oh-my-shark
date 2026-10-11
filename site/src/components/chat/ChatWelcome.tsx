import { Sparkles, Terminal, Code, Cpu, ShieldCheck } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AuroraCore } from "../aurora/AuroraCore";

interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenFolderManager: () => void;
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
 * - Sugestões de início práticas, limpas e clicáveis
 */
export function ChatWelcome({
  onSelectPrompt,
}: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center my-auto py-8 px-4 text-center max-w-2xl mx-auto">
      {/* Núcleo Aurora com Presença Visual */}
      <div className="mb-6 relative group">
        <AuroraCore size={56} />
        <div className="absolute inset-0 rounded-full bg-[var(--espectro-azul)]/20 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      </div>

      {/* Título de Boas-Vindas Oficial */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--texto-principal)] mb-2">
        O que vamos explorar hoje?
      </h2>

      <p className="text-xs sm:text-sm text-[var(--texto-secundario)] max-w-md leading-relaxed mb-8">
        Converse normalmente, selecione modelos de ponta, ajuste níveis de raciocínio ou invoque comandos e especialistas diretamente.
      </p>

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
