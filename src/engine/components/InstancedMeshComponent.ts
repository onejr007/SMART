import * as THREE from 'three';
import { Component } from '../Component';

export class InstancedMeshComponent extends Component {
    private instancedMesh: THREE.InstancedMesh | null = null;
    private count: number = 0;
    private instances: { position: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3 }[] = [];

    constructor(geometry: THREE.BufferGeometry, material: THREE.Material, maxCount: number = 100) {
        super('InstancedMeshComponent');
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Allow updates
        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
    }

    public addInstance(position: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3) {
        if (this.instancedMesh && this.count < this.instancedMesh.count) {
            const matrix = new THREE.Matrix4();
            const rot = rotation || new THREE.Euler();
            const sc = scale || new THREE.Vector3(1, 1, 1);
            
            matrix.compose(position, new THREE.Quaternion().setFromEuler(rot), sc);
            this.instancedMesh.setMatrixAt(this.count, matrix);
            this.count++;
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            
            this.instances.push({ position, rotation: rot, scale: sc });
        }
    }

    public onAttach(): void {
        if (this.instancedMesh) {
            this.entity.mesh.add(this.instancedMesh);
        }
    }

    public update(delta: number): void {
        // Logika update jika instansi bergerak atau beranimasi
    }

    public onDetach(): void {
        if (this.instancedMesh) {
            this.entity.mesh.remove(this.instancedMesh);
            this.instancedMesh.dispose();
        }
    }
}
