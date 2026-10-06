export type Locale = "en" | "pt";

export const LOCALE_KEY = "ohms:locale";

export function initLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "pt" || stored === "en") return stored;
  } catch {
    /* storage unavailable: fall through to browser preference */
  }
  const langs: readonly string[] =
    typeof navigator !== "undefined" && navigator.languages?.length
      ? navigator.languages
      : [typeof navigator !== "undefined" ? navigator.language : ""];
  const first = (langs[0] ?? "").toLowerCase();
  return first.startsWith("pt") ? "pt" : "en";
}

const en = {
  skipLink: "Skip to content",
  wordmark: "OHMYSHARK",
  navLabel: "Sections",
  versionBadge: "v0.0.20",
  navCommands: "Commands",
  navFeatures: "Features",
  navPreset: "Preset",
  navLineage: "Lineage",
  navGithub: "GitHub",
  githubHref: "https://github.com/LucasEntweihen/oh-my-shark",
  localeToggleLabel: "Language",
  themeToggleLabel: "Color theme",
  themeDark: "Dark",
  themeLight: "Light",

  heroSpectrumBadge: "PROJECT PRISM // DEEP WEB SPECTRUM",
  heroEyebrow: "TERMINAL CODING AGENT",
  heroTitle: "Your terminal agent. Tuned for the herd.",
  heroLede:
    "Install in minutes, code for hours. OhMyShark ships with a curated model setup, automatic fallbacks, and long sessions that stay sharp — no configuration rabbit hole.",
  heroInstallCta: "Install",
  heroChangesCta: "Why OhMyShark",

  quickInstallHeader: "DEFINITIVE INSTALL COMMAND",
  quickInstallSub: "Universal PowerShell 5.1 & Core one-liner — paste and execute directly in your terminal:",
  quickInstallBadge: "LATEST: omsk-v0.0.20",
  quickInstallMeta: "Zero configuration • SHA-256 verified • Isolated in ~/.ohms",
  osMacos: "macOS / Linux",
  osWindows: "Windows (PowerShell)",
  osTabLabel: "Operating system",
  methodVerified: "Verified (Attestation)",
  methodQuick: "Standard (Robust)",
  methodLabel: "Install method",
  verifiedNote: "Zero-trust default. Requires an authenticated GitHub CLI (gh auth login). Verifies the installer attestation against the build provenance before running it.",
  quickNote:
    "Robust disk-write bootstrap. Bypasses in-memory execution constraints (AMSI) and local policies by securely downloading the installer to disk before executing.",
  installHeading: "Install",
  installLede:
    "Pick your platform below. Verified is the safe default; Quick trades verification for speed. Either way you are running in minutes — and your existing config is never touched.",
  presetNote:
    "Ships with a curated starting setup: model roles, fallbacks, long-session compaction. Your keys, your choices — nothing phones home.",
  copyLabel: "Copy",
  copiedMessage: "Copied to clipboard",
  copyFailedMessage: "Copy failed — select the text manually",
  commandRegionLabel: "Install commands",
  stepLabel: "Step",

  telemetryHeader: "OPTICAL REFRACTION TELEMETRY",
  telemetryGrid: "GRID: 3D WIREFRAME MESH (Z-0)",
  telemetrySpectrum: "DISPERSION: 8-BAND CONTINUOUS SPECTRUM (Z-10)",
  telemetryStatus: "ANOMALOUS DATA NODES: 7500+ TB DETECTED",

  providersEyebrow: "MODEL PROVIDERS",
  providersNote:
    "Works with the providers you already pay for. Bring your own keys.",
  providerOpenCodeGo: "OpenCode Go",
  providerOpenAiCodex: "OpenAI Codex",
  providerCommandCode: "CommandCode",

  featuresEyebrow: "CHANNELS",
  featuresHeading: "Features",
  featuresLede:
    "Everything you need to ship from the terminal.",
  featureDetailLabel: "Feature detail",
  featuresList: [
    {
      id: "shark",
      title: "Own identity",
      body: "A shark mark, a clean terminal aesthetic, and a config that lives in its own ~/.ohms — your setup never fights another tool's.",
    },
    {
      id: "preset",
      title: "Ready-to-run models",
      body: "Roles, fallbacks, and thinking levels arrive preconfigured. Bring your own API keys — nothing secret ever ships in the box.",
    },
    {
      id: "commandcode",
      title: "More models on demand",
      body: "A 47-model CommandCode catalog is one env var away. Nothing uses it until you say so.",
    },
    {
      id: "snapcompact",
      title: "Long sessions stay sharp",
      body: "Compaction keeps big sessions coherent instead of degrading. SnapCompact first, graceful fallbacks after.",
    },
    {
      id: "lsp",
      title: "Understands your code",
      body: "Language-server aware edits, diagnostics, and navigation — the agent sees what your IDE sees.",
    },
    {
      id: "debugger",
      title: "Debug without leaving",
      body: "Inspect real program state mid-session instead of sprinkling print statements.",
    },
    {
      id: "orchestration",
      title: "Delegate the grind",
      body: "Fan work out to background agents and get typed results back — no babysitting.",
    },
    {
      id: "upstream",
      title: "Maintained, not frozen",
      body: "Daily upstream syncs land as reviewed PRs, so you get fixes without surprises.",
    },
  ] as Array<{ id: string; title: string; body: string }>,
  commandsEyebrow: "TERMINAL OPERATIONAL MODES",
  commandsHeading: "Special Magic Keywords & Commands",
  commandsLede:
    "Trigger advanced reasoning models, radical delivery acceleration, multi-agent swarm orchestration, and cognitive stream optimization directly in your prompt buffer.",
  powershellFixHeading: "Universal PowerShell Compatibility",
  powershellFixNote:
    "Resolves native architecture via environment variables for zero-error installation on Windows PowerShell 5.1 and PowerShell Core.",
  specialCommandsList: [
    {
      name: "promaxthink",
      tag: "Adversarial Reasoning",
      badgeClass: "badge-red",
      colors: "Rose → Red gradient",
      description:
        "Requests maximum reasoning effort and enforces an adversarial self-verification pass before answers are presented.",
      usage: "promaxthink verify the security invariants of this patch",
    },
    {
      name: "ultrathink",
      tag: "Deep Reasoning",
      badgeClass: "badge-rainbow",
      colors: "Full-Spectrum Rainbow",
      description:
        "Unlocks maximum available thinking and reasoning depth supported by the active model.",
      usage: "ultrathink design a high-throughput event streaming engine",
    },
    {
      name: "workflowz",
      tag: "Persistent Kernel Workflows",
      badgeClass: "badge-blue",
      colors: "Blue → Cyan gradient",
      description:
        "Activates long-running multi-step persistent eval kernel workflows and workpool execution.",
      usage: "workflowz orchestrate test migrations across modules",
    },
    {
      name: "orchestrate",
      tag: "Multi-Agent Swarm",
      badgeClass: "badge-purple",
      colors: "Purple → Magenta gradient",
      description:
        "Decomposes complex requests up front and dispatches parallel task subagents simultaneously.",
      usage: "orchestrate refactor database adapters concurrently",
    },
    {
      name: "deepseaneuron",
      tag: "Token Rationalization",
      badgeClass: "badge-cyan",
      colors: "Cyan → Deep Blue gradient",
      description:
        "Dynamically rationalizes token consumption and maximizes informational signal density without sacrificing depth.",
      usage: "deepseaneuron implement the AST parser optimizations",
    },
    {
      name: "fastthinkworkerz",
      tag: "Radical Velocity",
      badgeClass: "badge-yellow",
      colors: "Yellow → Gold → White gradient",
      description:
        "Aggressively minimizes thinking depth and cuts latency to deliver responses at top speed while preserving agent flow.",
      usage: "fastthinkworkerz fix the typo and rebuild immediately",
    },
    {
      name: "/doomania",
      tag: "Tri-Agent Deliberation Panel",
      badgeClass: "badge-green",
      colors: "Lime → Emerald Green gradient",
      description:
        "Convenes a three-persona panel (crítico, permissivo, criativo) before executing under maximum rigor.",
      usage: "/doomania migrate our auth layer to WebAuthn",
    },
    {
      name: "/xlr8",
      tag: "Hyperspeed & Mid-Flight Acceleration",
      badgeClass: "badge-teal",
      colors: "Gray → Blue → Green → White gradient",
      description:
        "Accelerates reasoning flow, simplifies code, injects instant mid-flight acceleration on active turns, and disconnects from agents into basic mode.",
      usage: "/xlr8 --basic generate the simplest minimal script",
    },
  ] as Array<{ name: string; tag: string; badgeClass: string; colors: string; description: string; usage: string }>,

  changesEyebrow: "WHY OHMYSHARK",
  changesHeading: "Why OhMyShark",
  changesLede: "Built on the excellent Oh My Pi engine — plus everything needed to go from zero to shipping.",
  changesList: [
    {
      title: "Running in minutes",
      body: "One command installs the ohms CLI on Windows or macOS. Verified binaries, checksums checked before anything touches your system.",
    },
    {
      title: "Setup that survives reinstalls",
      body: "Your models and preferences live in plain YAML under ~/.ohms — and reinstalls never overwrite them.",
    },
    {
      title: "Install you can trust",
      body: "Every release asset carries build-provenance attestations you can verify yourself before running anything.",
    },
    {
      title: "Kept current",
      body: "Upstream improvements arrive as reviewable PRs. Conflicts become issues, never silent breakage.",
    },
  ] as Array<{ title: string; body: string }>,

  lineageEyebrow: "LINEAGE",
  lineageHeading: "Built on open source",
  lineageChain: "Pi by Mario Zechner → Oh My Pi by Can Bölük / Stencil Labs → OhMyShark by LucasEntweihen",
  lineageLicense: "Released under the MIT license.",
  lineageDisclaimer: "Independent public fork; not affiliated with Stencil Labs.",

  footerTagline: "made by LucasEntweihen",
  footerLicenses: "Third-party notices",
  footerRelease: "Release omsk-v0.0.20",
  socialX: "X",
  socialGithub: "GitHub",
  socialLinkedin: "LinkedIn",
  socialLabel: "Social links",
};

