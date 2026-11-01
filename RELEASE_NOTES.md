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
