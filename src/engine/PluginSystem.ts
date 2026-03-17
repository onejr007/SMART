import { Engine } from './Core';
import { eventBus } from './EventBus';

export interface Plugin {
    name: string;
    version: string;
    initialize: (engine: Engine) => void;
    update?: (delta: number) => void;
    dispose?: () => void;
}

export class PluginSystem {
    private plugins: Map<string, Plugin> = new Map();
    private engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    /**
     * Daftarkan dan inisialisasi plugin baru.
     */
    public registerPlugin(plugin: Plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin ${plugin.name} is already registered. Replacing...`);
            this.unregisterPlugin(plugin.name);
        }

        try {
            plugin.initialize(this.engine);
            this.plugins.set(plugin.name, plugin);
            console.log(`[PluginSystem] Plugin ${plugin.name} v${plugin.version} initialized.`);
            eventBus.emit('plugin:registered', { name: plugin.name });
        } catch (error) {
            console.error(`[PluginSystem] Error initializing plugin ${plugin.name}:`, error);
        }
    }

    /**
     * Unregister dan bersihkan plugin.
     */
    public unregisterPlugin(name: string) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            if (plugin.dispose) plugin.dispose();
            this.plugins.delete(name);
            eventBus.emit('plugin:unregistered', { name });
        }
    }

    /**
     * Jalankan update loop untuk semua plugin yang memilikinya.
     */
    public update(delta: number) {
        this.plugins.forEach(plugin => {
            if (plugin.update) plugin.update(delta);
        });
    }

    public clear() {
        this.plugins.forEach((_, name) => this.unregisterPlugin(name));
        this.plugins.clear();
    }
}
