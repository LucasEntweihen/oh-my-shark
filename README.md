# OhMyShark

<p align="center">
  <strong>Install in minutes. Build with focus.</strong><br/>
  Um coding agent terminal-first, pronto para trabalhar.
</p>

<p align="center">
  <a href="https://ohmyshark.vercel.app"><img src="https://img.shields.io/badge/website-ohmyshark.vercel.app-39A7FF?style=flat&colorA=222222" alt="Website"></a>
  <a href="https://github.com/LucasEntweihen/oh-my-shark/releases"><img src="https://img.shields.io/github/v/release/LucasEntweihen/oh-my-shark?label=ohms&color=8FE6FF&style=flat&colorA=222222" alt="OhMyShark release"></a>
  <a href="https://github.com/LucasEntweihen/oh-my-shark/actions"><img src="https://img.shields.io/github/actions/workflow/status/LucasEntweihen/oh-my-shark/ohms-ci.yml?label=OhMyShark%20CI&color=3FB950&style=flat&colorA=222222" alt="OhMyShark CI"></a>
  <a href="https://github.com/LucasEntweihen/oh-my-shark/blob/main/LICENSE"><img src="https://img.shields.io/github/license/LucasEntweihen/oh-my-shark?style=flat&colorA=222222&colorB=58A6FF" alt="License"></a>
</p>

OhMyShark (`ohms`) é um agente de programação para terminal com modelos, sessões,
ferramentas de código, subagentes e modos especializados já integrados. Ele
prioriza execução prática: ler o repositório, editar com segurança, validar o
resultado e manter o contexto útil em sessões longas.

