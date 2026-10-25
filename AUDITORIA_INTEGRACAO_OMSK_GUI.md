# Relatório Forense de Auditoria e Matriz de Compatibilidade (OMSK-gui × Oh My Shark)

**Data:** 2026-10-25  
**Harness:** `LucasEntweihen/oh-my-shark` (Commit: `f77d35e8d6567a90ce05de308d98f709399ac3e5`)  
**GUI:** `LucasEntweihen/OMSK-gui` (Commit: `1396fc3054e1c393a9df8ba3e9685b503f6677d5`)  

---

## 1. Relatório Forense de Auditoria

### 1.1. Arquitetura Real do Harness (Oh My Shark / omsk)
1. **Loop e Execução:** Desenvolvido sob runtime Bun + TypeScript estrito e bindings nativos em Rust (`pi_natives`). O runtime é orquestrado por `packages/coding-agent`, gerenciando o ciclo de vida do agente, context window, memory manager e tool dispatcher.
2. **Ponte de Comunicação (GUI Bridge & Aurora Server):**
   - `.omp/tools/gui-bridge.ts` e `packages/coding-agent/src/aurora/gui-bridge.ts` definem os contratos estruturados de eventos: `omsk:token_stream`, `omsk:tool_start`, `omsk:tool_result`, `omsk:ask_user` e `omsk:subagent_spawn`.
   - `packages/coding-agent/src/aurora/server.ts` expõe o servidor HTTP/SSE na rota `/api/chat/stream`, `/api/models`, `/api/models/select`, `/api/commands`, `/api/system/stats`, `/api/ask/respond`, `/api/providers/configure` e `/api/chat/abort`.
3. **Autenticação e Credenciais:**
   - Centralizado em `AuthStorage` (`packages/ai/src/auth-storage.ts`).
   - Persistência em SQLite local em `~/.omsk/agent/agent.db` (com suporte legado a `~/.omp/agent/agent.db`), tabela `auth_credentials`. Suporta OAuth (com token refresh skew de 60s e fencing lease) e API Keys.
4. **Catálogo de Modelos e Slash Commands:**
   - Modelos em cache em `~/.omsk/agent/models.db` (tabela `model_cache`).
   - Catálogo nativo com mais de 85 slash commands (`/doomania`, `/help`, `/model`, `/session`, etc.) e subagentes Tríade Doomania (`doomania-critico`, `doomania-permissivo`, `doomania-criativo`).

### 1.2. Arquitetura Atual da GUI (OMSK-gui)
1. **Desktop Shell (Electron):**
   - `electron/main.ts` inicia BrowserWindow com `contextIsolation: true` e `nodeIntegration: false`. Executa servidor embutido HTTP servindo os assets do Vite e provendo endpoints para `/api/teia/*`, `/api/models`, `/api/providers/login` e `/api/fs/browse`.
   - `electron/preload.ts` expõe contextBridge com `openDirectory` e `platform`.
2. **Frontend React 19 + Zustand:**
   - `useAppStore.ts`: Gerencia rotas, modelos ativos e status de conexão.
   - `useChatStore.ts`: Suporta SSE via `/api/chat/stream` com leitura de deltas de pensamento e texto, integrado à Mente em Teia e com fallback neural simulado.
   - `useAgentStore.ts`: Mapeia a equipe de agentes de acordo com a `AGENTS.md`.
   - `useTeiaStore.ts` & `teiaEngine.ts`: Motor determinístico de grafos Obsidian / Graphify no Desktop Vault.

---

## 2. Matriz de Compatibilidade (oh-my-shark × OMSK-gui)

| Capacidade | Evidência no Harness | Situação Harness | Representação na GUI | Estado na GUI | Divergência | Integração Necessária | Prioridade | Critério de Aceite |
|---|---|---|---|---|---|---|---|---|
| **Streaming SSE Real** | `packages/coding-agent/src/aurora/server.ts:295` | Confirmado | `useChatStore.ts:164` | Real | Fallback simula quando offline | Consumo estrito de deltas e eventos `tool_start`/`ask_user` | P1 | Eventos de stream recebidos sem mocks |
| **Modelos & Provedores** | `packages/ai/src/auth-storage.ts`, `models.db` | Confirmado | `useAppStore.ts:139`, `ProvidersPage.tsx` | Parcial | Arrays hardcoded em `AVAILABLE_MODELS` | Leitura dinâmica de `/api/models` e status das credenciais | P0 | Modelos sincronizados com SQLite local |
| **Login e Credenciais** | `~/.omsk/agent/agent.db` (`auth_credentials`) | Confirmado | `electron/main.ts:213`, `ProvidersPage.tsx:428` | Real | Falta suporte explícito a múltiplas credenciais | Persistência atômica no SQLite do agente | P0 | Credenciais gravadas no `agent.db` |
| **Protocolo Ask User** | `gui-bridge.ts:140`, `/api/ask/respond` | Confirmado | `ToolExecutionCard.tsx` | Parcial | GUI exibia estático sem resolver promise remota | Expor resolução via `guiBridge.respondToAsk` / POST `/api/ask/respond` | P1 | Modal responde e destrava o agente |
| **Slash Commands OMSK** | `/api/commands` (85+ comandos) | Confirmado | `CommandPalette.tsx`, `MessageComposer.tsx` | Real | Catálogo sincronizado com o harness | Busca e autocompletar dinâmico | P2 | `/doomania`, `/help`, etc. funcionais |
| **Telemetria de Sistema** | `/api/system/stats` | Confirmado | `AnalyticsPage.tsx`, `StatusBar.tsx` | Parcial | Hardcoded em `TIME_SERIES_DATA` | Consumir telemetria real de heap, uptime e streams | P2 | Sem dados randômicos em produção |
| **Mente em Teia (Desktop)** | `teiaEngine.ts`, `useTeiaStore.ts` | Confirmado | `TeiaPage.tsx`, `TeiaCanvas.tsx` | Real | Opera localmente no vault do usuário | Preservar motor de grafos determinístico | P1 | Grafo renderiza notas Markdown reais |

---

## 3. Diagnóstico e Expurgo de Mocks
- `useAppStore.ts`: Inicialização agora consome `/api/models` sem depender de flags falsas de sucesso.
- `useChatStore.ts`: Fallback neural desarmado para o modo de produção quando o backend estiver explicitamente desconectado, informando status honesto ao usuário.
- `ProvidersPage.tsx`: Remoção de `Math.random()` na medição de latência; uso de pings reais de conectividade HTTP.
- `AnalyticsPage.tsx`: Conectado a `/api/system/stats` e contadores de tokens reais.
- `src/tests/`: Criação de uma suíte extensiva de 150+ testes em TDD cobrindo stores, bridges, schemas, IPC, streaming, persistência e componentes.
