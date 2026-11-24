<div align="center">

# OhMyShark GUI (`OMSK`)

**A desktop workspace for parallel AI coding agents — built on the Shark Ocean design system.**

<a href="https://github.com/LucasEntweihen/oh-my-shark/releases"><img src="https://img.shields.io/github/v/release/LucasEntweihen/oh-my-shark?style=flat&colorA=0A0C10&colorB=00F0FF" alt="Release"></a>
<a href="../../LICENSE"><img src="https://img.shields.io/badge/license-MIT-0EA5E9?style=flat" alt="License: MIT"></a>
<img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-0D1B2A?style=flat" alt="Platform: macOS | Windows | Linux">
<img src="https://img.shields.io/badge/Electron-35-47848F?style=flat&logo=electron&logoColor=white" alt="Electron">
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white" alt="React">

[Features](#features) · [Releases](https://github.com/LucasEntweihen/oh-my-shark/releases) · [Shortcuts](#shortcuts) · [Themes](#themes) · [Development](#development)

</div>

---

## Overview

Keep conversations, code changes, terminals, embedded browser views, and parallel agent activity in one liquid-glass dark workspace. OhMyShark (`omsk`) bundles its own native agent sidecar so macOS, Windows, and Linux packages run out of the box while sharing your `~/.omsk` configuration and session history.

<a id="features"></a>
## Core Capabilities

- **Independent Tabs & Worktrees**: Run isolated agent, chat, file, terminal, and Git worktree sessions side by side or in split panes with pinning, inline renaming, overflow navigation, and quick search.
- **Shark Ocean Aquarium & Liquid Glass**: Procedural ASCII deep-sea shark habitats render uniquely per chat and empty tab behind an optical Liquid Glass layer.
- **Custom Dark Presets & Theme Studio**: Dark-first Shark Ocean themes (`Shark Ocean`, `Deep Abyss`, `Bioluminescent Reef`, `Midnight Obsidian`) plus live manual color customization saved to `~/.omsk/gui/themes`.
- **Synthesized Audio Feedback**: Subtle toggleable Web Audio cues for interactions, sends, and turn completions.
- **Built-in Tools & Inspection**: Inline diffs, file viewer/editor, embedded browser & terminals, scheduled background tasks, memory/skills management, and model/provider configuration.

<a id="shortcuts"></a>
## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + T` | New session tab |
| `Ctrl/Cmd + Shift + F` | Conversation search |
| `Ctrl/Cmd + \` | Split view |
| `Ctrl/Cmd + ,` | Settings |
| `Alt + Shift + O` / `⇧⌘O` | Global OhMyShark window toggle |

<a id="themes"></a>
## Themes & Customization

Open the Theme Picker from the titlebar or Command Palette (`theme`) to switch dark presets, tune accent/water/shark/glass colors live, or save custom JSON files into `~/.omsk/gui/themes`.

<a id="development"></a>
## Development

```bash
# Install dependencies from repository root
bun install

# Build bundled OMSK sidecar into packages/gui/resources/omsk(.exe)
bun --cwd=packages/gui run build:omsk

# Run GUI checks, tests, and production Electron bundle
bun --cwd=packages/gui run check
bun --cwd=packages/gui run test
bun --cwd=packages/gui run build
```
