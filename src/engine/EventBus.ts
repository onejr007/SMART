type EventCallback = (...args: any[]) => void;

class EventBus {
    private events: Map<string, Set<EventCallback>>;

    constructor() {
        this.events = new Map();
    }

    public on(event: string, callback: EventCallback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)?.add(callback);
    }

    public off(event: string, callback: EventCallback) {
        this.events.get(event)?.delete(callback);
    }

    public emit(event: string, ...args: any[]) {
        this.events.get(event)?.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    public clear(event?: string) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}

export const eventBus = new EventBus();
