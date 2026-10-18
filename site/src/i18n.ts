export type Locale = "en" | "pt";

export const LOCALE_KEY = "ohms:locale";

export function initLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "pt" || stored === "en") return stored;
  } catch {
    /* storage unavailable */
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
  wordmark: "OH MY SHARK",
  editionTag: "v0.0.29 // QUANTUM HARNESS",
  versionBadge: "omsk-v0.0.29",
  navFeatures: "Features",
  navBento: "Architecture",
  navCompression: "Compression",
  navCommands: "Pipelines",
  navInstall: "Quickstart",
  navDocs: "Documentation",
  navGithub: "GitHub",
  githubHref: "https://github.com/LucasEntweihen/oh-my-shark",
  localeToggleLabel: "Language",
  themeToggleLabel: "Color theme",
  themeDark: "Dark",
  themeLight: "Light",
  commandPaletteHint: "Press / or Cmd+K for Tactical Command Palette",

  // Telemetry Bar
  telemetryStatus: "SYSTEM: OPTIMAL",
  telemetryEngine: "ENGINE: BUN NATIVE + RUST/NODE ADDONS",
  telemetryTokenSavings: "COMPRESSION: -68.4% TOKENS SAVED",
  telemetryLatency: "TTFT: 14ms",
  telemetryVersion: "BUILD: v0.0.29 PASS",

  // Hero Section
  heroBadge: "OHMYSHARK // PREDATORY VELOCITY CODING HARNESS",
  heroTitlePre: "Autonomous engineering at the",
  heroTitleGradient: "speed of pure thought.",
  heroLede:
    "The sub-millisecond AI agent harness built on Bun, Rust and directed acyclic task graphs. Features semantic compression, 3-way user plan authorization, live Kanban HUD, and zero-overhead execution.",
  heroInstallHeader: "QUICKSTART TERMINAL BOOTSTRAP",
  heroCopyLabel: "Copy",
  heroCopied: "Copied to clipboard [0.4ms]",
  heroCopyFailed: "Copy failed — please select manually",
  heroDownloadExe: "Download Desktop Engine (.exe)",
  heroInspectLive: "Explore Architecture",
  heroDocsCta: "Open Interactive Guide",

  // TUI Simulator Tabs
  tuiTitle: "ohms-tui — 128x48 [LIVE KERNEL]",
  tabTuiLive: "Live Terminal TUI",
  tabTuiTask: "DAG Task Plan Engine",
  tabTuiCompress: "Semantic Compression",
  tabTuiRoster: "Specialist Roster",

  // Section 03 - 6 Pillars Bento Grid
  pillarsEyebrow: "CORE ARCHITECTURE",
  pillarsHeading: "The 6 Structural Pillars of Oh My Shark",
  pillarsLede: "Engineered from first principles for zero needless allocations, deterministic builds, and deep cognitive density.",
  
  pillar1Title: "Task Plan Engine & Topological DAG",
  pillar1Tag: "KAHN ALGORITHM",
  pillar1Body: "Autonomous task sequencing via directed acyclic graphs. Detects circular dependencies with DFS recursion, enforces prerequisite completion, and tracks real verification evidence.",

  pillar2Title: "3-Way User Plan Authorization",
  pillar2Tag: "SOVEREIGN CONTROL",
  pillar2Body: "Developers stay in command: Option A executes the full topological sequence, Option B resolves transitive closures for subsets, and Option C preserves conversational context without loss.",

  pillar3Title: "Deep Semantic Token Compression",
  pillar3Tag: "DEEPSEANEURON",
  pillar3Body: "Reduces context pressure by up to 70%. FileReadCache prevents redundant disk reads via mtime hashing; ToolResultCompactor elides oversized historic outputs safely.",

  pillar4Title: "Predatory Execution Speed",
  pillar4Tag: "/xlr8 & FASTTHINK",
  pillar4Body: "Hyperspeed turnaround pipelines via /xlr8 and fastthinkworkerz. Minimizes speculation, strips boilerplate, and triggers direct basic execution.",

  pillar5Title: "Specialized Multi-Agent Roster",
  pillar5Tag: "COORDINATED SWARM",
  pillar5Body: "Shark Lead orquestrates, Code Architect enforces Bun-native TypeScript, Security Sentinel audits attack surfaces, and Scholar maintains semantic rigor.",

  pillar6Title: "Native Dark TaskManager HUD",
  pillar6Tag: "/taskmanager",
  pillar6Body: "Standalone high-contrast dark Kanban board with live process tracking, opacity control, and local JSON persistence in ~/.omsk/tarefas.json.",

  // Section 04 - Split-Pane Semantic Compression Viewer
  compressEyebrow: "TOKEN OPTIMIZATION",
  compressHeading: "Semantic Compression & FileReadCache",
  compressLede: "Compare uncompressed raw tool outputs with Oh My Shark's dense semantic representations.",
  compressBeforeTitle: "Raw Bloated System & Tool Output",
  compressBeforeStats: "Tokens: 14,850 • Redundancy: High • Disk Reads: 42x",
  compressAfterTitle: "Oh My Shark Compacted Context",
  compressAfterStats: "Tokens: 4,620 • Savings: -68.9% • Cache Hit: 100%",
  compressReductionBadge: "-68.9% TOKEN REDUCTION",

  // Section 05 - Autonomous Workflow Commands Pipeline
  commandsEyebrow: "OPERATIONAL PROTOCOLS",
  commandsHeading: "Autonomous Slash Commands Pipeline",
  commandsLede: "Trigger specialized cognitive stream modes and workflow automation directly in your terminal prompt.",
  
  cmdPromaxthinkName: "promaxthink",
  cmdPromaxthinkBadge: "5x Cognitive Depth",
  cmdPromaxthinkDesc: "Multi-tier first-principles decomposition, adversarial falsification, and uncompromising architectural depth.",

  cmdXlr8Name: "/xlr8",
  cmdXlr8Badge: "Hyperspeed Acceleration",
  cmdXlr8Desc: "Accelerates reasoning flow, simplifies code aggressively, and supports autonomous single-agent basic mode.",

  cmdLearnerName: "/learner-proj",
  cmdLearnerBadge: "Holistic Scan (Cyan→Sapphire)",
  cmdLearnerDesc: "Performs an exhaustive 13-pillar scan across architecture, mechanics, dependencies, and code patterns.",

  cmdDoomaniaName: "/doomania",
  cmdDoomaniaBadge: "Tri-Agent Deliberation",
  cmdDoomaniaDesc: "Convenes critique, permissive, and creative perspectives to review critical changes under maximum rigor.",

  cmdTaskManagerName: "/taskmanager",
  cmdTaskManagerBadge: "Kanban HUD GUI",
  cmdTaskManagerDesc: "Launches the native dark desktop board or web app with real-time process monitoring.",
  cmdUltrathinkName: "ultrathink",
  cmdUltrathinkBadge: "Full-Spectrum Rainbow",
  cmdUltrathinkDesc: "Unlocks maximum available thinking and reasoning depth supported by the active model.",

  cmdFastthinkName: "fastthinkworkerz",
  cmdFastthinkBadge: "Radical Velocity (Gold/White)",
  cmdFastthinkDesc: "Aggressively minimizes thinking depth and cuts latency to deliver responses at top speed.",

  cmdDeepseaName: "deepseaneuron",
  cmdDeepseaBadge: "Token Compression (Blue)",
  cmdDeepseaDesc: "Dynamically rationalizes token consumption and maximizes semantic density without losing depth.",

  cmdWorkflowName: "workflowz",
  cmdWorkflowBadge: "Persistent Workflows (Amber)",
  cmdWorkflowDesc: "Activates long-running multi-step persistent eval kernel workflows and subagent workpool execution.",

  cmdSandboxName: "/vibecoding",
  cmdSandboxBadge: "Vibe Coding Toolkit (Amber → Violet)",
  cmdSandboxDesc: "Wave dispatching, quality gates, canonical documentation, prompts and tool catalog.",

  // Section 06 - 10-Step Interactive Onboarding Guide
  guideEyebrow: "PRACTICAL GUIDE",
  guideHeading: "Complete Developer Onboarding in 10 Steps",
  guideLede: "A clear didactic path from initial setup to multi-hour autonomous task execution.",

  // Section 07 - Installation & Terminal CTA
  installEyebrow: "DEPLOYMENT",
  installHeading: "Install Oh My Shark in Seconds",
  installLede: "Native standalone binaries for Windows, Linux, and macOS. Zero npm dependencies, zero configuration required.",
  
  tabWindows: "Windows (PowerShell)",
  tabMacLinux: "macOS / Linux (Shell)",
  tabVerify: "Verified Install",
  tabQuick: "Standard One-Liner",

  footerSitemap: "Site Map & Architecture",
  footerLicense: "Released under MIT License",
  footerProvenance: "Release omsk-v0.0.29 • SHA-256 Verified",
  footerSocialLabel: "Community and links",

  // Command Palette
  paletteTitle: "Tactical Command Palette",
  palettePlaceholder: "Type a command or jump to section (e.g., 'guide', 'install', 'dag')...",
  paletteEscHint: "Press ESC to close",
};

