export interface PanelRenderContext {
  width: number;
  height: number;
}

export interface SharkPanelExtension {
  id: string;
  title: string;
  defaultPosition: "left" | "center" | "right" | "bottom";
  minWidth?: number;
  minHeight?: number;
  render: (context: PanelRenderContext) => string[];
}

export class PanelExtensionRegistry {
  private readonly extensions = new Map<string, SharkPanelExtension>();

  public register(extension: SharkPanelExtension): void {
    this.extensions.set(extension.id, extension);
  }

  public unregister(id: string): boolean {
    return this.extensions.delete(id);
  }

  public get(id: string): SharkPanelExtension | undefined {
    return this.extensions.get(id);
  }

  public getAll(): SharkPanelExtension[] {
    return Array.from(this.extensions.values());
  }

  public renderPanel(id: string, context: PanelRenderContext): string[] {
    const ext = this.extensions.get(id);
    if (!ext) {
      return [`[PanelExtension] Panel "${id}" not found`];
    }
    try {
      return ext.render(context);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return [`[PanelExtension] Error rendering "${id}": ${errMsg}`];
    }
  }
}
