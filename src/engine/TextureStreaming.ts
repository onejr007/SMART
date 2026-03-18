/**
 * TextureStreaming.ts
 * [P0] Texture streaming + eviction policy
 * Budget VRAM dengan strategi evict (LRU/priority) untuk mencegah OOM
 */

import * as THREE from 'three';

export interface TextureStreamingConfig {
  vramBudgetMB: number;
  evictionPolicy: 'LRU' | 'PRIORITY';
  minTextureSize: number;
  maxTextureSize: number;
}

export const DEFAULT_TEXTURE_STREAMING_CONFIG: TextureStreamingConfig = {
  vramBudgetMB: 512,
  evictionPolicy: 'LRU',
  minTextureSize: 64,
  maxTextureSize: 2048
};

interface TextureEntry {
  texture: THREE.Texture;
  size: number;
  lastUsed: number;
  priority: number;
  loaded: boolean;
}

export class TextureStreamingManager {
  private config: TextureStreamingConfig;
  private textureCache: Map<string, TextureEntry> = new Map();
  private currentVRAMUsage: number = 0;
  private loadQueue: string[] = [];
  private evictionQueue: string[] = [];
  
  constructor(config: TextureStreamingConfig = DEFAULT_TEXTURE_STREAMING_CONFIG) {
    this.config = { ...config };
    this.detectPlatformBudget();
  }
  
  private detectPlatformBudget(): void {
    // Adjust budget based on platform
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      this.config.vramBudgetMB = Math.min(this.config.vramBudgetMB, 256);
    }
    
    console.log(`📦 Texture streaming budget: ${this.config.vramBudgetMB}MB`);
  }
  
  public registerTexture(id: string, texture: THREE.Texture, priority: number = 1): void {
    const size = this.estimateTextureSize(texture);
    
    const entry: TextureEntry = {
      texture,
      size,
      lastUsed: Date.now(),
      priority,
      loaded: false
    };
    
    this.textureCache.set(id, entry);
  }
  
  private estimateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 0;
    
    const image = texture.image as any;
    const width = image.width || this.config.minTextureSize;
    const height = image.height || this.config.minTextureSize;
    
    // Estimate bytes per pixel (RGBA = 4 bytes)
    let bytesPerPixel = 4;
    
    // Account for mipmaps (adds ~33% more memory)
    const mipmapMultiplier = texture.generateMipmaps ? 1.33 : 1.0;
    
    const sizeBytes = width * height * bytesPerPixel * mipmapMultiplier;
    return sizeBytes / (1024 * 1024); // Convert to MB
  }
  
  public async loadTexture(id: string): Promise<void> {
    const entry = this.textureCache.get(id);
    if (!entry || entry.loaded) return;
    
    // Check if we need to evict textures
    while (this.currentVRAMUsage + entry.size > this.config.vramBudgetMB) {
      await this.evictTexture();
    }
    
    // Load texture
    entry.loaded = true;
    entry.lastUsed = Date.now();
    this.currentVRAMUsage += entry.size;
    
    console.log(`📥 Loaded texture ${id} (${entry.size.toFixed(2)}MB) - VRAM: ${this.currentVRAMUsage.toFixed(2)}/${this.config.vramBudgetMB}MB`);
  }
  
  public useTexture(id: string): void {
    const entry = this.textureCache.get(id);
    if (!entry) return;
    
    entry.lastUsed = Date.now();
    
    if (!entry.loaded) {
      this.loadQueue.push(id);
    }
  }
  
  private async evictTexture(): Promise<void> {
    if (this.textureCache.size === 0) return;
    
    let victimId: string | null = null;
    
    if (this.config.evictionPolicy === 'LRU') {
      // Evict least recently used
      let oldestTime = Date.now();
      
      for (const [id, entry] of this.textureCache.entries()) {
        if (entry.loaded && entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          victimId = id;
        }
      }
    } else {
      // Evict lowest priority
      let lowestPriority = Infinity;
      
      for (const [id, entry] of this.textureCache.entries()) {
        if (entry.loaded && entry.priority < lowestPriority) {
          lowestPriority = entry.priority;
          victimId = id;
        }
      }
    }
    
    if (victimId) {
      const entry = this.textureCache.get(victimId)!;
      entry.texture.dispose();
      entry.loaded = false;
      this.currentVRAMUsage -= entry.size;
      
      console.log(`📤 Evicted texture ${victimId} (${entry.size.toFixed(2)}MB) - VRAM: ${this.currentVRAMUsage.toFixed(2)}/${this.config.vramBudgetMB}MB`);
    }
  }
  
  public async processLoadQueue(): Promise<void> {
    while (this.loadQueue.length > 0) {
      const id = this.loadQueue.shift()!;
      await this.loadTexture(id);
    }
  }
  
  public getStats() {
    const loadedTextures = Array.from(this.textureCache.values()).filter(e => e.loaded).length;
    
    return {
      totalTextures: this.textureCache.size,
      loadedTextures,
      vramUsage: this.currentVRAMUsage,
      vramBudget: this.config.vramBudgetMB,
      vramUsagePercent: (this.currentVRAMUsage / this.config.vramBudgetMB) * 100,
      queuedLoads: this.loadQueue.length,
      evictionPolicy: this.config.evictionPolicy
    };
  }
  
  public setVRAMBudget(mb: number): void {
    this.config.vramBudgetMB = mb;
  }
  
  public dispose(): void {
    for (const entry of this.textureCache.values()) {
      if (entry.loaded) {
        entry.texture.dispose();
      }
    }
    this.textureCache.clear();
    this.currentVRAMUsage = 0;
    this.loadQueue = [];
  }
}