export type Strings = typeof en;

const pt: Strings = {
  skipLink: "Pular para o conteúdo",
  wordmark: "OH MY SHARK",
  editionTag: "v0.0.29 // MOTOR QUÂNTICO",
  versionBadge: "omsk-v0.0.29",
  navFeatures: "Recursos",
  navBento: "Arquitetura",
  navCompression: "Compressão",
  navCommands: "Pipelines",
  navInstall: "Instalação",
  navDocs: "Documentação",
  navGithub: "GitHub",
  githubHref: "https://github.com/LucasEntweihen/oh-my-shark",
  localeToggleLabel: "Idioma",
  themeToggleLabel: "Tema de cor",
  themeDark: "Escuro",
  themeLight: "Claro",
  commandPaletteHint: "Pressione / ou Cmd+K para abrir a Command Palette",

  // Telemetry Bar
  telemetryStatus: "STATUS: OPERACIONAL ÓTIMO",
  telemetryEngine: "MOTOR: BUN NATIVO + ADDONS RUST/NODE",
  telemetryTokenSavings: "COMPRESSÃO: -68.4% TOKENS POUPADOS",
  telemetryLatency: "TTFT: 14ms",
  telemetryVersion: "BUILD: v0.0.29 APROVADO",

  // Hero Section
  heroBadge: "OHMYSHARK // HARNESS DE CODIFICAÇÃO COM VELOCIDADE PREDATÓRIA",
  heroTitlePre: "Engenharia autônoma na",
  heroTitleGradient: "velocidade do puro pensamento.",
  heroLede:
    "O harness de desenvolvimento sub-milissegundo construído sobre Bun, Rust e grafos acíclicos dirigidos. Traz compressão semântica profunda, autorização de plano em 3 vias, HUD Kanban em tempo real e zero overhead.",
  heroInstallHeader: "COMANDO UNIVERSAL DE INSTALAÇÃO",
  heroCopyLabel: "Copiar",
  heroCopied: "Copiado para a área de transferência [0.4ms]",
  heroCopyFailed: "Falha ao copiar — por favor selecione manualmente",
  heroDownloadExe: "Baixar Executável Desktop (.exe)",
  heroInspectLive: "Explorar Arquitetura",
  heroDocsCta: "Abrir Guia Interativo",

  // TUI Simulator Tabs
  tuiTitle: "ohms-tui — 128x48 [KERNEL ATIVO]",
  tabTuiLive: "Terminal TUI em Tempo Real",
  tabTuiTask: "Motor DAG de Tarefas",
  tabTuiCompress: "Compressão Semântica",
  tabTuiRoster: "Equipe de Especialistas",

  // Section 03 - 6 Pillars Bento Grid
  pillarsEyebrow: "ARQUITETURA CENTRAL",
  pillarsHeading: "Os 6 Pilares Estruturais do Oh My Shark",
  pillarsLede: "Projetado a partir de primeiros princípios para zero alocações inúteis, builds determinísticos e densidade cognitiva máxima.",

  pillar1Title: "Task Plan Engine & DAG Topológico",
  pillar1Tag: "ALGORITMO DE KAHN",
  pillar1Body: "Sequenciamento autônomo de tarefas via grafos acíclicos dirigidos. Detecta dependências circulares com recursão DFS, exige conclusão de pré-requisitos e coleta evidências reais de verificação.",

  pillar2Title: "Autorização de Plano em 3 Vias",
  pillar2Tag: "CONTROLE SOBERANO",
  pillar2Body: "O desenvolvedor permanece no comando: Opção A executa toda a sequência topológica, Opção B resolve dependências para subconjuntos parciais e Opção C preserva o histórico sem perda de dados.",

  pillar3Title: "Compressão Semântica de Tokens",
  pillar3Tag: "DEEPSEANEURON",
  pillar3Body: "Reduz a pressão da janela de contexto em até 70%. FileReadCache elimina leituras redundantes de disco por hash mtime; ToolResultCompactor resume saídas massivas com segurança.",

  pillar4Title: "Velocidade de Execução Predatória",
  pillar4Tag: "/xlr8 & FASTTHINK",
  pillar4Body: "Pipelines de resposta ultrarrápida via /xlr8 e fastthinkworkerz. Minimiza especulações, descarta código supérfluo e aciona execução direta em modo básico.",

  pillar5Title: "Roster de Agentes Especialistas",
  pillar5Tag: "SWARM COORDENADO",
  pillar5Body: "Shark Lead orquestra a estratégia, Code Architect aplica TypeScript nativo Bun com zero overhead, Security Sentinel audita superfícies e Scholar mantém rigor semântico.",

  pillar6Title: "HUD Kanban Dark Nativo",
  pillar6Tag: "/taskmanager",
  pillar6Body: "Quadro Kanban escuro de alto contraste com acompanhamento de processos em tempo real, controle de opacidade e persistência JSON local em ~/.omsk/tarefas.json.",

  // Section 04 - Split-Pane Semantic Compression Viewer
  compressEyebrow: "OTIMIZAÇÃO DE TOKENS",
  compressHeading: "Compressão Semântica & FileReadCache",
  compressLede: "Compare saídas brutas desnecessariamente infladas com as representações semânticas densas do Oh My Shark.",
  compressBeforeTitle: "Saída Bruta Inflada (Tools & Prompts)",
  compressBeforeStats: "Tokens: 14.850 • Redundância: Alta • Leituras de Disco: 42x",
  compressAfterTitle: "Contexto Compactado Oh My Shark",
  compressAfterStats: "Tokens: 4.620 • Economia: -68.9% • Cache Hit: 100%",
  compressReductionBadge: "-68.9% REDUÇÃO DE TOKENS",

  // Section 05 - Autonomous Workflow Commands Pipeline
  commandsEyebrow: "PROTOCOLOS OPERACIONAIS",
  commandsHeading: "Pipeline de Comandos Autônomos",
  commandsLede: "Ative fluxos de raciocínio especializado e automações de engenharia diretamente no buffer do seu terminal.",

  cmdPromaxthinkName: "promaxthink",
  cmdPromaxthinkBadge: "5x Profundidade Cognitiva",
  cmdPromaxthinkDesc: "Decomposição rigorosa por primeiros princípios, falsificação adversarial e profundidade arquitetural implacável.",

  cmdXlr8Name: "/xlr8",
  cmdXlr8Badge: "Aceleração Hipersônica",
  cmdXlr8Desc: "Acelera a linha de raciocínio, simplifica código e suporta modo básico desconectado com velocidade direta.",

  cmdLearnerName: "/learner-proj",
  cmdLearnerBadge: "Mapeamento Holístico (Ciano→Safira)",
  cmdLearnerDesc: "Executa uma varredura profunda em 13 pilares sobre arquitetura, mecânicas, dependências e padrões de código.",

  cmdDoomaniaName: "/doomania",
  cmdDoomaniaBadge: "Painel Tri-Agente",
  cmdDoomaniaDesc: "Convoca visões crítica, permissiva e criativa para deliberar sobre alterações de alto impacto antes da execução.",

  cmdTaskManagerName: "/taskmanager",
  cmdTaskManagerBadge: "HUD Kanban GUI",
  cmdTaskManagerDesc: "Abre o quadro nativo de desktop ou aplicação web com acompanhamento de processos em tempo real.",
  cmdUltrathinkName: "ultrathink",
  cmdUltrathinkBadge: "Arco-Íris Full-Spectrum",
  cmdUltrathinkDesc: "Desbloqueia o nível máximo de raciocínio profundo suportado pelo modelo ativo.",

  cmdFastthinkName: "fastthinkworkerz",
  cmdFastthinkBadge: "Velocidade Radical (Ouro/Branco)",
  cmdFastthinkDesc: "Minimiza drasticamente o tempo de reflexão e reduz latência para entrega ultraveloz.",

  cmdDeepseaName: "deepseaneuron",
  cmdDeepseaBadge: "Compressão de Tokens (Azul)",
  cmdDeepseaDesc: "Racionaliza o consumo de tokens e maximiza densidade semântica sem sacrificar profundidade.",

  cmdWorkflowName: "workflowz",
  cmdWorkflowBadge: "Workflows Persistentes (Âmbar)",
  cmdWorkflowDesc: "Aciona workflows de kernel persistente em múltiplos passos e pools de execução de subagentes.",

  cmdSandboxName: "/vibecoding",
  cmdSandboxBadge: "Vibe Coding Toolkit (Âmbar → Violeta)",
  cmdSandboxDesc: "Despacho em ondas paralelas, quality gates, manifesto canônico, prompts e catálogo de ferramentas.",

  // Section 06 - 10-Step Interactive Onboarding Guide
  guideEyebrow: "GUIA PRÁTICO",
  guideHeading: "Guia Completo de Desenvolvimento em 10 Passos",
  guideLede: "Um percurso didático claro da instalação inicial à execução de tarefas autônomas de múltiplas horas.",

  // Section 07 - Installation & Terminal CTA
  installEyebrow: "IMPLANTAÇÃO",
  installHeading: "Instale o Oh My Shark em Segundos",
  installLede: "Binários nativos standalone para Windows, Linux e macOS. Zero dependências de npm, zero configuração necessária.",

  tabWindows: "Windows (PowerShell)",
  tabMacLinux: "macOS / Linux (Shell)",
  tabVerify: "Instalação Verificada",
  tabQuick: "Comando Rápido Único",

  footerSitemap: "Mapa do Sítio & Arquitetura",
  footerLicense: "Publicado sob Licença MIT",
  footerProvenance: "Release omsk-v0.0.29 • Verificação SHA-256",
  footerSocialLabel: "Comunidade e links",

  // Command Palette
  paletteTitle: "Paleta Tática de Comandos",
  palettePlaceholder: "Digite um comando ou pule para uma seção (ex: 'guia', 'instalar', 'dag')...",
  paletteEscHint: "Pressione ESC para fechar",
};

export const dict: Record<Locale, Strings> = { en, pt };
