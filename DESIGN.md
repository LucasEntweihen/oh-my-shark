---
# ============================================================================
# DESIGN.md & ROADMAP.md — SINGLE SOURCE OF TRUTH (FONTE ÚNICA DE VERDADE)
# Especificação Unificada: Design System Astral Codex + Roteiro de Engenharia
# Executável Nativo Oh My Shark Desktop GUI ("OMSK Orbital")
# Compatível com Google Stitch, @google/design.md CLI, Claude Code, Cursor,
# Windsurf, OpenAI Codex Agents, Tauri v2, Bun Runtime e Cargo/Bazel.
# ============================================================================

version: "3.0.0-orbital-unified"
name: "Oh My Shark: Astral Codex Orbital GUI (OMSK Orbital / PT-BR)"
description: "Fusão definitiva da Especificação de Design System Híbrido Retrô-Futurista/Interestelar (Astral Codex) com o Roteiro de Arquitetura e Engenharia de Software Executável Nativo Desktop do assistente Oh My Shark (OMSK)."
locale: "pt-BR"
theme_strategy: "Hybrid Tactical Starbridge (Beige Hardware Chassis + Deep Space CRT Dark Mode Viewports + Native Rust/Bun Engine Integration)"

colors:
  # 1. Chassi Físico e Molduras Industriais (Matriz Visual Language.jpg)
  chassis:
    surface_primary: "#C8C4B8"        # Bege Módulo Lunar (corpo principal do gabinete físico)
    surface_secondary: "#B8B4A6"      # Cinza-Bege médio (painéis secundários e slots de fita/cartucho)
    surface_recessed: "#9E9A8C"       # Fundo rebaixado do teclado numérico e entradas de disquete
    bezel_inner_dark: "#2B2D2F"       # Moldura interna de borracha/metal escuro ao redor do tubo CRT
    bezel_shadow_deep: "#141618"      # Cavidade profunda entre o plástico industrial e o vidro curvo
    bevel_highlight: "#ECEAE2"        # Aresta superior/esquerda iluminada (chanfro 3D luz)
    bevel_shadow: "#7A7669"           # Aresta inferior/direita sombreada (chanfro 3D sombra)
    keycap_face: "#D6D2C4"            # Topo das teclas físicas (00 a 39)
    keycap_side: "#8F8B7D"            # Lateral chanfrada das teclas físicas mecânicas
    ink_stamp: "#3A3832"              # Tinta serigrafada nos botões e rótulos do chassi ("ASTRA-IA", "UNIDADE 02-60")
    expansion_joint: "#4A473E"        # Junta de dilatação escura entre módulos do chassi

  # 2. Espaço Profundo, Telemetria Cósmica e Radares Táticos (Matriz download (5).jpg + OMSK Deep Space)
  cosmos:
    void_black: "#020307"             # Vácuo interestelar absoluto (fundo dos radares, mapa de cometas e editor)
    abismo_interestelar: "#05070E"    # Background principal do aplicativo executável e janelas
    nebulosa_escura: "#0B0F1F"        # Sidebars, painéis de telemetria e cards de ferramentas
    orbital_navy: "#071E42"           # Azul atmosfera orbital profundo (fundo dos painéis de status)
    ionosphere_blue: "#14468C"        # Azul ionosfera (céu do fractal, malha do osciloscópio e mares)
    starlight_cyan: "#5CE1E6"         # Ciano de cauda de íons de cometa e nós de dados ativos
    ciano_cherenkov: "#00F0FF"        # Ciano elétrico primário OMSK (destaques, tubarão cósmico, cursores)
    nebula_ice: "#E6F4FA"             # Branco-azulado cristalino (núcleo da explosão fractal / supernova)
    exoplanet_snow: "#F2EFE9"         # Crosta glacial do exoplaneta central (repositório de código)
    exoplanet_forest: "#132916"       # Regiões densas de biomassa/código compilado na superfície planetária
    telemetry_gold: "#968244"         # Ouro velho tático (bordas estruturais de 2px dos painéis)
    telemetry_gold_bright: "#D4B85E"  # Amarelo-ouro de destaque em linhas de grade e coordenadas
    amber_supernova: "#F59E0B"        # Âmbar de alerta, permissões de escrita/execução (Ask) e avisos LSPV
    anomaly_crimson: "#9E1418"        # Vermelho carmesim profundo (manchas de alerta de bugs e radar esquerdo)
    anomaly_laser: "#E62229"          # Vermelho laser vibrante (vetores de trajetória de cometa e erros críticos)
    vermelho_gigante: "#EF4444"       # Vermelho de deleção no Diff, erros de execução e comandos kill/rm
    beacon_emerald: "#00A838"         # Verde esmeralda orbital (marcador de deploy confirmado e testes aprovados)
    verde_pulsar: "#10B981"           # Verde neon (linhas adicionadas no Diff, saídas exit 0)
    violeta_quasar: "#8B5CF6"         # Violeta vibrante (subagentes Task, Tríade /doomania e compressão semântica)
    glass_horizon: "rgba(18, 25, 48, 0.72)" # Superfície translúcida para modais, backdrop blur(16px) e paleta Ctrl+K

  # 3. Interface 16-Bit de Navegação Estelar e Grimório (Matriz download (4).jpg)
  pioneer_hud:
    panel_obsidian: "#161816"         # Fundo escuro esverdeado dos painéis laterais ("PIONEIROS / AGENTES")
    compass_ring_green: "#489638"     # Verde do anel da bússola orbital (N, S, L, O)
    terra_continent: "#4EA832"        # Verde pixelado dos continentes/setores de código no radar circular
    terra_ocean: "#2C568C"            # Azul pontilhado (dithered) do oceano de dados no radar circular
    parchment_light: "#E4F0D0"        # Fundo claro esverdeado das páginas do Manual de Prompts/Missões
    parchment_highlight: "#F4F8EC"    # Centro iluminado do pergaminho digital
    parchment_border: "#2B5B84"       # Capa azul-aço do livro de missões/prompts
    selection_olive: "#4E9A26"        # Barra de seleção verde ativa ("Arquiteto de Sistema", "Refatoração")
    text_parchment: "#1A2118"         # Tinta escura pixelada para leitura no Manual de Prompts

  # 4. Campos de Simulação de Superfície (Biosfera / Sandbox de Produção)
  biosphere:
    steppe_gold: "#9E9876"            # Gramado dourado/seco do horizonte de simulação (Sandbox)
    mountain_slate: "#2A394A"         # Cadeia de montanhas distantes no horizonte do monitor principal
    hill_moss: "#4A5644"              # Colinas intermediárias verde-musgo

  # 5. Semântica Global da GUI de IA e Runtime Nativo (Codex PT-BR + OMSK)
  semantic:
    primary: "#00F0FF"                # Ciano Cherenkov OMSK
    secondary: "#968244"              # Ouro Tático Orbital
    accent: "#8B5CF6"                 # Violeta Quasar (/doomania)
    success: "#10B981"                # Verde Pulsar / Esmeralda
    warning: "#F59E0B"                # Âmbar Supernova (Ask Tool)
    error: "#EF4444"                  # Vermelho Gigante / Laser
    info: "#5CE1E6"                   # Ciano Estelar
    text_starlight: "#F8FAFC"         # Texto principal de alta legibilidade
    text_muted: "#94A3B8"             # Texto secundário e telemetria neutra

