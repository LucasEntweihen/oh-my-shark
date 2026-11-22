# OhMyShark v0.1.2 — Correção de Inicialização Windows VT & Restauração do Design OMSK

Release de correção imediata garantindo execução limpa do binário compilado `omsk` / `ohms` e restauração integral da identidade visual OMSK na inicialização do terminal.

## Correções
- **Correção definitiva de `TypeError: enableConsoleVtInput is not a function` (`packages/natives/native/index.js`, `packages/tui/src/terminal.ts`)**: adicionados fallbacks nativos via `kernel32.dll` (`bun:ffi`) para `enableConsoleVtInput` / `restoreConsoleInputMode`, fallback seguro para `translateWindowsAltGrSequence`, fallback compatível para `diffLineRunsWithin` e guardas defensivas no `ProcessTerminal`.
- **Restauração do Design OMSK na TUI (`packages/tui/src/prompt/welcome.ts`, `packages/tui/src/prompt/composer.ts`, `packages/coding-agent`)**: restaurado o **Deep Sea Cockpit** padrão (`tui.layout = "cockpit"`), a arte **ASCII Shark** em gradiente azul oceânico, o cabeçalho `ohmyshark v0.1.2 · made by LucasEntweihen`, os painéis de Missão/Changes/Checks/LSP/Sessões Recentes e dicas do OMSK (removendo o banner/logo `███ omp` e o aviso de nerdfont).

---
# OhMyShark v0.1.0 — OMP 19.0.1, Shark Orchestrator & Native Desktop GUI

Primeira release minor do OhMyShark: o núcleo foi atualizado para o **Oh My Pi 19.0.1** (com a ponte GUI-RPC), preservando 100% dos pilares do OMSK, e o projeto agora traz um **Orchestrator** estilo Antigravity / Claude Code e uma **GUI nativa de desktop**.

## Novidades

### 1. Núcleo OMP 19.0.1 + GUI-RPC
- Atualização completa de `packages/*` e `crates/*` para o OMP 19.0.1 (MCP compartilhado no daemon, ovnfs, jobs/pty, ask forms, chillax/jevify).
- Protocolo RPC expandido (settings, providers, model roles, skills, agents, MCP, queue, subagents, worktrees, PR, terminal).
- Addons nativos `pi_natives` 19.0.1 travados por SHA-512 em `packaging/native-inputs.lock.json`.
- Preservados: `@ohms/kernel`, `@ohms/project-intelligence`, `@ohms/capability-registry`, `@ohms/execution-engine`, `@ohms/terminal-layout`, Vibe Toolkit, Deep Sea Cockpit, Mente em Teia, Transactional Edit Engine, Root Hub e todos os modos (`promaxthink`, `xlr8`, `doomania`, `deepseaneuron`, `fastthinkworkerz`, `vibecoding`, `learner-proj`).

### 2. Shark Orchestrator (TUI + RPC)
- `SharkOrchestratorEngine`: plano em DAG, waves paralelas com posse disjunta de arquivos, gate de aprovação, FSM transacional, checkpoints atômicos com rollback por wave, self-repair limitado, TDD enforcer e verificação independente.
- Comando `/orchestrator` (aliases `/orch`, `/swarm`, `/team`) com board TUI responsivo e sincronização com o Deep Sea Cockpit.
- 20 endpoints RPC (`orchestrator_*` e `shark_*`) + eventos `orchestrator_event` / `shark_event`.

### 3. OhMyShark Native Desktop GUI (`packages/gui`)
- Electron + React 19 com sidecar OMSK embutido (não precisa instalar Bun/Node).
- **Orchestrator Studio**, **Shark Command Center** (Cockpit/Kernel, Impact Analysis, Capabilities, Checkpoints & Rollback, Mente em Teia), **OmskModesBar** e temas **Shark Ocean / Deep Abyss**.
- Localização completa em **Português (pt-BR)**; deep links `omsk://`, `ohms://` e `omp://`; `omsk desktop` abre a GUI instalada.

### 4. Release
- Binários CLI otimizados (bytecode + addons nativos embutidos) para Windows x64/arm64, Linux x64/arm64 e macOS x64/arm64 (`ohms-*` e aliases `omsk-*`).
- Instaladores da GUI (Windows Setup/Portable; Linux AppImage/DEB e macOS DMG/ZIP via CI), `SHA256SUMS.txt` e attestations.

---
# OhMyShark v0.0.51 â€” Autonomous Software Engineering Environment & Superiority Architecture

