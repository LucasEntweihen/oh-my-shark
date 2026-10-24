# Especificação de Releases do Oh My Shark (OMSK / OHMS)

> **Documento Normativo**: Define os requisitos inegociáveis para publicação, empacotamento, distribuição e integridade de releases do Oh My Shark, garantindo execução resiliente em qualquer máquina (Windows, Linux, macOS) e eliminando pontos de falha no auto-atualizador (`omsk update`).

---

## 1. Origem do Erro e Análise Causal

### 1.1 O Erro Observado
```text
PS C:\Users\guerr\Downloads\oh-my-shark\oh-my-shark> omsk update
Current version: 0.0.34
Failed to check for updates: TypeError: getaddrinfo ENOTFOUND api.github.com
```

### 1.2 Causa Técnica
1. **Falha de Resolução de DNS (`getaddrinfo ENOTFOUND`)**:
   - O comando `omsk update` faz uma requisição HTTP via `fetch` para `https://api.github.com/repos/LucasEntweihen/oh-my-shark/releases/latest`.
   - Se a máquina local sofrer oscilação transitória de rede, instabilidade no servidor DNS local/ISP, bloqueio por firewall ou proxy empresarial, ou se o IP da API do GitHub não resolver naquele segundo exato, o runtime do Node/Bun emite `getaddrinfo ENOTFOUND api.github.com`.
2. **Ausência de Retry com Backoff e de Fallback de Resolução**:
   - Um erro transitório de socket ou DNS interrompe imediatamente o fluxo com código de saída 1 em vez de:
     - Tentar novamente com jitter/backoff exponencial (ex: 3 tentativas com intervalo progressivo);
     - Recorrer a endpoints alternativos (ex: redirecionamento web em `https://github.com/.../releases/latest` ou mirrors Vercel como `https://ohmyshark.vercel.app/api/version`);
     - Fornecer mensagem orientativa clara caso a máquina esteja verdadeiramente offline.

---

## 2. Os Três Pilares da Release Perfeita

### Pilar 1: Conteúdo Completo no GitHub (Zero Releases Vazias)
Toda tag `omsk-v*` ou `ohms-v*` publicada no GitHub DEVE conter os assets compilados e assinados. Nunca criar release manual sem os binários completos.

A matriz autoritativa definida em `.github/workflows/release-ohms.yml` exige **19 assets obrigatórios**:

| Asset | Descrição |
| :--- | :--- |
| `omsk-windows-x64.exe` / `ohms-windows-x64.exe` | Binário compilado autônomo para Windows x64 (com addons nativos embutidos) |
| `omsk-windows-arm64.exe` / `ohms-windows-arm64.exe` | Binário Windows ARM64 |
| `omsk-linux-x64` / `ohms-linux-x64` | Executável estático para Linux x64 (compatível com glibc e musl) |
| `omsk-linux-arm64` / `ohms-linux-arm64` | Executável para Linux ARM64 (Raspberry Pi, AWS Graviton) |
| `omsk-darwin-x64` / `ohms-darwin-x64` | Executável para macOS Intel |
| `omsk-darwin-arm64` / `ohms-darwin-arm64` | Executável para Apple Silicon (M1/M2/M3/M4) |
| `install.ps1` | Script do instalador Windows (com verificação SHA256) |
| `install.sh` | Script do instalador POSIX (Linux e macOS) |
| `ohmyshark.config.yml` | Template oficial de configurações do usuário |
| `ohmyshark.models.yml` | Catálogo offline de modelos suportados |
| `SHA256SUMS.txt` | Tabela de hashes SHA-256 de todos os artefatos |
| `LICENSE` e `THIRD-PARTY-NOTICES.txt` | Licenças e conformidade legal |

---

### Pilar 2: Funcionar em Qualquer Máquina (Portabilidade Extrema)

1. **Addons Nativos Embutidos (`pi_natives`)**:
   - Antes do comando `bun build --compile`, DEVE ser executado `bun run gen:native` (script `packages/natives/scripts/embed-native.ts`).
   - Os frames compactados com Zstandard (`.zst`) são incorporados diretamente no executável standalone gerado.
   - **Resultado**: O usuário final não precisa ter Node, Bun, C++ Compiler, Python ou compilar nada localmente. O binário executa instantaneamente sem depender de `~/.ohms/natives/`.