typography:
  font_families:
    code_mono: "'JetBrains Mono', 'Fira Code', monospace"
    pixel_telemetry: "'VT323', 'Press Start 2P', 'Silkscreen', monospace"
    retro_serif: "'PxPlus IBM VGA8', 'Courier Prime', Georgia, serif"
    chassis_industrial: "'Space Grotesk', 'Eurostile', 'DIN Alternate', sans-serif"
    ui_sans: "'Inter', 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
  scale:
    display_console: "2.25rem"        # 36px - Títulos de Módulos Estelares
    h1_sector: "1.5rem"               # 24px - Cabeçalhos de Painel ("PIONEIROS", "OMSK ORBITAL")
    h2_subpanel: "1.125rem"           # 18px - Títulos do Grimório ("Fonte", "Descrição", "Missões")
    h3_telemetry: "0.9375rem"         # 15px - Subtítulos de Status ("Frota", "Equipamento", "Processos")
    body_code: "0.875rem"             # 14px - Código-fonte no Monaco Editor e respostas do Agente
    ui_menubar: "0.8125rem"           # 13px - Barra de menu superior ("Arquivo Configurações Visão...")
    data_micro: "0.6875rem"           # 11px - Coordenadas estelares, carimbos de botão (00-39) e métricas
  line_heights:
    tight: "1.1"
    snug: "1.25"
    code: "1.5"
    readable: "1.6"
  letter_spacing:
    chassis_stamp: "0.12em"
    pixel_header: "0.06em"
    normal: "0em"
    compact: "-0.02em"

