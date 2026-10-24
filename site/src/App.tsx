import { useEffect, useRef, useState } from "react";
import { siGithub, siLinkedin } from "simple-icons";
import { LOCALE_KEY, dict, initLocale } from "./i18n";
import type { Locale, Strings } from "./i18n";
import { applyTheme, initTheme } from "./theme";
import type { Theme } from "./theme";
import { startTopo } from "./topo";

type OS = "win" | "mac";
type Method = "quick" | "verified";

const COMMANDS: Record<OS, Record<Method, string[]>> = {
  win: {
    quick: [
      "irm https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.ps1 | iex",
    ],
    verified: [
      "irm https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.ps1 -OutFile install.ps1",
      "powershell -ExecutionPolicy Bypass -File .\\install.ps1",
    ],
  },
  mac: {
    quick: ["curl -fsSL https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.sh | sh"],
    verified: [
      "curl -fSLO https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/install.sh",
      "sh install.sh",
    ],
  },
};

const SOCIALS = [
  { icon: siGithub, name: "GitHub", href: "https://github.com/LucasEntweihen/oh-my-shark" },
  { icon: siLinkedin, name: "LinkedIn", href: "https://www.linkedin.com/in/lucas-guerriero-286665364/" },
] as const;

function SharkIcon() {
  return (
    <svg className="shark-icon-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M5 26C8 18 13 8 26 5C23 15 17 22 7 27L5 26Z"
        fill="url(#shark-cyan-grad)"
        stroke="rgba(0, 229, 255, 0.9)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 24C16 18 19 13 25 10"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="shark-cyan-grad" x1="5" y1="5" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#0055FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#1E3A8A" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(initLocale);
  const [theme, setTheme] = useState<Theme>(initTheme);
  const [os, setOs] = useState<OS>("win");
  const [method] = useState<Method>("quick");
  const [tuiTab, setTuiTab] = useState<"live" | "task" | "compress" | "roster">("live");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [noticeId, setNoticeId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t: Strings = dict[locale];

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {}
  }, [locale]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startTopo(canvas);
  }, []);

  // Keyboard shortcut listener (/ or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setNoticeId(id);
      setTimeout(() => setNoticeId(null), 2500);
    }).catch(() => {
      setNoticeId("fail");
      setTimeout(() => setNoticeId(null), 2500);
    });
  };

  const heroCommand = COMMANDS[os].quick[0];

  const paletteItems = [
    { name: "Quickstart Installation", section: "#install", tag: "CLI / Powershell" },
    { name: "Task Plan Engine & DAG", section: "#pillars", tag: "Architecture" },
    { name: "3-Way Plan Authorization", section: "#pillars", tag: "User Control" },
    { name: "Semantic Compression & FileReadCache", section: "#compression", tag: "Optimization" },
    { name: "Autonomous Slash Commands", section: "#commands", tag: "Protocols" },
    { name: "10-Step Practical Onboarding Guide", section: "#guide", tag: "Documentation" },
    { name: "Download Windows CLI (.exe)", section: "https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/omsk-windows-x64.exe", tag: "Download" },
    { name: "GitHub Source Code Repository", section: "https://github.com/LucasEntweihen/oh-my-shark", tag: "GitHub" },
  ];

  const filteredPalette = paletteItems.filter((i) =>
    i.name.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    i.tag.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <>
      <a className="skip-link" href="#main">{t.skipLink}</a>
      <canvas ref={canvasRef} className="topo-canvas" aria-hidden="true" />
      <div className="dot-matrix-overlay" aria-hidden="true" />

      {/* COMMAND PALETTE MODAL (Cmd+K / /) */}
      {paletteOpen && (
        <div className="palette-modal-backdrop" onClick={() => setPaletteOpen(false)}>
          <div className="palette-box" onClick={(e) => e.stopPropagation()}>
            <div className="palette-input-row">
              <span style={{ color: "var(--shark-cyan)", fontFamily: "var(--font-mono)" }}>❯</span>
              <input
                type="text"
                className="palette-search-input"
                placeholder={t.palettePlaceholder}
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                autoFocus
              />
              <span className="kbd-chip">{t.paletteEscHint}</span>
            </div>
            <ul className="palette-list">
              {filteredPalette.map((item, idx) => (
                <li
                  key={idx}
                  className="palette-item"
                  onClick={() => {
                    setPaletteOpen(false);
                    if (item.section.startsWith("http")) {
                      window.open(item.section, "_blank");
                    } else {
                      window.location.hash = item.section;
                    }
                  }}
                >
                  <span className="palette-item-name">{item.name}</span>
                  <span className="palette-item-badge">{item.tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="page-container">
        {/* VIEW 01: TELEMETRY STRIP */}
        <div className="telemetry-strip" aria-hidden="true">
          <div className="wrap telemetry-inner">
            <span className="telemetry-item">
              <span className="status-dot green" />
              {t.telemetryStatus}
            </span>
            <span className="telemetry-item">{t.telemetryEngine}</span>
            <span className="telemetry-item">{t.telemetryTokenSavings}</span>
            <span className="telemetry-item">{t.telemetryLatency}</span>
            <span className="telemetry-item">
              <span className="status-dot cyan" />
              {t.telemetryVersion}
            </span>
          </div>
        </div>

        {/* VIEW 01: GLOBAL TACTICAL HEADER */}
        <header className="site-header">
          <div className="wrap header-inner">
            <a className="brand-group" href="#top">
              <SharkIcon />
              <span className="brand-text">{t.wordmark}</span>
              <span className="brand-badge">{t.versionBadge}</span>
            </a>

            <nav className="site-nav" aria-label="Main Navigation">
              <a className="nav-link" href="#pillars">{t.navBento}</a>
              <a className="nav-link" href="#compression">{t.navCompression}</a>
              <a className="nav-link" href="#commands">{t.navCommands}</a>
              <a className="nav-link" href="#guide">{t.navDocs}</a>
              <a className="nav-link" href="#install">{t.navInstall}</a>
              <a className="nav-link" href={t.githubHref} target="_blank" rel="noopener noreferrer">
                {t.navGithub}
              </a>
            </nav>

            <div className="header-actions">
              <button
                type="button"
                className="palette-trigger-btn"
                onClick={() => setPaletteOpen(true)}
                title={t.commandPaletteHint}
              >
                <span>Command</span>
                <span className="kbd-chip">Cmd+K</span>
              </button>

              <div className="control-btn-group" role="group" aria-label={t.localeToggleLabel}>
                <button
                  type="button"
                  className={locale === "pt" ? "control-btn active" : "control-btn"}
                  onClick={() => setLocale("pt")}
                >
                  PT
                </button>
                <button
                  type="button"
                  className={locale === "en" ? "control-btn active" : "control-btn"}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
              </div>

              <div className="control-btn-group" role="group" aria-label={t.themeToggleLabel}>
                <button
                  type="button"
                  className={theme === "dark" ? "control-btn active" : "control-btn"}
                  onClick={() => setTheme("dark")}
                >
                  {t.themeDark}
                </button>
                <button
                  type="button"
                  className={theme === "light" ? "control-btn active" : "control-btn"}
                  onClick={() => setTheme("light")}
                >
                  {t.themeLight}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main id="main">
          {/* VIEW 02: HERO SECTION (ABOVE THE FOLD — PHI 1.618 SPLIT) */}
          <section className="hero-section" id="top">
            <div className="wrap hero-grid">
              {/* Coluna Esquerda: Proposta de Valor e Seletor CLI */}
              <div className="hero-content">
                {/* 1. COMANDO DE DOWNLOAD E INSTALAÇÃO NO TOPO (PRIMEIRA VISÃO) */}
                <div className="hero-install-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="hero-install-label">{t.heroInstallHeader}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        style={{
                          background: os === "win" ? "rgba(0, 229, 255, 0.2)" : "transparent",
                          border: "1px solid " + (os === "win" ? "var(--shark-cyan)" : "rgba(255,255,255,0.1)"),
                          color: os === "win" ? "var(--shark-cyan)" : "var(--text-muted)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer"
                        }}
                        onClick={() => setOs("win")}
                      >
                        Windows
                      </button>
                      <button
                        type="button"
                        style={{
                          background: os === "mac" ? "rgba(0, 229, 255, 0.2)" : "transparent",
                          border: "1px solid " + (os === "mac" ? "var(--shark-cyan)" : "rgba(255,255,255,0.1)"),
                          color: os === "mac" ? "var(--shark-cyan)" : "var(--text-muted)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer"
                        }}
                        onClick={() => setOs("mac")}
                      >
                        macOS / Linux
                      </button>
                    </div>
                  </div>
                  <div className="install-cmd-row">
                    <span style={{ color: "var(--shark-cyan)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {os === "win" ? "PS >" : "$"}
                    </span>
                    <code className="install-cmd-code">{heroCommand}</code>
                    <button
                      type="button"
                      className="btn-copy-action"
                      onClick={() => copy("hero", heroCommand)}
                    >
                      {noticeId === "hero" ? <CheckIcon /> : <CopyIcon />}
                      <span>{noticeId === "hero" ? t.heroCopied : t.heroCopyLabel}</span>
                    </button>
                  </div>
                </div>

                <div className="hero-eyebrow-badge">
                  <span className="status-dot cyan" />
                  <span>{t.heroBadge}</span>
                </div>

                <h1 className="hero-title">
                  {t.heroTitlePre} <span className="hero-title-gradient">{t.heroTitleGradient}</span>
                </h1>

                <p className="hero-lede">{t.heroLede}</p>

                {/* CTAs Primário e Secundário */}
                <div className="hero-cta-group">
                  <a
                    className="btn-primary"
                    href="https://github.com/LucasEntweihen/OMSK-gui/releases/download/v1.1.0/OMSK-GUI-Windows-x64.zip"
                    download="OMSK-GUI-Windows-x64.zip"
                    style={{ background: "linear-gradient(135deg, #00E5FF, #2678FF)", color: "#020A16", fontWeight: 700 }}
                  >
                    <span>⚡</span>
                    <span>{t.heroDownloadGui}</span>
                  </a>
                  <a
                    className="btn-ghost"
                    href="https://github.com/LucasEntweihen/oh-my-shark/releases/latest/download/omsk-windows-x64.exe"
                    download="omsk-windows-x64.exe"
                  >
                    <span>⬇</span>
                    <span>{t.heroDownloadExe}</span>
                  </a>
                  <a className="btn-ghost" href="#pillars">
                    <span>{t.heroInspectLive}</span>
                    <span>→</span>
                  </a>
                  <a className="btn-ghost" href="#guide">
                    <span>{t.heroDocsCta}</span>
                  </a>
                </div>
              </div>

              {/* Coluna Direita: Emulador TUI Interativo em Tempo Real */}
              <div className="tui-window">
                <div className="tui-titlebar">
                  <div className="tui-dots">
                    <span className="tui-dot red" />
                    <span className="tui-dot yellow" />
                    <span className="tui-dot green" />
                  </div>
                  <span className="tui-title-text">{t.tuiTitle}</span>
                  <span className="brand-badge">SHARK KERNEL</span>
                </div>

                <div className="tui-tabs-bar">
                  <button
                    type="button"
                    className={tuiTab === "live" ? "tui-tab active" : "tui-tab"}
                    onClick={() => setTuiTab("live")}
                  >
                    {t.tabTuiLive}
                  </button>
                  <button
                    type="button"
                    className={tuiTab === "task" ? "tui-tab active" : "tui-tab"}
                    onClick={() => setTuiTab("task")}
                  >
                    {t.tabTuiTask}
                  </button>
                  <button
                    type="button"
                    className={tuiTab === "compress" ? "tui-tab active" : "tui-tab"}
                    onClick={() => setTuiTab("compress")}
                  >
                    {t.tabTuiCompress}
                  </button>
                  <button
                    type="button"
                    className={tuiTab === "roster" ? "tui-tab active" : "tui-tab"}
                    onClick={() => setTuiTab("roster")}
                  >
                    {t.tabTuiRoster}
                  </button>
                </div>

                <div className="tui-viewport">
                  {tuiTab === "live" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontFamily: "var(--font-mono)" }}>
                      <span className="tui-line-item" style={{ color: "var(--shark-cyan)" }}>
                        [OMSK::KERNEL] Initializing sub-millisecond harness...
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--text-muted)" }}>
                        Reading ~/.omsk/tarefas.json [OK] • FileReadCache mounted
                      </span>
                      <span className="tui-line-item" style={{ color: "#ffffff", fontWeight: 700, marginBlock: "0.2rem" }}>
                        ❯ omsk task "WebAuthn credentials"
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--shark-emerald)" }}>
                        ✔ DAG: 4 tasks ordered via Kahn (zero cycles)
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--text-muted)", paddingLeft: "0.5rem" }}>
                        ├─ [t1] auth-schema.ts [DONE]
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--text-muted)", paddingLeft: "0.5rem" }}>
                        ├─ [t2] challenge-token.ts [DONE]
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--shark-cyan)", paddingLeft: "0.5rem", fontWeight: 600 }}>
                        ├─ [t3] verify-signature.ts [IN_PROGRESS]
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--text-faint)", paddingLeft: "0.5rem" }}>
                        └─ [t4] integration.test.ts [PENDING]
                      </span>
                      <span className="tui-line-item" style={{ color: "var(--shark-amber)", marginTop: "0.25rem" }}>
                        [EVIDENCE] 16 tests verified • SHA-256: e82f...
                      </span>
                    </div>
                  )}

                  {tuiTab === "task" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ color: "var(--shark-cyan)" }}>
                        === OH MY SHARK TASK PLAN ENGINE (DAG) ===
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        State: Directed Acyclic Graph • Topological In-Degree Resolution
                      </span>
                      <span style={{ color: "var(--shark-emerald)" }}>
                        [Option A] Execute Full Topological Sequence (Autonomous)
                      </span>
                      <span style={{ color: "var(--shark-cyan)" }}>
                        [Option B] Selective Tasks with Auto-Dependency Inclusion
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        [Option C] Graceful Skip without Context Loss
                      </span>
                      <span style={{ color: "#ffffff", marginTop: "0.5rem" }}>
                        Active Plan: local://webauthn-migration-plan.md
                      </span>
                    </div>
                  )}

                  {tuiTab === "compress" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ color: "var(--shark-cyan)" }}>
                        === SEMANTIC COMPRESSION (DEEPSEANEURON) ===
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        Raw Tokens Ingested: 14,850 tokens
                      </span>
                      <span style={{ color: "var(--shark-emerald)" }}>
                        Compacted Semantic Output: 4,620 tokens (-68.9% reduction)
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        FileReadCache: 28 disk reads avoided • 1.4 MB memory saved
                      </span>
                      <span style={{ color: "var(--shark-purple)" }}>
                        [ACTIVE METRICS] TTFT accelerated from 142ms to 14ms
                      </span>
                    </div>
                  )}

                  {tuiTab === "roster" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ color: "var(--shark-cyan)" }}>
                        === SPECIALIST AGENT ROSTER ===
                      </span>
                      <span style={{ color: "#ffffff" }}>
                        🦈 @shark-lead — Master Strategy & Delegation Orchestrator
                      </span>
                      <span style={{ color: "var(--shark-emerald)" }}>
                        ⚙️ @code-architect — Zero-Overhead Bun/TypeScript Engineer
                      </span>
                      <span style={{ color: "var(--shark-crimson)" }}>
                        🛡️ @security-sentinel — Vulnerability & Vector Auditor
                      </span>
                      <span style={{ color: "var(--shark-amber)" }}>
                        📜 @theological-scholar — Lexicographical & Semantic Rigor
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* VIEW 03: 6 PILLARS BENTO GRID */}
          <section id="pillars">
            <div className="wrap">
              <span className="section-eyebrow">{t.pillarsEyebrow}</span>
              <h2 className="section-title">{t.pillarsHeading}</h2>
              <p className="section-lede">{t.pillarsLede}</p>

              <div className="bento-grid">
                {/* Pillar 1: Large Span 8 */}
                <div className="glass-panel bento-card col-span-8">
                  <span className="bento-tag">{t.pillar1Tag}</span>
                  <h3 className="bento-title">{t.pillar1Title}</h3>
                  <p className="bento-body">{t.pillar1Body}</p>
                </div>

                {/* Pillar 2: Span 4 */}
                <div className="glass-panel bento-card col-span-4">
                  <span className="bento-tag amber">{t.pillar2Tag}</span>
                  <h3 className="bento-title">{t.pillar2Title}</h3>
                  <p className="bento-body">{t.pillar2Body}</p>
                </div>

                {/* Pillar 3: Span 4 */}
                <div className="glass-panel bento-card col-span-4">
                  <span className="bento-tag purple">{t.pillar3Tag}</span>
                  <h3 className="bento-title">{t.pillar3Title}</h3>
                  <p className="bento-body">{t.pillar3Body}</p>
                </div>

                {/* Pillar 4: Span 4 */}
                <div className="glass-panel bento-card col-span-4">
                  <span className="bento-tag">{t.pillar4Tag}</span>
                  <h3 className="bento-title">{t.pillar4Title}</h3>
                  <p className="bento-body">{t.pillar4Body}</p>
                </div>

                {/* Pillar 5: Span 4 */}
                <div className="glass-panel bento-card col-span-4">
                  <span className="bento-tag">{t.pillar5Tag}</span>
                  <h3 className="bento-title">{t.pillar5Title}</h3>
                  <p className="bento-body">{t.pillar5Body}</p>
                </div>

                {/* Pillar 6: Large Span 12 */}
                <div className="glass-panel bento-card col-span-12">
                  <span className="bento-tag purple">{t.pillar6Tag}</span>
                  <h3 className="bento-title">{t.pillar6Title}</h3>
                  <p className="bento-body">{t.pillar6Body}</p>
                </div>
              </div>
            </div>
          </section>

          {/* VIEW 04: DEEP DIVE SEMANTIC COMPRESSION (SPLIT-PANE VIEWER) */}
          <section id="compression">
            <div className="wrap">
              <span className="section-eyebrow">{t.compressEyebrow}</span>
              <h2 className="section-title">{t.compressHeading}</h2>
              <p className="section-lede">{t.compressLede}</p>

              <div className="split-pane-box">
                {/* Lado Esquerdo: Before */}
                <div className="glass-panel pane-side before">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="pane-badge red">{t.compressBeforeTitle}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.compressBeforeStats}</span>
                  </div>
                  <pre className="pane-code-box">
                    <code>{`// Inflated repetitive context & unchecked tool reads
[DEBUG] Reading 4,200 lines from server.log (redundant)
[TRACE] AST traversal re-emitting 84 identical symbols
[ERROR] Uncached file reads triggering 42 disk accesses
... 12,000 repetitive token lines elided ...
[STATUS] Context Window Pressure: 94.2%`}</code>
                  </pre>
                </div>

                {/* Centro: Savings Badge */}
                <div className="split-arrow">
                  <span className="savings-pill">{t.compressReductionBadge}</span>
                  <span style={{ color: "var(--shark-cyan)", fontSize: "1.5rem" }}>➔</span>
                </div>

                {/* Lado Direito: After */}
                <div className="glass-panel pane-side after">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="pane-badge cyan">{t.compressAfterTitle}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.compressAfterStats}</span>
                  </div>
                  <pre className="pane-code-box">
                    <code>{`// Oh My Shark Dense Semantic Representation
[OMSK::CACHE] FileReadCache: 0 disk reads • Hash hit: mtime:ok
[OMSK::COMPACT] ToolResultCompactor: 42 lines summarized -> artifact://74
[OMSK::DAG] Kahn topological validation: 4 tasks ready
[OMSK::EVIDENCE] 100% verified test coverage
[STATUS] Context Window Pressure: 24.1%`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* VIEW 05: AUTONOMOUS SLASH COMMANDS PIPELINE */}
          <section id="commands">
            <div className="wrap">
              <span className="section-eyebrow">{t.commandsEyebrow}</span>
              <h2 className="section-title">{t.commandsHeading}</h2>
              <p className="section-lede">{t.commandsLede}</p>

              <div className="commands-pipeline-grid">
                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdPromaxthinkName}</code>
                  <span className="cmd-badge">{t.cmdPromaxthinkBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdPromaxthinkDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdUltrathinkName}</code>
                  <span className="cmd-badge">{t.cmdUltrathinkBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdUltrathinkDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdXlr8Name}</code>
                  <span className="cmd-badge">{t.cmdXlr8Badge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdXlr8Desc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdFastthinkName}</code>
                  <span className="cmd-badge">{t.cmdFastthinkBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdFastthinkDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdDeepseaName}</code>
                  <span className="cmd-badge">{t.cmdDeepseaBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdDeepseaDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdLearnerName}</code>
                  <span className="cmd-badge">{t.cmdLearnerBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdLearnerDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdDoomaniaName}</code>
                  <span className="cmd-badge">{t.cmdDoomaniaBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdDoomaniaDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdTaskManagerName}</code>
                  <span className="cmd-badge">{t.cmdTaskManagerBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdTaskManagerDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdWorkflowName}</code>
                  <span className="cmd-badge">{t.cmdWorkflowBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdWorkflowDesc}</p>
                </div>

                <div className="glass-panel cmd-card">
                  <code style={{ color: "var(--shark-cyan)", fontWeight: 700 }}>{t.cmdSandboxName}</code>
                  <span className="cmd-badge">{t.cmdSandboxBadge}</span>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t.cmdSandboxDesc}</p>
                </div>
              </div>
            </div>
          </section>

          {/* VIEW 06: 10-STEP ONBOARDING GUIDE */}
          <section id="guide">
            <div className="wrap">
              <span className="section-eyebrow">{t.guideEyebrow}</span>
              <h2 className="section-title">{t.guideHeading}</h2>
              <p className="section-lede">{t.guideLede}</p>

              <div className="guide-stepper-grid">
                {[
                  { step: "01", title: "Setup & Binaries", desc: "Download standalone native binaries or bootstrap via PowerShell/Bash.", cmd: "irm .../install.ps1 | iex" },
                  { step: "02", title: "API Keys & BYOK", desc: "Configure Anthropic Claude, OpenAI, Gemini or local Ollama models.", cmd: "export GEMINI_API_KEY=\"...\"" },
                  { step: "03", title: "Model & Reasoning Roles", desc: "Configure smol, default, or slow tiers with promaxthink or fastthink.", cmd: "promaxthink design the engine" },
                  { step: "04", title: "Launch ohms Session", desc: "Start the terminal harness in any repository root safely in ~/.ohms.", cmd: "ohms" },
                  { step: "05", title: "State Objective", desc: "Define task goals and explicit observable acceptance criteria.", cmd: "Migrate auth to WebAuthn" },
                  { step: "06", title: "Interactive ask Prompts", desc: "Answer structured questions when architectural choices arise.", cmd: "ask: [Option 1] [Option 2]" },
                  { step: "07", title: "Authorize Plan (A/B/C)", desc: "Choose Option A (All), Option B (Subset), or Option C (Skip).", cmd: "[Option A: Execute All]" },
                  { step: "08", title: "Track via Kanban HUD", desc: "Monitor live DAG execution, retries, and blockers in real time.", cmd: "/taskmanager" },
                  { step: "09", title: "Inspect Evidences", desc: "Validate diffs, test outputs, and SHA-256 artifacts before settlement.", cmd: "npm test -- --coverage" },
                  { step: "10", title: "Resume Anytime", desc: "Interrupt safely. Tasks and conversational context restore instantly.", cmd: "ohms --continue" },
                ].map((s) => (
                  <div key={s.step} className="glass-panel step-card">
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span className="step-number">{s.step}</span>
                        <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>STAGE</span>
                      </div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</h3>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{s.desc}</p>
                    </div>
                    <div className="install-cmd-row" style={{ padding: "0.4rem 0.65rem" }}>
                      <code style={{ fontSize: "0.75rem" }}>{s.cmd}</code>
                      <button type="button" className="btn-copy-action" onClick={() => copy(s.step, s.cmd)}>
                        {noticeId === s.step ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VIEW 07: INSTALLATION & TERMINAL CTA */}
          <section id="install">
            <div className="wrap">
              <span className="section-eyebrow">{t.installEyebrow}</span>
              <h2 className="section-title">{t.installHeading}</h2>
              <p className="section-lede">{t.installLede}</p>

              <div className="glass-panel terminal-install-panel">
                <div className="os-toggle-tabs">
                  <button
                    type="button"
                    className={os === "win" ? "os-tab active" : "os-tab"}
                    onClick={() => setOs("win")}
                  >
                    {t.tabWindows}
                  </button>
                  <button
                    type="button"
                    className={os === "mac" ? "os-tab active" : "os-tab"}
                    onClick={() => setOs("mac")}
                  >
                    {t.tabMacLinux}
                  </button>
                </div>

                <div className="install-cmd-row" style={{ padding: "1rem" }}>
                  <span style={{ color: "var(--shark-cyan)", fontFamily: "var(--font-mono)" }}>
                    {os === "win" ? "PS >" : "$"}
                  </span>
                  <code className="install-cmd-code" style={{ fontSize: "0.95rem" }}>
                    {COMMANDS[os][method][0]}
                  </code>
                  <button
                    type="button"
                    className="btn-copy-action"
                    onClick={() => copy("install-final", COMMANDS[os][method][0])}
                  >
                    {noticeId === "install-final" ? <CheckIcon /> : <CopyIcon />}
                    <span>{noticeId === "install-final" ? t.heroCopied : t.heroCopyLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* SITE FOOTER */}
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div className="footer-top">
              <div className="brand-group">
                <SharkIcon />
                <span className="brand-text">{t.wordmark}</span>
                <span className="brand-badge">{t.versionBadge}</span>
              </div>

              <div style={{ display: "flex", gap: "1.5rem" }}>
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-bottom">
              <span>{t.footerLicense} • {t.footerProvenance}</span>
              <span>Made with predatory precision by LucasEntweihen</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