Esta release eleva o OhMyShark de um agente de terminal tradicional para uma **plataforma completa de engenharia de software autÃ´noma**, integrando inteligÃªncia de projeto profunda, verificaÃ§Ã£o independente com provas observÃ¡veis, autocorreÃ§Ã£o controlada e sistema de benchmarking contÃ­nuo.

---

## ðŸŒŸ Novidades da VersÃ£o 0.0.51

### 1. Shark Context Engine (`@ohms/project-intelligence`)
- **AdaptaÃ§Ã£o DinÃ¢mica por IntenÃ§Ã£o:** ClassificaÃ§Ã£o automatizada do tipo de tarefa (`bug_fix`, `feature`, `refactor`, `optimization`, `security`) e ponderaÃ§Ã£o seletiva de contexto.
- **PontuaÃ§Ã£o Multidimensional de RelevÃ¢ncia:** AvaliaÃ§Ã£o lÃ©xica, estrutural e contextual garantindo que apenas arquivos e sÃ­mbolos de alto sinal sejam incluÃ­dos no prompt.
- **OrÃ§amento Inteligente de Tokens & DetecÃ§Ã£o de Contexto Obsoleto:** Rastreamento por hash de conteÃºdo para invalidaÃ§Ã£o imediata de caches de arquivos modificados.

### 2. Shark Impact Analysis & Breaking Risk
- **Mapeamento PrÃ©vio de Efeitos Colaterais:** IdentificaÃ§Ã£o precisa de sÃ­mbolos exportados modificados, chamadores diretos e arquivos afetados antes de qualquer ediÃ§Ã£o.
- **Descoberta Automatizada de Testes Transitivos:** PriorizaÃ§Ã£o e execuÃ§Ã£o automÃ¡tica dos testes unitÃ¡rios e de integraÃ§Ã£o pertinentes aos mÃ³dulos alterados.

### 3. Independent Verification Engine (`@ohms/execution-engine`)
- **Auditoria em MÃºltiplas Camadas Independentes:** VerificaÃ§Ã£o rigorosa de Sintaxe, Tipagem Estrita (polÃ­tica zero-any e proibiÃ§Ã£o de `@ts-ignore`), Quality Gates (limite de 350 linhas por arquivo) e Confinamento de Workspace.
- **Zero ConfianÃ§a em Auto-DeclaraÃ§Ãµes:** O sistema rejeita afirmaÃ§Ãµes verbais de sucesso do executor sem cÃ³digo de saÃ­da limpo e evidÃªncias empÃ­ricas observÃ¡veis.

### 4. Controlled Self-Repair & Transactional FSM
- **MÃ¡quina de Estados Finita Transacional:** FSM formal de 8 estados (`CREATED` -> `INVESTIGATING` -> `PLANNED` -> `EXECUTING` -> `VALIDATING` -> `COMMITTED` / `RECOVERING` / `ABORTED`).
- **DiagnÃ³stico Categorizado & Limite de Retentativas:** ClassificaÃ§Ã£o estruturada de falhas (`SYNTAX_ERROR`, `TYPE_ERROR`, `IMPORT_ERROR`, `TEST_FAILURE`, `SAFETY_VIOLATION`) com teto rÃ­gido de retentativas (mÃ¡ximo 3) para impedir loops infinitos e acionar rollback automÃ¡tico em violaÃ§Ãµes de seguranÃ§a.

### 5. Shark Hybrid Retrieval (4-Way Retrieval)
- **RecuperaÃ§Ã£o HÃ­brida QuÃ¡drupla:** CombinaÃ§Ã£o calibrada de busca LÃ©xica (FTS5 / tokens), Estrutural (AST e sÃ­mbolos do grafo), Contextual (recÃªncia temporal) e SemÃ¢ntica com reranqueamento ponderado e deduplicaÃ§Ã£o.

### 6. Shark Benchmark Engine & Performance Lab
- **AvaliaÃ§Ã£o Objetiva em 13 MÃ©tricas:** AvaliaÃ§Ã£o contÃ­nua de taxa de sucesso, taxa de regressÃ£o, eficiÃªncia de tokens, latÃªncia de ferramentas, precisÃ£o de contexto e velocidade de inicializaÃ§Ã£o.
- **Ã�ndice de Superioridade MensurÃ¡vel:** ComparaÃ§Ã£o matemÃ¡tica direta contra baselines com geraÃ§Ã£o de relatÃ³rios estruturados de vantagens e desvantagens.

