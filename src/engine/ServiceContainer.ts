/**
 * Enhanced Service Container (Rekomendasi #9)
 * Token bertipe (symbol) + lifecycle (singleton/scoped)
 */

type ServiceKey = string | symbol;

export enum ServiceLifecycle {
  SINGLETON = 'singleton',
  SCOPED = 'scoped',
  TRANSIENT = 'transient',
}

interface ServiceDescriptor {
  instance?: any;
  factory?: () => any;
  lifecycle: ServiceLifecycle;
}

class ServiceContainer {
    private services: Map<ServiceKey, ServiceDescriptor> = new Map();
    private warnedKeys: Set<ServiceKey> = new Set();
    private static instance: ServiceContainer;

    private constructor() {}

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }

    public register(
        key: ServiceKey,
        service: any,
        lifecycle: ServiceLifecycle = ServiceLifecycle.SINGLETON
    ) {
        if (this.services.has(key)) {
            const existing = this.services.get(key);
            if (existing?.instance === service) {
                return;
            }
            if (!this.warnedKeys.has(key)) {
                console.warn(`Service ${String(key)} is already registered. Overwriting...`);
                this.warnedKeys.add(key);
            }
        }
        
        this.services.set(key, {
            instance: service,
            lifecycle,
        });
    }
    
    public registerFactory(
        key: ServiceKey,
        factory: () => any,
        lifecycle: ServiceLifecycle = ServiceLifecycle.TRANSIENT
    ) {
        if (this.services.has(key)) {
            if (!this.warnedKeys.has(key)) {
                console.warn(`Service ${String(key)} is already registered. Overwriting...`);
                this.warnedKeys.add(key);
            }
        }
        
        this.services.set(key, {
            factory,
            lifecycle,
        });
    }

    public get<T>(key: ServiceKey): T {
        const descriptor = this.services.get(key);
        
        if (!descriptor) {
            throw new Error(`Service ${String(key)} not found in ServiceContainer`);
        }
        
        // If it's a direct instance, return it
        if (descriptor.instance) {
            return descriptor.instance as T;
        }
        
        // If it's a factory
        if (descriptor.factory) {
            switch (descriptor.lifecycle) {
                case ServiceLifecycle.SINGLETON:
                    // Create once and cache
                    if (!descriptor.instance) {
                        descriptor.instance = descriptor.factory();
                    }
                    return descriptor.instance as T;
                    
                case ServiceLifecycle.TRANSIENT:
                    // Always create new
                    return descriptor.factory() as T;
                    
                case ServiceLifecycle.SCOPED:
                    // For now, treat as singleton (would need scope context)
                    if (!descriptor.instance) {
                        descriptor.instance = descriptor.factory();
                    }
                    return descriptor.instance as T;
            }
        }
        
        throw new Error(`Service ${String(key)} has no instance or factory`);
    }

    public has(key: ServiceKey): boolean {
        return this.services.has(key);
    }

    public unregister(key: ServiceKey) {
        this.services.delete(key);
    }
    
    public clear() {
        this.services.clear();
        this.warnedKeys.clear();
    }
    
    public getAllKeys(): ServiceKey[] {
        return Array.from(this.services.keys());
    }
}

// Typed service tokens (symbols)
export const ServiceTokens = {
    Renderer: Symbol('Renderer'),
    Scene: Symbol('Scene'),
    Camera: Symbol('Camera'),
    Physics: Symbol('Physics'),
    SceneManager: Symbol('SceneManager'),
    NetworkManager: Symbol('NetworkManager'),
    PluginSystem: Symbol('PluginSystem'),
    Leaderboards: Symbol('Leaderboards'),
    Persistence: Symbol('Persistence'),
    Engine: Symbol('Engine'),
};

export const container = ServiceContainer.getInstance();
