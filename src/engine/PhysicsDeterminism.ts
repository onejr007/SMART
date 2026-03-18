/**
 * Physics Determinism System
 * Target determinism untuk multiplayer dengan consistent simulation
 */

import { World, Body, Vec3 } from 'cannon-es';

interface DeterminismConfig {
  enableDeterminism: boolean;
  fixedTimeStep: number;
  maxSubSteps: number;
  enableStateHashing: boolean;
  enableInputValidation: boolean;
  enableRollback: boolean;
  maxRollbackFrames: number;
}

interface PhysicsState {
  frameNumber: number;
  timestamp: number;
  bodies: { [id: string]: BodyState };
  checksum: string;
}

interface BodyState {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  sleeping: boolean;
}

interface InputFrame {
  frameNumber: number;
  playerId: string;
  inputs: any;
  timestamp: number;
}

export class PhysicsDeterminism {
  private config: DeterminismConfig;
  private world: World;
  private stateHistory: PhysicsState[] = [];
  private inputHistory: InputFrame[] = [];
  private currentFrame = 0;
  private lastValidatedFrame = 0;
  
  private onDesyncDetected?: (frame: number, expected: string, actual: string) => void;
  private onRollbackRequired?: (targetFrame: number) => void;

  constructor(world: World, config: Partial<DeterminismConfig> = {}) {
    this.world = world;
    this.config = {
      enableDeterminism: true,
      fixedTimeStep: 1/60,
      maxSubSteps: 3,
      enableStateHashing: true,
      enableInputValidation: true,
      enableRollback: true,
      maxRollbackFrames: 60,
      ...config
    };

    if (this.config.enableDeterminism) {
      this.setupDeterministicWorld();
    }
  }

  /**
   * Setup world untuk deterministic simulation
   */
  private setupDeterministicWorld(): void {
    // Ensure consistent solver settings
    const solver = this.world.solver as any;
    solver.iterations = 10;
    solver.tolerance = 1e-7;
    
    // Disable random elements
    this.world.broadphase.useBoundingBoxes = true;
    
    // Set consistent gravity
    this.world.gravity.set(0, -9.82, 0);
    
    // Ensure consistent contact material properties
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.3;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;
  }

  /**
   * Step physics dengan deterministic guarantees
   */
  stepDeterministic(inputs: InputFrame[]): PhysicsState {
    if (!this.config.enableDeterminism) {
      this.world.step(this.config.fixedTimeStep);
      return this.captureState();
    }

    // Validate inputs
    if (this.config.enableInputValidation) {
      this.validateInputs(inputs);
    }

    // Store inputs for this frame
    this.inputHistory.push(...inputs);
    this.trimInputHistory();

    // Apply inputs to bodies
    this.applyInputs(inputs);

    // Step physics with fixed timestep
    this.world.step(this.config.fixedTimeStep, undefined, this.config.maxSubSteps);

    // Capture state
    const state = this.captureState();
    
    // Store state for rollback
    this.storeState(state);
    
    this.currentFrame++;
    return state;
  }

  /**
   * Validate input consistency
   */
  private validateInputs(inputs: InputFrame[]): void {
    for (const input of inputs) {
      // Check frame number consistency
      if (input.frameNumber !== this.currentFrame) {
        console.warn(`Input frame mismatch: expected ${this.currentFrame}, got ${input.frameNumber}`);
      }

      // Validate input data structure
      if (!input.playerId || !input.inputs) {
        console.warn('Invalid input structure:', input);
      }

      // Check for duplicate inputs
      const duplicates = inputs.filter(i => i.playerId === input.playerId);
      if (duplicates.length > 1) {
        console.warn(`Duplicate inputs for player ${input.playerId}`);
      }
    }
  }

  /**
   * Apply inputs to physics bodies
   */
  private applyInputs(inputs: InputFrame[]): void {
    for (const input of inputs) {
      const body = this.findBodyByPlayerId(input.playerId);
      if (!body) continue;

      const { inputs: playerInputs } = input;

      // Apply movement forces
      if (playerInputs.movement) {
        const force = new Vec3(
          playerInputs.movement.x * 100,
          0,
          playerInputs.movement.z * 100
        );
        body.applyForce(force, body.position);
      }

      // Apply jump
      if (playerInputs.jump && Math.abs(body.velocity.y) < 0.1) {
        body.velocity.y = 10;
      }

      // Apply rotation
      if (playerInputs.rotation) {
        body.angularVelocity.y = playerInputs.rotation.y * 5;
      }
    }
  }

  /**
   * Find body by player ID
   */
  private findBodyByPlayerId(playerId: string): Body | null {
    // This would need to be implemented based on your body tagging system
    for (const body of this.world.bodies) {
      if ((body as any).playerId === playerId) {
        return body;
      }
    }
    return null;
  }

  /**
   * Capture current physics state
   */
  private captureState(): PhysicsState {
    const bodies: { [id: string]: BodyState } = {};

    for (const body of this.world.bodies) {
      const id = (body as any).id || body.id.toString();
      
      bodies[id] = {
        position: [body.position.x, body.position.y, body.position.z],
        quaternion: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
        velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
        angularVelocity: [body.angularVelocity.x, body.angularVelocity.y, body.angularVelocity.z],
        sleeping: body.sleepState === Body.SLEEPING
      };
    }

    const state: PhysicsState = {
      frameNumber: this.currentFrame,
      timestamp: performance.now(),
      bodies,
      checksum: this.config.enableStateHashing ? this.calculateChecksum(bodies) : ''
    };

    return state;
  }

