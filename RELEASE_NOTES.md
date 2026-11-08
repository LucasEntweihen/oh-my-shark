# OhMyShark v0.0.51 — Autonomous Software Engineering Environment & Superiority Architecture

Esta release eleva o OhMyShark de um agente de terminal tradicional para uma **plataforma completa de engenharia de software autônoma**, integrando inteligência de projeto profunda, verificação independente com provas observáveis, autocorreção controlada e sistema de benchmarking contínuo.

---

## 🌟 Novidades da Versão 0.0.51

### 1. Shark Context Engine (`@ohms/project-intelligence`)
- **Adaptação Dinâmica por Intenção:** Classificação automatizada do tipo de tarefa (`bug_fix`, `feature`, `refactor`, `optimization`, `security`) e ponderação seletiva de contexto.
- **Pontuação Multidimensional de Relevância:** Avaliação léxica, estrutural e contextual garantindo que apenas arquivos e símbolos de alto sinal sejam incluídos no prompt.
- **Orçamento Inteligente de Tokens & Detecção de Contexto Obsoleto:** Rastreamento por hash de conteúdo para invalidação imediata de caches de arquivos modificados.

### 2. Shark Impact Analysis & Breaking Risk
- **Mapeamento Prévio de Efeitos Colaterais:** Identificação precisa de símbolos exportados modificados, chamadores diretos e arquivos afetados antes de qualquer edição.
- **Descoberta Automatizada de Testes Transitivos:** Priorização e execução automática dos testes unitários e de integração pertinentes aos módulos alterados.

### 3. Independent Verification Engine (`@ohms/execution-engine`)
- **Auditoria em Múltiplas Camadas Independentes:** Verificação rigorosa de Sintaxe, Tipagem Estrita (política zero-any e proibição de `@ts-ignore`), Quality Gates (limite de 350 linhas por arquivo) e Confinamento de Workspace.
- **Zero Confiança em Auto-Declarações:** O sistema rejeita afirmações verbais de sucesso do executor sem código de saída limpo e evidências empíricas observáveis.

### 4. Controlled Self-Repair & Transactional FSM
- **Máquina de Estados Finita Transacional:** FSM formal de 8 estados (`CREATED` -> `INVESTIGATING` -> `PLANNED` -> `EXECUTING` -> `VALIDATING` -> `COMMITTED` / `RECOVERING` / `ABORTED`).
- **Diagnóstico Categorizado & Limite de Retentativas:** Classificação estruturada de falhas (`SYNTAX_ERROR`, `TYPE_ERROR`, `IMPORT_ERROR`, `TEST_FAILURE`, `SAFETY_VIOLATION`) com teto rígido de retentativas (máximo 3) para impedir loops infinitos e acionar rollback automático em violações de segurança.

### 5. Shark Hybrid Retrieval (4-Way Retrieval)
- **Recuperação Híbrida Quádrupla:** Combinação calibrada de busca Léxica (FTS5 / tokens), Estrutural (AST e símbolos do grafo), Contextual (recência temporal) e Semântica com reranqueamento ponderado e deduplicação.

### 6. Shark Benchmark Engine & Performance Lab
- **Avaliação Objetiva em 13 Métricas:** Avaliação contínua de taxa de sucesso, taxa de regressão, eficiência de tokens, latência de ferramentas, precisão de contexto e velocidade de inicialização.
- **Índice de Superioridade Mensurável:** Comparação matemática direta contra baselines com geração de relatórios estruturados de vantagens e desvantagens.

### 7. Governança de Agentes Baseada em Competências (`AGENTS.md`)
- **Roster Otimizado:** Substituição de agentes genéricos pelo `@verification-specialist`, focado em auditoria independente, conformidade contratual e quality gates.

---

# OhMyShark v0.0.50 — Hyper-Optimized Autonomous Multi-System Architecture & Unified Desktop Integration

Esta release consolida o OhMyShark (OMSK) como uma plataforma autônoma de alta performance, unificando a integração nativa com o **OMSK Desktop (Tauri 2)**, motor de despacho de ondas e quality gates do **Vibe Coding Toolkit**, sistema reativo da TUI **Deep Sea Cockpit**, motor transacional atômico **TransactionalEditEngine** e base de conhecimento semântica **Mente em Teia (Graphify)**.

---

## 🌟 Novidades da Versão 0.0.50

### 1. OMSK Desktop Nativo via Tauri 2 (`apps/desktop`)
- **Adaptador OmskEngine de Primeira Classe:** Backend nativo em Rust (`src-tauri/src/engine/omsk.rs`) com comunicação via stdio NDJSON (`--mode rpc-ui` para turnos interativos e `--mode acp` para sessões de plano transacional).
- **Pureza CLI e Zero Overhead:** O comando `omsk desktop` encapsula o lançamento seguro do GUI mantendo os caminhos da CLI 100% headless e livres de acoplamento legado.
- **Localização Completa em Português (pt-BR):** Suporte nativo completo a strings e fluxos de trabalho em pt-BR.

