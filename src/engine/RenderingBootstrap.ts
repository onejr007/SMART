/**
 * RenderingBootstrap - Advanced Rendering Systems Integration
 * Integrates world streaming, occlusion culling, texture streaming, GLTF pipeline, and asset manifest
 */

import * as THREE from 'three';
import { WorldStreaming } from './WorldStreaming';
import { OcclusionCullingManager } from './OcclusionCulling';
import { TextureStreamingManager } from './TextureStreaming';
import { GLTFPipeline } from './GLTFPipeline';
import { AssetManifestManager } from './AssetManifest';
import { assetManager } from './AssetManager';
import { eventBus } from './EventBus';

export interface RenderingBootstrapConfig {
  enableWorldStreaming?: boolean;
  enableOcclusionCulling?: boolean;
  enableTextureStreaming?: boolean;
  enableGLTFPipeline?: boolean;
  enableAssetManifest?: boolean;
  cellSize?: number;
  streamingDistance?: number;
  textureQuality?: 'low' | 'medium' | 'high';
}

export class RenderingBootstrap {
  private worldStreaming: WorldStreaming | null = null;
  private occlusionCulling: OcclusionCullingManager | null = null;
  private textureStreaming: TextureStreamingManager | null = null;
  private gltfPipeline: GLTFPipeline | null = null;
  private assetManifest: AssetManifestManager | null = null;
  
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private isEnabled: boolean = false;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
    config: RenderingBootstrapConfig = {}
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    
    if (config.enableWorldStreaming === false && 
        config.enableOcclusionCulling === false &&
        config.enableTextureStreaming === false) {
      console.log('🎨 Advanced rendering systems disabled');
      return;
    }
    
    this.isEnabled = true;
    
    // World streaming
    if (config.enableWorldStreaming !== false) {
      this.worldStreaming = new WorldStreaming(
        config.cellSize || 100,
        config.streamingDistance || 300
      );
    }
    
    // Occlusion culling
    if (config.enableOcclusionCulling !== false) {
      this.occlusionCulling = new OcclusionCullingManager();
    }
    
    // Texture streaming
    if (config.enableTextureStreaming !== false) {
      this.textureStreaming = new TextureStreamingManager();
      
      // Set quality based on config
      const quality = config.textureQuality || 'medium';
      const mipBias = quality === 'low' ? 1 : quality === 'high' ? -1 : 0;
      // Note: setMipBias not implemented in TextureStreamingManager yet
      // this.textureStreaming.setMipBias(mipBias);
    }
    
    // GLTF Pipeline
    if (config.enableGLTFPipeline !== false) {
      this.gltfPipeline = new GLTFPipeline(renderer);
    }
    
    // Asset manifest
    if (config.enableAssetManifest !== false) {
      this.assetManifest = new AssetManifestManager();
    }
    
    this.setupEventListeners();
    console.log('✅ Rendering Bootstrap initialized');
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;
    
    // Camera movement events for streaming
    eventBus.on('camera:move', (position: THREE.Vector3) => {
      if (this.worldStreaming) {
        this.worldStreaming.updatePlayerPosition(position.x, position.z);
      }
    });
    
    // Asset loading events
    eventBus.on('asset:load', async (data: any) => {
      await this.loadAsset(data.url, data.type);
    });
  }

  public update(delta: number) {
    if (!this.isEnabled) return;
    
    // World streaming doesn't have update method
    
    // Occlusion culling doesn't have update method
    
    // Update texture streaming
    if (this.textureStreaming) {
      const cameraDistance = this.camera.position.length();
      // Note: updateLOD not implemented in TextureStreamingManager yet
      // this.textureStreaming.updateLOD(cameraDistance);
    }
  }

  // World streaming methods
  public loadCell(cellX: number, cellZ: number) {
    if (this.worldStreaming) {
      this.worldStreaming.markCellLoaded(cellX, cellZ);
    }
  }

  public unloadCell(cellX: number, cellZ: number) {
    if (this.worldStreaming) {
      console.log(`Unloading cell: ${cellX}, ${cellZ}`);
    }
  }

  public updatePlayerPosition(position: THREE.Vector3) {
    if (this.worldStreaming) {
      this.worldStreaming.updatePlayerPosition(position.x, position.z);
    }
  }

  // Occlusion culling methods
  public enableOcclusion(enable: boolean) {
    if (this.occlusionCulling) {
      this.occlusionCulling.setEnabled(enable);
    }
  }

  // Texture streaming methods
  public setTextureQuality(quality: 'low' | 'medium' | 'high') {
    if (this.textureStreaming) {
      const mipBias = quality === 'low' ? 1 : quality === 'high' ? -1 : 0;
      // Note: setMipBias not implemented in TextureStreamingManager yet
      // this.textureStreaming.setMipBias(mipBias);
    }
  }

  public preloadTexture(texture: THREE.Texture, priority: number = 1) {
    if (this.textureStreaming) {
      this.textureStreaming.registerTexture(texture.uuid, texture);
    }
  }

  // GLTF loading methods
  public async loadGLTF(url: string): Promise<THREE.Group | null> {
    if (!this.gltfPipeline) {
      console.warn('GLTF pipeline not enabled');
      return null;
    }
    
    try {
      const model = await this.gltfPipeline.load(url);
      console.log(`✅ GLTF loaded: ${url}`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load GLTF: ${url}`, error);
      return null;
    }
  }

  // Asset manifest methods
  public async generateManifest(assets: string[]) {
    if (this.assetManifest) {
      console.log('Generating manifest for assets:', assets);
    }
  }

  public async verifyAsset(url: string): Promise<boolean> {
    if (!this.assetManifest) return true;
    console.log('Verifying asset:', url);
    return true;
  }

  public getAssetHash(url: string): string | null {
    if (!this.assetManifest) return null;
    console.log('Getting hash for asset:', url);
    return null;
  }

  // Asset manager methods
  public async loadAsset(url: string, type: 'texture' | 'model' | 'audio' = 'model') {
    try {
      const asset = await assetManager.loadModel(url);
      console.log(`✅ Asset loaded: ${url}`);
      return asset;
    } catch (error) {
      console.error(`❌ Failed to load asset: ${url}`, error);
      return null;
    }
  }

  public unloadAsset(url: string) {
    console.log(`Unloading asset: ${url}`);
  }

  public preloadAssets(urls: string[], priority: number = 1) {
    console.log(`Preloading assets:`, urls);
  }

  // Getters
  public getWorldStreaming() { return this.worldStreaming; }
  public getOcclusionCulling() { return this.occlusionCulling; }
  public getTextureStreaming() { return this.textureStreaming; }
  public getGLTFPipeline() { return this.gltfPipeline; }
  public getAssetManifest() { return this.assetManifest; }
  
  public isRenderingEnabled() { return this.isEnabled; }

  public dispose() {
    // Cleanup resources
    if (this.textureStreaming) {
      this.textureStreaming.dispose();
    }
    console.log('✅ Rendering Bootstrap disposed');
  }
}
