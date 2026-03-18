/**
 * Dynamic Resolution Scaling (Rekomendasi #23)
 * Turunkan pixelRatio saat FPS drop, naikkan kembali saat stabil
 */

import * as THREE from 'three';
import { eventBus } from './EventBus';

export interface ResolutionConfig {
  minPixelRatio: number;
  maxPixelRatio: number;
  targetFPS: number;
  adjustmentStep: number;
  stabilityFrames: number; // Frames needed to consider FPS stable
}

export class DynamicResolution {
  private renderer: THREE.WebGLRenderer;
  private config: ResolutionConfig;
  private currentPixelRatio: number;
  private fpsHistory: number[] = [];
  private stableFrameCount: number = 0;
  
  constructor(renderer: THREE.WebGLRenderer, config?: Partial<ResolutionConfig>) {
    this.renderer = renderer;
    this.config = {
      minPixelRatio: 0.5,
      maxPixelRatio: Math.min(window.devicePixelRatio, 2.0),
      targetFPS: 60,
      adjustmentStep: 0.1,
      stabilityFrames: 30,
      ...config,
    };
    
    this.currentPixelRatio = this.config.maxPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
  }
  
  public update(currentFPS: number): void {
    this.fpsHistory.push(currentFPS);
    
    // Keep only last 60 frames
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const fpsThreshold = this.config.targetFPS * 0.9; // 90% of target
    
    if (avgFPS < fpsThreshold) {
      // FPS too low, decrease resolution
      this.stableFrameCount = 0;
      this.decreaseResolution();
    } else if (avgFPS > this.config.targetFPS * 1.05) {
      // FPS stable and high, try increasing resolution
      this.stableFrameCount++;
      
      if (this.stableFrameCount >= this.config.stabilityFrames) {
        this.increaseResolution();
        this.stableFrameCount = 0;
      }
    } else {
      // FPS in acceptable range
      this.stableFrameCount = 0;
    }
  }
  
  private decreaseResolution(): void {
    const newRatio = Math.max(
      this.config.minPixelRatio,
      this.currentPixelRatio - this.config.adjustmentStep
    );
    
    if (newRatio !== this.currentPixelRatio) {
      this.currentPixelRatio = newRatio;
      this.renderer.setPixelRatio(this.currentPixelRatio);
      eventBus.emit('resolution:changed', { pixelRatio: this.currentPixelRatio, reason: 'fps-drop' });
      console.log(`Resolution decreased to ${this.currentPixelRatio.toFixed(2)}x`);
    }
  }
  
  private increaseResolution(): void {
    const newRatio = Math.min(
      this.config.maxPixelRatio,
      this.currentPixelRatio + this.config.adjustmentStep
    );
    
    if (newRatio !== this.currentPixelRatio) {
      this.currentPixelRatio = newRatio;
      this.renderer.setPixelRatio(this.currentPixelRatio);
      eventBus.emit('resolution:changed', { pixelRatio: this.currentPixelRatio, reason: 'fps-stable' });
      console.log(`Resolution increased to ${this.currentPixelRatio.toFixed(2)}x`);
    }
  }
  
  public getCurrentPixelRatio(): number {
    return this.currentPixelRatio;
  }
  
  public reset(): void {
    this.currentPixelRatio = this.config.maxPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.fpsHistory = [];
    this.stableFrameCount = 0;
  }
}
