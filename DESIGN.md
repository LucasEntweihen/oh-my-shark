---
version: "alpha"
name: "Oh My Pi (OMP) — Home Page Official Design System"
description: "Especificação arquitetural e visual exaustiva da Home Page do ecossistema de agentes de codificação autónomos Oh My Pi (OMP), unindo precisão industrial de terminal TUI, compressão semântica, integração nativa Rust/Bun/Bazel e orquestração multi-modelo."
theme: "Dark Mode Exclusivo — Cybernetic Terminal & Precision TUI"

colors:
  # Superfícies & Backgrounds (Tonal Layers de Profundidade Terminal)
  background-void: "#06070A"
  background-primary: "#0A0C10"
  background-secondary: "#0F1218"
  surface-terminal: "#12161F"
  surface-elevated: "#181D29"
  surface-interactive: "#1F2637"
  surface-glass: "rgba(18, 22, 31, 0.78)"
  surface-glass-heavy: "rgba(10, 12, 16, 0.92)"

  # Identidade de Marca & Acentos (Core OMP Spectrum)
  primary: "#FF5500"
  primary-hover: "#FF6E26"
  primary-pressed: "#CC4400"
  primary-glow: "rgba(255, 85, 0, 0.28)"
  
  secondary: "#00E5FF"
  secondary-hover: "#33EBFF"
  secondary-glow: "rgba(0, 229, 255, 0.22)"
  
  tertiary: "#A855F7"
  tertiary-hover: "#C084FC"
  tertiary-glow: "rgba(168, 85, 247, 0.24)"

  # Cores de Ecossistema, Ferramentas & Providers (Extraídas dos Assets do Repo)
  provider-arxiv: "#B31B1B"
  provider-perplexity: "#20B8CD"
  provider-lspv: "#38BDF8"
  provider-discovery: "#F59E0B"
  provider-models: "#8B5CF6"
  provider-ask: "#10B981"
  tech-rust: "#DEA584"
  tech-bun: "#FBF0DF"
  tech-bazel: "#43A047"
  tech-nix: "#5277C3"

  # Semânticas de Telemetria & Status TUI
  status-success: "#00E676"
  status-warning: "#FFEA00"
  status-error: "#FF1744"
  status-info: "#00B0FF"

  # Tipografia & Escala de Cinzas (Alto Contraste WCAG AAA/AA)
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-muted: "#64748B"
  text-terminal-green: "#4ADE80"
  text-terminal-amber: "#FBBF24"
  on-primary: "#06070A"
  on-secondary: "#06070A"

  # Bordas & Divisores Estruturais (Box-Drawing & Hairlines)
  border-subtle: "#1E293B"
  border-default: "#334155"
  border-focus: "#FF5500"
  border-cyan-glow: "rgba(0, 229, 255, 0.45)"
  border-glass: "rgba(255, 255, 255, 0.08)"

typography:
  headline-hero:
    fontFamily: "'Space Grotesk', 'Geist', -apple-system, sans-serif"
    fontSize: "clamp(2.75rem, 5vw + 1rem, 4.75rem)"
    fontWeight: "700"
    lineHeight: "1.04"
    letterSpacing: "-0.035em"
  headline-section:
    fontFamily: "'Space Grotesk', 'Geist', sans-serif"
    fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.25rem)"
    fontWeight: "700"
    lineHeight: "1.12"
    letterSpacing: "-0.025em"
  headline-card:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "1.5rem"
    fontWeight: "600"
    lineHeight: "1.25"
    letterSpacing: "-0.015em"
  body-lg:
    fontFamily: "'Inter', 'Public Sans', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: "400"
    lineHeight: "1.65"
    letterSpacing: "-0.005em"
  body-md:
    fontFamily: "'Inter', 'Public Sans', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: "0em"
  body-sm:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "0.005em"
  code-tui:
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Geist Mono', monospace"
    fontSize: "0.9375rem"
    fontWeight: "500"
    lineHeight: "1.55"
    letterSpacing: "-0.01em"
  label-telemetry:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: "0.08em"

spacing:
  half: "4px"
  base: "8px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
  5xl: "128px"

rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.code-tui}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
    border: "1px solid #FF7733"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    boxShadow: "0 0 24px {colors.primary-glow}"
  button-secondary:
    backgroundColor: "{colors.surface-terminal}"
    textColor: "{colors.text-primary}"
    typography: "{typography.code-tui}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
    border: "1px solid {colors.border-default}"
  terminal-window:
    backgroundColor: "{colors.surface-terminal}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.border-default}"
    padding: "{spacing.lg}"
  bento-card:
    backgroundColor: "{colors.background-secondary}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.border-subtle}"
    padding: "{spacing.xl}"
---

# DESIGN.md — Especificação Oficial da Home Page do Oh My Pi (`omp`)

Este documento constitui a **Fonte Única de Verdade (Single Source of Truth)** para o desenvolvimento, manutenção e evolução visual da **Home Page do Oh My Pi (`omp`)**. Projetado especificamente para ser consumido de forma determinística por agentes de codificação de IA (Claude Code, Cursor, Windsurf, Google Stitch, Kiro) e engenheiros de front-end humanos, este arquivo combina **design tokens legíveis por máquina** no cabeçalho YAML com **regras arquiteturais, heurísticas, diretrizes vetoriais e especificações de interface legíveis por humanos** em Markdown. 

A sua existência na raiz do repositório (`oh-my-pi/DESIGN.md`), posicionado estrategicamente ao lado de `AGENTS.md`, elimina definitivamente a improvisação estilística (*vibe coding* / *AI slop*) e garante que cada componente gerado reflita a engenharia de extrema precisão do ecossistema **Oh My Pi** — construído sobre **Rust** (`Cargo.toml` / `Cargo.lock`), **TypeScript / Bun** (`.omp/tools/tui.ts`, `bun.lock`), **Bazel 9.2.0** (`BUILD.bazel`, `MODULE.bazel`) e **Nix** (`nix.yml`), equipado com *skills* nativas de **Semantic Compression**, **System Prompts Optimization** (incluindo suporte a *Small Models*), **Tool Prompt Optimization** (`probe.ts`, `probe-builtin.ts`), automação via comandos (`.omp/commands/cleanup.md`, `fix-issues.md`, `release.md`, `review-prs.md`, `triage.md`) e execução isolada com `Dockerfile.robomp`.

---

## 1. Visão Geral e Heurísticas (Overview & UX Heuristics)

### 1.1. Direção Visual e Atmosfera ("Tactical TUI Meets High-Velocity Systems Engineering")
A Home Page do **Oh My Pi (`omp`)** não deve parecer um template SaaS genérico de marketing; ela deve transpirar a atmosfera de um **ambiente de engenharia de sistemas de altíssima performance e baixa latência**. A estética funde o rigor geométrico das interfaces de terminal modernas (**TUI — Terminal User Interface**, derivada diretamente de `.omp/tools/tui.ts`) com camadas tonais escuras de acabamento fosco (*matte dark obsidian*), acentos elétricos em **Pi-Flame Orange (`#FF5500`)** e **Telemetry Cyan (`#00E5FF`)**, e diagramas vetoriais de compressão de tokens e árvores sintáticas abstratas (LSPV).

### 1.2. Aplicação Implacável das 10 Heurísticas de Nielsen e Leis da Psicologia Cognitiva
Toda decisão de layout e microinteração na Home Page submete-se às 10 Heurísticas de Usabilidade de Jakob Nielsen e à Lei de Hick:

