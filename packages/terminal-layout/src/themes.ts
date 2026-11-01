export type ThemeName =
  | "shark-ocean"
  | "deep-abyss"
  | "arctic"
  | "amber-terminal"
  | "retro-green"
  | "high-contrast";

export type ColorKey =
  | "background"
  | "foreground"
  | "primary"
  | "secondary"
  | "accent"
  | "border"
  | "error"
  | "success";

export type ColorDepth = "truecolor" | "256" | "16";

export interface ThemePalette {
  name: ThemeName;
  truecolor: Record<ColorKey, string>;
  ansi256: Record<ColorKey, number>;
  ansi16: Record<ColorKey, number>;
}

export const BUILTIN_THEMES: Record<ThemeName, ThemePalette> = {
  "shark-ocean": {
    name: "shark-ocean",
    truecolor: {
      background: "#08101e",
      foreground: "#e2e8f0",
      primary: "#00e5ff",
      secondary: "#0284c7",
      accent: "#38bdf8",
      border: "#1e293b",
      error: "#ef4444",
      success: "#10b981",
    },
    ansi256: {
      background: 234,
      foreground: 254,
      primary: 45,
      secondary: 31,
      accent: 75,
      border: 238,
      error: 196,
      success: 46,
    },
    ansi16: {
      background: 0,
      foreground: 7,
      primary: 6,
      secondary: 4,
      accent: 6,
      border: 8,
      error: 1,
      success: 2,
    },
  },
  "deep-abyss": {
    name: "deep-abyss",
    truecolor: {
      background: "#030712",
      foreground: "#f9fafb",
      primary: "#6366f1",
      secondary: "#4338ca",
      accent: "#a855f7",
      border: "#111827",
      error: "#f43f5e",
      success: "#14b8a6",
    },
    ansi256: {
      background: 232,
      foreground: 255,
      primary: 63,
      secondary: 55,
      accent: 135,
      border: 235,
      error: 161,
      success: 36,
    },
    ansi16: {
      background: 0,
      foreground: 7,
      primary: 5,
      secondary: 4,
      accent: 5,
      border: 8,
      error: 1,
      success: 2,
    },
  },
  arctic: {
    name: "arctic",
    truecolor: {
      background: "#0f172a",
      foreground: "#f8fafc",
      primary: "#e0f2fe",
      secondary: "#7dd3fc",
      accent: "#bae6fd",
      border: "#334155",
      error: "#f87171",
      success: "#34d399",
    },
    ansi256: {
      background: 235,
      foreground: 231,
      primary: 195,
      secondary: 117,
      accent: 153,
      border: 240,
      error: 203,
      success: 78,
    },
    ansi16: {
      background: 0,
      foreground: 7,
      primary: 7,
      secondary: 6,
      accent: 7,
      border: 8,
      error: 1,
      success: 2,
    },
  },
  "amber-terminal": {
    name: "amber-terminal",
    truecolor: {
      background: "#181204",
      foreground: "#fbbf24",
      primary: "#f59e0b",
      secondary: "#d97706",
      accent: "#fde68a",
      border: "#78350f",
      error: "#dc2626",
      success: "#84cc16",
    },
    ansi256: {
      background: 233,
      foreground: 214,
      primary: 214,
      secondary: 172,
      accent: 222,
      border: 94,
      error: 160,
      success: 106,
    },
    ansi16: {
      background: 0,
      foreground: 3,
      primary: 3,
      secondary: 3,
      accent: 7,
      border: 3,
      error: 1,
      success: 2,
    },
  },
  "retro-green": {
    name: "retro-green",
    truecolor: {
      background: "#021505",
      foreground: "#22c55e",
      primary: "#4ade80",
      secondary: "#16a34a",
      accent: "#86efac",
      border: "#14532d",
      error: "#ef4444",
      success: "#22c55e",
    },
    ansi256: {
      background: 232,
      foreground: 35,
      primary: 48,
      secondary: 28,
      accent: 120,
      border: 22,
      error: 196,
      success: 46,
    },
    ansi16: {
      background: 0,
      foreground: 2,
      primary: 2,
      secondary: 2,
      accent: 2,
      border: 8,
      error: 1,
      success: 2,
    },
  },
  "high-contrast": {
    name: "high-contrast",
    truecolor: {
      background: "#000000",
      foreground: "#ffffff",
      primary: "#ffff00",
      secondary: "#00ffff",
      accent: "#ff00ff",
      border: "#ffffff",
      error: "#ff0000",
      success: "#00ff00",
    },
    ansi256: {
      background: 16,
      foreground: 231,
      primary: 226,
      secondary: 51,
      accent: 201,
      border: 231,
      error: 196,
      success: 46,
    },
    ansi16: {
      background: 0,
      foreground: 7,
      primary: 3,
      secondary: 6,
      accent: 5,
      border: 7,
      error: 1,
      success: 2,
    },
  },
};

export class ThemeEngine {
  private activeTheme: ThemeName = "shark-ocean";
  private customThemes = new Map<string, ThemePalette>();

  public setTheme(name: ThemeName): void {
    if (!BUILTIN_THEMES[name] && !this.customThemes.has(name)) {
      throw new Error(`[ThemeEngine] Unknown theme: "${name}".`);
    }
    this.activeTheme = name;
  }

  public getTheme(): ThemeName {
    return this.activeTheme;
  }

  public registerCustomTheme(theme: ThemePalette): void {
    this.customThemes.set(theme.name, theme);
  }

  public resolveColor(key: ColorKey, depth: ColorDepth = "truecolor", themeName?: ThemeName): string {
    const targetName = themeName ?? this.activeTheme;
    const theme = BUILTIN_THEMES[targetName] ?? this.customThemes.get(targetName);
    if (!theme) return "#ffffff";

    switch (depth) {
      case "truecolor":
        return theme.truecolor[key] ?? "#ffffff";
      case "256":
        return `\x1b[38;5;${theme.ansi256[key] ?? 15}m`;
      case "16":
        return `\x1b[${30 + (theme.ansi16[key] ?? 7)}m`;
    }
  }
}
