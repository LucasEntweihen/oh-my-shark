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