export type Strings = typeof en;

const pt: Strings = {
  skipLink: "Pular para o conteúdo",
  wordmark: "OHMYSHARK",
  navLabel: "Seções",
  versionBadge: "v0.0.20",
  navCommands: "Comandos",
  navFeatures: "Recursos",
  navPreset: "Configuração",
  navLineage: "Origem",
  navGithub: "GitHub",
  githubHref: "https://github.com/LucasEntweihen/oh-my-shark",
  localeToggleLabel: "Idioma",
  themeToggleLabel: "Tema de cor",
  themeDark: "Escuro",
  themeLight: "Claro",

  heroSpectrumBadge: "PROJECT PRISM // DEEP WEB SPECTRUM",
  heroEyebrow: "AGENTE DE CODIFICAÇÃO PARA TERMINAL",
  heroTitle: "Seu agente de terminal. Afinado para o rebanho.",
  heroLede:
    "Instale em minutos, programe por horas. OhMyShark já vem com modelos configurados, fallbacks automáticos e sessões longas que não perdem o fio — sem labirinto de configuração.",
  heroInstallCta: "Instalar",
  heroChangesCta: "Por que OhMyShark",

  quickInstallHeader: "COMANDO DEFINITIVO DE UMA LINHA",
  quickInstallSub: "Comando de uma linha compatível com PowerShell 5.1 e Core — cole e execute diretamente no terminal:",
  quickInstallBadge: "VERSÃO ATUAL: omsk-v0.0.20",
  quickInstallMeta: "Zero configuração • Validação SHA-256 • Isolado em ~/.ohms",
  osMacos: "macOS / Linux",
  osWindows: "Windows (PowerShell)",
  osTabLabel: "Sistema operacional",
  methodVerified: "Verificado (Attestation)",
  methodQuick: "Padrão (Robusto)",
  methodLabel: "Método de instalação",
  verifiedNote:
    "Padrão zero-trust. Exige GitHub CLI autenticado (gh auth login). Verifica a attestation de proveniência do instalador antes de executá-lo.",
  quickNote:
    "Garantido contra bloqueios de memória (AMSI). Baixa o instalador para o disco e executa com bypass de política, garantindo a instalação em ambientes restritos.",
  installHeading: "Instalação",
  installLede:
    "Escolha sua plataforma abaixo. Verificado é o padrão seguro; Rápido troca verificação por velocidade. De qualquer forma, em minutos você está rodando — e sua config existente nunca é tocada.",
  presetNote:
    "Acompanha uma configuração inicial curada: model roles, fallbacks, compactação para sessões longas. Suas chaves, suas escolhas — nada liga para casa.",
  copyLabel: "Copiar",
  copiedMessage: "Copiado para a área de transferência",
  copyFailedMessage: "Falha ao copiar — selecione o texto manualmente",
  commandRegionLabel: "Comandos de instalação",
  stepLabel: "Passo",

  telemetryHeader: "TELEMETRIA DE REFRAÇÃO ÓTICA",
  telemetryGrid: "MALHA: TOPOGRAFIA 3D WIREFRAME (Z-0)",
  telemetrySpectrum: "DISPERSÃO: ESPECTRO CONTÍNUO DE 8 BANDAS (Z-10)",
  telemetryStatus: "NÓS ANÔMALOS: 7500+ TB DETECTADOS",

  providersEyebrow: "PROVEDORES DE MODELO",
  providersNote:
    "Funciona com os provedores que você já paga. Traga suas próprias chaves.",
  providerOpenCodeGo: "OpenCode Go",
  providerOpenAiCodex: "OpenAI Codex",
  providerCommandCode: "CommandCode",

  featuresEyebrow: "CANAIS",
  featuresHeading: "Recursos",
  featuresLede:
    "Tudo que você precisa para entregar código pelo terminal.",
  featureDetailLabel: "Detalhe do recurso",
  featuresList: [
    {
      id: "shark",
      title: "Identidade própria",
      body: "Marca do tubarão, estética limpa de terminal e config isolada em ~/.ohms — sua configuração nunca briga com outra ferramenta.",
    },
    {
      id: "preset",
      title: "Modelos prontos para rodar",
      body: "Roles, fallbacks e níveis de raciocínio já vêm configurados. Traga suas próprias chaves de API — nenhum segredo viaja na caixa.",
    },
    {
      id: "commandcode",
      title: "Mais modelos sob demanda",
      body: "Um catálogo CommandCode de 47 modelos a uma variável de ambiente de distância. Nada usa sem você mandar.",
    },
    {
      id: "snapcompact",
      title: "Sessões longas afiadas",
      body: "A compactação mantém sessões grandes coerentes em vez de degradar. SnapCompact primeiro, fallbacks graciosos depois.",
    },
    {
      id: "lsp",
      title: "Entende seu código",
      body: "Edição, diagnósticos e navegação com language server — o agente vê o que sua IDE vê.",
    },
    {
      id: "debugger",
      title: "Depure sem sair",
      body: "Inspecione o estado real do programa no meio da sessão em vez de espalhar prints.",
    },
    {
      id: "orchestration",
      title: "Delegue o trabalho pesado",
      body: "Distribua tarefas para agentes em segundo plano e receba resultados tipados — sem babá.",
    },
    {
      id: "upstream",
      title: "Mantido, não congelado",
      body: "Syncs diários do upstream viram PRs revisados — você recebe correções sem surpresas.",
    },
  ] as Array<{ id: string; title: string; body: string }>,

  changesEyebrow: "POR QUE OHMYSHARK",
  changesHeading: "Por que OhMyShark",
  changesLede: "Construído sobre o excelente motor do Oh My Pi — mais tudo que falta para sair do zero ao shipping.",
  commandsEyebrow: "MODOS OPERACIONAIS DE TERMINAL",
  commandsHeading: "Comandos Especiais & Magic Keywords",
  commandsLede:
    "Ative modelos avançados de raciocínio, aceleração máxima de entrega, orquestração de agentes em enxame e otimização cognitiva direto no seu prompt.",
  powershellFixHeading: "Compatibilidade Universal PowerShell 5.1 & Core",
  powershellFixNote:
    "O instalador oficial resolve a arquitetura nativa diretamente via variáveis de ambiente, garantindo instalação sem erros em qualquer versão do Windows PowerShell.",
  specialCommandsList: [
    {
      name: "promaxthink",
      tag: "Raciocínio Adversarial",
      badgeClass: "badge-red",
      colors: "Gradiente Rosa → Vermelho",
      description:
        "Exige nível máximo de pensamento e executa uma verificação adversarial rigorosa antes de apresentar a resposta.",
      usage: "promaxthink valide os invariantes de segurança deste patch",
    },
    {
      name: "ultrathink",
      tag: "Raciocínio Profundo",
      badgeClass: "badge-rainbow",
      colors: "Arco-íris Espectral",
      description:
        "Libera o nível máximo de raciocínio e reflexão suportado pelo modelo em uso.",
      usage: "ultrathink arquitete um motor de streaming de eventos de alta vazão",
    },
    {
      name: "workflowz",
      tag: "Workflows em Kernel Persistente",
      badgeClass: "badge-blue",
      colors: "Gradiente Azul → Ciano",
      description:
        "Ativa pipelines de execução contínua com kernel interativo persistente e workpools paralelos.",
      usage: "workflowz migre a suíte de testes entre os módulos",
    },
    {
      name: "orchestrate",
      tag: "Enxame Multi-Agente",
      badgeClass: "badge-purple",
      colors: "Gradiente Roxo → Magenta",
      description:
        "Decompõe tarefas complexas e despacha subagentes paralelos simultaneamente em lote.",
      usage: "orchestrate refatore adaptadores de banco de dados em paralelo",
    },
    {
      name: "deepseaneuron",
      tag: "Racionalização de Tokens",
      badgeClass: "badge-cyan",
      colors: "Gradiente Ciano → Azul Profundo",
      description:
        "Racionaliza o consumo de tokens e maximiza a densidade informacional sem perder profundidade.",
      usage: "deepseaneuron implemente as otimizações do parser de AST",
    },
    {
      name: "fastthinkworkerz",
      tag: "Velocidade Radical",
      badgeClass: "badge-yellow",
      colors: "Gradiente Amarelo → Dourado → Branco",
      description:
        "Acelera a entrega ao máximo, reduzindo o nível de pensamento e a latência sem perder o fluxo de agentes.",
      usage: "fastthinkworkerz corrija o erro de digitação e recompile imediatamente",
    },
    {
      name: "/doomania",
      tag: "Painel de Deliberação Tri-Agente",
      badgeClass: "badge-green",
      colors: "Gradiente Verde Esmeralda",
      description:
        "Convoca um painel silencioso com 3 agentes (crítico, permissivo e criativo) antes da execução definitiva.",
      usage: "/doomania migre nossa camada de autenticação para WebAuthn",
    },
    {
      name: "/xlr8",
      tag: "Aceleração Hipersônica & In-Flight",
      badgeClass: "badge-teal",
      colors: "Gradiente Cinza → Azul → Verde → Branco",
      description:
        "Acelera a linha de raciocínio, simplifica código, injeta aceleração instantânea em mensagens ativas e permite desconectar de agentes no modo básico.",
      usage: "/xlr8 --basic gere o script mais simples e direto possível",
    },
  ] as Array<{ name: string; tag: string; badgeClass: string; colors: string; description: string; usage: string }>,
  changesList: [
    {
      title: "Rodando em minutos",
      body: "Um comando instala o CLI ohms no Windows ou macOS. Binários verificados, checksums conferidos antes de tocar no seu sistema.",
    },
    {
      title: "Configuração que sobrevive a reinstalações",
      body: "Seus modelos e preferências vivem em YAML puro sob ~/.ohms — e reinstalações nunca sobrescrevem.",
    },
    {
      title: "Instalação em que dá para confiar",
      body: "Cada asset de release traz attestations de proveniência que você mesmo pode verificar antes de executar.",
    },
    {
      title: "Sempre atualizado",
      body: "Melhorias do upstream chegam como PRs revisáveis. Conflitos viram issues, nunca quebra silenciosa.",
    },
  ] as Array<{ title: string; body: string }>,

  lineageEyebrow: "ORIGEM",
  lineageHeading: "Feito sobre código aberto",
  lineageChain: "Pi por Mario Zechner → Oh My Pi por Can Bölük / Stencil Labs → OhMyShark por LucasEntweihen",
  lineageLicense: "Publicado sob a licença MIT.",
  lineageDisclaimer: "Fork público independente; sem afiliação com a Stencil Labs.",

  footerTagline: "made by LucasEntweihen",
  footerLicenses: "Avisos de terceiros",
  footerRelease: "Release omsk-v0.0.20",
  socialX: "X",
  socialGithub: "GitHub",
  socialLinkedin: "LinkedIn",
  socialLabel: "Redes sociais",
};

export const dict: Record<Locale, Strings> = { en, pt };
