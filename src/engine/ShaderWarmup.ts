/**
 * ShaderWarmup.ts
 * [P0] Shader warmup + pipeline cache
 * Compile shader/material di loading screen untuk menghindari stutter
 */

import * as THREE from 'three';

export class ShaderWarmupManager {
  private renderer: THREE.WebGLRenderer;
  private warmupSceneInternal: THREE.Scene;
  private warmupCamera: THREE.Camera;
  private compiledMaterials: Set<THREE.Material> = new Set();
  
  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.warmupSceneInternal = new THREE.Scene();
    this.warmupCamera = new THREE.PerspectiveCamera();
  }
  
  public async warmupMaterial(material: THREE.Material): Promise<void> {
    if (this.compiledMaterials.has(material)) {
      return;
    }
    
    // Create a simple mesh with the material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    this.warmupSceneInternal.add(mesh);
    
    // Compile the material
    this.renderer.compile(this.warmupSceneInternal, this.warmupCamera);
    
    // Clean up
    this.warmupSceneInternal.remove(mesh);
    geometry.dispose();
    
    this.compiledMaterials.add(material);
  }
  
  public async warmupMaterials(materials: THREE.Material[]): Promise<void> {
    console.log(`🔥 Warming up ${materials.length} materials...`);
    const start = performance.now();
    
    for (const material of materials) {
      await this.warmupMaterial(material);
    }
    
    const time = performance.now() - start;
    console.log(`✅ Material warmup complete in ${time.toFixed(2)}ms`);
  }
  
  public async warmupSceneContent(scene: THREE.Scene): Promise<void> {
    console.log('🔥 Warming up scene materials...');
    const start = performance.now();
    
    const materials: THREE.Material[] = [];
    scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          materials.push(...mesh.material);
        } else {
          materials.push(mesh.material);
        }
      }
    });
    
    // Remove duplicates
    const uniqueMaterials = Array.from(new Set(materials));
    await this.warmupMaterials(uniqueMaterials);
    
    const time = performance.now() - start;
    console.log(`✅ Scene warmup complete in ${time.toFixed(2)}ms`);
  }
  
  public warmupCommonShaders(): void {
    console.log('🔥 Warming up common shaders...');
    
    const commonMaterials = [
      new THREE.MeshBasicMaterial(),
      new THREE.MeshStandardMaterial(),
      new THREE.MeshPhongMaterial(),
      new THREE.MeshLambertMaterial(),
      new THREE.LineBasicMaterial(),
      new THREE.PointsMaterial()
    ];
    
    this.warmupMaterials(commonMaterials);
  }
  
  public isWarmedUp(material: THREE.Material): boolean {
    return this.compiledMaterials.has(material);
  }
  
  public getStats() {
    return {
      compiledMaterials: this.compiledMaterials.size
    };
  }
  
  public dispose(): void {
    this.compiledMaterials.clear();
    this.warmupSceneInternal.clear();
  }
}