  /**
   * Calculate state checksum
   */
  private calculateChecksum(bodies: { [id: string]: BodyState }): string {
    // Sort bodies by ID for consistent hashing
    const sortedBodies = Object.keys(bodies).sort().map(id => bodies[id]);
    
    let hash = 0;
    const str = JSON.stringify(sortedBodies, (key, value) => {
      // Round floating point numbers for consistency
      if (typeof value === 'number') {
        return Math.round(value * 1000000) / 1000000;
      }
      return value;
    });

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Store state for rollback
   */
  private storeState(state: PhysicsState): void {
    this.stateHistory.push(state);
    
    // Trim history
    if (this.stateHistory.length > this.config.maxRollbackFrames) {
      this.stateHistory.shift();
    }
  }

  /**
   * Validate state against expected checksum
   */
  validateState(expectedChecksum: string, frameNumber: number): boolean {
    if (!this.config.enableStateHashing) return true;

    const state = this.stateHistory.find(s => s.frameNumber === frameNumber);
    if (!state) {
      console.warn(`State not found for frame ${frameNumber}`);
      return false;
    }

    if (state.checksum !== expectedChecksum) {
      console.error(`Desync detected at frame ${frameNumber}:`, {
        expected: expectedChecksum,
        actual: state.checksum
      });
      
      this.onDesyncDetected?.(frameNumber, expectedChecksum, state.checksum);
      
      if (this.config.enableRollback) {
        this.rollbackToFrame(frameNumber - 1);
      }
      
      return false;
    }

    this.lastValidatedFrame = Math.max(this.lastValidatedFrame, frameNumber);
    return true;
  }

  /**
   * Rollback to specific frame
   */
  private rollbackToFrame(targetFrame: number): void {
    const targetState = this.stateHistory.find(s => s.frameNumber === targetFrame);
    if (!targetState) {
      console.error(`Cannot rollback: state not found for frame ${targetFrame}`);
      return;
    }

    console.log(`Rolling back to frame ${targetFrame}`);
    
    // Restore physics state
    this.restoreState(targetState);
    
    // Reset frame counter
    this.currentFrame = targetFrame;
    
    // Trim future states
    this.stateHistory = this.stateHistory.filter(s => s.frameNumber <= targetFrame);
    
    // Replay inputs from rollback point
    this.replayInputsFromFrame(targetFrame + 1);
    
    this.onRollbackRequired?.(targetFrame);
  }

  /**
   * Restore physics state
   */
  private restoreState(state: PhysicsState): void {
    for (const body of this.world.bodies) {
      const id = (body as any).id || body.id.toString();
      const bodyState = state.bodies[id];
      
      if (bodyState) {
        body.position.set(bodyState.position[0], bodyState.position[1], bodyState.position[2]);
        body.quaternion.set(bodyState.quaternion[0], bodyState.quaternion[1], bodyState.quaternion[2], bodyState.quaternion[3]);
        body.velocity.set(bodyState.velocity[0], bodyState.velocity[1], bodyState.velocity[2]);
        body.angularVelocity.set(bodyState.angularVelocity[0], bodyState.angularVelocity[1], bodyState.angularVelocity[2]);
        
        if (bodyState.sleeping) {
          body.sleep();
        } else {
          body.wakeUp();
        }
      }
    }
  }

  /**
   * Replay inputs from specific frame
   */
  private replayInputsFromFrame(startFrame: number): void {
    const inputsToReplay = this.inputHistory.filter(input => input.frameNumber >= startFrame);
    
    // Group inputs by frame
    const inputsByFrame = new Map<number, InputFrame[]>();
    for (const input of inputsToReplay) {
      if (!inputsByFrame.has(input.frameNumber)) {
        inputsByFrame.set(input.frameNumber, []);
      }
      inputsByFrame.get(input.frameNumber)!.push(input);
    }

    // Replay frame by frame
    for (const [frameNumber, frameInputs] of inputsByFrame) {
      this.currentFrame = frameNumber;
      this.stepDeterministic(frameInputs);
    }
  }

  /**
   * Trim input history
   */
  private trimInputHistory(): void {
    const cutoffFrame = this.currentFrame - this.config.maxRollbackFrames;
    this.inputHistory = this.inputHistory.filter(input => input.frameNumber > cutoffFrame);
  }

  /**
   * Get determinism statistics
   */
  getStats() {
    return {
      currentFrame: this.currentFrame,
      lastValidatedFrame: this.lastValidatedFrame,
      stateHistorySize: this.stateHistory.length,
      inputHistorySize: this.inputHistory.length,
      desyncCount: this.currentFrame - this.lastValidatedFrame,
      deterministicMode: this.config.enableDeterminism
    };
  }

  /**
   * Set event handlers
   */
  setOnDesyncDetected(handler: (frame: number, expected: string, actual: string) => void): void {
    this.onDesyncDetected = handler;
  }

  setOnRollbackRequired(handler: (targetFrame: number) => void): void {
    this.onRollbackRequired = handler;
  }

  /**
   * Enable/disable determinism
   */
  setDeterminismEnabled(enabled: boolean): void {
    this.config.enableDeterminism = enabled;
    if (enabled) {
      this.setupDeterministicWorld();
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.stateHistory = [];
    this.inputHistory = [];
    this.currentFrame = 0;
    this.lastValidatedFrame = 0;
  }

  /**
   * Dispose system
   */
  dispose(): void {
    this.clearHistory();
  }
}