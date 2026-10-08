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
      '$s = (irm https://oh-my-shark.vercel.app/install.ps1); $s = $s.Replace("[System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()", \'"x64"\'); & ([scriptblock]::Create($s))',
    ],
    verified: [
      "irm https://github.com/LucasEntweihen/oh-my-shark/releases/download/omsk-v0.0.20/install.ps1 -OutFile install.ps1",
      "powershell -ExecutionPolicy Bypass -File .\\install.ps1",
    ],
  },
  mac: {
    quick: ["curl -fsSL https://oh-my-shark.vercel.app/install -o install.sh && sh install.sh"],
    verified: [
      "curl -fSLO https://github.com/LucasEntweihen/oh-my-shark/releases/download/omsk-v0.0.20/install.sh",
      "sh install.sh",
    ],
  },
};

const SOCIALS = [
  { icon: siGithub, key: "socialGithub", href: "https://github.com/LucasEntweihen" },
  { icon: siLinkedin, key: "socialLinkedin", href: "https://www.linkedin.com/in/lucas-guerriero-286665364/?isSelfProfile=true" },
] as const;

function fallbackCopy(text: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.top = "-9999px";
    area.setAttribute("aria-hidden", "true");
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Shark Fin Signature: precision aerodynamic shark silhouette mark
 */
function SharkMark() {
  return (
    <svg className="shark-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M5 26C8 18 13 8 26 5C23 15 17 22 7 27L5 26Z"
        fill="url(#shark-grad)"
        stroke="rgba(0, 229, 255, 0.85)"
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
        <linearGradient id="shark-grad" x1="5" y1="5" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#0055FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#4A00E0" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function BrandIcon({ path }: { path: string }) {
  return (
    <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/**
 * Midground Z-10 Spectrum Layer
 * Film-grain fractal noise filter + Continuous 8-color spectrum beam (#4A00E0 -> #FF0033)
 */
function SpectrumLayer() {
  return (
    <svg
      className="prism-spectrum-bg"
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="film-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0" />
          <feComposite in2="SourceGraphic" in="gl" operator="in" />
        </filter>

        <linearGradient id="spectrum-beam" x1="0" y1="0" x2="1920" y2="1080" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A00E0" stopOpacity="0.4" />
          <stop offset="14%" stopColor="#3B11A4" stopOpacity="0.35" />
          <stop offset="28%" stopColor="#0055FF" stopOpacity="0.35" />
          <stop offset="42%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="57%" stopColor="#00FF66" stopOpacity="0.3" />
          <stop offset="71%" stopColor="#FFEA00" stopOpacity="0.25" />
          <stop offset="85%" stopColor="#FF6600" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF0033" stopOpacity="0.4" />
        </linearGradient>

        <radialGradient id="beam-bloom" cx="60%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#0055FF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g filter="url(#film-grain)">
        <polygon points="120,0 680,0 1920,920 1920,1080 1360,1080 0,160" fill="url(#spectrum-beam)" opacity="0.65" />
        <circle cx="1150" cy="520" r="620" fill="url(#beam-bloom)" />
        <line x1="260" y1="0" x2="1920" y2="980" stroke="#00E5FF" strokeWidth="1.5" strokeOpacity="0.45" />
        <line x1="420" y1="0" x2="1920" y2="820" stroke="#00FF66" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="580" y1="0" x2="1920" y2="660" stroke="#FFEA00" strokeWidth="1" strokeOpacity="0.25" />
      </g>
    </svg>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(initLocale);
  const [theme, setTheme] = useState<Theme>(initTheme);
  const [heroOs, setHeroOs] = useState<OS>("win");
  const [os, setOs] = useState<OS>("win");
  const [method, setMethod] = useState<Method>("quick");
  const [feature, setFeature] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [noticeOk, setNoticeOk] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const t: Strings = dict[locale];
  const activeFeature = t.featuresList[Math.min(feature, t.featuresList.length - 1)];

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startTopo(canvas);
  }, []);

  const copy = (id: string, text: string) => {
    const ok =
      typeof navigator !== "undefined" && navigator.clipboard
        ? navigator.clipboard
            .writeText(text)
            .then(() => true)
            .catch(() => fallbackCopy(text))
        : Promise.resolve(fallbackCopy(text));

    void ok.then((success) => {
      setNoticeId(id);
      setNoticeOk(success);
      window.setTimeout(() => {
        setNoticeId((cur) => (cur === id ? null : cur));
      }, 2500);
    });
  };

  const heroCommand = COMMANDS[heroOs].quick[0];
  const steps = COMMANDS[os][method];
  const noticeText = noticeOk ? t.copiedMessage : t.copyFailedMessage;

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {noticeId ? noticeText : ""}
      </div>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>

      {/* Layer Z-0: Deep Web 3D Topographic Mesh */}
      <canvas ref={canvasRef} className="topo-canvas" aria-hidden="true" />

      {/* Layer Z-10: 8-Band Optical Spectrum Beam */}
      <SpectrumLayer />

      <div className="page">
        {/* Optical Telemetry Status Strip */}
        <div className="telemetry-strip" aria-hidden="true">
          <div className="wrap telemetry-inner">
            <span className="telemetry-node">
              <span className="pulse-dot green" />
              {t.telemetryGrid}
            </span>
            <span className="telemetry-node">
              <span className="pulse-dot cyan" />
              {t.telemetrySpectrum}
            </span>
            <span className="telemetry-node anomaly">
              <span className="pulse-dot red" />
              {t.telemetryStatus}
            </span>
          </div>
        </div>

        {/* Site Header */}
        <header className="site-header">
          <div className="wrap header-inner">
            <a className="brand" href="#top" aria-label={t.wordmark}>
              <SharkMark />
              <span className="wordmark">{t.wordmark}</span>
              <span className="version-badge">{t.versionBadge}</span>
            </a>

            <nav className="site-nav" aria-label={t.navLabel}>
              <a href="#quick-install">{t.heroInstallCta}</a>
              <a href="#agents">{t.navAgents}</a>
              <a href="#commands">{t.navCommands}</a>
              <a href="#features">{t.navFeatures}</a>
              <a href="#install">{t.navPreset}</a>
              <a href="#lineage">{t.navLineage}</a>
              <a href={t.githubHref} target="_blank" rel="noopener noreferrer">
                {t.navGithub}
              </a>
            </nav>

            <div className="header-controls">
              <div className="locale-control" role="group" aria-label={t.localeToggleLabel}>
                <button
                  type="button"
                  aria-pressed={locale === "pt"}
                  onClick={() => setLocale("pt")}
                >
                  PT
                </button>
                <button
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
              </div>

              <div className="theme-control" role="group" aria-label={t.themeToggleLabel}>
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  onClick={() => setTheme("dark")}
                >
                  {t.themeDark}
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "light"}
                  onClick={() => setTheme("light")}
                >
                  {t.themeLight}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main id="main">
          <div className="wrap" id="top">
            {/* HERO SECTION */}
            <section className="hero" aria-labelledby="hero-title">
              <div className="hero-prism-badge">
                <span className="badge-glow-dot" />
                <span>{t.heroSpectrumBadge}</span>
              </div>

              <p className="eyebrow">
                <SharkMark />
                {t.heroEyebrow}
              </p>

              <h1 id="hero-title">{t.heroTitle}</h1>
              <p className="lede">{t.heroLede}</p>

              {/* ----------------------------------------------------------------- */}
              {/* DEFINITIVE INSTALL COMMAND HERO CARD                              */}
              {/* ----------------------------------------------------------------- */}
              <div className="hero-install-card glass-card" id="quick-install">
                <div className="card-ambient-light" aria-hidden="true" />
                <div className="hero-card-header">
                  <div className="hero-card-title-group">
                    <TerminalIcon />
                    <span className="hero-card-title">{t.quickInstallHeader}</span>
                    <span className="live-pill">{t.quickInstallBadge}</span>
                  </div>
                  <div className="hero-os-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={heroOs === "win"}
                      onClick={() => setHeroOs("win")}
                      className={heroOs === "win" ? "os-tab is-active" : "os-tab"}
                    >
                      Windows (PowerShell)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={heroOs === "mac"}
                      onClick={() => setHeroOs("mac")}
                      className={heroOs === "mac" ? "os-tab is-active" : "os-tab"}
                    >
                      macOS / Linux
                    </button>
                  </div>
                </div>

                <p className="hero-card-sub">{t.quickInstallSub}</p>

                <div className="hero-cmd-display">
                  <span className="cmd-prompt">{heroOs === "win" ? "PS >" : "$"}</span>
                  <code className="cmd-code">{heroCommand}</code>
                  <button
                    type="button"
                    className={noticeId === `hero-${heroOs}` ? "btn-hero-copy copied" : "btn-hero-copy"}
                    onClick={() => copy(`hero-${heroOs}`, heroCommand)}
                    aria-label={`${t.copyLabel}: ${heroCommand}`}
                  >
                    {noticeId === `hero-${heroOs}` ? (
                      <>
                        <CheckIcon />
                        <span>{t.copiedMessage}</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon />
                        <span>{t.copyLabel}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="hero-card-footer">
                  <span className="meta-badge">
                    <span className="status-indicator" />
                    {t.quickInstallMeta}
                  </span>
                  <a href="#install" className="advanced-link">
                    {t.methodVerified} →
                  </a>
                </div>
              </div>

              <div className="hero-ctas">
                <a className="btn btn-primary" href="#quick-install">
                  {t.heroInstallCta}
                </a>
                <a className="btn btn-ghost" href="#agents">
                  {t.navAgents}
                </a>
                <a className="btn btn-ghost" href="#changes">
                  {t.heroChangesCta}
                </a>
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* AGENT ROSTER SECTION                                              */}
            {/* ----------------------------------------------------------------- */}
            <section className="agents-section" id="agents" aria-labelledby="agents-title">
              <p className="eyebrow">
                <BotIcon />
                {t.agentsEyebrow}
              </p>
              <h2 id="agents-title">{t.agentsHeading}</h2>
              <p className="section-lede">{t.agentsLede}</p>

              <div className="agents-grid">
                {t.agentsList.map((ag, idx) => (
                  <div
                    key={ag.id}
                    className={`agent-card glass-card ${selectedAgent === idx ? "is-active-card" : ""}`}
                    onClick={() => setSelectedAgent(idx)}
                    style={{ "--agent-accent": ag.color } as React.CSSProperties}
                  >
                    <div className="agent-card-header">
                      <div className="agent-avatar-sphere" style={{ backgroundColor: ag.color, boxShadow: `0 0 16px ${ag.color}66` }} />
                      <div>
                        <div className="agent-handle-group">
                          <code className="agent-handle">{ag.handle}</code>
                          <button
                            type="button"
                            className="btn-agent-handle-copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(`handle-${ag.id}`, ag.handle);
                            }}
                            title={t.copyLabel}
                          >
                            {noticeId === `handle-${ag.id}` ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                        <h3 className="agent-name">{ag.name}</h3>
                      </div>
                    </div>

                    <div className="agent-role-badge">
                      <span>{ag.role}</span>
                    </div>

                    <p className="agent-motto">"{ag.motto}"</p>
                    <p className="agent-desc">{ag.description}</p>

                    <div className="agent-meta-grid">
                      <div className="agent-meta-item">
                        <span className="agent-meta-label">{t.agentThinking}</span>
                        <span className="agent-meta-val">{ag.thinking}</span>
                      </div>
                      <div className="agent-meta-item">
                        <span className="agent-meta-label">{t.agentPrimaryModel}</span>
                        <span className="agent-meta-val">{ag.model}</span>
                      </div>
                    </div>

                    <div className="agent-tools-container">
                      <span className="agent-tools-label">{t.agentAuthorizedTools}:</span>
                      <div className="agent-tools-pills">
                        {ag.tools.map((tl) => (
                          <code key={tl} className="tool-pill">
                            {tl}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* SPECIAL COMMANDS & MODES SECTION                                  */}
            {/* ----------------------------------------------------------------- */}
            <section className="commands-section" id="commands" aria-labelledby="commands-title">
              <p className="eyebrow">{t.commandsEyebrow}</p>
              <h2 id="commands-title">{t.commandsHeading}</h2>
              <p className="section-lede">{t.commandsLede}</p>

              <div className="commands-grid">
                {t.specialCommandsList.map((cmd) => (
                  <div key={cmd.name} className="command-card glass-card">
                    <div className="command-header">
                      <code className="command-name">{cmd.name}</code>
                      <span className={`command-badge ${cmd.badgeClass}`}>{cmd.tag}</span>
                    </div>
                    <div className="command-palette-info">
                      <span className="palette-dot" />
                      <span className="palette-label">{cmd.colors}</span>
                    </div>
                    <p className="command-desc">{cmd.description}</p>
                    <div className="command-example">
                      <span className="example-prompt">Ex:</span>
                      <code>{cmd.usage}</code>
                      <button
                        type="button"
                        className="btn-cmd-copy"
                        onClick={() => copy(`cmd-${cmd.name}`, cmd.usage)}
                        aria-label={`${t.copyLabel}: ${cmd.usage}`}
                      >
                        {noticeId === `cmd-${cmd.name}` ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* FULL INSTALL SECTION                                              */}
            {/* ----------------------------------------------------------------- */}
            <section className="install" id="install" aria-labelledby="install-title">
              <h2 id="install-title">{t.installHeading}</h2>
              <p className="section-lede">{t.installLede}</p>

              <div className="terminal glass-card">
                <div className="terminal-bar" aria-hidden="true">
                  <div className="terminal-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="terminal-title">ohms // terminal bootstrap</span>
                  <span className="terminal-spec">v0.0.20</span>
                </div>

                <div className="terminal-body">
                  <div className="tabs" role="tablist" aria-label={t.osTabLabel}>
                    {(["win", "mac"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={os === key}
                        onClick={() => setOs(key)}
                        className={os === key ? "tab is-active" : "tab"}
                      >
                        {key === "win" ? t.osWindows : t.osMacos}
                      </button>
                    ))}
                  </div>

                  <div className="methods" role="group" aria-label={t.methodLabel}>
                    {(["quick", "verified"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={method === key}
                        onClick={() => setMethod(key)}
                        className={method === key ? "method is-active" : "method"}
                      >
                        {key === "quick" ? t.methodQuick : t.methodVerified}
                      </button>
                    ))}
                  </div>

                  <p className="method-note">
                    {method === "verified" ? t.verifiedNote : t.quickNote}
                  </p>

                  <div aria-label={t.commandRegionLabel} className="cmd-container">
                    {steps.map((cmd, i) => {
                      const id = `${os}-${method}-${i}`;
                      const isCopied = noticeId === id;
                      return (
                        <div key={id} className="cmd-block">
                          {steps.length > 1 && (
                            <div className="cmd-step" aria-hidden="true">
                              {t.stepLabel} {i + 1}
                            </div>
                          )}
                          <div className="cmd-row">
                            <span className="prompt-indicator" aria-hidden="true">
                              {os === "win" ? "PS >" : "$"}
                            </span>
                            <pre className="cmd">
                              <code>{cmd}</code>
                            </pre>
                            <div className="cmd-actions">
                              <button
                                type="button"
                                className={isCopied ? "btn-copy is-copied" : "btn-copy"}
                                onClick={() => copy(id, cmd)}
                                aria-label={`${t.copyLabel} ${t.stepLabel.toLowerCase()} ${i + 1}`}
                              >
                                {isCopied ? (
                                  <>
                                    <CheckIcon />
                                    <span className="btn-copy-text">{t.copiedMessage}</span>
                                  </>
                                ) : (
                                  <>
                                    <CopyIcon />
                                    <span className="btn-copy-text">{t.copyLabel}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="preset-note">{t.presetNote}</p>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* MODEL PROVIDERS SECTION                                           */}
            {/* ----------------------------------------------------------------- */}
            <section className="providers" aria-labelledby="providers-eyebrow">
              <p className="eyebrow" id="providers-eyebrow">
                {t.providersEyebrow}
              </p>
              <div className="providers-grid">
                <ul className="provider-list">
                  <li className="glass-card provider-card">
                    <span className="provider-name">{t.providerOpenCodeGo}</span>
                    <span className="provider-tag">Primary</span>
                  </li>
                  <li className="glass-card provider-card">
                    <span className="provider-name">{t.providerOpenAiCodex}</span>
                    <span className="provider-tag">Fast</span>
                  </li>
                  <li className="glass-card provider-card">
                    <span className="provider-name">{t.providerCommandCode}</span>
                    <span className="provider-tag">Catalog</span>
                  </li>
                </ul>
              </div>
              <p className="providers-note">{t.providersNote}</p>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* FEATURES SECTION                                                  */}
            {/* ----------------------------------------------------------------- */}
            <section className="features" id="features" aria-labelledby="features-title">
              <p className="eyebrow">{t.featuresEyebrow}</p>
              <h2 id="features-title">{t.featuresHeading}</h2>
              <p className="section-lede">{t.featuresLede}</p>

              <div className="features-grid">
                <div className="rail" role="tablist" aria-label={t.featuresHeading}>
                  {t.featuresList.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      id={`feature-tab-${f.id}`}
                      aria-controls={`feature-panel-${f.id}`}
                      aria-selected={feature === i}
                      onClick={() => setFeature(i)}
                      className={feature === i ? "rail-item is-selected" : "rail-item"}
                    >
                      <span className="rail-index">0{i + 1}</span>
                      <span className="rail-title">{f.title}</span>
                    </button>
                  ))}
                </div>

                <div
                  className="feature-detail glass-card"
                  role="tabpanel"
                  id={`feature-panel-${activeFeature.id}`}
                  aria-labelledby={`feature-tab-${activeFeature.id}`}
                >
                  <div className="feature-prism-glow" aria-hidden="true" />
                  <span className="feature-kicker">FEATURE SPECTRUM // 0{feature + 1}</span>
                  <h3>{activeFeature.title}</h3>
                  <p>{activeFeature.body}</p>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* WHY OHMYSHARK SECTION                                             */}
            {/* ----------------------------------------------------------------- */}
            <section className="changes" id="changes" aria-labelledby="changes-title">
              <p className="eyebrow">{t.changesEyebrow}</p>
              <h2 id="changes-title">{t.changesHeading}</h2>
              <p className="section-lede">{t.changesLede}</p>

              <div className="delta-grid">
                {t.changesList.map((item, idx) => (
                  <div key={idx} className="delta glass-card">
                    <span className="delta-index">PRISM-DELTA // 0{idx + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ----------------------------------------------------------------- */}
            {/* LINEAGE SECTION                                                   */}
            {/* ----------------------------------------------------------------- */}
            <section className="lineage" id="lineage" aria-labelledby="lineage-title">
              <p className="eyebrow">{t.lineageEyebrow}</p>
              <h2 id="lineage-title">{t.lineageHeading}</h2>
              <div className="lineage-box glass-card">
                <p className="lineage-chain">{t.lineageChain}</p>
                <p className="lineage-meta">
                  <span>{t.lineageLicense}</span> • <span>{t.lineageDisclaimer}</span>
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* ----------------------------------------------------------------- */}
        {/* SITE FOOTER                                                       */}
        {/* ----------------------------------------------------------------- */}
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div className="footer-brand">
              <div className="brand">
                <SharkMark />
                <span className="wordmark">{t.wordmark}</span>
              </div>
              <p className="footer-tagline">{t.footerTagline}</p>
            </div>

            <div className="socials" aria-label={t.socialLabel}>
              {SOCIALS.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t[s.key]}
                  className="social-btn glass-card"
                >
                  <BrandIcon path={s.icon.path} />
                </a>
              ))}
            </div>

            <div className="footer-meta">
              <a href="/NOTICES.txt" target="_blank" rel="noopener noreferrer">
                {t.footerLicenses}
              </a>
              <span className="dot-sep" aria-hidden="true">•</span>
              <a
                href="https://github.com/LucasEntweihen/oh-my-shark/releases/tag/omsk-v0.0.20"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.footerRelease}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
