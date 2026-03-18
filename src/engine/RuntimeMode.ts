/**
 * RuntimeMode.ts
 * [P0] Pisahkan "runtime mode"
 * Beda config & subsystem untuk play, editor, dan headless
 */

export type RuntimeMode = 'play' | 'editor' | 'headless';

export interface ModeConfig {
  enablePhysics: boolean;
  enableRendering: boolean;
  enableAudio: boolean;
  enableNetworking: boolean;
  enableEditor: boolean;
  enableDebugTools: boolean;
  enableProfiling: boolean;
  targetFPS: number;
}

export const MODE_CONFIGS: Record<RuntimeMode, ModeConfig> = {
  play: {
    enablePhysics: true,
    enableRendering: true,
    enableAudio: true,
    enableNetworking: true,
    enableEditor: false,
    enableDebugTools: false,
    enableProfiling: false,
    targetFPS: 60
  },
  editor: {
    enablePhysics: true,
    enableRendering: true,
    enableAudio: false,
    enableNetworking: false,
    enableEditor: true,
    enableDebugTools: true,
    enableProfiling: true,
    targetFPS: 60
  },
  headless: {
    enablePhysics: true,
    enableRendering: false,
    enableAudio: false,
    enableNetworking: true,
    enableEditor: false,
    enableDebugTools: false,
    enableProfiling: false,
    targetFPS: 30
  }
};

export class RuntimeModeManager {
  private currentMode: RuntimeMode = 'play';
  private config: ModeConfig;
  
  constructor(mode: RuntimeMode = 'play') {
    this.currentMode = mode;
    this.config = { ...MODE_CONFIGS[mode] };
  }
  
  public getMode(): RuntimeMode {
    return this.currentMode;
  }
  
  public getConfig(): ModeConfig {
    return { ...this.config };
  }
  
  public isPlayMode(): boolean {
    return this.currentMode === 'play';
  }
  
  public isEditorMode(): boolean {
    return this.currentMode === 'editor';
  }
  
  public isHeadlessMode(): boolean {
    return this.currentMode === 'headless';
  }
  
  public setMode(mode: RuntimeMode): void {
    this.currentMode = mode;
    this.config = { ...MODE_CONFIGS[mode] };
    console.log(`🎮 Runtime mode changed to: ${mode}`);
  }
  
  public overrideConfig(partial: Partial<ModeConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