2. **Desacoplamento Headless do CLI**:
   - O binário CLI `omsk` **NUNCA** deve abrir janela gráfica ou navegador automaticamente em execuções de terminal ou headless.
   - A GUI é ativada exclusivamente via comandos dedicados ou executáveis próprios da interface (CosmoSky App).
3. **Padrão POSIX e Windows Paths**:
   - Normalização automática de barras `/` e `\` em chaves de arquivos para evitar erros de cache ou caminhos inexistentes entre SOs.
4. **Resolução de Permissões no Windows**:
   - O processo de atualização substitui o arquivo com lock transacional (`withUpdateFileLock`), renomeando o arquivo antigo para `.old` para contornar o bloqueio de arquivo em execução do Windows (Win32 file lock).

---

### Pilar 3: Nunca Dar Erro (Resiliência & Tolerância a Falhas)

1. **Retry Resiliente de Rede & DNS**:
   - Qualquer chamada de rede para checar versão ou baixar binários deve implementar tolerância a falhas de rede (`getaddrinfo`, `ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`).
   - Implementação de retry automático (ex.: 3 tentativas com pausa de 1s, 2s, 3s) antes de declarar falha.
2. **Fallback Transparente contra Rate Limit e Bloqueios**:
   - Se `api.github.com` retornar 403 (Rate Limit) ou falhar por bloqueio de DNS corporativo, o sistema deve recorrer à rota web imune a limites: `https://github.com/LucasEntweihen/oh-my-shark/releases/latest` (via cabeçalho `Location` de redirecionamento 302).
   - Se ainda assim a rede estiver desconectada, o comando deve informar com clareza: *"Ambiente offline ou sem conexão com GitHub. Mantendo versão atual sem interromper o trabalho."* em vez de cuspir uma stack trace de erro feia.
3. **Checagem Estrita de Integridade Criptográfica**:
   - Cada binário baixado tem seu tamanho (bytes) e hash SHA-256 calculados e validados contra o `SHA256SUMS.txt` da release antes de ser executado ou substituir o binário anterior.
   - Em caso de hash divergente, o arquivo corrompido é descartado imediatamente, protegendo a instalação do usuário.

---

## 3. Checklist Passo a Passo para Criar uma Release Segura

### Etapa 1: Atualizar a Versão no Código-Fonte
Em `packages/utils/src/dirs.ts`:
```typescript
export const PRODUCT_VERSION = "0.0.35"; // Deve coincidir estritamente com o semver da tag
```
E atualizar os defaults em `scripts/install.ps1` e `scripts/install.sh`.

### Etapa 2: Validar a Saúde do Código Localmente
```bash
# 1. Checagem de ferramentas e linter
bun run check:tools

# 2. Tipagem estrita
bun run check:types

# 3. Testes unitários do updater
bun test packages/coding-agent/test/cli/update-cli.test.ts
```

### Etapa 3: Gerar e Submeter a Tag de Release
```bash
# 1. Commit convencional
git add .
git commit -m "chore(release): bump version to 0.0.35"
git push origin main

# 2. Tag com o prefixo oficial omsk-v ou ohms-v
git tag omsk-v0.0.35
git push origin omsk-v0.0.35
```

### Etapa 4: Acompanhar o Workflow Automatizado no GitHub Actions
1. O workflow `.github/workflows/release-ohms.yml` é disparado automaticamente.
2. A etapa `verify-tag` valida que o tag `omsk-v0.0.35` bate exatamente com `PRODUCT_VERSION` em `dirs.ts`.
3. A matriz compila os 6 binários nativos com addons embutidos.
4. Os testes de fumaça (`smoke-test`) executam `./omsk --version` em cada SO runner.
5. Os assets são empacotados, os hashes SHA-256 gerados e a release é publicada com as devidas assinaturas de procedência (GitHub Attestation).
