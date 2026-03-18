/**
 * KeyboardShortcuts.ts
 * Keyboard Shortcuts Enhancement (Quick Win #1)
 * Customizable shortcuts untuk editor
 */

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private enabled: boolean = true;
  private customBindings: Map<string, string> = new Map();

  constructor() {
    this.loadCustomBindings();
    this.setupDefaultShortcuts();
  }

  private setupDefaultShortcuts(): void {
    // Editor shortcuts
    this.register({
      key: 's',
      ctrl: true,
      action: () => console.log('Save'),
      description: 'Save scene',
      category: 'Editor'
    });

    this.register({
      key: 'z',
      ctrl: true,
      action: () => console.log('Undo'),
      description: 'Undo',
      category: 'Editor'
    });

    this.register({
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => console.log('Redo'),
      description: 'Redo',
      category: 'Editor'
    });

    this.register({
      key: 'd',
      ctrl: true,
      action: () => console.log('Duplicate'),
      description: 'Duplicate selected',
      category: 'Editor'
    });

    this.register({
      key: 'Delete',
      action: () => console.log('Delete'),
      description: 'Delete selected',
      category: 'Editor'
    });

    // Transform shortcuts
    this.register({
      key: 'w',
      action: () => console.log('Move mode'),
      description: 'Move tool',
      category: 'Transform'
    });

    this.register({
      key: 'e',
      action: () => console.log('Rotate mode'),
      description: 'Rotate tool',
      category: 'Transform'
    });

    this.register({
      key: 'r',
      action: () => console.log('Scale mode'),
      description: 'Scale tool',
      category: 'Transform'
    });

    // View shortcuts
    this.register({
      key: 'f',
      action: () => console.log('Focus'),
      description: 'Focus on selected',
      category: 'View'
    });

    this.register({
      key: 'g',
      action: () => console.log('Toggle grid'),
      description: 'Toggle grid',
      category: 'View'
    });
  }

  public register(config: ShortcutConfig): void {
    const key = this.getShortcutKey(config);
    this.shortcuts.set(key, config);
  }

  public unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  private getShortcutKey(config: ShortcutConfig): string {
    const parts: string[] = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    parts.push(config.key);
    return parts.join('+');
  }

  public handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    const key = this.getKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      return true;
    }

    return false;
  }

  private getKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    parts.push(event.key);
    return parts.join('+');
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  public getShortcutsByCategory(category: string): ShortcutConfig[] {
    return Array.from(this.shortcuts.values()).filter(
      s => s.category === category
    );
  }

  public rebind(oldKey: string, newKey: string): boolean {
    const shortcut = this.shortcuts.get(oldKey);
    if (!shortcut) return false;

    this.shortcuts.delete(oldKey);
    this.shortcuts.set(newKey, shortcut);
    this.customBindings.set(oldKey, newKey);
    this.saveCustomBindings();
    return true;
  }

  private loadCustomBindings(): void {
    try {
      const saved = localStorage.getItem('keyboardShortcuts');
      if (saved) {
        const bindings = JSON.parse(saved);
        this.customBindings = new Map(Object.entries(bindings));
      }
    } catch (error) {
      console.error('Failed to load custom bindings:', error);
    }
  }

  private saveCustomBindings(): void {
    try {
      const bindings = Object.fromEntries(this.customBindings);
      localStorage.setItem('keyboardShortcuts', JSON.stringify(bindings));
    } catch (error) {
      console.error('Failed to save custom bindings:', error);
    }
  }

  public resetToDefaults(): void {
    this.customBindings.clear();
    this.saveCustomBindings();
    this.shortcuts.clear();
    this.setupDefaultShortcuts();
  }
}
