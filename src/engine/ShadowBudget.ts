/**
 * ShadowBudget.ts
 * P1 Rendering #7 - Dynamic shadow quality management
 * Cascades, map size, distance berdasarkan budget device
 */

import * as THREE from 'three';

export type DeviceTier = 'low' | 'medium' | 'high' | 'ultra';

export interface ShadowBudgetConfig {
  deviceTier: DeviceTier;
  maxShadowMaps: number;
  enableDynamicQuality: boolean;
  targetFrameTime: number;
}

interface ShadowQualityPreset {
  mapSize: number;
  cascades: number;
  maxDistance: number;
  bias: number;
  normalBias: number;
}

export class ShadowBudgetManager {
  private config: ShadowBudgetConfig;
  private qualityPresets: Map<DeviceTier, ShadowQualityPreset>;
  private activeLights: THREE.Light[] = [];
  private currentQuality: ShadowQualityPreset;
  private stats = {
    activeShadowMaps: 0,
    totalShadowMemoryMB: 0,
    averageFrameTime: 16.67,
    qualityAdjustments: 0
  };

  constructor(config: Partial<ShadowBudgetConfig> = {}) {
    this.config = {
      deviceTier: 'medium',
      maxShadowMaps: 4,
      enableDynamicQuality: true,
      targetFrameTime: 16.67,
      ...config
    };

    this.qualityPresets = new Map([
      ['low', {
        mapSize: 512,
        cascades: 1,
        maxDistance: 50,
        bias: -0.001,
        normalBias: 0.02
      }],
      ['medium', {
        mapSize: 1024,
        cascades: 2,
        maxDistance: 100,
        bias: -0.0005,
        normalBias: 0.01
      }],
      ['high', {
        mapSize: 2048,
        cascades: 3,
        maxDistance: 200,
        bias: -0.0002,
        normalBias: 0.005
      }],
      ['ultra', {
        mapSize: 4096,
        cascades: 4,
        maxDistance: 500,
        bias: -0.0001,
        normalBias: 0.002
      }]
    ]);

    this.currentQuality = this.qualityPresets.get(this.config.deviceTier)!;
  }

  public registerLight(light: THREE.Light): void {
    if (this.activeLights.length >= this.config.maxShadowMaps) {
      console.warn('Shadow budget exceeded, light shadows disabled');
      light.castShadow = false;
      return;
    }

    this.activeLights.push(light);
    this.applyShadowQuality(light);
    this.updateStats();
  }

  public unregisterLight(light: THREE.Light): void {
    const index = this.activeLights.indexOf(light);
    if (index !== -1) {
      this.activeLights.splice(index, 1);
      light.castShadow = false;
      this.updateStats();
    }
  }

  public setDeviceTier(tier: DeviceTier): void {
    this.config.deviceTier = tier;
    this.currentQuality = this.qualityPresets.get(tier)!;
    this.reapplyAllShadows();
  }

  public update(frameTime: number): void {
    if (!this.config.enableDynamicQuality) return;

    // Smooth frame time averaging
    this.stats.averageFrameTime = this.stats.averageFrameTime * 0.9 + frameTime * 0.1;

    // Adjust quality if needed
    if (this.stats.averageFrameTime > this.config.targetFrameTime * 1.2) {
      this.decreaseQuality();
    } else if (this.stats.averageFrameTime < this.config.targetFrameTime * 0.8) {
      this.increaseQuality();
    }
  }

  private applyShadowQuality(light: THREE.Light): void {
    light.castShadow = true;

    if (light instanceof THREE.DirectionalLight) {
      light.shadow.mapSize.width = this.currentQuality.mapSize;
      light.shadow.mapSize.height = this.currentQuality.mapSize;
      light.shadow.camera.far = this.currentQuality.maxDistance;
      light.shadow.bias = this.currentQuality.bias;
      light.shadow.normalBias = this.currentQuality.normalBias;
      
      // Setup cascades (simplified)
      const d = this.currentQuality.maxDistance / 2;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;
    } else if (light instanceof THREE.SpotLight) {
      light.shadow.mapSize.width = this.currentQuality.mapSize;
      light.shadow.mapSize.height = this.currentQuality.mapSize;
      light.shadow.bias = this.currentQuality.bias;
      light.shadow.normalBias = this.currentQuality.normalBias;
    } else if (light instanceof THREE.PointLight) {
      light.shadow.mapSize.width = this.currentQuality.mapSize / 2; // Point lights use 6 faces
      light.shadow.mapSize.height = this.currentQuality.mapSize / 2;
      light.shadow.bias = this.currentQuality.bias;
      light.shadow.normalBias = this.currentQuality.normalBias;
    }
  }

  private reapplyAllShadows(): void {
    for (const light of this.activeLights) {
      this.applyShadowQuality(light);
    }
    this.updateStats();
  }

  private decreaseQuality(): void {
    const tiers: DeviceTier[] = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = tiers.indexOf(this.config.deviceTier);
    
    if (currentIndex < tiers.length - 1) {
      this.setDeviceTier(tiers[currentIndex + 1]);
      this.stats.qualityAdjustments++;
      console.log(`Shadow quality decreased to: ${this.config.deviceTier}`);
    }
  }

  private increaseQuality(): void {
    const tiers: DeviceTier[] = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = tiers.indexOf(this.config.deviceTier);
    
    if (currentIndex > 0) {
      this.setDeviceTier(tiers[currentIndex - 1]);
      this.stats.qualityAdjustments++;
      console.log(`Shadow quality increased to: ${this.config.deviceTier}`);
    }
  }

  private updateStats(): void {
    this.stats.activeShadowMaps = this.activeLights.filter(l => l.castShadow).length;
    
    // Estimate shadow memory usage
    const bytesPerPixel = 4; // RGBA
    let totalPixels = 0;
    
    for (const light of this.activeLights) {
      if (!light.castShadow) continue;
      
      // Type guard for lights with shadow property
      if (light instanceof THREE.DirectionalLight || 
          light instanceof THREE.SpotLight || 
          light instanceof THREE.PointLight) {
        const mapSize = light.shadow.mapSize.width * light.shadow.mapSize.height;
        if (light instanceof THREE.PointLight) {
          totalPixels += mapSize * 6; // 6 faces for cube map
        } else {
          totalPixels += mapSize;
        }
      }
    }
    
    this.stats.totalShadowMemoryMB = (totalPixels * bytesPerPixel) / (1024 * 1024);
  }

  public getStats() {
    return {
      ...this.stats,
      deviceTier: this.config.deviceTier,
      currentQuality: {
        mapSize: this.currentQuality.mapSize,
        cascades: this.currentQuality.cascades,
        maxDistance: this.currentQuality.maxDistance
      },
      budgetUsage: `${this.stats.activeShadowMaps}/${this.config.maxShadowMaps}`
    };
  }

  public dispose(): void {
    for (const light of this.activeLights) {
      light.castShadow = false;
    }
    this.activeLights = [];
  }
}
