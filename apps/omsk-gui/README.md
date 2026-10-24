# OMSK GUI — Interface Gráfica Oficial do Oh My Shark

Aplicativo desktop nativo do Oh My Shark (**OMSK GUI**), construído para execução direta em desktop no Windows, Linux e macOS com tema Deep Ocean, visualizador neural da Mente em Teia e integração direta com o motor OMSK.

---

## 🚀 Como Executar o App no seu Computador

### Modo 1: Executável Direto (Dois Cliques)
Dê dois cliques no executável:
- **`apps/omsk-gui/OMSK GUI.exe`**

Ou crie um atalho na sua Área de Trabalho / Barra de Tarefas para acesso rápido.

### Modo 2: Via Terminal PowerShell / CMD
```powershell
& ".\apps\omsk-gui\OMSK GUI.exe"
```

### Modo 3: Via Script Bun
```bash
bun run gui:app
```

---

## 🛠️ Como Recompilar

Caso faça modificações no código-fonte em `../OMSK-gui`:

```bash
cd ../OMSK-gui
bun run build
bun build electron/main.ts --target=node --outfile=electron/dist/main.cjs
bun build electron/preload.ts --target=node --outfile=electron/dist/preload.cjs
bun x electron-builder --win dir
```
