/**
 * Physics Worker System
 * Pindahkan update physics ke worker untuk menurunkan jank main thread
 */

interface PhysicsWorkerMessage {
  type: 'init' | 'step' | 'addBody' | 'removeBody' | 'updateBody' | 'getState';
  id?: string;
  data?: any;
  timestamp?: number;
}

interface PhysicsBody {
  id: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  mass: number;
  shape: 'box' | 'sphere' | 'plane';
  size: [number, number, number];
}

interface PhysicsState {
  bodies: { [id: string]: PhysicsBody };
  timestamp: number;
}

export class PhysicsWorker {
  private worker: Worker | null = null;
  private isInitialized = false;
  private messageId = 0;
  private pendingMessages = new Map<number, (result: any) => void>();
  
  private onStateUpdate?: (state: PhysicsState) => void;
  private lastState: PhysicsState = { bodies: {}, timestamp: 0 };

  constructor(private options = {
    gravity: [0, -9.82, 0] as [number, number, number],
    timestep: 1/60,
    maxSubSteps: 3,
    enableSleep: true
  }) {}

  /**
   * Initialize physics worker
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Create worker from inline script
    const workerScript = this.createWorkerScript();
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    this.worker = new Worker(workerUrl);
    
    this.worker.onmessage = (event) => {
      this.handleWorkerMessage(event.data);
    };

    this.worker.onerror = (error) => {
      console.error('Physics worker error:', error);
    };

    // Initialize physics world in worker
    await this.sendMessage('init', this.options);
    
    this.isInitialized = true;
    URL.revokeObjectURL(workerUrl);
  }

  /**
   * Step physics simulation
   */
  async step(deltaTime: number): Promise<PhysicsState> {
    if (!this.isInitialized) {
      throw new Error('Physics worker not initialized');
    }

    const state = await this.sendMessage('step', { deltaTime });
    this.lastState = state;
    this.onStateUpdate?.(state);
    
    return state;
  }

  /**
   * Add physics body
   */
  async addBody(body: PhysicsBody): Promise<void> {
    if (!this.isInitialized) return;
    
    await this.sendMessage('addBody', body);
  }

  /**
   * Remove physics body
   */
  async removeBody(bodyId: string): Promise<void> {
    if (!this.isInitialized) return;
    
    await this.sendMessage('removeBody', { id: bodyId });
  }

  /**
   * Update body properties
   */
  async updateBody(bodyId: string, updates: Partial<PhysicsBody>): Promise<void> {
    if (!this.isInitialized) return;
    
    await this.sendMessage('updateBody', { id: bodyId, updates });
  }

  /**
   * Get current physics state
   */
  async getState(): Promise<PhysicsState> {
    if (!this.isInitialized) {
      return this.lastState;
    }
    
    return await this.sendMessage('getState');
  }

