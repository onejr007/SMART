/**
 * GPUTiming.ts
 * [P0] GPU timing-based scaling
 * Dynamic resolution/quality berdasarkan GPU timing untuk respons lebih akurat
 */

import * as THREE from 'three';

export interface GPUTimingConfig {
  targetFrameTime: number; // ms (e.g., 16.67ms for 60fps)
  minScale: number;
  maxScale: number;
  adjustmentSpeed: number;
}

export const DEFAULT_GPU_TIMING_CONFIG: GPUTimingConfig = {
  targetFrameTime: 16.67,
  minScale: 0.5,
  maxScale: 1.0,
  adjustmentSpeed: 0.05
};

export class GPUTimingManager {
  private renderer: THREE.WebGLRenderer;
  private config: GPUTimingConfig;
  private currentScale: number = 1.0;
  private frameTimeSamples: number[] = [];
  private maxSamples: number = 60;
  private gl: WebGL2RenderingContext | null = null;
  private ext: any = null;
  private query: WebGLQuery | null = null;
  private queryPending: boolean = false;
  
  constructor(renderer: THREE.WebGLRenderer, config: GPUTimingConfig = DEFAULT_GPU_TIMING_CONFIG) {
    this.renderer = renderer;
    this.config = { ...config };
    this.initGPUTiming();
  }
  
  private initGPUTiming(): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    this.gl = gl;
    
    // Check for timer query extension
    if (gl instanceof WebGL2RenderingContext) {
      // WebGL2 has built-in timer queries
      this.ext = gl;
    } else {
      // WebGL1 needs extension
      const context = gl as any;
      this.ext = context.getExtension('EXT_disjoint_timer_query_webgl2');
    }
    
    if (this.ext) {
      console.log('⏱️ GPU timing queries available');
    } else {
      console.warn('⚠️ GPU timing queries not available, falling back to CPU timing');
    }
  }
  
  public beginFrame(): void {
    if (!this.ext || !this.gl || this.queryPending) return;
    
    this.query = this.gl.createQuery();
    if (this.query) {
      this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT || 0x88BF, this.query);
      this.queryPending = true;
    }
  }
  
  public endFrame(): void {
    if (!this.ext || !this.gl || !this.query) return;
    
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT || 0x88BF);
  }
  
  public update(): void {
    if (!this.ext || !this.gl || !this.query || !this.queryPending) return;
    
    // Check if query result is available
    const available = this.gl.getQueryParameter(this.query, this.gl.QUERY_RESULT_AVAILABLE);
    
    if (available) {
      const timeElapsed = this.gl.getQueryParameter(this.query, this.gl.QUERY_RESULT);
      const frameTimeMs = timeElapsed / 1000000; // Convert nanoseconds to milliseconds
      
      this.frameTimeSamples.push(frameTimeMs);
      if (this.frameTimeSamples.length > this.maxSamples) {
        this.frameTimeSamples.shift();
      }
      
      this.adjustQuality();
      
      this.gl.deleteQuery(this.query);
      this.query = null;
      this.queryPending = false;
    }
  }
  
  private adjustQuality(): void {
    if (this.frameTimeSamples.length < 10) return;
    
    // Calculate average frame time
    const avgFrameTime = this.frameTimeSamples.reduce((a, b) => a + b, 0) / this.frameTimeSamples.length;
    
    // Adjust resolution scale based on frame time
    if (avgFrameTime > this.config.targetFrameTime * 1.2) {
      // Too slow, reduce quality
      this.currentScale = Math.max(
        this.config.minScale,
        this.currentScale - this.config.adjustmentSpeed
      );
    } else if (avgFrameTime < this.config.targetFrameTime * 0.8) {
      // Fast enough, increase quality
      this.currentScale = Math.min(
        this.config.maxScale,
        this.currentScale + this.config.adjustmentSpeed
      );
    }
    
    // Apply resolution scale
    this.applyResolutionScale();
  }
  
  private applyResolutionScale(): void {
    const size = this.renderer.getSize(new THREE.Vector2());
    this.renderer.setPixelRatio(window.devicePixelRatio * this.currentScale);
  }
  
  public getAverageFrameTime(): number {
    if (this.frameTimeSamples.length === 0) return 0;
    return this.frameTimeSamples.reduce((a, b) => a + b, 0) / this.frameTimeSamples.length;
  }
  
  public getCurrentScale(): number {
    return this.currentScale;
  }
  
  public setTargetFrameTime(ms: number): void {
    this.config.targetFrameTime = ms;
  }
  
  public getStats() {
    return {
      currentScale: this.currentScale,
      avgFrameTime: this.getAverageFrameTime(),
      targetFrameTime: this.config.targetFrameTime,
      samples: this.frameTimeSamples.length,
      gpuTimingAvailable: this.ext !== null
    };
  }
  
  public dispose(): void {
    if (this.query && this.gl) {
      this.gl.deleteQuery(this.query);
    }
    this.frameTimeSamples = [];
  }
}
