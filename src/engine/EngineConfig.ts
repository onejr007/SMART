/**
 * Centralized Engine Configuration (Rekomendasi #5)
 * Sentralisasi konfigurasi runtime untuk tuning performa yang terukur
 */

export interface EngineConfig {
  // Physics
  gravity: number;
  timeScale: number;
  fixedTimeStep: number;
  maxSubSteps: number;
  
  // Rendering
  targetFPS: number;
  maxDeltaTime: number; // Delta clamp untuk mencegah spiral of death
  pixelRatioMax: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  
  // World
  worldUnit: number; // 1 unit = X meters
  
  // Performance
  enableFrustumCulling: boolean;
  enableLOD: boolean;
  enableInstancing: boolean;
  
  // Network
  networkTickRate: number;
  
  // Debug
  showPerformanceOverlay: boolean;
  enableAuditLog: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  gravity: -9.82,
  timeScale: 1.0,
  fixedTimeStep: 1 / 60,
  maxSubSteps: 3,
  
  targetFPS: 60,
  maxDeltaTime: 0.1, // 100ms max delta
  pixelRatioMax: 2.0,
  shadowQuality: 'medium',
  
  worldUnit: 1.0,
  
  enableFrustumCulling: true,
  enableLOD: true,
  enableInstancing: true,
  
  networkTickRate: 20,
  
  showPerformanceOverlay: false,
  enableAuditLog: true,
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: EngineConfig;
  
  private constructor() {
    this.config = { ...DEFAULT_ENGINE_CONFIG };
  }
  
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  public get(): EngineConfig {
    return { ...this.config };
  }
  
  public set(partial: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...partial };
  }
  
  public reset(): void {
    this.config = { ...DEFAULT_ENGINE_CONFIG };
  }
  
  public getShadowMapSize(): number {
    switch (this.config.shadowQuality) {
      case 'off': return 0;
      case 'low': return 512;
      case 'medium': return 1024;
      case 'high': return 2048;
      default: return 1024;
    }
  }
}

export const configManager = ConfigManager.getInstance();