  /**
   * Send message to worker
   */
  private sendMessage(type: string, data?: any): Promise<any> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(null);
        return;
      }

      const id = ++this.messageId;
      this.pendingMessages.set(id, resolve);

      this.worker.postMessage({
        type,
        id,
        data,
        timestamp: performance.now()
      });
    });
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(message: any): void {
    const { id, type, data, error } = message;

    if (id && this.pendingMessages.has(id)) {
      const resolve = this.pendingMessages.get(id)!;
      this.pendingMessages.delete(id);
      
      if (error) {
        console.error('Physics worker error:', error);
        resolve(null);
      } else {
        resolve(data);
      }
    }

    // Handle state updates
    if (type === 'stateUpdate') {
      this.lastState = data;
      this.onStateUpdate?.(data);
    }
  }

  /**
   * Create worker script
   */
  private createWorkerScript(): string {
    return `
      // Simple physics simulation in worker
      class SimplePhysicsWorld {
        constructor(options) {
          this.gravity = options.gravity || [0, -9.82, 0];
          this.timestep = options.timestep || 1/60;
          this.maxSubSteps = options.maxSubSteps || 3;
          this.enableSleep = options.enableSleep !== false;
          this.bodies = new Map();
        }

        addBody(body) {
          this.bodies.set(body.id, {
            ...body,
            velocity: body.velocity || [0, 0, 0],
            angularVelocity: body.angularVelocity || [0, 0, 0],
            sleeping: false,
            sleepTime: 0
          });
        }

        removeBody(id) {
          this.bodies.delete(id);
        }

        updateBody(id, updates) {
          const body = this.bodies.get(id);
          if (body) {
            Object.assign(body, updates);
          }
        }

        step(deltaTime) {
          const steps = Math.min(Math.ceil(deltaTime / this.timestep), this.maxSubSteps);
          const stepTime = deltaTime / steps;

          for (let i = 0; i < steps; i++) {
            this.stepOnce(stepTime);
          }

          return this.getState();
        }

        stepOnce(dt) {
          for (const [id, body] of this.bodies) {
            if (body.sleeping) continue;

            // Apply gravity
            if (body.mass > 0) {
              body.velocity[0] += this.gravity[0] * dt;
              body.velocity[1] += this.gravity[1] * dt;
              body.velocity[2] += this.gravity[2] * dt;
            }

            // Update position
            body.position[0] += body.velocity[0] * dt;
            body.position[1] += body.velocity[1] * dt;
            body.position[2] += body.velocity[2] * dt;

            // Simple ground collision
            if (body.position[1] < 0) {
              body.position[1] = 0;
              body.velocity[1] = Math.max(0, -body.velocity[1] * 0.5);
            }

            // Sleep detection
            if (this.enableSleep) {
              const speed = Math.sqrt(
                body.velocity[0] ** 2 + 
                body.velocity[1] ** 2 + 
                body.velocity[2] ** 2
              );

              if (speed < 0.1) {
                body.sleepTime += dt;
                if (body.sleepTime > 1.0) {
                  body.sleeping = true;
                  body.velocity = [0, 0, 0];
                  body.angularVelocity = [0, 0, 0];
                }
              } else {
                body.sleepTime = 0;
              }
            }
          }
        }

        getState() {
          const bodies = {};
          for (const [id, body] of this.bodies) {
            bodies[id] = {
              id: body.id,
              position: [...body.position],
              quaternion: body.quaternion || [0, 0, 0, 1],
              velocity: [...body.velocity],
              angularVelocity: [...body.angularVelocity],
              mass: body.mass,
              shape: body.shape,
              size: body.size
            };
          }

          return {
            bodies,
            timestamp: performance.now()
          };
        }
      }

      let world = null;

      self.onmessage = function(event) {
        const { type, id, data } = event.data;

        try {
          let result = null;

          switch (type) {
            case 'init':
              world = new SimplePhysicsWorld(data);
              result = { success: true };
              break;

            case 'step':
              if (world) {
                result = world.step(data.deltaTime);
              }
              break;

            case 'addBody':
              if (world) {
                world.addBody(data);
                result = { success: true };
              }
              break;

            case 'removeBody':
              if (world) {
                world.removeBody(data.id);
                result = { success: true };
              }
              break;

            case 'updateBody':
              if (world) {
                world.updateBody(data.id, data.updates);
                result = { success: true };
              }
              break;

            case 'getState':
              if (world) {
                result = world.getState();
              }
              break;
          }

          self.postMessage({
            id,
            type: 'response',
            data: result
          });

        } catch (error) {
          self.postMessage({
            id,
            type: 'response',
            error: error.message
          });
        }
      };
    `;
  }

  /**
   * Set state update handler
   */
  setOnStateUpdate(handler: (state: PhysicsState) => void): void {
    this.onStateUpdate = handler;
  }

  /**
   * Get last known state
   */
  getLastState(): PhysicsState {
    return this.lastState;
  }

  /**
   * Check if worker is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose worker
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.isInitialized = false;
    this.pendingMessages.clear();
  }
}