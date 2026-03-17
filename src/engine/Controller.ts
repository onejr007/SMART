import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class FPSController {
    private camera: THREE.Camera;
    private body: CANNON.Body;
    private isLocked: boolean = false;
    private yawObject: THREE.Object3D;
    private pitchObject: THREE.Object3D;
    private moveSpeed: number = 5;
    private sprintSpeed: number = 8;
    private jumpForce: number = 5;
    private canJump: boolean = false;
    private headBobTimer: number = 0;
    private baseCameraY: number = 0;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.baseCameraY = camera.position.y;
        
        // Setup Object Hierarchy for Camera Rotation
        this.pitchObject = new THREE.Object3D();
        this.pitchObject.add(camera);
        
        this.yawObject = new THREE.Object3D();
        this.yawObject.position.y = 2; // Initial height
        this.yawObject.add(this.pitchObject);

        // Physics Body
        const radius = 0.5;
        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 5, 0),
            shape: new CANNON.Sphere(radius),
            fixedRotation: true,
            linearDamping: 0.9
        });

        // Mouse Look Logic
        const onMouseMove = (event: MouseEvent) => {
            if (!this.isLocked) return;
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.yawObject.rotation.y -= movementX * 0.002;
            this.pitchObject.rotation.x -= movementY * 0.002;
            this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
        };

        // Pointer Lock
        domElement.addEventListener('click', () => {
            domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === domElement;
        });

        document.addEventListener('mousemove', onMouseMove, false);
    }

    public getBody(): CANNON.Body {
        return this.body;
    }

    public getObject(): THREE.Object3D {
        return this.yawObject;
    }

    public update(delta: number, input: any) {
        if (!this.isLocked) return;

        const velocity = this.body.velocity;
        const inputVector = new THREE.Vector3();

        // Better Ground Check (Advanced Mechanism #22)
        const from = new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z);
        const to = new CANNON.Vec3(from.x, from.y - 0.6, from.z);
        const world = this.body.world;
        let onGround = false;
        if (world) {
            const raycastResult = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, raycastResult);
            onGround = raycastResult.hasHit;
        }
        this.canJump = onGround;

        if (input.isKeyDown('KeyW')) inputVector.z -= 1;
        if (input.isKeyDown('KeyS')) inputVector.z += 1;
        if (input.isKeyDown('KeyA')) inputVector.x -= 1;
        if (input.isKeyDown('KeyD')) inputVector.x += 1;

        // Sprinting
        const currentSpeed = input.isKeyDown('ShiftLeft') ? this.sprintSpeed : this.moveSpeed;

        if (input.isKeyDown('Space') && this.canJump) {
            velocity.y = this.jumpForce;
            this.canJump = false;
        }

        // Convert input to world direction based on camera yaw
        if (inputVector.length() > 0) {
            inputVector.normalize().multiplyScalar(currentSpeed);
            inputVector.applyEuler(new THREE.Euler(0, this.yawObject.rotation.y, 0));
            
            // Head Bobbing (Advanced Mechanism #22)
            if (this.canJump) {
                this.headBobTimer += delta * (input.isKeyDown('ShiftLeft') ? 15 : 10);
                this.camera.position.y = this.baseCameraY + Math.sin(this.headBobTimer) * 0.05;
            }
        } else {
            // Reset Head Bob
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseCameraY, 0.1);
        }

        // Apply velocity
        velocity.x = inputVector.x;
        velocity.z = inputVector.z;

        // Sync visual position
        this.yawObject.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    }
}
