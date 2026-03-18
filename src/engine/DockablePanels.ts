/**
 * DockablePanels.ts
 * P0 Editor #2 - Dockable panel system
 * Explorer/Properties/Toolbox bisa dock/resize dan simpan layout
 */

export type PanelPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'floating';
export type PanelState = 'docked' | 'floating' | 'minimized' | 'maximized';

export interface PanelConfig {
  id: string;
  title: string;
  position: PanelPosition;
  state: PanelState;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  resizable: boolean;
  closable: boolean;
}

export interface LayoutPreset {
  name: string;
  panels: PanelConfig[];
  timestamp: number;
}

export class DockablePanelsManager {
  private panels: Map<string, PanelConfig> = new Map();
  private layouts: Map<string, LayoutPreset> = new Map();
  private currentLayout: string = 'default';
  private onPanelChange?: (panelId: string, config: PanelConfig) => void;
  private onLayoutChange?: (layoutName: string) => void;

  constructor() {
    this.initializeDefaultLayout();
  }

  private initializeDefaultLayout(): void {
    const defaultPanels: PanelConfig[] = [
      {
        id: 'explorer',
        title: 'Explorer',
        position: 'left',
        state: 'docked',
        width: 250,
        minWidth: 200,
        resizable: true,
        closable: true
      },
      {
        id: 'viewport',
        title: 'Viewport',
        position: 'center',
        state: 'docked',
        resizable: false,
        closable: false
      },
      {
        id: 'properties',
        title: 'Properties',
        position: 'right',
        state: 'docked',
        width: 300,
        minWidth: 250,
        resizable: true,
        closable: true
      },
      {
        id: 'console',
        title: 'Console',
        position: 'bottom',
        state: 'docked',
        height: 150,
        minHeight: 100,
        resizable: true,
        closable: true
      }
    ];

    for (const panel of defaultPanels) {
      this.panels.set(panel.id, panel);
    }

    this.saveLayout('default');
  }

  public registerPanel(config: PanelConfig): void {
    this.panels.set(config.id, config);
    this.notifyPanelChange(config.id, config);
  }

  public unregisterPanel(panelId: string): void {
    this.panels.delete(panelId);
  }

  public updatePanel(panelId: string, updates: Partial<PanelConfig>): void {
    const panel = this.panels.get(panelId);
    if (!panel) {
      console.error(`Panel ${panelId} not found`);
      return;
    }

    Object.assign(panel, updates);
    this.notifyPanelChange(panelId, panel);
  }

  public dockPanel(panelId: string, position: PanelPosition): void {
    this.updatePanel(panelId, { position, state: 'docked' });
  }

  public floatPanel(panelId: string, x: number, y: number): void {
    this.updatePanel(panelId, { state: 'floating', x, y });
  }

  public minimizePanel(panelId: string): void {
    this.updatePanel(panelId, { state: 'minimized' });
  }

  public maximizePanel(panelId: string): void {
    this.updatePanel(panelId, { state: 'maximized' });
  }

  public resizePanel(panelId: string, width?: number, height?: number): void {
    const panel = this.panels.get(panelId);
    if (!panel || !panel.resizable) return;

    const updates: Partial<PanelConfig> = {};
    
    if (width !== undefined && width >= (panel.minWidth || 0)) {
      updates.width = width;
    }
    
    if (height !== undefined && height >= (panel.minHeight || 0)) {
      updates.height = height;
    }

    this.updatePanel(panelId, updates);
  }

  public saveLayout(name: string): void {
    const layout: LayoutPreset = {
      name,
      panels: Array.from(this.panels.values()).map(p => ({ ...p })),
      timestamp: Date.now()
    };

    this.layouts.set(name, layout);
    console.log(`Layout "${name}" saved`);
  }

  public loadLayout(name: string): boolean {
    const layout = this.layouts.get(name);
    if (!layout) {
      console.error(`Layout "${name}" not found`);
      return false;
    }

    this.panels.clear();
    for (const panel of layout.panels) {
      this.panels.set(panel.id, { ...panel });
    }

    this.currentLayout = name;
    this.notifyLayoutChange(name);
    console.log(`Layout "${name}" loaded`);
    
    return true;
  }

  public deleteLayout(name: string): boolean {
    if (name === 'default') {
      console.error('Cannot delete default layout');
      return false;
    }

    return this.layouts.delete(name);
  }

  public getPanel(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId);
  }

  public getAllPanels(): PanelConfig[] {
    return Array.from(this.panels.values());
  }

  public getLayouts(): LayoutPreset[] {
    return Array.from(this.layouts.values());
  }

  public getCurrentLayout(): string {
    return this.currentLayout;
  }

  public setOnPanelChange(callback: (panelId: string, config: PanelConfig) => void): void {
    this.onPanelChange = callback;
  }

  public setOnLayoutChange(callback: (layoutName: string) => void): void {
    this.onLayoutChange = callback;
  }

  private notifyPanelChange(panelId: string, config: PanelConfig): void {
    if (this.onPanelChange) {
      this.onPanelChange(panelId, config);
    }
  }

  private notifyLayoutChange(layoutName: string): void {
    if (this.onLayoutChange) {
      this.onLayoutChange(layoutName);
    }
  }

  public exportLayout(): string {
    const layout = this.layouts.get(this.currentLayout);
    return JSON.stringify(layout, null, 2);
  }

  public importLayout(layoutJson: string): boolean {
    try {
      const layout: LayoutPreset = JSON.parse(layoutJson);
      this.layouts.set(layout.name, layout);
      return true;
    } catch (error) {
      console.error('Failed to import layout:', error);
      return false;
    }
  }

  public dispose(): void {
    this.panels.clear();
    this.layouts.clear();
  }
}
