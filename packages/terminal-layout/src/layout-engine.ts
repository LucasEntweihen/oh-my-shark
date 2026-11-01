export type PanelId = "workspace" | "execution" | "intelligence" | "prompt";

export type LayoutPreset = "command-center" | "developer" | "research" | "agent-control" | "minimal";

export interface PanelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface ComputedLayout {
  preset: LayoutPreset;
  compactMode: boolean;
  totalColumns: number;
  totalRows: number;
  panels: Record<PanelId, PanelBounds>;
}

export class TerminalLayoutEngine {
  private currentPreset: LayoutPreset = "command-center";
  private panelVisibility: Record<PanelId, boolean> = {
    workspace: true,
    execution: true,
    intelligence: true,
    prompt: true,
  };

  public setPreset(preset: LayoutPreset): void {
    this.currentPreset = preset;
  }

  public getPreset(): LayoutPreset {
    return this.currentPreset;
  }

  public setPanelVisibility(panel: PanelId, visible: boolean): void {
    this.panelVisibility[panel] = visible;
  }

  public calculateLayout(columns: number, rows: number): ComputedLayout {
    const compactMode = columns < 80;
    const promptHeight = 3;
    const mainHeight = Math.max(1, rows - promptHeight);

    const panels: Record<PanelId, PanelBounds> = {
      workspace: { x: 0, y: 0, width: 0, height: 0, visible: false },
      execution: { x: 0, y: 0, width: 0, height: 0, visible: false },
      intelligence: { x: 0, y: 0, width: 0, height: 0, visible: false },
      prompt: {
        x: 0,
        y: mainHeight,
        width: columns,
        height: promptHeight,
        visible: this.panelVisibility.prompt,
      },
    };

    if (compactMode) {
      // In narrow terminals, execution occupies 100% width
      panels.execution = {
        x: 0,
        y: 0,
        width: columns,
        height: mainHeight,
        visible: true,
      };
      return {
        preset: this.currentPreset,
        compactMode: true,
        totalColumns: columns,
        totalRows: rows,
        panels,
      };
    }

    // Wide terminal layout depending on preset
    switch (this.currentPreset) {
      case "minimal": {
        panels.execution = {
          x: 0,
          y: 0,
          width: columns,
          height: mainHeight,
          visible: true,
        };
        break;
      }
      case "developer": {
        const wsWidth = Math.floor(columns * 0.25);
        const execWidth = columns - wsWidth;
        panels.workspace = {
          x: 0,
          y: 0,
          width: wsWidth,
          height: mainHeight,
          visible: this.panelVisibility.workspace,
        };
        panels.execution = {
          x: wsWidth,
          y: 0,
          width: execWidth,
          height: mainHeight,
          visible: this.panelVisibility.execution,
        };
        break;
      }
      case "research": {
        const wsWidth = Math.floor(columns * 0.2);
        const intelWidth = Math.floor(columns * 0.4);
        const execWidth = columns - wsWidth - intelWidth;
        panels.workspace = {
          x: 0,
          y: 0,
          width: wsWidth,
          height: mainHeight,
          visible: this.panelVisibility.workspace,
        };
        panels.execution = {
          x: wsWidth,
          y: 0,
          width: execWidth,
          height: mainHeight,
          visible: this.panelVisibility.execution,
        };
        panels.intelligence = {
          x: wsWidth + execWidth,
          y: 0,
          width: intelWidth,
          height: mainHeight,
          visible: this.panelVisibility.intelligence,
        };
        break;
      }
      case "command-center":
      case "agent-control":
      default: {
        const wsWidth = Math.floor(columns * 0.2);
        const intelWidth = Math.floor(columns * 0.28);
        const execWidth = columns - wsWidth - intelWidth;
        panels.workspace = {
          x: 0,
          y: 0,
          width: wsWidth,
          height: mainHeight,
          visible: this.panelVisibility.workspace,
        };
        panels.execution = {
          x: wsWidth,
          y: 0,
          width: execWidth,
          height: mainHeight,
          visible: this.panelVisibility.execution,
        };
        panels.intelligence = {
          x: wsWidth + execWidth,
          y: 0,
          width: intelWidth,
          height: mainHeight,
          visible: this.panelVisibility.intelligence,
        };
        break;
      }
    }

    return {
      preset: this.currentPreset,
      compactMode: false,
      totalColumns: columns,
      totalRows: rows,
      panels,
    };
  }
}
