// 48. Plugin SDK dengan lifecycle hook
export interface PluginCapabilities {
  canModifyScene: boolean;
  canAccessNetwork: boolean;
  canAccessStorage: boolean;
  canRegisterComponents: boolean;
}

export interface PluginLifecycle {
  onInit?: () => void | Promise<void>;
  onStart?: () => void | Promise<void>;
  onUpdate?: (delta: number) => void;
  onStop?: () => void | Promise<void>;
  onDispose?: () => void | Promise<void>;
}

export interface Plugin extends PluginLifecycle {
  name: string;
  version: string;
  capabilities: PluginCapabilities;
}

export class PluginSDK {
  private plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }

    this.validateCapabilities(plugin.capabilities);
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    if (this.activePlugins.has(name)) {
      this.stop(name);
    }
    this.plugins.delete(name);
  }

  async init(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin "${name}" not found`);

    await plugin.onInit?.();
  }

  async start(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin "${name}" not found`);

    await plugin.onStart?.();
    this.activePlugins.add(name);
  }

  update(delta: number): void {
    for (const name of this.activePlugins) {
      const plugin = this.plugins.get(name);
      plugin?.onUpdate?.(delta);
    }
  }

  async stop(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    await plugin.onStop?.();
    this.activePlugins.delete(name);
  }

  async dispose(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (this.activePlugins.has(name)) {
      await this.stop(name);
    }

    await plugin.onDispose?.();
  }

  private validateCapabilities(capabilities: PluginCapabilities): void {
    // Implement capability validation
    if (capabilities.canAccessNetwork) {
      console.warn("Plugin requests network access");
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  isActive(name: string): boolean {
    return this.activePlugins.has(name);
  }

  loadPlugin(pluginId: string, pluginSource?: string | any): void {
    if (typeof pluginSource === "string") {
      console.error(
        `Failed to load plugin ${pluginId}: dynamic code execution is disabled. Plugins must be pre-registered or passed as instances.`,
      );
      throw new Error(
        "Dynamic plugin loading from string is disabled for security reasons.",
      );
    } else if (pluginSource) {
      const plugin = pluginSource as Plugin;
      plugin.name = pluginId;
      if (!plugin.version) plugin.version = "1.0.0";
      if (!plugin.capabilities) {
        plugin.capabilities = {
          canModifyScene: true,
          canAccessNetwork: false,
          canAccessStorage: false,
          canRegisterComponents: true,
        };
      }
      this.register(plugin);
      this.start(pluginId);
    }
  }

  unloadPlugin(pluginId: string): void {
    this.unregister(pluginId);
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.activePlugins);
  }

  callMethod(pluginId: string, method: string, ...args: any[]): any {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;

    if (typeof (plugin as any)[method] === "function") {
      return (plugin as any)[method](...args);
    }

    return null;
  }
}
