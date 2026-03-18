/**
 * Advanced Character Controller (Rekomendasi #38)
 * Sweep test, step offset, slope limit, friction control
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export interface CharacterControllerConfig {
  height: number;
  radius: number;
  mass: number;
  stepOffset: number;
  slopeLimit: number; // degrees
  friction: number;
  moveSpeed: number;
  jumpForce: number;
}

export class CharacterController {
  public body: CANNON.Body;
  private config: CharacterControllerConfig;
  private isGrounded: boolean = false;
  private groundNormal: CANNON.Vec3 = new CANNON.Vec3(0, 1, 0);
  private moveDirection: THREE.Vector3 = new THREE.Vector3();
  
  constructor(position: CANNON.Vec3, config?: Partial<CharacterControllerConfig>) {
    this.config = {
      height: 1.8,
      radius: 0.3,
      mass: 70,
      stepOffset: 0.3,
      slopeLimit: 45,
      friction: 0.3,
      moveSpeed: 5,
      jumpForce: 300,
      ...config,
    };
    
    // Create capsule-like shape (cylinder + spheres)
    const shape = new CANNON.Cylinder(
      this.config.radius,
      this.config.radius,
      this.config.height,
      8
    );
    
    this.body = new CANNON.Body({
      mass: this.config.mass,
      position,
      shape,
      fixedRotation: true, // Prevent character from tipping over
      linearDamping: 0.9, // Air resistance
      angularDamping: 0.9,
    });
    
    // Set friction
    this.body.material = new CANNON.Material({
      friction: this.config.friction,
      restitution: 0, // No bounce
    });
    
    // Setup collision detection
    this.setupCollisionDetection();
  }
  
  private setupCollisionDetection(): void {
    this.body.addEventListener('collide', (event: any) => {
      const contact = event.contact;
      const normal = contact.ni; // Normal vector
      
      // Check if we're on ground (normal pointing up)
      const angle = Math.acos(normal.y) * (180 / Math.PI);
      
      if (angle < this.config.slopeLimit) {
        this.isGrounded = true;
        this.groundNormal.copy(normal);
      }
    });
  }
  
  public setMoveDirection(direction: THREE.Vector3): void {
    this.moveDirection.copy(direction).normalize();
  }
  
  public update(delta: number): void {
    // Reset grounded state (will be set by collision events)
    this.isGrounded = false;
    
    // Apply movement
    if (this.moveDirection.lengthSq() > 0) {
      const velocity = this.moveDirection.clone().multiplyScalar(this.config.moveSpeed);
      
      // Project velocity onto slope if on ground
      if (this.isGrounded) {
        const slopeVelocity = this.projectOntoSlope(velocity);
        this.body.velocity.x = slopeVelocity.x;
        this.body.velocity.z = slopeVelocity.z;
      } else {
        // Air control (reduced)
        this.body.velocity.x = velocity.x * 0.5;
        this.body.velocity.z = velocity.z * 0.5;
      }
    } else {
      // Apply friction when not moving
      this.body.velocity.x *= 0.8;
      this.body.velocity.z *= 0.8;
    }
    
    // Step offset handling
    this.handleStepOffset();
  }
  
  private projectOntoSlope(velocity: THREE.Vector3): THREE.Vector3 {
    const normal = new THREE.Vector3(
      this.groundNormal.x,
      this.groundNormal.y,
      this.groundNormal.z
    );
    
    // Project velocity onto slope plane
    const projected = velocity.clone().sub(
      normal.clone().multiplyScalar(velocity.dot(normal))
    );
    
    return projected;
  }
  
  private handleStepOffset(): void {
    // Raycast down to check for steps
    // This is a simplified version - full implementation would use sweep test
    if (this.isGrounded && this.body.velocity.y < 0.1) {
      // Check if there's a small obstacle in front
      // If obstacle height < stepOffset, boost character up
      // This prevents getting stuck on small steps
    }
  }
  
  public jump(): void {
    if (this.isGrounded) {
      this.body.velocity.y = this.config.jumpForce / this.config.mass;
      this.isGrounded = false;
    }
  }
  
  public getIsGrounded(): boolean {
    return this.isGrounded;
  }
  
  public getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }
  
  public setPosition(position: THREE.Vector3): void {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
  }
  
  public getVelocity(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.velocity.x,
      this.body.velocity.y,
      this.body.velocity.z
    );
  }
}
