import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Entity } from './Entity';
import { eventBus } from './EventBus';

export class SceneManager {
    private scene: THREE.Scene;
    private physicsWorld: CANNON.World;
    private entities: Map<string, Entity>;

    constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.entities = new Map();
    }

    public addEntity(entity: Entity) {
        if (this.entities.has(entity.name)) {
            console.warn(`Entity with name ${entity.name} already exists. Overwriting...`);
            this.removeEntity(entity.name);
        }

        this.entities.set(entity.name, entity);
        this.scene.add(entity.mesh);
        this.physicsWorld.addBody(entity.body);
        
        eventBus.emit('scene:entity-added', { name: entity.name, entity });
    }

    public removeEntity(name: string) {
        const entity = this.entities.get(name);
        if (entity) {
            this.scene.remove(entity.mesh);
            this.physicsWorld.removeBody(entity.body);
            this.entities.delete(name);
            eventBus.emit('scene:entity-removed', { name });
        }
    }

    public getEntity(name: string): Entity | undefined {
        return this.entities.get(name);
    }

    public update(delta: number) {
        this.entities.forEach(entity => {
            entity.update(delta);
        });
    }

    /**
     * Manual Frustum Culling Helper (Performance Recommendation #6)
     * Useful for disabling logic/updates for entities far outside view.
     */
    public getEntitiesInFrustum(camera: THREE.PerspectiveCamera): Entity[] {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);

        return this.getAllEntities().filter(entity => {
            if (!entity.mesh) return false;
            // Simple check against bounding box or position
            return frustum.containsPoint(entity.mesh.position);
        });
    }

    public clear() {
        this.entities.forEach((_, name) => this.removeEntity(name));
        this.entities.clear();
        eventBus.emit('scene:cleared');
    }

    public getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    public toJSON() {
        return this.getAllEntities().map(ent => ent.toJSON());
    }

    public serialize(): any {
        return {
            entities: this.getAllEntities().map(entity => ({
                name: entity.name,
                position: {
                    x: entity.mesh.position.x,
                    y: entity.mesh.position.y,
                    z: entity.mesh.position.z
                },
                rotation: {
                    x: entity.mesh.rotation.x,
                    y: entity.mesh.rotation.y,
                    z: entity.mesh.rotation.z
                },
                scale: {
                    x: entity.mesh.scale.x,
                    y: entity.mesh.scale.y,
                    z: entity.mesh.scale.z
                },
                mass: entity.body.mass,
                components: [] // Simplified for now
            })),
            timestamp: Date.now()
        };
    }

    public deserialize(data: any): void {
        this.clear();
        
        if (data.entities) {
            data.entities.forEach((entityData: any) => {
                const entity = new Entity({
                    position: new THREE.Vector3(entityData.position.x, entityData.position.y, entityData.position.z),
                    rotation: new THREE.Euler(entityData.rotation.x, entityData.rotation.y, entityData.rotation.z),
                    size: new THREE.Vector3(entityData.scale.x, entityData.scale.y, entityData.scale.z),
                    mass: entityData.mass,
                    name: entityData.name
                });
                
                this.addEntity(entity);
            });
        }
    }
}