### 2. Vibe Coding Toolkit Wave Engine & Catálogo Duplo
- **Despacho em Ondas Paralelas Aclíclicas (Part C):** Particionamento inteligente de tarefas em conjuntos estritamente disjuntos de arquivos com commits serializados.
- **Quality Gate Estrito de 350 Linhas:** Verificação automatizada de tamanho de arquivos para evitar acúmulo de complexidade e funções monolíticas.
- **Catálogo Integrado de 22 Ferramentas e 14 Prompts Canônicos:** Inclui o Prompt 13 (Auditoria Diferencial de Segurança) e resolução instantânea das ferramentas do harness (`edit`, `read`, `write`, `bash`).

### 3. Deep Sea Cockpit TUI Reativa & Otimização de Tokens
- **Artwork Canônico do Tubarão em 17 Linhas:** ASCII shark autêntico (stackedlol/ascii-sharks) com degradê ciano-oceano para azul-abissal.
- **Layout Responsivo Adaptativo:** Adaptação perfeita desde terminais ultra-compactos (20 colunas) até telas ultrawide (115+ colunas).
- **Contrato DEEPSEANEURON:** Otimização dinâmica de tokens sem perda de sinal ou qualidade em raciocínios analíticos profundos.

### 4. TransactionalEditEngine com Resiliência EBUSY
- **Checkpoints Transacionais Multi-Arquivo:** Rastreamento atômico de arquivos alterados com hash SHA-256 antes e depois das mutações.
- **Escrita Atômica com Swap Files:** Mitigação de conflitos de lock EBUSY no Windows e garantia de reversão bit-a-bit limpa.
- **Confinamento Rígido de Workspace:** Proteção ativa contra travessia de diretórios (path traversal).

### 5. Mente em Teia SQLite (Grafo de Conhecimento Graphify)
- **Relacionamentos Semânticos Bidirecionais:** Mapeamento de nós, arestas e dependências com indexação de busca textual completa FTS5.
- **Travessia de Subgrafos Multi-Hop Aclíclicos:** Recuperação rápida de contexto e histórico de decisões com rastreamento auditável de invalidações.

---

# OhMyShark v0.0.49 — Root Providers, Shared Database & Universal Knowledge Hub

Esta release introduz a centralização e exportação universal dos subsistemas de **Provedores de IA**, **Autenticação/Login**, **Banco de Dados SQLite Compartilhado** e **Base de Conhecimento Relacional (Mente em Teia)** na raiz do projeto, permitindo consumo simultâneo e seguro por múltiplos sistemas, agentes e linguagens externas sem qualquer perda de performance ou degradação na conexão com os modelos.

---

## 🌟 Novidades da Versão 0.0.49

### 1. Sistema de Provedores e Login na Raiz do Projeto (`OmskSharedProviders`)
- **Persistência Local e Centralizada:** Credenciais salvas no banco de dados SQLite local da raiz em `.omsk/agent.db`.
- **Sincronização Bidirecional Transparente:** Importação automática das credenciais globais existentes (`~/.omsk/agent/agent.db`) no primeiro boot e sincronização mútua ao salvar novas credenciais.
- **Snapshot Interoperável (`.omsk/providers.json`):** Exportação atômica em formato JSON padronizado para leitura instantânea por sistemas em qualquer linguagem (Python, Go, Rust, Java, scripts bash) sem necessidade de dependências SQLite.
- **Isolamento e Zero Overhead:** Conexões otimizadas com SQLite nativo, `PRAGMA journal_mode = WAL;`, `synchronous = NORMAL;` e `busy_timeout = 5000;`, eliminando contenção entre múltiplos processos.

### 2. Base de Dados e Conhecimento Relacional Compartilhada (`OmskSharedKnowledge` & `OmskSharedDatabase`)
- **Acesso Direto à Engine Mente em Teia:** Gestão de nós, arestas, decisões arquiteturais (`recordDecision`), fatos técnicos (`recordFact`), evidências (`recordEvidence`) e grafos relacionais.
- **Busca Léxica FTS5 / Trigramas:** Pesquisa ultrarrápida na base de conhecimento com ranqueamento léxico e navegação em subgrafos multi-hop (`getMultiHopSubgraph`).
- **Conexão SQLite Unificada de Alta Performance:** Suporte a queries parametrizadas tipadas, comandos DDL/DML e transações atômicas seguras para leituras e escritas concorrentes.

### 3. Ecossistema de Consumo Universal na Raiz
- **SDK TypeScript Raiz:** Exportado diretamente no ponto de entrada `./index.ts` e configurado no `package.json` (`ohmyshark`, `./providers`, `./database`, `./knowledge`, `./hub`).
- **CLI Dedicado na Raiz (`bun run hub`):** Comandos diretos para `status`, `providers`, `models`, `login`, `knowledge`, `record-decision` e `export`.
- **Servidor HTTP REST Embutido (`bun run hub:serve [porta]`):** Endpoints REST leves (`/api/status`, `/api/providers`, `/api/knowledge`, `/api/database/query`) com CORS habilitado para integração instantânea com microserviços e ferramentas externas.

