/**
 * Physics Sleep System
 * Aktifkan tidur rigidbody dan tune threshold untuk menurunkan beban saat scene ramai
 */

import { Body } from 'cannon-es';

interface SleepConfig {
  sleepSpeedLimit: number;
  sleepTimeLimit: number;
  enableAutoSleep: boolean;
  wakeUpThreshold: number;
  maxSleepingBodies: number;
}

interface SleepStats {
  totalBodies: number;
  sleepingBodies: number;
  sleepRatio: number;
  averageSleepTime: number;
  wakeUpEvents: number;
}

interface BodySleepData {
  body: Body;
  sleepTime: number;
  lastVelocity: number;
  lastAngularVelocity: number;
  sleepStartTime: number;
}

export class PhysicsSleep {
  private config: SleepConfig;
  private bodies = new Map<Body, BodySleepData>();
  private sleepingBodies = new Set<Body>();
  private wakeUpEvents = 0;
  private lastUpdateTime = 0;

  constructor(config: Partial<SleepConfig> = {}) {
    this.config = {
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 1.0, // seconds
      enableAutoSleep: true,
      wakeUpThreshold: 0.5,
      maxSleepingBodies: 1000,
      ...config
    };
  }

  /**
   * Register body untuk sleep management
   */
  registerBody(body: Body): void {
    if (this.bodies.has(body)) return;

    const sleepData: BodySleepData = {
      body,
      sleepTime: 0,
      lastVelocity: 0,
      lastAngularVelocity: 0,
      sleepStartTime: 0
    };

    this.bodies.set(body, sleepData);

    // Setup sleep callbacks
    body.addEventListener('sleep', () => {
      this.onBodySleep(body);
    });

    body.addEventListener('wakeup', () => {
      this.onBodyWakeUp(body);
    });
  }

  /**
   * Unregister body
   */
  unregisterBody(body: Body): void {
    this.bodies.delete(body);
    this.sleepingBodies.delete(body);
  }

  /**
   * Update sleep system
   */
  update(deltaTime: number): void {
    if (!this.config.enableAutoSleep) return;

    const currentTime = performance.now() / 1000;
    this.lastUpdateTime = currentTime;

    for (const [body, sleepData] of this.bodies) {
      this.updateBodySleep(body, sleepData, deltaTime, currentTime);
    }

    // Limit sleeping bodies untuk performance
    this.enforceSleepLimit();
  }

  /**
   * Update individual body sleep state
   */
  private updateBodySleep(body: Body, sleepData: BodySleepData, deltaTime: number, currentTime: number): void {
    if (body.type === Body.STATIC) return;

    const velocity = body.velocity.length();
    const angularVelocity = body.angularVelocity.length();
    const totalSpeed = velocity + angularVelocity;

    // Check if body should start sleeping
    if (!body.sleepState && totalSpeed < this.config.sleepSpeedLimit) {
      sleepData.sleepTime += deltaTime;
      
      if (sleepData.sleepTime >= this.config.sleepTimeLimit) {
        this.putBodyToSleep(body, sleepData, currentTime);
      }
    } else if (body.sleepState && totalSpeed > this.config.wakeUpThreshold) {
      // Body should wake up
      this.wakeUpBody(body, sleepData);
    } else if (totalSpeed >= this.config.sleepSpeedLimit) {
      // Reset sleep timer
      sleepData.sleepTime = 0;
    }

    // Update velocity tracking
    sleepData.lastVelocity = velocity;
    sleepData.lastAngularVelocity = angularVelocity;
  }

  /**
   * Put body to sleep
   */
  private putBodyToSleep(body: Body, sleepData: BodySleepData, currentTime: number): void {
    if (body.sleepState) return;

    body.sleep();
    sleepData.sleepStartTime = currentTime;
    this.sleepingBodies.add(body);
  }

  /**
   * Wake up body
   */
  private wakeUpBody(body: Body, sleepData: BodySleepData): void {
    if (!body.sleepState) return;

    body.wakeUp();
    sleepData.sleepTime = 0;
    sleepData.sleepStartTime = 0;
    this.sleepingBodies.delete(body);
    this.wakeUpEvents++;
  }

  /**
   * Handle body sleep event
   */
  private onBodySleep(body: Body): void {
    this.sleepingBodies.add(body);
  }

  /**
   * Handle body wake up event
   */
  private onBodyWakeUp(body: Body): void {
    this.sleepingBodies.delete(body);
    this.wakeUpEvents++;
  }

  /**
   * Enforce maximum sleeping bodies limit
   */
  private enforceSleepLimit(): void {
    if (this.sleepingBodies.size <= this.config.maxSleepingBodies) return;

    // Wake up oldest sleeping bodies
    const sortedBodies = Array.from(this.sleepingBodies)
      .map(body => ({
        body,
        sleepData: this.bodies.get(body)!
      }))
      .sort((a, b) => a.sleepData.sleepStartTime - b.sleepData.sleepStartTime);

    const bodiesToWake = sortedBodies.slice(0, this.sleepingBodies.size - this.config.maxSleepingBodies);
    
    for (const { body, sleepData } of bodiesToWake) {
      this.wakeUpBody(body, sleepData);
    }
  }

  /**
   * Wake up all bodies
   */
  wakeUpAll(): void {
    for (const body of this.sleepingBodies) {
      const sleepData = this.bodies.get(body);
      if (sleepData) {
        this.wakeUpBody(body, sleepData);
      }
    }
  }

  /**
   * Force sleep all eligible bodies
   */
  forceSleepAll(): void {
    const currentTime = performance.now() / 1000;
    
    for (const [body, sleepData] of this.bodies) {
      if (body.type !== Body.STATIC && !body.sleepState) {
        const totalSpeed = body.velocity.length() + body.angularVelocity.length();
        
        if (totalSpeed < this.config.sleepSpeedLimit) {
          this.putBodyToSleep(body, sleepData, currentTime);
        }
      }
    }
  }

  /**
   * Get sleep statistics
   */
  getStats(): SleepStats {
    const totalBodies = this.bodies.size;
    const sleepingBodies = this.sleepingBodies.size;
    const sleepRatio = totalBodies > 0 ? sleepingBodies / totalBodies : 0;
    
    let totalSleepTime = 0;
    let sleepingCount = 0;
    const currentTime = this.lastUpdateTime;
    
    for (const body of this.sleepingBodies) {
      const sleepData = this.bodies.get(body);
      if (sleepData && sleepData.sleepStartTime > 0) {
        totalSleepTime += currentTime - sleepData.sleepStartTime;
        sleepingCount++;
      }
    }
    
    const averageSleepTime = sleepingCount > 0 ? totalSleepTime / sleepingCount : 0;

    return {
      totalBodies,
      sleepingBodies,
      sleepRatio,
      averageSleepTime,
      wakeUpEvents: this.wakeUpEvents
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SleepConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): SleepConfig {
    return { ...this.config };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.wakeUpEvents = 0;
  }

  /**
   * Get sleeping bodies
   */
  getSleepingBodies(): Body[] {
    return Array.from(this.sleepingBodies);
  }

  /**
   * Check if body is sleeping
   */
  isBodySleeping(body: Body): boolean {
    return this.sleepingBodies.has(body);
  }

  /**
   * Dispose system
   */
  dispose(): void {
    this.wakeUpAll();
    this.bodies.clear();
    this.sleepingBodies.clear();
    this.resetStats();
  }
}