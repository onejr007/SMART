import { 
    Vector3, 
    Euler, 
    Object3D, 
    LOD, 
    BoxGeometry, 
    MeshStandardMaterial, 
    Mesh 
} from 'three';
import { 
    Body, 
    Box, 
    Vec3 
} from 'cannon-es';
import { assetManager } from './AssetManager';
import { eventBus } from './EventBus';
import { Component } from './Component';
import { uuidManager } from './UUIDManager';

export interface LODLevel {
    modelUrl: string;
    distance: number;
}

export interface EntityProps {
    position: Vector3;
    rotation?: Euler;
    color?: number;
    size?: Vector3;
    mass?: number;
    name?: string;
    modelUrl?: string; // Optional URL for single GLTF/GLB model
    lodLevels?: LODLevel[]; // Optional LOD levels
}

export class Entity {
    public uuid: string; // Stable UUID for network/save
    public mesh: Object3D; // Changed to Object3D to support complex models
    public lod?: LOD;
    public body: Body;
    public name: string;
    private isModelLoaded: boolean = false;
    private components: Map<string, Component> = new Map();
    
    constructor(props: EntityProps) {
        this.name = props.name || 'Entity';
        
        // Register UUID for stable identification
        this.uuid = uuidManager.register(this.name);
        
        // Base container for the mesh
        this.mesh = new Object3D();
        this.mesh.position.copy(props.position);
        
        if (props.rotation) {
            this.mesh.rotation.copy(props.rotation);
        }

        if (props.lodLevels && props.lodLevels.length > 0) {
            this.setupLOD(props.lodLevels, props.size);
        } else if (props.modelUrl) {
            // Load External 3D Model using AssetManager
            this.loadModel(props.modelUrl, props.size);
        } else {
            // Setup default Three.js Box Mesh
            const geometry = new BoxGeometry(props.size?.x || 1, props.size?.y || 1, props.size?.z || 1);
            const material = new MeshStandardMaterial({ color: props.color || 0xff0000 });
            const boxMesh = new Mesh(geometry, material);
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            this.mesh.add(boxMesh);
            this.isModelLoaded = true;
        }

        // Setup Physics Body
        // For simplicity, we still use a Box shape for collision even if it's a complex model
        const shape = new Box(new Vec3((props.size?.x || 1) / 2, (props.size?.y || 1) / 2, (props.size?.z || 1) / 2));
        this.body = new Body({
            mass: props.mass !== undefined ? props.mass : 1, // 0 = static, >0 = dynamic
            position: new Vec3(props.position.x, props.position.y, props.position.z),
        });
        this.body.addShape(shape);
        
        // Add reference to the entity on the physics body
        (this.body as any).entityRef = this;
    }

    private async setupLOD(levels: LODLevel[], size?: Vector3) {
        this.lod = new LOD();
        this.mesh.add(this.lod);

        for (const level of levels) {
            try {
                const model = await assetManager.loadModel(level.modelUrl);
                if (size) model.scale.set(size.x, size.y, size.z);
                this.lod.addLevel(model, level.distance);
            } catch (error) {
                console.error(`Error loading LOD level ${level.modelUrl}:`, error);
            }
        }
        this.isModelLoaded = true;
        eventBus.emit('entity:lod-loaded', { name: this.name });
    }

    public addComponent(component: Component) {
        if (this.components.has(component.name)) {
            console.warn(`Component ${component.name} already exists on entity ${this.name}`);
            return;
        }
        component.entity = this;
        this.components.set(component.name, component);
        if (component.onAttach) component.onAttach();
        return component;
    }

    public removeComponent(name: string) {
        const component = this.components.get(name);
        if (component) {
            if (component.onDetach) component.onDetach();
            this.components.delete(name);
        }
    }

    public getComponent<T extends Component>(name: string): T | undefined {
        return this.components.get(name) as T;
    }

    private async loadModel(url: string, size?: Vector3) {
        try {
            const model = await assetManager.loadModel(url);
            
            // Scale model to match size prop if provided
            if (size) {
                model.scale.set(size.x, size.y, size.z);
            }

            this.mesh.add(model);
            this.isModelLoaded = true;
            eventBus.emit('entity:loaded', { name: this.name, entity: this });
        } catch (error) {
            console.error(`Error loading model for entity ${this.name}:`, error);
        }
    }

    public update(delta: number) {
        if (!this.isModelLoaded) return;

        // Sync mesh position with physics body if dynamic
        if (this.body.mass > 0) {
            this.mesh.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
            this.mesh.quaternion.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
        }

        // Update all components
        this.components.forEach(component => component.update(delta));
    }

    // Helper for Serialization
    public toJSON() {
        return {
            uuid: this.uuid,
            name: this.name,
            position: { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z },
            rotation: { x: this.mesh.rotation.x, y: this.mesh.rotation.y, z: this.mesh.rotation.z },
            scale: { x: this.mesh.scale.x, y: this.mesh.scale.y, z: this.mesh.scale.z },
            mass: this.body.mass
        };
    }
}
