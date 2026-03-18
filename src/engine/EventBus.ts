export enum EventPriority {
    LOW,
    NORMAL,
    HIGH
}

type EventCallback = (...args: any[]) => void;

interface EventCallbackOptions {
    priority: EventPriority;
    once: boolean;
}

class EventBus {
    private events: Map<string, Set<{ callback: EventCallback; options: EventCallbackOptions }>>;
    private listenerCounts: Map<string, number> = new Map();
    private maxListeners: number = 100;

    constructor() {
        this.events = new Map();
    }

    public on(event: string, callback: EventCallback, options: Partial<EventCallbackOptions> = {}) {
        const finalOptions: EventCallbackOptions = { priority: EventPriority.NORMAL, once: false, ...options };

        if (!this.events.has(event)) {
            this.events.set(event, new Set());
            this.listenerCounts.set(event, 0);
        }
        
        this.events.get(event)?.add({ callback, options: finalOptions });
        
        const count = (this.listenerCounts.get(event) || 0) + 1;
        this.listenerCounts.set(event, count);
        
        if (count > this.maxListeners) {
            console.warn(
                `Possible EventBus memory leak detected: ${count} listeners for event "${event}". ` +
                `Consider using once() or off() to clean up listeners.`
            );
        }
    }

    public once(event: string, callback: EventCallback, priority = EventPriority.NORMAL) {
        this.on(event, callback, { priority, once: true });
    }

    public off(event: string, callback: EventCallback) {
        const listeners = this.events.get(event);
        if (!listeners) return;

        let removed = false;
        for (const listener of listeners) {
            if (listener.callback === callback) {
                listeners.delete(listener);
                removed = true;
                break;
            }
        }

        if (removed) {
            const count = Math.max(0, (this.listenerCounts.get(event) || 0) - 1);
            this.listenerCounts.set(event, count);
        }
    }

    public offAll(event: string) {
        this.events.delete(event);
        this.listenerCounts.delete(event);
    }

    public emit(event: string, ...args: any[]): boolean {
        const listeners = this.events.get(event);
        if (!listeners) return true;

        const sortedListeners = [...listeners].sort((a, b) => b.options.priority - a.options.priority);

        for (const listener of sortedListeners) {
            try {
                listener.callback(...args);
                if (listener.options.once) {
                    this.off(event, listener.callback);
                }
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        }
        return true;
    }

    public clear(event?: string) {
        if (event) {
            this.events.delete(event);
            this.listenerCounts.delete(event);
        } else {
            this.events.clear();
            this.listenerCounts.clear();
        }
    }
    
    public getListenerCount(event: string): number {
        return this.listenerCounts.get(event) || 0;
    }
    
    public setMaxListeners(max: number): void {
        this.maxListeners = max;
    }
    
    public getAllEvents(): string[] {
        return Array.from(this.events.keys());
    }
}

export const eventBus = new EventBus();
