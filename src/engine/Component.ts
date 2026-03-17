import { Entity } from './Entity';

export abstract class Component {
    public entity!: Entity;
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public abstract update(delta: number): void;

    // Lifecycle hooks
    public onAttach?(): void;
    public onDetach?(): void;
}