spacing:
  base_unit: "4px"
  grid_unit: "8px"
  scale:
    xxs: "2px"        # Espessura de chanfros e divisórias de alta densidade
    xs: "4px"         # Espaçamento entre teclas numéricas e bordas duplas
    sm: "8px"         # Padding interno de células de inventário e abas
    md: "12px"        # Margem entre subpainéis de telemetria
    lg: "16px"        # Padding de containers CRT e molduras
    xl: "24px"        # Espessura da moldura do monitor principal
    xxl: "32px"       # Separação estrutural de macro-módulos

borders:
  widths:
    hairline: "1px"
    tactical: "2px"
    bevel_medium: "3px"
    crt_cavity: "6px"
    chassis_frame: "12px"
  radius:
    none: "0px"       # Painéis de telemetria, janelas RPG e terminais
    micro: "2px"      # Teclas mecânicas e slots de cartucho
    crt_corner: "8px" # Curvatura interna dos cantos dos monitores CRT no chassi bege
    compass: "50%"    # Radar orbital circular (N, S, L, O)

elevation_and_shadows:
  chassis_outset: "inset 2px 2px 0px #ECEAE2, inset -2px -2px 0px #7A7669, 0px 2px 4px rgba(0, 0, 0, 0.35)"
  chassis_inset: "inset 3px 3px 6px #141618, inset -2px -2px 0px #ECEAE2"
  keycap_resting: "inset 1px 1px 0px #FFFFFF, inset -2px -2px 0px #8F8B7D, 2px 3px 0px #5A574E, 2px 4px 5px rgba(0,0,0,0.4)"
  keycap_pressed: "inset 2px 2px 3px #5A574E, 0px 0px 0px #5A574E"
  crt_glass_glow: "inset 0 0 28px rgba(92, 225, 230, 0.18), inset 0 0 6px rgba(255, 255, 255, 0.25)"
  gold_tactical_frame: "0 0 0 1px #020307, 0 0 0 3px #968244, inset 0 0 0 1px #D4B85E"
  glass_surface: "0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.08)"

z_index:
  background_void: 0
  planetary_render: 10
  dither_matrix_overlay: 20
  telemetry_vectors: 30
  crt_scanlines_and_glare: 40
  chassis_bezel_frame: 50
  interactive_controls: 60
  grimoire_modal_window: 70
  top_command_menubar: 80
  critical_anomaly_alert: 90
  accessibility_focus_ring: 100
---

# 🦈🌌 OMSK ORBITAL // ASTRAL CODEX DESKTOP GUI
## Documento Mestre Unificado: Fonte Única de Verdade (Single Source of Truth), Especificação do Sistema de Design e Roteiro de Engenharia Executável Nativo

> **Declaração de Missão do Produto:**
> O **OMSK Orbital (Oh My Shark Cosmos Desktop GUI)** transforma o motor open-source de engenharia agêntica **Oh My Shark (`ohms` / `omp`)** em um aplicativo de desktop executável nativo (`.exe`, `.app`, `.AppImage`). Ele une a ergonomia de fluxo de trabalho cirúrgica do **OpenAI Codex Desktop** (foco em código, diffs atômicos lado a lado, aprovação explícita e execução na máquina local) com o sistema de design skeuomórfico interestelar **Astral Codex** (estação orbital industrial em polímero bege lunar, monitores CRT curvos, painéis táticos de alta densidade e grimório 16-bit de missões).
>
> **Garantia de Paridade Absoluta:** O aplicativo desktop **NÃO É** uma casca simulada nem um chat desconectado em sandbox web. Ele mantém **100% de paridade** com o motor Oh My Shark: utiliza as mesmas crates Rust (`crates/pi-ast` e `crates/pi-builtins`), o mesmo runtime Bun, os mesmos agentes (`.ohms/agents/`), os mesmos comandos slash (`.ohms/commands/` e `.omp/commands/`), as mesmas habilidades (`.omp/skills/`), os mesmos provedores de inferência (Anthropic, OpenAI, Google Gemini, DeepSeek, Ollama local), o mesmo sistema de arquivos do usuário e acesso irrestrito à máquina operacional através de IPC seguro.

---

