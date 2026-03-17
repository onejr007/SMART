type ServiceKey = string | symbol;

class ServiceContainer {
    private services: Map<ServiceKey, any> = new Map();
    private static instance: ServiceContainer;

    private constructor() {}

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }

    public register(key: ServiceKey, service: any) {
        if (this.services.has(key)) {
            console.warn(`Service ${String(key)} is already registered. Overwriting...`);
        }
        this.services.set(key, service);
    }

    public get<T>(key: ServiceKey): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service ${String(key)} not found in ServiceContainer`);
        }
        return service as T;
    }

    public has(key: ServiceKey): boolean {
        return this.services.has(key);
    }

    public unregister(key: ServiceKey) {
        this.services.delete(key);
    }
}

export const container = ServiceContainer.getInstance();
