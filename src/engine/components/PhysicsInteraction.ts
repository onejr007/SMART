import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Component } from '../Component';
import { eventBus } from '../EventBus';
import { container } from '../ServiceContainer';

/**
 * Komponen untuk menangani interaksi fisik seperti mengangkat dan melempar objek.
 * Memungkinkan entitas (biasanya pemain) untuk berinteraksi dengan objek fisik lain.
 * 
 */
export class PhysicsInteraction extends Component {
    private pickedEntity: any | null = null;
    private holdDistance: number = 3;
    private throwForce: number = 15;
    private raycaster: THREE.Raycaster;
    private camera: THREE.Camera;
    private physicsWorld: CANNON.World;

    constructor(camera: THREE.Camera) {
        super('PhysicsInteraction');
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.physicsWorld = container.get<CANNON.World>('Physics');
    }

    /**
     * Mencoba mengambil objek di depan kamera.
     */
    public pickObject() {
        if (this.pickedEntity) {
            this.releaseObject();
            return;
        }

        // Raycast dari tengah layar
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const scene = container.get<THREE.Scene>('Scene');
        const intersects = this.raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let target = intersects[0].object;
            // Cari root mesh yang punya body
            while (target.parent && !(target as any).entityRef && target.parent !== scene) {
                target = target.parent;
            }

            const entity = (target as any).entityRef || (target.parent as any)?.entityRef;
            
            if (entity && entity.body && entity.body.mass > 0) {
                this.pickedEntity = entity;
                // Nonaktifkan gravitasi sementara untuk objek yang diangkat
                this.pickedEntity.body.mass = 0;
                this.pickedEntity.body.updateMassProperties();
                eventBus.emit('physics:picked', { entity: this.pickedEntity });
            }
        }
    }

    /**
     * Melepaskan objek yang sedang diangkat.
     */
    public releaseObject() {
        if (!this.pickedEntity) return;

        // Kembalikan massa (asumsi massa default = 1, bisa dikembangkan lebih lanjut)
        this.pickedEntity.body.mass = 1;
        this.pickedEntity.body.updateMassProperties();
        
        eventBus.emit('physics:released', { entity: this.pickedEntity });
        this.pickedEntity = null;
    }

    /**
     * Melempar objek yang sedang diangkat ke arah depan.
     */
    public throwObject() {
        if (!this.pickedEntity) return;

        const entity = this.pickedEntity;
        this.releaseObject();

        // Berikan impuls ke arah depan kamera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        const impulse = new CANNON.Vec3(
            direction.x * this.throwForce,
            direction.y * this.throwForce,
            direction.z * this.throwForce
        );

        entity.body.applyImpulse(impulse, entity.body.position);
        eventBus.emit('physics:thrown', { entity, force: this.throwForce });
    }

    public update(delta: number): void {
        if (this.pickedEntity) {
            // Update posisi objek agar tetap di depan kamera
            const targetPos = new THREE.Vector3(0, 0, -this.holdDistance);
            targetPos.applyQuaternion(this.camera.quaternion);
            targetPos.add(this.camera.position);

            this.pickedEntity.body.position.set(targetPos.x, targetPos.y, targetPos.z);
            this.pickedEntity.body.velocity.set(0, 0, 0);
            this.pickedEntity.body.angularVelocity.set(0, 0, 0);
        }
    }
}
