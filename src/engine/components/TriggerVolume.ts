import * as CANNON from 'cannon-es';
import { Component } from '../Component';
import { eventBus } from '../EventBus';
import { Entity } from '../Entity';

export class TriggerVolume extends Component {
    private onEnterCallback?: (other: Entity) => void;
    private onExitCallback?: (other: Entity) => void;
    private currentIntersections: Set<Entity> = new Set();

    constructor(onEnter?: (other: Entity) => void, onExit?: (other: Entity) => void) {
        super('TriggerVolume');
        this.onEnterCallback = onEnter;
        this.onExitCallback = onExit;
    }

    public onAttach(): void {
        // Set physics body to trigger mode
        this.entity.body.isTrigger = true;
        
        // Listen for collisions from the physics world
        // Cannon-es uses 'collide' event
        this.entity.body.addEventListener('collide', (event: any) => {
            const otherBody = event.body as CANNON.Body;
            const otherEntity = (otherBody as any).entityRef as Entity;
            
            if (otherEntity && !this.currentIntersections.has(otherEntity)) {
                this.currentIntersections.add(otherEntity);
                this.handleEnter(otherEntity);
            }
        });
    }

    private handleEnter(other: Entity) {
        if (this.onEnterCallback) this.onEnterCallback(other);
        eventBus.emit('trigger:enter', { trigger: this.entity, other });
    }

    private handleExit(other: Entity) {
        if (this.onExitCallback) this.onExitCallback(other);
        eventBus.emit('trigger:exit', { trigger: this.entity, other });
    }

    public update(delta: number): void {
        // Simple cleanup: check if intersecting entities are still close
        // (Cannon-es triggers can be tricky with 'exit' events)
        this.currentIntersections.forEach(other => {
            const dist = this.entity.mesh.position.distanceTo(other.mesh.position);
            // Rough distance check based on size (could be improved)
            if (dist > 5) { // Threshold
                this.currentIntersections.delete(other);
                this.handleExit(other);
            }
        });
    }
}
