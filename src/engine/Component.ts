/**
 * Enhanced Component (Rekomendasi #10)
 * Urutan update ECS (preUpdate/update/postUpdate) + enable/disable
 */

import { Entity } from './Entity';

export abstract class Component {
    public entity!: Entity;
    public name: string;
    public enabled: boolean = true;

    constructor(name: string) {
        this.name = name;
    }

    public preUpdate?(delta: number): void;
    public abstract update(delta: number): void;
    public postUpdate?(delta: number): void;

    // Lifecycle hooks
    public onAttach?(): void;
    public onDetach?(): void;
    
    public enable(): void {
        this.enabled = true;
    }
    
    public disable(): void {
        this.enabled = false;
    }
}