### 7. GovernanÃ§a de Agentes Baseada em CompetÃªncias (`AGENTS.md`)
- **Roster Otimizado:** SubstituiÃ§Ã£o de agentes genÃ©ricos pelo `@verification-specialist`, focado em auditoria independente, conformidade contratual e quality gates.

---

# OhMyShark v0.0.50 â€” Hyper-Optimized Autonomous Multi-System Architecture & Unified Desktop Integration

Esta release consolida o OhMyShark (OMSK) como uma plataforma autÃ´noma de alta performance, unificando a integraÃ§Ã£o nativa com o **OMSK Desktop (Tauri 2)**, motor de despacho de ondas e quality gates do **Vibe Coding Toolkit**, sistema reativo da TUI **Deep Sea Cockpit**, motor transacional atÃ´mico **TransactionalEditEngine** e base de conhecimento semÃ¢ntica **Mente em Teia (Graphify)**.

---

## ðŸŒŸ Novidades da VersÃ£o 0.0.50

### 1. OMSK Desktop Nativo via Tauri 2 (`apps/desktop`)
- **Adaptador OmskEngine de Primeira Classe:** Backend nativo em Rust (`src-tauri/src/engine/omsk.rs`) com comunicaÃ§Ã£o via stdio NDJSON (`--mode rpc-ui` para turnos interativos e `--mode acp` para sessÃµes de plano transacional).
- **Pureza CLI e Zero Overhead:** O comando `omsk desktop` encapsula o lanÃ§amento seguro do GUI mantendo os caminhos da CLI 100% headless e livres de acoplamento legado.
- **LocalizaÃ§Ã£o Completa em PortuguÃªs (pt-BR):** Suporte nativo completo a strings e fluxos de trabalho em pt-BR.

### 2. Vibe Coding Toolkit Wave Engine & CatÃ¡logo Duplo
- **Despacho em Ondas Paralelas AclÃ­clicas (Part C):** Particionamento inteligente de tarefas em conjuntos estritamente disjuntos de arquivos com commits serializados.
- **Quality Gate Estrito de 350 Linhas:** VerificaÃ§Ã£o automatizada de tamanho de arquivos para evitar acÃºmulo de complexidade e funÃ§Ãµes monolÃ­ticas.
- **CatÃ¡logo Integrado de 22 Ferramentas e 14 Prompts CanÃ´nicos:** Inclui o Prompt 13 (Auditoria Diferencial de SeguranÃ§a) e resoluÃ§Ã£o instantÃ¢nea das ferramentas do harness (`edit`, `read`, `write`, `bash`).

### 3. Deep Sea Cockpit TUI Reativa & OtimizaÃ§Ã£o de Tokens
- **Artwork CanÃ´nico do TubarÃ£o em 17 Linhas:** ASCII shark autÃªntico (stackedlol/ascii-sharks) com degradÃª ciano-oceano para azul-abissal.
- **Layout Responsivo Adaptativo:** AdaptaÃ§Ã£o perfeita desde terminais ultra-compactos (20 colunas) atÃ© telas ultrawide (115+ colunas).
- **Contrato DEEPSEANEURON:** OtimizaÃ§Ã£o dinÃ¢mica de tokens sem perda de sinal ou qualidade em raciocÃ­nios analÃ­ticos profundos.

### 4. TransactionalEditEngine com ResiliÃªncia EBUSY
- **Checkpoints Transacionais Multi-Arquivo:** Rastreamento atÃ´mico de arquivos alterados com hash SHA-256 antes e depois das mutaÃ§Ãµes.
- **Escrita AtÃ´mica com Swap Files:** MitigaÃ§Ã£o de conflitos de lock EBUSY no Windows e garantia de reversÃ£o bit-a-bit limpa.
- **Confinamento RÃ­gido de Workspace:** ProteÃ§Ã£o ativa contra travessia de diretÃ³rios (path traversal).

### 5. Mente em Teia SQLite (Grafo de Conhecimento Graphify)
- **Relacionamentos SemÃ¢nticos Bidirecionais:** Mapeamento de nÃ³s, arestas e dependÃªncias com indexaÃ§Ã£o de busca textual completa FTS5.
- **Travessia de Subgrafos Multi-Hop AclÃ­clicos:** RecuperaÃ§Ã£o rÃ¡pida de contexto e histÃ³rico de decisÃµes com rastreamento auditÃ¡vel de invalidaÃ§Ãµes.

---

