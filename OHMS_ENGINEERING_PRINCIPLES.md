# OhMyShark Engineering Principles & Architectural Blueprint

Este documento estabelece as 15 regras inegociáveis de engenharia e os 5 pilares arquiteturais que tornam o OhMyShark (omsk/ohms) uma plataforma autônoma, extensível e tecnicamente superior.

---

## 1. As 15 Regras de Engenharia do OhMyShark

1. **Nenhum modelo local pode ser obrigatório:** O sistema deve ser pronto para uso imediato sem exigir downloads de gigabytes de pesos antes do primeiro comando.
2. **Nenhum serviço pago pode ser requisito para utilizar o núcleo:** O núcleo do OMSK deve operar com ferramentas determinísticas, APIs gratuitas ou modelos abertos.
3. **Nenhuma ferramenta externa pode ser executada sem avaliação de permissões:** Toda capacidade deve ser classificada por nível de risco (`low`, `medium`, `high`, `critical`) antes do despacho.
4. **Nenhuma extensão pode receber acesso irrestrito por padrão:** O Security Sandbox audita acessos, bloqueia path traversal fora do workspace e mascara credenciais.
5. **Toda funcionalidade precisa ser executável, não apenas visual:** Proibido código cosmético ou mocks sem implementação correspondente.
6. **Toda alteração de código precisa ter mecanismos de validação:** Validações determinísticas, asserções de contrato e testes devem anteceder qualquer confirmação (`COMMITTED`).
7. **Toda operação importante precisa ter rastreabilidade:** O `SharkEventBus` registra ciclo de vida, timestamps, operações de ferramentas e checkpoints.
8. **Toda integração deve ser modular e removível:** Cada módulo reside em um pacote desacoplado com contratos e ciclo de vida explícitos.
9. **Toda dependência deve ter licença auditada:** Conformidade rigorosa com licenças permissivas (MIT, Apache 2.0).
10. **Toda personalização da TUI deve ser persistente:** Layouts, temas, preferências de densidade e configurações são preservadas.
11. **O sistema deve funcionar em Windows, Linux e macOS:** Suporte universal e multiplataforma garantido em arquiteturas x64 e arm64.
12. **O funcionamento básico não pode depender de conexão com registries externos:** Operações offline essenciais continuam ativas mesmo sem internet.
13. **O usuário deve controlar o que é enviado a provedores externos:** Redação automática de segredos em logs e telemetria transparente.
14. **O OMSK deve continuar utilizável quando ferramentas opcionais falharem:** Resiliência com isolamento de falhas: se um plugin falhar, o harness permanece funcional.
15. **Nenhuma melhoria deve ser considerada superior sem evidências de benchmark:** Afirmações de desempenho e confiabilidade devem ser lastreadas em testes mensuráveis.

---

## 2. Os 5 Pilares Arquiteturais Implementados

### 🏛️ 1. Shark Kernel (`@ohms/kernel`)
- **Arquitetura Hexagonal:** Portas e adaptadores desacoplados de clientes (TUI, CLI, ACP).
- **Typed Event Bus:** Barramento tipado para eventos como `session.started`, `task.planned`, `tool.discovered`, `file.changed`, etc.
- **Isolamento de Erros:** Falhas em listeners de plugins nunca derrubam o fluxo principal.
- **Permissões Granulares:** Gerenciamento baseado em capacidades com matriz de risco.

### 🧠 2. Project Intelligence (`@ohms/project-intelligence`)
- **Grafo de Símbolos e Dependências:** Mapeamento bidirecional de arquivos, funções, chamadas e suites de teste.
- **Indexação Incremental com SHA-256:** Cache instantâneo de arquivos não modificados.
- **Shark Impact Analysis (`/impact`):** Cálculo antecipado do raio de impacto, testes a rodar e riscos de quebra de contrato público.

### 🌐 3. Universal Capability Ecosystem (`@ohms/capability-registry`)
- **Ingestão Universal:** Suporte nativo a Agent Skills (`SKILL.md`), Model Context Protocol (MCP), Plugins e Builtins.
- **Pipeline de 6 Estágios:** `DISCOVERY` ➔ `IDENTIFICATION` ➔ `INSPECTION` ➔ `COMPATIBILITY` ➔ `AUTHORIZATION` ➔ `ACTIVATION`.
- **Security Sandbox:** Bloqueio ativo de path traversal (`../`) e redação automática de tokens/chaves de API em saídas e logs.

### ⚙️ 4. Transactional Execution Engine (`@ohms/execution-engine`)
- **Máquina de Estados Finitos (FSM):** `CREATED` ➔ `INVESTIGATING` ➔ `PLANNED` ➔ `EXECUTING` ➔ `VALIDATING` ➔ `COMMITTED` (com rotas de contingência `RECOVERING` e `WAITING_FOR_APPROVAL`).
- **Checkpoints Atômicos com SHA-256:** Snapshots operacionais que permitem rollback seletivo por arquivo.
- **Detecção de Conflitos Externos:** Verificação de drift em modificações concorrentes.

### 🖥️ 5. Modular TUI Layout Engine (`@ohms/terminal-layout`)
- **Layout Adaptativo e Responsivo:** Presets como `command-center`, `developer`, `research` e `minimal`. Auto-collapse inteligente em terminais estreitos (<80 colunas).
- **Engine de Temas:** `shark-ocean`, `deep-abyss`, `arctic`, `amber-terminal`, `retro-green`, `high-contrast` com fallback automático de TrueColor para 256 cores e ANSI 16 cores.
- **Painéis Extensíveis:** Permite que plugins e MCP registrem e renderizem visualizações personalizadas no terminal.

---

## 3. Comandos Integrados no Terminal (Slash Commands)

- `/shark`: Visão geral da arquitetura, métricas de subsistemas e histórico do event bus.
- `/impact <alvo>`: Executa a Shark Impact Analysis para calcular o raio de impacto e suites de teste antes de editar.
- `/capabilities [busca]`: Inspeciona capacidades ativas, origens e conformidade de segurança.
