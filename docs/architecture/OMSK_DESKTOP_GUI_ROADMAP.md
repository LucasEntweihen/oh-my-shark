# OMSK Desktop — Roteiro de Arquitetura e Implementação da GUI Nativa

Este documento estabelece o roteiro técnico, os fundamentos de engenharia, a especificação dos adaptadores e a matriz de verificação para a integração do **OMSK Desktop**, transformando o repositório [`LucasEntweihen/oh-my-shark`](https://github.com/LucasEntweihen/oh-my-shark) em uma plataforma completa com interface gráfica nativa de alta performance baseada na infraestrutura do [`zhukunpenglinyutong/desktop-cc-gui`](https://github.com/zhukunpenglinyutong/desktop-cc-gui).

---

## 1. Princípios de Engenharia e Separação de Responsabilidades

### 1.1 Premissa Inviolável: O OMSK é o Único Motor de Execução
A interface gráfica **não reimplementa** a inteligência, o catálogo de modelos, a resolução de credenciais, o loop de agentes ou o sistema de arquivos do agente. O harness `oh-my-shark` permanece como autoridade executiva absoluta. A GUI desktop atua como uma extensão operacional de controle de missão (Deep Sea Cockpit Desktop).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OMSK DESKTOP (apps/desktop)                     │
│   React 18 + TypeScript + Vite + Tailwind CSS + CodeMirror + Xterm.js  │
│   Gerenciador de Abas · Chat · File Tree · Git Panel · PTY Terminal   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ IPC Local / EventSink
┌──────────────────────────────────▼─────────────────────────────────────┐
│                 BACKEND TAURI 2 (apps/desktop/src-tauri)                │
│   OmskEngine (`src/engine/omsk.rs`) · Registro de Processos (Job Obj)  │
│   portable-pty · git2 (vendored) · SQLite App DB · Sandboxing Seguro   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │ Stdio NDJSON (v2 Framed RPC) / ACP Pipe │
              ▼                                         ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       OMSK RUNTIME (--mode rpc-ui)     │ │   OMSK ACP (--mode acp)     │
│   @ohms/kernel (EventBus, Permissions) │ │   TransactionalEditEngine    │
│   @ohms/project-intelligence (Graph)   │ │   Plan Approval FSM          │
│   @ohms/execution-engine (Edits)       │ │   Checkpoints & Rollbacks    │
│   @ohms/capability-registry (Sandbox)  │ │   Mente em Teia (Memories)   │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Matriz de Reaproveitamento e Adaptação

| Componente | Origem | Decisão Arquitetural no OMSK |
|---|---|---|
| **Janelas & Ciclo de Vida** | `desktop-cc-gui` | Reaproveitado via Tauri 2 (`apps/desktop/src-tauri`). Janelas sem moldura, atalhos globais e splash screen. |
| **Terminal Integrado** | `desktop-cc-gui` | Reaproveitado via `portable-pty`. PTY nativo independente do processo do agente, com buffer em lote de 32ms. |
| **Explorador & Editor** | `desktop-cc-gui` | Reaproveitado com CodeMirror 6, syntax highlighting e sandboxing estrito via `files.rs` contra path traversal. |
| **Controle de Versão (Git)** | `desktop-cc-gui` | Reaproveitado via `git2` com libgit2 embarcada. Exibe diffs, staging e commits no mesmo repositório do workspace. |
| **Motor de Execução** | `oh-my-shark` | **Substituição Integral**. Removida qualquer dependência de engines externas legadas em favor do `OmskEngine`. |
| **Adaptador do Motor** | **Novo (OMSK)** | Criado `apps/desktop/src-tauri/src/engine/omsk.rs` com suporte a `--mode rpc-ui` e `--mode acp`. |
| **Identidade & Marca** | **Novo (OMSK)** | Identidade `OMSK Desktop`, glifo do tubarão `OmskGlyph` (gradiente ciano `#00F0FF` a azul abissal), `activeEngine: "omsk"`. |
| **Localização** | **Novo (OMSK)** | Implementada internacionalização brasileira (`pt-BR`) completa em `apps/desktop/src/i18n/pt.ts`. |
| **Comando CLI** | **Novo (OMSK)** | Adicionado comando `omsk desktop` em `packages/coding-agent/src/commands/desktop.ts`. |

---

## 3. Especificação do Adaptador `OmskEngine`

O adaptador `OmskEngine` reside em `apps/desktop/src-tauri/src/engine/omsk.rs` e implementa o contrato `Engine` do Tauri:

### 3.1 Identificação e Prioridade de Execução
```rust
impl Engine for OmskEngine {
    fn id(&self) -> &'static str { "omsk" }
    fn supports_images(&self) -> bool { true }
    fn supports_effort(&self) -> bool { true }
    fn supports_computer_use(&self) -> bool { true }
    fn supports_memory(&self) -> bool { true }
    fn supported_permissions(&self) -> &'static [&'static str] { &["auto", "bypass", "plan"] }
}
```

### 3.2 Hierarquia de Resolução do Binário OMSK
1. `omsk.exe` / `omsk` no `PATH` ou diretórios globais do npm/bun.
2. `ohms.exe` / `ohms` no `PATH`.
3. Script executável do workspace: `bun packages/coding-agent/src/cli.ts`.
4. Fallback legado de compatibilidade: `omp`.

### 3.3 Isolamento de Armazenamento e Credenciais
O `OmskEngine` direciona o ambiente explicitamente para `~/.omsk/agent`:
- **Credenciais**: lidas da tabela `auth_credentials` do SQLite em `~/.omsk/agent/agent.db`.
- **Modelos Customizados**: lidos e persistidos em `~/.omsk/agent/models.yml`.
- **Sessões e Memória**: persistidos em `~/.omsk/agent/sessions/` e consultados pelo scanner de histórico nativo.

### 3.4 Protocolo de Comunicação Bidirecional
- **Modo Interativo (`--mode rpc-ui`)**:
  - Negociação de protocolo: `{ "id": "negotiate_protocol", "type": "negotiate_protocol", "protocolVersion": 2 }`
  - Consulta de estado: `{ "id": "get_state", "type": "get_state" }`
  - Emissão de prompt com imagens em base64: `{ "id": "prompt", "type": "prompt", "message": "...", "images": [...] }`
  - Diálogos interativos: frames `extension_ui_request` mapeados para cartões de perguntas no chat respondidos via stdin.
- **Modo Plano Transacional (`--mode acp`)**:
  - Acionado quando a permissão solicitada for `"plan"`.
  - Negociação ACP com declaração `elicitation.form`.
  - Captura de propostas em `local://<slug>-plan.md` e exibição de botões de aprovação/refinamento na GUI.

---

## 4. Estrutura de Arquivos da Integração

```
oh-my-shark/
├── apps/
│   └── desktop/                        # Subprojeto Desktop CC GUI adaptado
│       ├── package.json                # @ohms/desktop (v0.0.48)
│       ├── index.html                  # HTML base com branding OMSK Desktop
│       ├── src/
│       │   ├── lib/
│       │   │   └── i18n.ts             # Configuração i18n com padrão pt-BR
│       │   ├── i18n/
│       │   │   ├── pt.ts               # Dicionário pt-BR nativo do OMSK
│       │   │   ├── en.ts
│       │   │   └── zh.ts
│       │   ├── features/
│       │   │   └── chat/
│       │   │       └── store.ts        # activeEngine: "omsk" por padrão
│       │   └── components/foundations/icons/
│       │       ├── engine-icon.tsx     # OmskGlyph (ícone SVG do tubarão)
│       │       └── engine-brands.ts    # CLI_DISPLAY_NAMES com OMSK
│       └── src-tauri/
│           ├── Cargo.toml              # omsk-desktop v0.0.48
│           ├── tauri.conf.json         # app.omsk.desktop
│           └── src/
│               ├── main.rs             # Invocação de omsk_desktop_lib::run()
│               ├── config.rs           # ENGINES com "omsk" como índice 0
│               └── engine/
│                   ├── omsk.rs         # Adaptador dedicado OmskEngine
│                   ├── mod.rs          # Registro central de engines
│                   ├── pi_family_auth.rs # Auth integrado com ~/.omsk/agent/agent.db
│                   └── models/
│                       └── mod.rs      # Catálogo models --json via omsk
├── packages/
│   └── coding-agent/
│       ├── src/
│       │   ├── cli-commands.ts         # Registro do comando `desktop`
│       │   ├── cli/command-help.ts     # Documentação do comando desktop
│       │   └── commands/
│       │       └── desktop.ts          # Inicializador omsk desktop / rpc-ui
│       └── test/cli/
│           └── desktop-gui-command.test.ts # Testes unitários do comando desktop
└── docs/architecture/
    └── OMSK_DESKTOP_GUI_ROADMAP.md     # Este documento
```

---

## 5. Matriz de Verificação e Definition of Done

| Critério | Status | Evidência de Verificação |
|---|---|---|
| **1. Runtime Real do OMSK** | CONCLUÍDO | `OmskEngine` executa o binário oficial `omsk` / `bun packages/coding-agent/src/cli.ts`. |
| **2. Sem Agente Paralelo Duplicado** | CONCLUÍDO | Toda lógica de raciocínio, ferramentas e sessões delegada ao coding-agent do OMSK. |
| **3. Preservação Estrita de CLI/TUI** | CONCLUÍDO | `bun packages/coding-agent/src/cli.ts --version` e `tdd-subagent1-zero-gui-cli-purity.test.ts` passam com 100% de sucesso. |
| **4. Sincronização de Providers & Modelos** | CONCLUÍDO | `omsk models --json` alimenta `list_engine_models` em Rust e `~/.omsk/agent/models.yml`. |
| **5. Histórico e Sessões Nativas** | CONCLUÍDO | `scanner.rs`, `discovery.rs`, `reader.rs` e `extract.rs` mapeiam diretamente `~/.omsk/agent/sessions/`. |
| **6. Eventos e Ferramentas Reais** | CONCLUÍDO | Linhas NDJSON com tool_call, tool_result, thinking_delta e text_delta mapeadas via `parse_pi_family_line_for_engine`. |
| **7. Aprovação de Permissões** | CONCLUÍDO | Suporte completo a bypass (`--auto-approve`), auto e plan (elicitation ACP). |
| **8. Interrupção e Cancelamento** | CONCLUÍDO | `ProcessRegistry` usa Job Objects no Windows e SIGINT/SIGTERM para encerrar árvores de processos órfãos. |
| **9. Preservação de Configurações Existentes** | CONCLUÍDO | Lê e respeita `~/.omsk/agent/config.yml` e banco de credenciais `agent.db`. |
| **10. Modos Especiais Suportados** | CONCLUÍDO | Flag `--thinking` suporta `promaxthink`, `ultrathink`, `low`, `medium`, `high`, `max`. |
| **11. Testes de Regressão do Harness** | CONCLUÍDO | Todos os testes TDD dos subagentes 1 a 5 passando sem quebras. |
| **12. Terminal PTY Integrado** | CONCLUÍDO | `portable-pty` configurado com UTF-8 e working directory vinculado ao workspace do projeto. |
| **13. Git Integrado** | CONCLUÍDO | `git2` com libgit2 embarcada realizando inspeção de status, branches, diffs e commits. |
| **14. Identidade e Idioma** | CONCLUÍDO | Marca `OMSK Desktop`, glifo `OmskGlyph` e tradução `pt-BR` aplicada como padrão. |
| **15. Inicialização Fácil pela CLI** | CONCLUÍDO | Comando `omsk desktop` disponível e testado com suite de testes automatizada. |

---

## 6. Guia Operacional de Execução e Desenvolvimento

### 6.1 Como Iniciar o OMSK Desktop em Desenvolvimento
```bash
# 1. Iniciar o frontend e backend Tauri do desktop
cd apps/desktop
bun install
bun run dev

# 2. Ou executar diretamente pelo CLI do OMSK
bun packages/coding-agent/src/cli.ts desktop
```

### 6.2 Como Compilar os Binários de Produção
```bash
# Compilar o instalador e executável desktop standalone para Windows/Linux/macOS
cd apps/desktop
cargo tauri build
```
O executável gerado residirá em `apps/desktop/src-tauri/target/release/omsk-desktop.exe` (ou binário correspondente no Linux/macOS).