# OhMyShark v0.0.49 â€” Root Providers, Shared Database & Universal Knowledge Hub

Esta release introduz a centralizaÃ§Ã£o e exportaÃ§Ã£o universal dos subsistemas de **Provedores de IA**, **AutenticaÃ§Ã£o/Login**, **Banco de Dados SQLite Compartilhado** e **Base de Conhecimento Relacional (Mente em Teia)** na raiz do projeto, permitindo consumo simultÃ¢neo e seguro por mÃºltiplos sistemas, agentes e linguagens externas sem qualquer perda de performance ou degradaÃ§Ã£o na conexÃ£o com os modelos.

---

## ðŸŒŸ Novidades da VersÃ£o 0.0.49

### 1. Sistema de Provedores e Login na Raiz do Projeto (`OmskSharedProviders`)
- **PersistÃªncia Local e Centralizada:** Credenciais salvas no banco de dados SQLite local da raiz em `.omsk/agent.db`.
- **SincronizaÃ§Ã£o Bidirecional Transparente:** ImportaÃ§Ã£o automÃ¡tica das credenciais globais existentes (`~/.omsk/agent/agent.db`) no primeiro boot e sincronizaÃ§Ã£o mÃºtua ao salvar novas credenciais.
- **Snapshot InteroperÃ¡vel (`.omsk/providers.json`):** ExportaÃ§Ã£o atÃ´mica em formato JSON padronizado para leitura instantÃ¢nea por sistemas em qualquer linguagem (Python, Go, Rust, Java, scripts bash) sem necessidade de dependÃªncias SQLite.
- **Isolamento e Zero Overhead:** ConexÃµes otimizadas com SQLite nativo, `PRAGMA journal_mode = WAL;`, `synchronous = NORMAL;` e `busy_timeout = 5000;`, eliminando contenÃ§Ã£o entre mÃºltiplos processos.

### 2. Base de Dados e Conhecimento Relacional Compartilhada (`OmskSharedKnowledge` & `OmskSharedDatabase`)
- **Acesso Direto Ã  Engine Mente em Teia:** GestÃ£o de nÃ³s, arestas, decisÃµes arquiteturais (`recordDecision`), fatos tÃ©cnicos (`recordFact`), evidÃªncias (`recordEvidence`) e grafos relacionais.
- **Busca LÃ©xica FTS5 / Trigramas:** Pesquisa ultrarrÃ¡pida na base de conhecimento com ranqueamento lÃ©xico e navegaÃ§Ã£o em subgrafos multi-hop (`getMultiHopSubgraph`).
- **ConexÃ£o SQLite Unificada de Alta Performance:** Suporte a queries parametrizadas tipadas, comandos DDL/DML e transaÃ§Ãµes atÃ´micas seguras para leituras e escritas concorrentes.

### 3. Ecossistema de Consumo Universal na Raiz
- **SDK TypeScript Raiz:** Exportado diretamente no ponto de entrada `./index.ts` e configurado no `package.json` (`ohmyshark`, `./providers`, `./database`, `./knowledge`, `./hub`).
- **CLI Dedicado na Raiz (`bun run hub`):** Comandos diretos para `status`, `providers`, `models`, `login`, `knowledge`, `record-decision` e `export`.
- **Servidor HTTP REST Embutido (`bun run hub:serve [porta]`):** Endpoints REST leves (`/api/status`, `/api/providers`, `/api/knowledge`, `/api/database/query`) com CORS habilitado para integraÃ§Ã£o instantÃ¢nea com microserviÃ§os e ferramentas externas.

---


# OhMyShark v0.0.48 â€” Architectural Independence & 5 Core Pillars

Esta release marca o salto definitivo do OhMyShark (omsk/ohms) para uma plataforma de engenharia autÃ´noma, extensÃ­vel e 100% terminal-first, estabelecendo arquitetura autoral prÃ³pria sobre os 5 pilares estruturais e 15 princÃ­pios inegociÃ¡veis de engenharia.

---

## ðŸ�›ï¸� Os 5 Pilares Arquiteturais Implementados

### 1. Shark Kernel (`@ohms/kernel`)
- **Arquitetura Hexagonal:** Desacoplamento estrito entre nÃºcleo e interfaces (TUI, CLI, ACP).
- **Typed Event Bus:** Barramento reativo tipado para telemetria (`session.started`, `task.planned`, `tool.discovered`, `file.changed`, etc.).
- **Isolamento de Falhas:** Erros em listeners de terceiros nÃ£o derrubam o fluxo principal de execuÃ§Ã£o.
- **SeguranÃ§a Baseada em Capacidades:** Matriz de permissÃµes categorizadas por nÃ­vel de risco (`low`, `medium`, `high`, `critical`).

