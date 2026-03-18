/**
 * Resource Manager (Rekomendasi #3, #33)
 * Dispose terpusat untuk Three.js resources dan tracking untuk mencegah memory leak
 */

import * as THREE from 'three';
import { eventBus } from './EventBus';

export interface ResourceStats {
  geometries: number;
  materials: number;
  textures: number;
  renderTargets: number;
  totalMemoryMB: number;
}

export class ResourceManager {
  private static instance: ResourceManager;
  
  private geometries: Set<THREE.BufferGeometry> = new Set();
  private materials: Set<THREE.Material> = new Set();
  private textures: Set<THREE.Texture> = new Set();
  private renderTargets: Set<THREE.WebGLRenderTarget> = new Set();
  
  private constructor() {}
  
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }
  
  // Track resources
  public trackGeometry(geometry: THREE.BufferGeometry): void {
    this.geometries.add(geometry);
  }
  
  public trackMaterial(material: THREE.Material): void {
    this.materials.add(material);
  }
  
  public trackTexture(texture: THREE.Texture): void {
    this.textures.add(texture);
  }
  
  public trackRenderTarget(target: THREE.WebGLRenderTarget): void {
    this.renderTargets.add(target);
  }
  
  // Dispose individual resources
  public disposeGeometry(geometry: THREE.BufferGeometry): void {
    geometry.dispose();
    this.geometries.delete(geometry);
  }
  
  public disposeMaterial(material: THREE.Material): void {
    material.dispose();
    this.materials.delete(material);
  }
  
  public disposeTexture(texture: THREE.Texture): void {
    texture.dispose();
    this.textures.delete(texture);
  }
  
  public disposeRenderTarget(target: THREE.WebGLRenderTarget): void {
    target.dispose();
    this.renderTargets.delete(target);
  }
  
  // Dispose object recursively
  public disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          this.disposeGeometry(child.geometry);
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.disposeMaterial(mat));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
  }
  
  // Dispose all tracked resources
  public disposeAll(): void {
    console.log('Disposing all resources...');
    
    this.geometries.forEach(geo => geo.dispose());
    this.materials.forEach(mat => mat.dispose());
    this.textures.forEach(tex => tex.dispose());
    this.renderTargets.forEach(rt => rt.dispose());
    
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
    this.renderTargets.clear();
    
    eventBus.emit('resources:disposed-all');
  }
  
  // Get resource statistics
  public getStats(): ResourceStats {
    const estimateMemory = () => {
      let total = 0;
      
      // Rough estimation
      this.geometries.forEach(geo => {
        const attrs = geo.attributes;
        for (const key in attrs) {
          total += attrs[key].array.byteLength;
        }
      });
      
      this.textures.forEach(tex => {
        if (tex.image && typeof tex.image === 'object') {
          const img = tex.image as any;
          const width = img.width || 0;
          const height = img.height || 0;
          total += width * height * 4; // RGBA
        }
      });
      
      return total / (1024 * 1024); // Convert to MB
    };
    
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size,
      renderTargets: this.renderTargets.size,
      totalMemoryMB: estimateMemory(),
    };
  }
  
  public logStats(): void {
    const stats = this.getStats();
    console.log('Resource Stats:', stats);
  }
}

export const resourceManager = ResourceManager.getInstance();