## 1. Diagnóstico da Arquitetura do Motor `oh-my-shark` & Alinhamento com a GUI

Para garantir que a interface gráfica governe diretamente a máquina do usuário sem intermediários frágeis, o ecossistema acopla seus controles gráficos aos subsistemas nativos do repositório:

```
+----------------------------------------------------------------------------------------------------+
|                                EXECUTÁVEL NATIVO (OMSK-ORBITAL)                                   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | FRONTEND STARBRIDGE (React 19 + Monaco Editor + WebGL/Canvas + Dither Shaders + Audio Synth) |  |
|  | - Chassi Bege Skeuomórfico (Visual Language) | - Monitor CRT Multimodo (Fractal / Planeta)   |  |
|  | - Coluna PIONEIROS (Agentes / Doomania Triad) | - Terminal PTY e Inspeção de Processos       |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                   ^                                   ^                            |
|                     Tauri IPC (Eventos/Comandos)       WebSocket / JSON-RPC (Stream de Tokens)     |
|                                   v                                   v                            |
|  +---------------------------------------------+  +-----------------------------+                  |
|  | CORE RUST (Tauri v2 Backend)                |  | MOTOR AGÊNTICO LOCAL (Bun)  |                  |
|  | - crates/pi-ast (Tree-sitter AST Engine)    |  | - Provedores: Anthropic...  |                  |
|  | - crates/pi-builtins (Shell / Coreutils)    |  | - .ohms/agents (Doomania)   |                  |
|  | - Terminal PTY Nativo e Acesso ao FS        |  | - .omp/commands & skills    |                  |
|  +---------------------------------------------+  +-----------------------------+                  |
+----------------------------------------------------------------------------------------------------+
```

### 1.1. Núcleo Nativo em Rust (`crates/`)
1. **`crates/pi-ast`**: Motor de análise sintática e refatoração estrutural baseado em Tree-sitter (`block.rs`, `ops.rs`, `parse_cache.rs`, `summary.rs`, `language/parsers.rs`).
2. **`crates/pi-builtins`**: Suite nativa de utilitários de sistema e shell de alta performance compilados em Rust (`rg`, `fd`, `jq`, `sed`, `diff`, `find`, `grep`, `cat`, `ls`, `mkdir`, `mv`, `rm`, `ln`, `ps`, `pgrep`, `pkill`, `pidwait`, `proc_match`, `proc_snapshot`, `jobs`, `bg`, `fg`, `kill`, `nohup`, `sponge`, `stat`, `cksum`, `sha256sum`, `b2sum`, etc.).

### 1.2. Orquestração de Agentes, Comandos e Habilidades (`.ohms/` e `.omp/`)
1. **Agentes Especializados (`.ohms/agents/`):** `doomania-criativo.md`, `doomania-critico.md`, `doomania-permissivo.md`.
2. **Comandos Slash (`.ohms/commands/` e `.omp/commands/`):** `/doomania`, `/cleanup`, `/fix-issues`, `/review-prs`, `/triage`, `/release`.
3. **Habilidades Internas de Otimização (`.omp/skills/`):** `semantic-compression`, `system-prompts`, `tool-prompt-optimization`.

---

## 2. A Estação Orbital e as 4 Vistas Operacionais

A interface opera em **Full-Viewport Lock (`100vw` $\times$ `100vh`)** com **4 Vistas / Modos Comutáveis**:

1. **Modo 1 — Deck Principal de Engenharia (Visual Language):**
   - Monaco Editor sobreposto ao Fractal de Raciocínio cristalino e ao horizonte da biosfera com as 3 vacas no campo dourado.
   - Osciloscópio de inferência à direita (curva exponencial de tokens/s) e teclado mecânico de 21 macros na base.
2. **Modo 2 — Planetário de Telemetria Global (download 5):**
   - Domo do exoplaneta-repositório com crateras de código azuis, anomalias de erro carmesim e o sinalizador esmeralda (`#00A838`) de build aprovado.
   - Rastreador de cometa de 5 feixes vermelhos assimétricos e console carmesim de exceções.
3. **Modo 3 — Navegador Estelar e Esquadrão de Agentes (download 4):**
   - Radar circular `N, S, L, O` em verde (`#489638`) com indicador de velocidade `0.0 kT/s` e sonda/caravela de dados.
   - Painel lateral `PIONEIROS`: Atributos numéricos, Frota com capacidade do porão de carga em $u.$, Receptáculos de Equipamento MCP (`MÃO-E`, `MÃO-D`, `ESCUDO`) e Mochila.