### 2. Project Intelligence (`@ohms/project-intelligence`)
- **Grafo de SÃ­mbolos e DependÃªncias:** Mapeamento bidirecional de arquivos, funÃ§Ãµes, rotas, tipos e testes associados.
- **IndexaÃ§Ã£o Incremental com SHA-256:** Cache instantÃ¢neo de conteÃºdo; arquivos inalterados nÃ£o sÃ£o re-processados.
- **Shark Impact Analysis (`/impact`):** CÃ¡lculo preventivo de raio de impacto, chamadores afetados, suites de teste a executar e anÃ¡lise de quebra de contrato pÃºblico.

### 3. Universal Capability Ecosystem (`@ohms/capability-registry`)
- **IngestÃ£o Universal:** Suporte nativo e unificado para Agent Skills (`SKILL.md`), Model Context Protocol (MCP), Plugins e Builtins.
- **Ciclo de Vida de 6 EstÃ¡gios:** `DISCOVERY` âž” `IDENTIFICATION` âž” `INSPECTION` âž” `COMPATIBILITY` âž” `AUTHORIZATION` âž” `ACTIVATION`.
- **Security Sandbox:** Bloqueio ativo de path traversal (`../`) fora do workspace e redaÃ§Ã£o automÃ¡tica de credenciais e chaves de API em saÃ­das e logs.

### 4. Transactional Execution Engine (`@ohms/execution-engine`)
- **MÃ¡quina de Estados Finitos (FSM):** TransiÃ§Ãµes determinÃ­sticas `CREATED` âž” `INVESTIGATING` âž” `PLANNED` âž” `EXECUTING` âž” `VALIDATING` âž” `COMMITTED` com contingÃªncias `RECOVERING` e `WAITING_FOR_APPROVAL`.
- **Checkpoints AtÃ´micos:** Snapshots de arquivos com hash SHA-256 e rollback seletivo por arquivo.
- **DetecÃ§Ã£o de Conflitos Externos:** VerificaÃ§Ã£o de drift em modificaÃ§Ãµes concorrentes no disco.

### 5. Modular TUI Layout Engine (`@ohms/terminal-layout`)
- **Layout Adaptativo Responsivo:** Presets modulares (`command-center`, `developer`, `research`, `minimal`) com auto-collapse em terminais estreitos (<80 colunas).
- **Engine de Temas:** 6 temas integrados (`shark-ocean`, `deep-abyss`, `arctic`, `amber-terminal`, `retro-green`, `high-contrast`) com degradaÃ§Ã£o graciosa de TrueColor para 256 cores e ANSI 16 cores.
- **PainÃ©is ExtensÃ­veis:** Permite que extensÃµes registrem visualizaÃ§Ãµes customizadas na TUI.

---

## ðŸ§ª Qualidade e Cobertura TDD

- **30 Testes TDD Automatizados:** 5 testes para cada pilar arquitetural + testes de integraÃ§Ã£o de slash commands.
- **Tempo de ExecuÃ§Ã£o:** Menos de 2 segundos no Bun v1.4.2 com zero falhas e zero dependÃªncias circulares.
- **Comandos no Terminal:** `/shark`, `/impact <alvo>` e `/capabilities [busca]` disponÃ­veis nativamente.

---

## ðŸ“¦ Assets Oficiais da Release (19 arquivos)

Todos os assets foram compilados e verificados com SHA-256:
- BinÃ¡rios Windows: `omsk-windows-x64.exe`, `ohms-windows-x64.exe`, `CosmoSky-windows-x64.exe`, `omsk-windows-arm64.exe`, `ohms-windows-arm64.exe`
- BinÃ¡rios Linux: `omsk-linux-x64`, `ohms-linux-x64`, `omsk-linux-arm64`, `ohms-linux-arm64`
- BinÃ¡rios macOS: `omsk-darwin-x64`, `ohms-darwin-x64`, `omsk-darwin-arm64`, `ohms-darwin-arm64`
- Instaladores e Configs: `install.ps1`, `install.sh`, `ohmyshark.config.yml`, `ohmyshark.models.yml`, `LICENSE`, `THIRD-PARTY-NOTICES.txt`, `SHA256SUMS.txt`