O projeto é um fork público independente construído sobre a base do
[Oh My Pi](https://github.com/can1357/oh-my-pi), que por sua vez descende do
[Pi](https://github.com/badlogic/pi-mono). OMP fornece a fundação de agente,
ferramentas e runtime; o OMSK mantém identidade, comandos, branding, releases,
configuração e fluxos próprios.

> **Proporção de escopo:** este README documenta o OMSK como produto principal.
> Conceitos herdados do OMP aparecem apenas onde ajudam a explicar a base
> arquitetural compartilhada; comandos e URLs abaixo são do OMSK.

## Instalação

### Instalação verificada — recomendada

A instalação verificada baixa um release publicado, valida a attestation do
script e deixa o instalador conferir os hashes dos assets antes de substituir o
binário existente.

**macOS / Linux**

```sh
curl -fSLO https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.sh
sh install.sh
```

Para validar explicitamente a proveniência do script com GitHub CLI:

```sh
gh attestation verify install.sh \
  --repo LucasEntweihen/oh-my-shark \
  --signer-workflow LucasEntweihen/oh-my-shark/.github/workflows/release-ohms.yml \
  --deny-self-hosted-runners
```

**Windows PowerShell**

```powershell
irm https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.ps1 -OutFile install.ps1
& ([scriptblock]::Create((Get-Content .\install.ps1 -Raw)))
```

### Instalação rápida

**macOS / Linux**

```sh
curl -fsSL https://ohmyshark.vercel.app/install | sh
```

**Windows PowerShell**

```powershell
irm https://ohmyshark.vercel.app/install.ps1 | iex
```

Os instaladores são direcionados aos releases do OMSK, verificam `SHA256SUMS.txt`
e executam um smoke test antes de concluir. Builds macOS são ad-hoc signed e
builds Windows são unsigned; Gatekeeper ou SmartScreen pode exibir um aviso.

## Primeiros passos

```sh
ohms --version
ohms --help
ohms
```

Na primeira execução, o OMSK cria sua configuração isolada em:

- `~/.ohms/agent` no macOS/Linux;
- `%USERPROFILE%\\.ohms\\agent` no Windows.

A configuração usa arquivos simples, preserva escolhas do usuário e não é
sobrescrita por reinstalações. O catálogo de modelos é inicializado apenas
quando ainda não existe.

Para iniciar uma sessão em um diretório específico:

```sh
ohms --cwd ./meu-projeto
```

Durante a sessão, use `/help` para descobrir comandos disponíveis e `/model`
para trocar o modelo ativo. Os papéis `default`, `smol`, `slow` e `plan`
separam tarefas normais, trabalho leve, raciocínio aprofundado e planejamento.

## O que torna o OMSK diferente

### Identidade e modos próprios

O OMSK combina um agente terminal-first com modos que alteram o contrato de
execução, a profundidade de raciocínio e a coordenação do trabalho:

| Comando / palavra-chave | Função |
| --- | --- |
| `promaxthink` | Raciocínio máximo com autoverificação antes da resposta. |
| `ultrathink` | Maior esforço de raciocínio suportado pelo modelo ativo. |
| `workflowz` | Fluxos persistentes com avaliação interativa e workpools. |
| `orchestrate` | Decomposição do trabalho e despacho de subagentes. |
| `deepseaneuron` | Maior densidade de sinal durante o raciocínio. |
| `fastthinkworkerz` | Execução rápida para reduzir latência em tarefas simples. |
| `/doomania` | Painel crítico, permissivo e criativo antes de tarefas exigentes. |
| `/xlr8` | Modo de aceleração; `/xlr8 --basic` ativa o fluxo autônomo básico. |

### Ferramentas orientadas ao repositório

O agente trabalha com uma superfície única de ferramentas para reduzir
ambiguidade entre arquivos, código e execução:

- `read` para arquivos, diretórios, arquivos compactados, SQLite, documentos e URLs;
- `write` para criar ou substituir arquivos e entradas suportadas;
- `edit` para patches ancorados por hash, rejeitando alterações em conteúdo obsoleto;
- `grep` e `glob` para busca por conteúdo e descoberta de caminhos;
- `lsp` para diagnósticos, navegação, referências, renames e code actions;
- `bash` para executar comandos no workspace;
- `eval` para células persistentes de Python e JavaScript;
- `browser` para páginas e sessões Chromium, quando habilitado;
- `task`, `hub` e `todo` para subagentes, jobs e execução por fases.

A ideia vem da arquitetura do OMP: ferramentas de leitura, edição, busca e
coordenação compartilham contratos previsíveis. No OMSK, elas permanecem
subordinadas aos modos, à identidade visual e às regras de execução do produto.

### Sessões longas sem perder o fio

- Compaction mantém o contexto utilizável em conversas extensas.
- Fallbacks trocam de modelo quando há limite, erro ou indisponibilidade.
- Sessões podem ser retomadas a partir do armazenamento local.
- Configurações e escolhas permanecem fora do binário instalado.

### Subagentes com propósito

Tarefas complexas podem ser divididas entre workers especializados. O fluxo
principal continua responsável por reunir resultados, validar mudanças e
entregar uma conclusão única. Use `orchestrate` ou `workflowz` quando o trabalho
realmente tiver partes independentes; tarefas pequenas devem permanecer simples.

## Modelos e autenticação

O OMSK oferece catálogo de modelos e papéis configuráveis. Use suas próprias
credenciais quando necessário; nenhuma chave é exigida para instalar o CLI.

Exemplo de login e seleção durante uma sessão:

```text
/login
/model
```

Para provedores adicionais, consulte os arquivos de configuração criados em
`~/.ohms/agent` ou `%USERPROFILE%\\.ohms\\agent`. Não copie configurações do
OMP diretamente: nomes de provedores, versões, endpoints e capacidades podem
divergir entre os projetos.

## Atualização segura

```sh
ohms update
```

O updater do OMSK trabalha com releases standalone, checksums e smoke tests.
Ele não substitui um binário funcional quando a nova versão não passa pelas
verificações. Use `ohms update --check` para consultar disponibilidade sem
instalar e `ohms update --force` apenas quando a substituição for intencional.

## Desenvolvimento local

Requisitos principais: [Bun](https://bun.sh) e toolchain nativa quando o
trabalho envolver os módulos Rust/N-API.

```sh
bun install
bun run build:native
bun run dev
```

Smoke check do CLI:

```sh
bun run dev -- --version
```

Testes:

```sh
bun test
```

O monorepo contém o agente, catálogo de modelos, cliente multi-provider, TUI,
bindings nativos, memória local, browser relay, estatísticas e ferramentas de
suporte. A arquitetura combina TypeScript/Bun para orquestração e Rust/N-API
para operações de alto volume, como busca, shell, AST, PTY e processamento de
texto.

## Pacotes principais

| Pacote | Responsabilidade |
| --- | --- |
| `packages/coding-agent` | CLI, sessões, ferramentas, modos e SDK do agente. |
| `packages/ai` | Streaming, providers e integração de modelos. |
| `packages/catalog` | Catálogo de modelos, providers e regras de compatibilidade. |
| `packages/agent` | Runtime de agente, tool calling e estado. |
| `packages/tui` | Interface terminal com renderização diferencial. |
| `packages/natives` | Bindings N-API para operações nativas. |
| `packages/mnemopi` | Memória local baseada em SQLite. |
| `packages/browser-relay` | Integração opcional com abas Chrome existentes. |
| `packages/utils` | Utilitários compartilhados de ambiente, processos e streams. |

Crates Rust relevantes:

- `crates/pi-natives` — addon N-API principal;
- `crates/pi-shell` — shell embarcado, PTY e processos;
- `crates/pi-ast` — sumarização e utilitários AST;
- `crates/pi-walker` — walker ignore-aware compartilhado por busca e workspace;
- `crates/pi-iso` — isolamento de tarefas;
- `crates/pi-builtins` — builtins e utilitários executados no shell.

## Relação com o Oh My Pi

O [Oh My Pi](https://github.com/can1357/oh-my-pi) é uma referência upstream e
parte importante da linhagem técnica do OMSK. O OMSK não é um espelho automático:

- melhorias upstream são avaliadas antes de serem portadas;
- branding, comandos especiais e releases pertencem ao OMSK;
- versões de catálogo e APIs podem ser diferentes;
- alterações de arquitetura que removam recursos do OMSK não são incorporadas
  automaticamente.

A referência do OMP é usada principalmente para ideias de superfície de agente:
ferramentas nativas, LSP, sessões, subagentes, memória e extensibilidade. A
experiência final, a distribuição e os contratos de compatibilidade são os do
OhMyShark.

## Contribuindo

Issues e pull requests são bem-vindos. Antes de alterar código:

1. leia [`AGENTS.md`](AGENTS.md);
2. preserve os comandos e modos especializados do OMSK;
3. mantenha compatibilidade com Windows, macOS e Linux quando aplicável;
4. execute os testes e o smoke check relevantes;
5. use Conventional Commits em minúsculas, sem pontuação final.

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md) para o fluxo de contribuição.

## Licença

OhMyShark é distribuído sob a [licença MIT](LICENSE). Componentes de terceiros
mantêm suas respectivas licenças e avisos. O projeto reconhece a linhagem
Pi → Oh My Pi → OhMyShark e os respectivos mantenedores upstream.

- [Site](https://ohmyshark.vercel.app)
- [Repositório](https://github.com/LucasEntweihen/oh-my-shark)
- [Oh My Pi](https://github.com/can1357/oh-my-pi)
- [Issues](https://github.com/LucasEntweihen/oh-my-shark/issues)
