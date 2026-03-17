import { eventBus } from './EventBus';
import { SceneManager } from './SceneManager';
import { container } from './ServiceContainer';
// import msgpack from 'msgpack5'; // Not needed for standalone Firebase

// const msg = msgpack(); // Not needed for standalone Firebase

export interface EntityState {
    id: string;
    position: { x: number, y: number, z: number };
    quaternion: { x: number, y: number, z: number, w: number };
}

export class NetworkManager {
    private socket: WebSocket | null = null;
    private isConnected: boolean = false;
    private sceneManager: SceneManager;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
    }

    public connect(url: string) {
        if (this.socket) return;

        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
            this.isConnected = true;
            eventBus.emit('network:connected');
        };

        this.socket.onmessage = (event) => {
            let data;
            if (event.data instanceof Blob) {
                // Binary data - parse as JSON for now (msgpack removed)
                event.data.text().then(text => {
                    data = JSON.parse(text);
                    this.handleMessage(data);
                });
            } else {
                data = JSON.parse(event.data);
                this.handleMessage(data);
            }
        };

        this.socket.onclose = () => {
            this.isConnected = false;
            eventBus.emit('network:disconnected');
            this.socket = null;
        };

        this.socket.onerror = (error) => {
            eventBus.emit('network:error', { error });
        };
    }

    private handleMessage(data: any) {
        switch (data.type) {
            case 'entity:sync':
                this.syncEntities(data.payload as EntityState[]);
                break;
            case 'chat:message':
                eventBus.emit('chat:received', data.payload);
                break;
            default:
                eventBus.emit('network:message', data);
        }
    }

    private syncEntities(states: EntityState[]) {
        states.forEach(state => {
            const entity = this.sceneManager.getEntity(state.id);
            if (entity) {
                // Smooth interpolation could be added here (Client-Side Prediction / Interpolation)
                entity.body.position.set(state.position.x, state.position.y, state.position.z);
                entity.body.quaternion.set(
                    state.quaternion.x, 
                    state.quaternion.y, 
                    state.quaternion.z, 
                    state.quaternion.w
                );
            }
        });
    }

    public send(type: string, payload: any, useBinary: boolean = false) {
        if (!this.isConnected || !this.socket) return;
        
        const message = { type, payload };
        
        // Always use JSON for standalone Firebase (msgpack removed)
        this.socket.send(JSON.stringify(message));
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