1. **Visibilidade do Status do Sistema (Heurística #1):** Como o `omp` é uma ferramenta centrada em execução de agentes e otimização de prompts, a Home Page deve exibir telemetria viva simulada e interativa. O emulador de TUI no Hero mostra em tempo real o estado do agente (`[OMP::IDLE]`, `[OMP::PROBING_TOOLS]`, `[OMP::COMPRESSING_CONTEXT]`), a contagem exata de tokens economizados via `semantic-compression` e a latência de resposta em milissegundos (`14ms`). Ao clicar no botão de copiar o comando de instalação (`curl -fsSL https://ohmypi.dev/install.sh | sh` ou `bunx oh-my-pi`), o feedback visual é instantâneo (mudança de ícone para `✓ COPIED TO CLIPBOARD [0.4ms]`, alteração de borda para `#00E676` e anúncio via `aria-live`).
2. **Correspondência entre o Sistema e o Mundo Real (Heurística #2):** O público-alvo é composto por engenheiros de software seniores, arquitetos de IA e hackers de sistemas. A linguagem visual utiliza metáforas reais do cotidiano de desenvolvimento: janelas de terminal com caracteres de desenho de caixa Unicode (`┌─┐│└─┘`), diffs de código reais, árvores de diretórios do próprio repositório (`.omp/skills/`, `.omp/commands/`), badges de build do Bazel (`9.2.0 PASS`) e gráficos de chamadas LSP (`lspv`). Jargões vazios de marketing corporativo são estritamente proibidos.
3. **Controle e Liberdade do Usuário (Heurística #3):** Nenhum vídeo, simulação de terminal ou carrossel de demonstração (`ask.webp`, `discovery.webp`, `models.webp`, `lspv.webp`, `perplexity.webp`, `arxiv.webp`) pode prender o usuário ou sequestrar o scroll (*scroll-jacking*). O terminal interativo da Home Page possui botões explícitos de `[PAUSE]`, `[RESET]`, `[STEP FORWARD]` e atalhos de teclado (`Esc` para fechar modais de inspeção de imagem, `Space` para pausar a simulação TUI).
4. **Consistência e Padrões (Heurística #4):** Um código de cores semântico inquebrável governa toda a página:
   * **Laranja Pi (`#FF5500`):** Exclusivo para o CTA primário, foco de teclado e ações de mutação/execução do agente.
   * **Ciano Telemetria (`#00E5FF`):** Exclusivo para inspeção de dados, links técnicos, nós de LSP (`lspv`) e buscas (`perplexity`, `discovery`).
   * **Roxo Neural (`#A855F7`):** Exclusivo para compressão semântica (`semantic-compression`) e roteamento de modelos (`models`, `small-models.md`).
   * **Verde Terminal (`#00E676`):** Exclusivo para validações bem-sucedidas, testes `nextest` / `bazel test` aprovados e redução de custos de tokens.
5. **Prevenção de Erros (Heurística #5):** No seletor de instalação rápida da Home Page (que alterna entre `Bun`, `Cargo/Rust`, `Nix Flake`, `Docker Robomp` e `Bazel`), o comando é pré-formatado sem caracteres invisíveis ou `$` iniciais que quebrariam a colagem direta no terminal do usuário. Ao selecionar uma aba de sistema operacional (Linux, macOS, WSL2), comandos incompatíveis são automaticamente filtrados.
6. **Reconhecimento em vez de Memorização — Diálogo com a Lei de Miller (Heurística #6):** A arquitetura do `omp` possui múltiplos submódulos (`.omp/commands/`, `.omp/skills/`, `.omp/tools/`). Em vez de forçar o usuário a memorizar flags de CLI, a seção de *Interactive Showcase* mantém os 6 pilares visuais (`Ask`, `Discovery`, `LSPV`, `Models`, `ArXiv`, `Perplexity`) sempre visíveis em abas com ícones semânticos e previews instantâneos, respeitando o limite cognitivo de $7 \pm 2$ blocos de informação por seção visual.
7. **Flexibilidade e Eficiência de Uso (Heurística #7):** A Home Page suporta navegação completa para *power users* via teclado: pressionar `/` ou `Cmd+K` (`Ctrl+K`) abre uma paleta de comandos estilo TUI diretamente no navegador, permitindo saltar para qualquer seção, copiar o comando de instalação, alternar a visualização de compressão de prompts ou abrir o repositório GitHub em menos de 200ms.
8. **Design Estético e Minimalista (Heurística #8):** Cada pixel na tela deve justificar a sua presença através de utilidade informacional. Fundos decorativos caóticos, blobs flutuantes sem significado técnico ou gradientes arco-íris genéricos são banidos. O espaço negativo em `#06070A` e `#0A0C10` é utilizado generosamente para isolar os diagramas técnicos e capturas do `tui.ts`.
9. **Ajudar a Reconhecer, Diagnosticar e Recuperar-se de Erros (Heurística #9):** No playground interativo de *Semantic Compression* e *Tool Prompt Probe* da Home Page, caso o usuário insira um prompt inválido ou vazio para testar o compressor, a interface não exibe um alerta genérico; ela renderiza um diagnóstico estilo compilador Rust/Oxlint: `error[OMP-E042]: Empty prompt buffer provided. Hint: Paste a system prompt (>50 tokens) or click [Load Sample Prompt] to benchmark compression.`.
10. **Ajuda e Documentação Contextual (Heurística #10):** Cada termo técnico exclusivo do repositório (`RoboMP`, `Semantic Compression`, `Tool Prompt Probe`, `Small-Model Routing`, `LSPV`) possui *tooltips* instantâneos acionáveis por *hover* ou foco (`Tab`), exibindo um resumo técnico conciso de 2 linhas e o caminho direto para o arquivo correspondente no repositório (ex: `.omp/skills/semantic-compression/SKILL.md`).
11. **Lei de Hick e Funil Vertical de Conversão:** O tempo de decisão cresce logaritmicamente com o número de escolhas ($T = b \cdot \log_2(n + 1)$). Portanto, acima da dobra (*Above the Fold*), existem apenas **duas ações competitivas**: o CTA Primário (`Install Oh My Pi` / Copiar Comando CLI) em destaque absoluto (`#FF5500`) e o CTA Secundário (`Explore Architecture & GitHub`) em superfície neutra.

---

## 2. Os Elementos Visuais e Cores (Visual Elements & Color Palette)

A paleta de cores da Home Page do **Oh My Pi** é estritamente controlada pelos tokens definidos no YAML Frontmatter, desenhada para monitores OLED e LCD modernos em ambientes de baixa luminosidade, garantindo fadiga visual zero e contraste cirúrgico.

### 2.1. Tabela Normativa de Cores e Papéis Semânticos

| Token YAML | Código Hex / Valor CSS | Espaço OKLCH Aproximado | Papel Semântico e Regra Estrita de Aplicação na Home Page |
| :--- | :--- | :--- | :--- |
| `background-void` | `#06070A` | `oklch(12% 0.015 260)` | Fundo mais profundo da página (body background) e interior de blocos de código/terminais brutos. |
| `background-primary` | `#0A0C10` | `oklch(15% 0.018 260)` | Fundo principal das seções estruturais pares para criar separação tonal sem sombras pesadas. |
| `background-secondary` | `#0F1218` | `oklch(18.5% 0.022 260)` | Superfície base dos *Bento Cards*, containers de módulos (`.omp/skills`) e painéis de métricas. |
| `surface-terminal` | `#12161F` | `oklch(21% 0.028 262)` | Corpo da janela principal do emulador TUI (`tui.ts`) e containers de abas interativas. |
| `surface-elevated` | `#181D29` | `oklch(24.5% 0.032 262)` | Cabeçalhos de janelas de terminal, barras de título de cards, *tooltips* e modais de comando (`Cmd+K`). |
| `surface-interactive` | `#1F2637` | `oklch(28% 0.038 264)` | Estado de `:hover` e `:active` para cards clicáveis, abas de navegação de features e linhas de tabela. |
| `primary` | `#FF5500` | `oklch(66% 0.22 38)` | **Pi-Flame Orange.** Cor primária da marca. Reservada **exclusivamente** para o CTA principal, cursor de bloco ativo no terminal, indicadores de seleção primária e anel de foco de acessibilidade (`:focus-visible`). |
| `secondary` | `#00E5FF` | `oklch(84% 0.16 205)` | **Telemetry Cyan.** Usada em grafos de análise estática (`lspv`), conexões de rede de agentes, destaques de sintaxe e métricas de velocidade. |
| `tertiary` | `#A855F7` | `oklch(64% 0.23 305)` | **Semantic Violet.** Representa o motor de *Semantic Compression*, otimização de prompts e roteamento inteligente de LLMs. |
| `status-success` | `#00E676` | `oklch(82% 0.21 152)` | Indicadores de economia de tokens (ex: `-64% tokens`), status de CI (`Bazel/Nix Passing`) e confirmação de cópia. |
| `status-warning` | `#FFEA00` | `oklch(92% 0.19 98)` | Alertas de limite de contexto (*Context Window Pressure*) no simulador de compressão e avisos de latência. |
| `status-error` | `#FF1744` | `oklch(63% 0.25 22)` | Indicadores de tokens desperdiçados (prompts não otimizados no comparador *Before/After*) e erros de validação. |
| `text-primary` | `#F8FAFC` | `oklch(98% 0.005 250)` | Títulos (`H1`–`H4`), código principal no TUI e textos de leitura primária (Contraste > 17:1 sobre `#0A0C10`). |
| `text-secondary` | `#94A3B8` | `oklch(71% 0.03 255)` | Subtítulos, parágrafos explicativos de arquitetura e descrições de cards (Contraste > 7.2:1 sobre `#0A0C10`). |
| `text-muted` | `#64748B` | `oklch(53% 0.035 255)` | Comentários de código (`//`), números de linha do editor, carimbos de tempo UTC e metadados secundários (Contraste > 4.6:1 sobre `#06070A`, cumprindo rigorosamente WCAG AA). |

### 2.2. Regras de Gradientes e Texturas Funcionais
* **Proibição de Degradês Decorativos Aleatórios:** Nenhum texto comum pode usar gradiente arco-íris. O único gradiente tipográfico permitido é no sufixo focal do `H1` da Hero Section: `linear-gradient(135deg, #FF5500 0%, #FF8800 50%, #00E5FF 100%)` com `-webkit-background-clip: text`.
* **Malha Pontilhada de Precisão (Tactical Dot Matrix):** O fundo da seção Hero e da seção de Arquitetura utiliza um padrão geométrico sutil em CSS puro:
  `background-image: radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px); background-size: 24px 24px;` com uma máscara radial (`mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)`) para fundir suavemente nas bordas sem criar ruído visual.

---

## 3. Disposição dos Elementos Gráficos, Proporções e Tamanhos (Layout, Proportions & Sizing)

### 3.1. Sistema de Grid, Escala de 8px e Proporção Áurea ($\phi \approx 1.618$)
* **Unidade Base Estrita:** Todo o sistema espacial (margens, paddings, gaps, alturas de componentes) deriva de uma escala matemática de `8px` (`spacing.base`), permitindo exclusivamente *half-steps* de `4px` (`spacing.half`) para alinhamento fino de bordas de terminal e ícones. Valores arbitrários como `5px`, `7px`, `13px` ou `19px` são estritamente proibidos.
* **Container Máximo e Colunas:**
  * **Largura Máxima do Container (`max-width`):** `1360px` centralizado (`margin: 0 auto`), com `padding-inline` responsivo de `24px` (Mobile), `48px` (Tablet/Laptop) e `64px` (Desktop Widescreen).
  * **Grid Principal:** CSS Grid de **12 colunas** com `gap: 24px` (`1.5rem`) no desktop e `16px` (`1rem`) em telas menores.
* **Proporção Áurea ($\phi = 1.618$) na Hero Section e Painéis:** A divisão horizontal acima da dobra em monitores Desktop (`>= 1024px`) obedece à razão áurea:
  * **Coluna Esquerda (Proposta de Valor, Badges de Build, Seletor CLI e CTAs):** Ocupa **5 colunas** (~`38.2%` da largura útil).
  * **Coluna Direita (Emulador Interativo `tui.ts` + Visualização `hero.png`):** Ocupa **7 colunas** (~`61.8%` da largura útil), garantindo espaço amplo para que o código monoespaçado não sofra quebras de linha (*word-wrap*) indesejadas.

### 3.2. Dimensões Exatas dos Componentes Estruturais
* **Header Global Fixo (`<header>`):** Altura fixa de `64px` (`8 * 8px`), `backdrop-filter: blur(16px)`, fundo `surface-glass` (`rgba(18, 22, 31, 0.78)`), borda inferior de `1px solid var(--border-subtle)`.
* **Alvos de Toque e Clique (Touch/Click Targets):** Todo botão, aba, seletor de cópia ou link interativo possui dimensão mínima clicável de **`48px x 48px`** (ou altura mínima de `48px` para botões horizontais), cumprindo a exigência máxima de acessibilidade motora.
* **Bento Grid de Recursos (Seção 3 — Os 6 Módulos Visuais):**
  * Organizado em um grid assimétrico de 3 colunas no desktop (`grid-template-columns: repeat(3, minmax(0, 1fr))`, `grid-auto-rows: minmax(340px, auto)`, `gap: 24px`).
  * Os cards de destaque (**Semantic Compression & Tool Probe** e **LSPV Code Intelligence**) ocupam `grid-column: span 2`, enquanto os cards complementares (**Ask TUI**, **Discovery Engine**, **Multi-Model Router**, **ArXiv & Perplexity Research**) ocupam `grid-column: span 1`, criando um ritmo visual dinâmico e escaneável.

---

## 4. A Tipografia (Typography Rules & Hierarchy)

A tipografia da Home Page opera um sistema tripartido onde cada família de fonte desempenha um papel funcional exclusivo, eliminando ambiguidades entre prosa explicativa, títulos arquiteturais e dados computacionais.

### 4.1. As Três Famílias Tipográficas Oficiais
1. **Display & Títulos (`Space Grotesk` ou `Geist Sans`):** Geométrica, técnica, com terminais retos que dialogam com a estética de engenharia de sistemas. Usada exclusivamente em `H1`, `H2`, `H3` e números de grandes métricas (ex: `68% Token Reduction`).
2. **Prosa & Documentação (`Inter` ou `Public Sans`):** Desenhada para máxima legibilidade em telas densas. Aplicada em parágrafos de descrição, textos de cards e tabelas comparativas, com largura de linha estritamente contida entre **`60ch` e `72ch`** para conforto ocular ótimo.
3. **Código, TUI, CLI & Telemetria (`JetBrains Mono`):** Com ligaduras técnicas desativadas em comandos copiáveis (`font-variant-ligatures: none` nos snippets de shell para evitar confusão visual) e ativadas nos blocos de demonstração TypeScript/Rust (`font-feature-settings: "calt" 1, "zero" 1` para zero cortado). Obrigatória também usar `font-variant-numeric: tabular-nums` em todos os contadores de tokens, benchmarks e relógios de latência para evitar trepidação horizontal (*layout shift*) durante animações numéricas.

### 4.2. Escala Tipográfica Completa

| Nível / Token | Tag HTML | Fonte | Tamanho (`rem` / `px`) | Peso (`font-weight`) | Altura de Linha (`line-height`) | Tracking (`letter-spacing`) | Uso Específico na Home Page |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `headline-hero` | `<h1>` | `Space Grotesk` | `clamp(2.75rem, 5vw, 4.5rem)` (`44px`–`72px`) | `700` (Bold) | `1.04` | `-0.035em` | Título único acima da dobra (Proposta de valor central do `omp`). |
| `headline-section` | `<h2>` | `Space Grotesk` | `clamp(2rem, 3.5vw, 3.25rem)` (`32px`–`52px`) | `700` (Bold) | `1.12` | `-0.025em` | Cabeçalhos das 7 seções principais da Home Page. |
| `headline-card` | `<h3>` | `Space Grotesk` | `1.5rem` (`24px`) | `600` (SemiBold) | `1.25` | `-0.015em` | Títulos dos *Bento Cards* e módulos `.omp/skills`. |
| `subheading` | `<h4>` | `Space Grotesk` | `1.125rem` (`18px`) | `600` (SemiBold) | `1.35` | `-0.01em` | Subtítulos de painéis de código, comandos `.omp/commands` e itens de FAQ. |
| `body-lg` | `<p class="lead">` | `Inter` | `1.125rem` (`18px`) | `400` (Regular) | `1.65` | `-0.005em` | Subheadline da seção Hero e introduções de seção. |
| `body-md` | `<p>`, `<li>` | `Inter` | `1rem` (`16px`) | `400` (Regular) | `1.60` | `0em` | Corpo de texto padrão em cards, documentação e listas. |
| `code-tui` | `<code>`, `<pre>` | `JetBrains Mono` | `0.9375rem` (`15px`) | `500` (Medium) | `1.55` | `-0.01em` | Emulador TUI (`tui.ts`), snippets de instalação e visualizador de prompts. |
| `label-telemetry` | `<span>`, `<kbd>` | `JetBrains Mono` | `0.75rem` (`12px`) | `600` (SemiBold) | `1.20` | `+0.08em` (UPPERCASE) | Badges de status, tags de arquitetura (`RUST`, `BUN`, `BAZEL 9.2`), atalhos de teclado. |

---

## 5. A Estrutura Visual e Lógica dos Elementos da Tela (Visual & Logical Screen Structure)

### 5.1. Quantas Telas / Seções Deverão Ser Utilizadas
A Home Page é arquitetada como uma experiência unificada de **1 Página Principal dividida em 7 Seções Lógicas Verticais (Views de Scroll)** + **2 Camadas Modais Sob Demanda (Overlays Interativos)**:

1. **View 01 — Global Tactical Navbar & Telemetry Bar (Topo Fixo):** Logo vetorial `icon.svg` + `oh-my-pi`, links de ancoragem semântica (`#features`, `#compression`, `#architecture`, `#commands`, `#benchmarks`), indicador de versão e build (`v0.9.2 · Bazel 9.2.0`), botão de acionamento da Command Palette (`Cmd+K`) e link para o repositório GitHub com contador de stars.
2. **View 02 — Hero Section (Above the Fold — Funil Nível 1):**
   * **Esquerda:** Badge de lançamento (`[OMP::CORE] Rust + Bun + TUI Agent Framework`), `<h1>` de alto impacto (*"The Sub-Millisecond Terminal Agent Harness with Semantic Compression"*), Subheadline técnica, Caixa de Instalação Rápida com seletor de pacote (`bun`, `cargo`, `nix`, `docker robomp`), CTA Primário (`Quickstart Guide →`) e CTA Secundário (`Inspect TUI Live`).
   * **Direita:** Janela interativa em tempo real reproduzindo a interface de `.omp/tools/tui.ts` com abas para alternar entre a renderização viva em DOM/Canvas e o ativo visual `assets/hero.png`.
3. **View 03 — Interactive Visual Showcase (Aba/Bento dos 6 Módulos Core do Repo):** Exibição estruturada e interativa integrando diretamente os ativos reais do projeto:
   * **Módulo A (`assets/ask.webp`):** Fluxo conversacional direto e execução de queries complexas no terminal (`omp ask`).
   * **Módulo B (`assets/discovery.webp`):** Descoberta autônoma de contexto de código, mapeamento de repositório e indexação rápida.
   * **Módulo C (`assets/lspv.webp`):** *Language Server Protocol Visualizer* — inspeção de referências, tipos e diagnósticos AST diretamente para o agente.
   * **Módulo D (`assets/models.webp`):** Orquestração multi-modelo e políticas dedicadas para modelos compactos (`.omp/skills/system-prompts/small-models.md`).
   * **Módulo E (`assets/arxiv.webp` & `assets/perplexity.webp`):** Integração nativa de pesquisa profunda, ingestão de papers científicos do ArXiv e síntese web em tempo real via Perplexity.
4. **View 04 — Deep-Dive: Semantic Compression & Tool Prompt Optimization (Interativo):** Comparador lado a lado (*Split-Pane Diff Viewer*) demonstrando como a skill `.omp/skills/semantic-compression/SKILL.md` e os scripts `.omp/skills/tool-prompt-optimization/scripts/probe.ts` e `probe-builtin.ts` comprimem prompts de sistema extensos sem perda de precisão semântica, reduzindo latência de *Time-To-First-Token (TTFT)* e custo de inferência.
5. **View 05 — Autonomous Workflow Commands (`.omp/commands/`):** Pipeline horizontal interativo demonstrando os 5 comandos operacionais nativos do repositório: `/triage` (`triage.md`), `/fix-issues` (`fix-issues.md`), `/review-prs` (`review-prs.md`), `/cleanup` (`cleanup.md`) e `/release` (`release.md`), mostrando o input/output exato de cada etapa no ciclo de vida do GitHub.
6. **View 06 — Polyglot Build & Sandboxed Execution (`Cargo` + `Bun` + `Bazel` + `RoboMP`):** Diagrama arquitetural em SVG avançado explicando por que o `omp` combina binários nativos em Rust, scripts rápidos em Bun, cache determinístico via Bazel (`.github/actions/bazel-cache`) e isolamento seguro em containers via `Dockerfile.robomp`.
7. **View 07 — Terminal CTA Final & Footer Técnico (Mapa do Sítio):** Prompt de terminal interativo onde o usuário pode digitar `help`, `install` ou `github` + rodapé completo contendo o Mapa do Sítio estruturado (exigência de acessibilidade), links para `CONTRIBUTING.md`, `SECURITY.md`, `THIRD-PARTY-NOTICES.txt` e licença (`LICENSE`).
8. **Overlays Modais (2 Telas Flutuantes):**
   * **Overlay A:** Command Palette (`Cmd+K` / `/`) inspirada em `.omp/tools/tui.ts`.
   * **Overlay B:** Lightbox de Inspeção de Alta Resolução para ampliar as capturas `hero.png`, `ask.webp`, `discovery.webp`, `lspv.webp`, `models.webp`, `arxiv.webp` e `perplexity.webp` com zoom e legendas técnicas.

### 5.2. Wireframe Esquemático ASCII da Home Page (Desktop Layout)
O planejamento estrutural parte deste wireframe esquemático para fixar a hierarquia e o fluxo visual antes de qualquer camada de efeito:

```text
+--------------------------------------------------------------------------------------------------+
| [SVG: icon.svg] OH MY PI (omp)   [Features] [Compression] [LSPV] [Commands]   [Cmd+K] [GitHub *] | <- z-index: 50 (64px)
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [BADGE: BAZEL 9.2.0 | RUST + BUN | ROBOMP SANDBOX]       +-----------------------------------+  |
|                                                           | [o][o][o] omp-tui — 120x42  [TUI] |  |
|  H1: AUTONOMOUS TERMINAL                                  +-----------------------------------+  |
|  ENGINEERING AT THE                                       | ┌─ Context Compression ─────────┐ |  |
|  SPEED OF THOUGHT.                                        | │ Raw: 14,280 tok -> OMP: 4,120 │ |  |
|                                                           | │ Saved: 71.1% [██████████░░░░] │ |  |
|  Lead: Sub-millisecond TUI harness powered by             | └─ Tool Probe (probe.ts) ───────┘ |  |
|  Semantic Compression, LSPV AST graphs, and               | > omp ask "Refactor AST parser"   |  |
|  deterministic Bazel/Nix toolchains.                      |   ├─ [LSPV] Scanning 42 symbols   |  |
|                                                           |   ├─ [ArXiv] Cross-referencing    |  |
|  +-------------------------------------------+ [COPY]     |   └─ [Patch] Applied in 180ms ✓   |  |
|  | $ bunx oh-my-pi init --compression=max    | [Cmd ]     +-----------------------------------+  |
|  +-------------------------------------------+            | [View: Live TUI] [View: hero.png] |  |
|  [ CTA: INSTALL OH MY PI (#FF5500) ]  [ Read Docs -> ]    +-----------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|  H2: THE 6 CORE PILLARS OF THE OMP RUNTIME (BENTO GRID — 12 COLUMNS)                             |
|  +---------------------------------------------------+ +---------------------------------------+ |
|  | [SPAN 8] LSPV & AST CODE INTELLIGENCE (lspv.webp) | | [SPAN 4] ASK ENGINE (ask.webp)        | |
|  | Deep symbol graph & real-time diagnostics         | | Zero-latency terminal Q&A & patching  | |
|  +---------------------------------------------------+ +---------------------------------------+ |
|  +-------------------------+ +-----------------------------------+ +---------------------------+ |
|  | [SPAN 4] DISCOVERY      | | [SPAN 4] MULTI-MODEL & SMALL LLM  | | [SPAN 4] RESEARCH AGENTS  | |
|  | (discovery.webp)        | | (models.webp + small-models.md)   | | (arxiv.webp + perplexity) | |
|  +-------------------------+ +-----------------------------------+ +---------------------------+ |
+--------------------------------------------------------------------------------------------------+
|  H2: SEMANTIC COMPRESSION & TOOL PROMPT OPTIMIZATION (.omp/skills/)                              |
|  +-----------------------------------------+   >>>   +-----------------------------------------+ |
|  | BEFORE: Bloated System Prompt (4,820t)  |  -68%   | AFTER: OMP Compressed Prompt (1,540t)   | |
|  | [Red highlights on redundant tokens]    |  TOKENS | [Violet highlights on dense primitives] | |
|  +-----------------------------------------+         +-----------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
|  H2: AUTONOMOUS REPO PIPELINE (.omp/commands/)                                                   |
|  [ 01. /triage ] ===> [ 02. /fix-issues ] ===> [ 03. /review-prs ] ===> [ 04. /cleanup ] ===> [05. /release]
+--------------------------------------------------------------------------------------------------+
|  FOOTER: Sitemap Completo | Acessibilidade WCAG AA/AAA | LICENSE | SECURITY.md | CONTRIBUTING.md |
+--------------------------------------------------------------------------------------------------+