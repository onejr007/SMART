/**
 * LODSystem.ts
 * [P1] LOD authoring pipeline
 * Dukung LOD auto-generate + impostor billboards untuk objek jauh
 */

import * as THREE from 'three';

export interface LODLevel {
  distance: number;
  mesh: THREE.Mesh | null;
  triangleCount?: number;
}

export interface LODConfig {
  enableAutoLOD: boolean;
  lodLevels: number[];
  impostorDistance: number;
  updateInterval: number; // ms
}

export const DEFAULT_LOD_CONFIG: LODConfig = {
  enableAutoLOD: true,
  lodLevels: [0, 50, 100, 200],
  impostorDistance: 500,
  updateInterval: 100
};

export class LODSystemManager {
  private config: LODConfig;
  private lodObjects: Map<string, THREE.LOD> = new Map();
  private impostors: Map<string, THREE.Sprite> = new Map();
  private camera: THREE.Camera | null = null;
  private lastUpdateTime: number = 0;
  
  constructor(config: LODConfig = DEFAULT_LOD_CONFIG) {
    this.config = { ...config };
  }
  
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }
  
  public createLOD(id: string, baseMesh: THREE.Mesh, scene: THREE.Scene): THREE.LOD {
    const lod = new THREE.LOD();
    
    // Add original mesh as highest detail level
    lod.addLevel(baseMesh, this.config.lodLevels[0]);
    
    // Generate simplified versions if auto-LOD is enabled
    if (this.config.enableAutoLOD) {
      for (let i = 1; i < this.config.lodLevels.length; i++) {
        const simplifiedMesh = this.generateSimplifiedMesh(baseMesh, i);
        if (simplifiedMesh) {
          lod.addLevel(simplifiedMesh, this.config.lodLevels[i]);
        }
      }
    }
    
    // Store LOD object
    this.lodObjects.set(id, lod);
    scene.add(lod);
    
    console.log(`📊 Created LOD for ${id} with ${lod.levels.length} levels`);
    return lod;
  }
  
  private generateSimplifiedMesh(baseMesh: THREE.Mesh, levelIndex: number): THREE.Mesh | null {
    // Simple decimation - in production, use proper mesh simplification library
    const geometry = baseMesh.geometry.clone();
    const material = baseMesh.material;
    
    // Calculate target triangle count (reduce by 50% each level)
    const reductionFactor = Math.pow(0.5, levelIndex);
    
    // Note: Actual mesh simplification would require a library like three-mesh-bvh or simplify-js
    // For now, we just create a copy with lower detail indication
    const simplifiedMesh = new THREE.Mesh(geometry, material);
    simplifiedMesh.userData.lodLevel = levelIndex;
    simplifiedMesh.userData.reductionFactor = reductionFactor;
    
    return simplifiedMesh;
  }
  
  public createImpostor(id: string, mesh: THREE.Mesh, scene: THREE.Scene): THREE.Sprite {
    // Create a billboard sprite as impostor
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    if (context) {
      // Simple placeholder - in production, render mesh to texture
      context.fillStyle = '#888888';
      context.fillRect(0, 0, 256, 256);
      context.fillStyle = '#ffffff';
      context.font = '20px Arial';
      context.fillText('LOD Impostor', 70, 128);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    // Match size to original mesh bounds
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    sprite.scale.set(size.x, size.y, 1);
    
    this.impostors.set(id, sprite);
    
    console.log(`🖼️ Created impostor for ${id}`);
    return sprite;
  }
  
  public update(currentTime: number): void {
    if (!this.camera || currentTime - this.lastUpdateTime < this.config.updateInterval) {
      return;
    }
    
    // Update all LOD objects
    for (const lod of this.lodObjects.values()) {
      lod.update(this.camera);
    }
    
    // Switch to impostors for very distant objects
    if (this.config.impostorDistance > 0) {
      this.updateImpostors();
    }
    
    this.lastUpdateTime = currentTime;
  }
  
  private updateImpostors(): void {
    if (!this.camera) return;
    
    const cameraPosition = this.camera.position;
    
    for (const [id, lod] of this.lodObjects.entries()) {
      const distance = cameraPosition.distanceTo(lod.position);
      const impostor = this.impostors.get(id);
      
      if (distance > this.config.impostorDistance) {
        // Switch to impostor
        if (impostor) {
          lod.visible = false;
          impostor.visible = true;
          impostor.position.copy(lod.position);
        }
      } else {
        // Use LOD mesh
        lod.visible = true;
        if (impostor) {
          impostor.visible = false;
        }
      }
    }
  }
  
  public getLOD(id: string): THREE.LOD | undefined {
    return this.lodObjects.get(id);
  }
  
  public getImpostor(id: string): THREE.Sprite | undefined {
    return this.impostors.get(id);
  }
  
  public removeLOD(id: string, scene: THREE.Scene): void {
    const lod = this.lodObjects.get(id);
    if (lod) {
      scene.remove(lod);
      this.lodObjects.delete(id);
    }
    
    const impostor = this.impostors.get(id);
    if (impostor) {
      scene.remove(impostor);
      impostor.material.map?.dispose();
      impostor.material.dispose();
      this.impostors.delete(id);
    }
  }
  
  public getStats() {
    let totalLevels = 0;
    for (const lod of this.lodObjects.values()) {
      totalLevels += lod.levels.length;
    }
    
    return {
      totalLODObjects: this.lodObjects.size,
      totalImpostors: this.impostors.size,
      totalLevels,
      avgLevelsPerObject: this.lodObjects.size > 0 ? totalLevels / this.lodObjects.size : 0,
      impostorDistance: this.config.impostorDistance,
      autoLODEnabled: this.config.enableAutoLOD
    };
  }
  
  public dispose(): void {
    for (const lod of this.lodObjects.values()) {
      for (const level of lod.levels) {
        if (level.object instanceof THREE.Mesh) {
          level.object.geometry.dispose();
          if (Array.isArray(level.object.material)) {
            level.object.material.forEach(m => m.dispose());
          } else {
            level.object.material.dispose();
          }
        }
      }
    }
    
    for (const impostor of this.impostors.values()) {
      impostor.material.map?.dispose();
      impostor.material.dispose();
    }
    
    this.lodObjects.clear();
    this.impostors.clear();
  }
}