---


# OhMyShark v0.0.48 — Architectural Independence & 5 Core Pillars

Esta release marca o salto definitivo do OhMyShark (omsk/ohms) para uma plataforma de engenharia autônoma, extensível e 100% terminal-first, estabelecendo arquitetura autoral própria sobre os 5 pilares estruturais e 15 princípios inegociáveis de engenharia.

---

## 🏛️ Os 5 Pilares Arquiteturais Implementados

### 1. Shark Kernel (`@ohms/kernel`)
- **Arquitetura Hexagonal:** Desacoplamento estrito entre núcleo e interfaces (TUI, CLI, ACP).
- **Typed Event Bus:** Barramento reativo tipado para telemetria (`session.started`, `task.planned`, `tool.discovered`, `file.changed`, etc.).
- **Isolamento de Falhas:** Erros em listeners de terceiros não derrubam o fluxo principal de execução.
- **Segurança Baseada em Capacidades:** Matriz de permissões categorizadas por nível de risco (`low`, `medium`, `high`, `critical`).

### 2. Project Intelligence (`@ohms/project-intelligence`)
- **Grafo de Símbolos e Dependências:** Mapeamento bidirecional de arquivos, funções, rotas, tipos e testes associados.
- **Indexação Incremental com SHA-256:** Cache instantâneo de conteúdo; arquivos inalterados não são re-processados.
- **Shark Impact Analysis (`/impact`):** Cálculo preventivo de raio de impacto, chamadores afetados, suites de teste a executar e análise de quebra de contrato público.

### 3. Universal Capability Ecosystem (`@ohms/capability-registry`)
- **Ingestão Universal:** Suporte nativo e unificado para Agent Skills (`SKILL.md`), Model Context Protocol (MCP), Plugins e Builtins.
- **Ciclo de Vida de 6 Estágios:** `DISCOVERY` ➔ `IDENTIFICATION` ➔ `INSPECTION` ➔ `COMPATIBILITY` ➔ `AUTHORIZATION` ➔ `ACTIVATION`.
- **Security Sandbox:** Bloqueio ativo de path traversal (`../`) fora do workspace e redação automática de credenciais e chaves de API em saídas e logs.

### 4. Transactional Execution Engine (`@ohms/execution-engine`)
- **Máquina de Estados Finitos (FSM):** Transições determinísticas `CREATED` ➔ `INVESTIGATING` ➔ `PLANNED` ➔ `EXECUTING` ➔ `VALIDATING` ➔ `COMMITTED` com contingências `RECOVERING` e `WAITING_FOR_APPROVAL`.
- **Checkpoints Atômicos:** Snapshots de arquivos com hash SHA-256 e rollback seletivo por arquivo.
- **Detecção de Conflitos Externos:** Verificação de drift em modificações concorrentes no disco.

### 5. Modular TUI Layout Engine (`@ohms/terminal-layout`)
- **Layout Adaptativo Responsivo:** Presets modulares (`command-center`, `developer`, `research`, `minimal`) com auto-collapse em terminais estreitos (<80 colunas).
- **Engine de Temas:** 6 temas integrados (`shark-ocean`, `deep-abyss`, `arctic`, `amber-terminal`, `retro-green`, `high-contrast`) com degradação graciosa de TrueColor para 256 cores e ANSI 16 cores.
- **Painéis Extensíveis:** Permite que extensões registrem visualizações customizadas na TUI.

---

## 🧪 Qualidade e Cobertura TDD

- **30 Testes TDD Automatizados:** 5 testes para cada pilar arquitetural + testes de integração de slash commands.
- **Tempo de Execução:** Menos de 2 segundos no Bun v1.4.2 com zero falhas e zero dependências circulares.
- **Comandos no Terminal:** `/shark`, `/impact <alvo>` e `/capabilities [busca]` disponíveis nativamente.

---

## 📦 Assets Oficiais da Release (19 arquivos)

Todos os assets foram compilados e verificados com SHA-256:
- Binários Windows: `omsk-windows-x64.exe`, `ohms-windows-x64.exe`, `CosmoSky-windows-x64.exe`, `omsk-windows-arm64.exe`, `ohms-windows-arm64.exe`
- Binários Linux: `omsk-linux-x64`, `ohms-linux-x64`, `omsk-linux-arm64`, `ohms-linux-arm64`
- Binários macOS: `omsk-darwin-x64`, `ohms-darwin-x64`, `omsk-darwin-arm64`, `ohms-darwin-arm64`
- Instaladores e Configs: `install.ps1`, `install.sh`, `ohmyshark.config.yml`, `ohmyshark.models.yml`, `LICENSE`, `THIRD-PARTY-NOTICES.txt`, `SHA256SUMS.txt`
