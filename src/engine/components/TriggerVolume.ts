import * as CANNON from 'cannon-es';
import { Component } from '../Component';
import { eventBus } from '../EventBus';
import { Entity } from '../Entity';

export class TriggerVolume extends Component {
    private onEnterCallback?: (other: Entity) => void;
    private onExitCallback?: (other: Entity) => void;
    private currentIntersections: Set<Entity> = new Set();
    private onCollide: ((event: any) => void) | null = null;

    constructor(onEnter?: (other: Entity) => void, onExit?: (other: Entity) => void) {
        super('TriggerVolume');
        this.onEnterCallback = onEnter;
        this.onExitCallback = onExit;
    }

    public onAttach(): void {
        (this.entity.body as any).isTrigger = true;
        this.entity.body.collisionResponse = false;
        
        this.onCollide = (event: any) => {
            const otherBody = event.body as CANNON.Body;
            const otherEntity = (otherBody as any).entityRef as Entity;
            
            if (otherEntity && !this.currentIntersections.has(otherEntity)) {
                this.currentIntersections.add(otherEntity);
                this.handleEnter(otherEntity);
            }
        };
        this.entity.body.addEventListener('collide', this.onCollide);
    }
    
    public onDetach(): void {
        if (this.onCollide) {
            this.entity.body.removeEventListener('collide', this.onCollide as any);
            this.onCollide = null;
        }
        this.currentIntersections.clear();
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