4. **Modo 4 — Grimório de Prompts e Missões (download 4):**
   - Livro em pergaminho aberto com abas laterais (`MISSÕES`, `DESC`, `OBJ`, `REC`, `X`), seleção de arquiteto (`Fonte`), lista de tarefas e botão de 1 clique `[ Aceitar missão ]`.

---

## 3. Mapeamento das 21 Teclas Mecânicas do Chassi (`SubroutineKeypad21`)

A matriz 3x7 física preserva a numeração histórica exata de `Visual Language.jpg`:

| Tecla Física | Rótulo Serigrafado | Ação Nativa OMSK | Sub-rotina Executada |
| :---: | :---: | :--- | :--- |
| `[ 3 ]` | `LSP-DIAG` | Diagnóstico de Tipos e Compilação | Dispara checagem do Language Server (`LSPV`) |
| `[ 11 ]`| `CLEANUP` | Limpeza de Código e Refatoração | Executa o comando `/cleanup` (`cleanup.md`) |
| `[ 34 ]`| `GEN-TEST` | Geração de Testes Unitários | Cria e roda suites via `pi-builtins: bun test/cargo nextest` |
| `[ 28 ]`| `AST-SUMM` | Resumo Estrutural de Arquitetura | Extrai a árvore de símbolos via `crates/pi-ast/summary.rs` |
| `[ 43 ]`| `DOOMANIA` | Ativação da Tríade Multiagente | Invoca o comando `/doomania` (`doomania.md`) |
| `[   ]`| `SLOT-A` | Slot de Macro Customizada 1 | Mapeável pelo usuário no Grimório |
| `[   ]`| `SLOT-B` | Slot de Macro Customizada 2 | Mapeável pelo usuário no Grimório |
| `[ 30 ]`| `RG-SEARCH`| Varredura Rápida de Texto | Executa `pi-builtins: rg` diretamente no repositório |
| `[ 39 ]`| `SEC-AUDIT`| Auditoria de Segurança e Falhas | Invoca a persona `doomania-critico` |
| `[ 27 ]`| `FD-FILES` | Localização Rápida de Arquivos | Executa `pi-builtins: fd` no disco local |
| `[ 27 ]`| `FD-DEEP`  | Localização Profunda com Ignorados | Executa `pi-builtins: fd -u` indexando tudo |
| `[ 30 ]`| `DIFF-REV` | Inspeção de Alterações Git | Abre o comparador de diff lado a lado |
| `[ 36 ]`| `PS-PROC`  | Gestão de Processos Locais | Lista processos ativos via `pi-builtins: ps / proc_match` |
| `[ 32 ]`| `MODE-SW`  | Comutador Modo Seguro / Permissivo| Alterna entre aprovação prévia e execução autônoma |
| `[ 21 ]`| `GIT-PULL` | Sincronização Orbital de Branch | Executa `git pull --rebase` |
| `[ 30 ]`| `BLD-CHECK`| Compilação e Checagem Sintática | Roda compilação via `pi-builtins` |
| `[ 20 ]`| `CTX-COMP` | Disparo de Compressão Semântica | Reduz o contexto ativo via `semantic-compression` |
| `[ 00 ]`| `SYS-RESET`| Reset de Sessão / Rollback TTSR | Reverte o estado do disco ao último snapshot limpo |
| `[ 20 ]`| `CTX-DUMP` | Inspecionar Resumo do Contexto | Abre o payload comprimido no Grimório |
| `[ 32 ]`| `SRV-START`| Iniciar Servidor / Processo Local | Lança rotina em background com monitoramento de PID |
| `[ 30 ]`| `DEP-PROD` | Deploy de Produção / Release | Executa o fluxo de entrega `/release` |

---

## 4. Diretrizes Técnicas e de Otimização

1. **Eficiência e Zero Bloat:** Componentes vetoriais SVG matematicamente calculados, dispensando texturas pesadas desnecessárias ou dependências externas dispensáveis.
2. **Ponte de Eventos:** Adaptador `.omp/tools/gui-bridge.ts` espelha streams e chamadas do agente para a GUI com tipagem estrita e latência mínima.
3. **Acessibilidade WCAG 2.2 AA/AAA:** Contraste matematicamente verificado, foco visível orbital e suporte completo à língua portuguesa (PT-BR).
