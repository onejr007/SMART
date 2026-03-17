import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Component } from '../Component';

export class AIController extends Component {
    private targetPosition: THREE.Vector3 | null = null;
    private moveSpeed: number = 2.0;
    private rotationSpeed: number = 5.0;

    constructor(speed: number = 2.0) {
        super('AIController');
        this.moveSpeed = speed;
    }

    public setTarget(pos: THREE.Vector3) {
        this.targetPosition = pos;
    }

    public update(delta: number): void {
        if (!this.targetPosition) return;

        const currentPos = new THREE.Vector3(
            this.entity.body.position.x,
            this.entity.body.position.y,
            this.entity.body.position.z
        );

        const direction = this.targetPosition.clone().sub(currentPos);
        direction.y = 0; // Keep movement on ground

        const distance = direction.length();
        if (distance < 0.5) {
            this.targetPosition = null;
            return;
        }

        direction.normalize();

        // 1. Movement: Apply force or velocity
        const velocity = direction.clone().multiplyScalar(this.moveSpeed);
        this.entity.body.velocity.x = velocity.x;
        this.entity.body.velocity.z = velocity.z;

        // 2. Rotation: Face target
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentRotation = this.entity.mesh.rotation.y;
        
        // Simple lerp for rotation
        const angleDiff = targetAngle - currentRotation;
        this.entity.mesh.rotation.y += angleDiff * delta * this.rotationSpeed;
        
        // Update physics body quaternion based on mesh rotation
        this.entity.body.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 1, 0),
            this.entity.mesh.rotation.y
        );
    }
}
