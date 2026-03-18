// 4. Preset kualitas render berbasis budget ms
export interface QualityPreset {
  name: string;
  targetFrameTime: number; // ms
  pixelRatio: number;
  shadowMapSize: number;
  shadowsEnabled: boolean;
  antialias: boolean;
  postProcessing: boolean;
  maxLights: number;
  lodBias: number;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: {
    name: 'Low',
    targetFrameTime: 33.3, // 30fps
    pixelRatio: 0.75,
    shadowMapSize: 512,
    shadowsEnabled: false,
    antialias: false,
    postProcessing: false,
    maxLights: 2,
    lodBias: 2
  },
  medium: {
    name: 'Medium',
    targetFrameTime: 22.2, // 45fps
    pixelRatio: 1.0,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    antialias: false,
    postProcessing: false,
    maxLights: 4,
    lodBias: 1
  },
  high: {
    name: 'High',
    targetFrameTime: 16.6, // 60fps
    pixelRatio: 1.0,
    shadowMapSize: 2048,
    shadowsEnabled: true,
    antialias: true,
    postProcessing: true,
    maxLights: 8,
    lodBias: 0
  },
  ultra: {
    name: 'Ultra',
    targetFrameTime: 11.1, // 90fps
    pixelRatio: window.devicePixelRatio || 1,
    shadowMapSize: 4096,
    shadowsEnabled: true,
    antialias: true,
    postProcessing: true,
    maxLights: 16,
    lodBias: -1
  }
};

export class QualityManager {
  private currentPreset: QualityPreset = QUALITY_PRESETS.medium;

  setPreset(name: keyof typeof QUALITY_PRESETS): void {
    this.currentPreset = QUALITY_PRESETS[name];
  }

  getPreset(): QualityPreset {
    return this.currentPreset;
  }

  autoDetect(avgFrameTime: number): void {
    if (avgFrameTime > 33) this.setPreset('low');
    else if (avgFrameTime > 22) this.setPreset('medium');
    else if (avgFrameTime > 16) this.setPreset('high');
    else this.setPreset('ultra');
  }
}
