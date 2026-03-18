/**
 * Fixed TimeStep System
 * Pastikan semua physics/character controller berjalan pada fixed timestep yang konsisten
 */

interface FixedTimeStepConfig {
  targetFPS: number;
  maxSubSteps: number;
  enableInterpolation: boolean;
  enableExtrapolation: boolean;
}

interface TimeStepStats {
  averageDelta: number;
  frameSkips: number;
  subSteps: number;
  interpolationFactor: number;
}

export class FixedTimeStep {
  private fixedDelta: number;
  private accumulator: number = 0;
  private maxSubSteps: number;
  private enableInterpolation: boolean;
  private enableExtrapolation: boolean;
  
  private lastFrameTime: number = 0;
  private frameSkips: number = 0;
  private totalFrames: number = 0;
  private deltaSum: number = 0;
  
  private interpolationFactor: number = 0;
  private lastSubSteps: number = 0;

  constructor(config: Partial<FixedTimeStepConfig> = {}) {
    const finalConfig = {
      targetFPS: 60,
      maxSubSteps: 5,
      enableInterpolation: true,
      enableExtrapolation: false,
      ...config
    };

    this.fixedDelta = 1.0 / finalConfig.targetFPS;
    this.maxSubSteps = finalConfig.maxSubSteps;
    this.enableInterpolation = finalConfig.enableInterpolation;
    this.enableExtrapolation = finalConfig.enableExtrapolation;
  }

  /**
   * Update dengan fixed timestep
   */
  update(deltaTime: number, fixedUpdateCallback: (fixedDelta: number) => void): void {
    // Clamp delta time untuk mencegah spiral of death
    const clampedDelta = Math.min(deltaTime, this.fixedDelta * this.maxSubSteps);
    
    this.accumulator += clampedDelta;
    this.deltaSum += clampedDelta;
    this.totalFrames++;

    let subSteps = 0;

    // Fixed timestep loop
    while (this.accumulator >= this.fixedDelta && subSteps < this.maxSubSteps) {
      fixedUpdateCallback(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
      subSteps++;
    }

    this.lastSubSteps = subSteps;

    // Calculate interpolation factor untuk smooth rendering
    if (this.enableInterpolation) {
      this.interpolationFactor = this.accumulator / this.fixedDelta;
    }

    // Track frame skips
    if (subSteps === 0) {
      this.frameSkips++;
    }

    this.lastFrameTime = performance.now();
  }

  /**
   * Get interpolation factor untuk smooth rendering
   */
  getInterpolationFactor(): number {
    return this.enableInterpolation ? this.interpolationFactor : 0;
  }

  /**
   * Get fixed delta time
   */
  getFixedDelta(): number {
    return this.fixedDelta;
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.fixedDelta = 1.0 / fps;
  }

  /**
   * Get current target FPS
   */
  getTargetFPS(): number {
    return 1.0 / this.fixedDelta;
  }

  /**
   * Set max substeps
   */
  setMaxSubSteps(maxSubSteps: number): void {
    this.maxSubSteps = Math.max(1, maxSubSteps);
  }

  /**
   * Enable/disable interpolation
   */
  setInterpolationEnabled(enabled: boolean): void {
    this.enableInterpolation = enabled;
    if (!enabled) {
      this.interpolationFactor = 0;
    }
  }

  /**
   * Enable/disable extrapolation
   */
  setExtrapolationEnabled(enabled: boolean): void {
    this.enableExtrapolation = enabled;
  }

  /**
   * Check if running behind schedule
   */
  isBehindSchedule(): boolean {
    return this.accumulator > this.fixedDelta;
  }

  /**
   * Get performance statistics
   */
  getStats(): TimeStepStats {
    const averageDelta = this.totalFrames > 0 ? this.deltaSum / this.totalFrames : 0;
    
    return {
      averageDelta,
      frameSkips: this.frameSkips,
      subSteps: this.lastSubSteps,
      interpolationFactor: this.interpolationFactor
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.frameSkips = 0;
    this.totalFrames = 0;
    this.deltaSum = 0;
  }

  /**
   * Force step (untuk debugging)
   */
  forceStep(callback: (fixedDelta: number) => void): void {
    callback(this.fixedDelta);
  }

  /**
   * Get remaining accumulator time
   */
  getRemainingTime(): number {
    return this.accumulator;
  }

  /**
   * Clear accumulator (untuk pause/resume)
   */
  clearAccumulator(): void {
    this.accumulator = 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.accumulator = 0;
    this.resetStats();
  }
}