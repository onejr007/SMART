/**
 * LOD Manager (Rekomendasi #28)
 * Level of Detail management untuk optimasi rendering
 */

import * as THREE from 'three';
import { Entity } from './Entity';

export interface LODConfig {
  distances: number[]; // [near, medium, far]
  enabled: boolean;
}

export class LODManager {
  private camera: THREE.Camera;
  private config: LODConfig;
  private lodEntities: Map<string, Entity> = new Map();
  
  constructor(camera: THREE.Camera, config?: Partial<LODConfig>) {
    this.camera = camera;
    this.config = {
      distances: [10, 50, 100],
      enabled: true,
      ...config,
    };
  }
  
  public registerEntity(entity: Entity): void {
    if (entity.lod) {
      this.lodEntities.set(entity.name, entity);
    }
  }
  
  public unregisterEntity(entityName: string): void {
    this.lodEntities.delete(entityName);
  }
  
  public update(): void {
    if (!this.config.enabled) return;
    
    const cameraPosition = this.camera.position;
    
    this.lodEntities.forEach(entity => {
      if (!entity.lod) return;
      
      const distance = entity.mesh.position.distanceTo(cameraPosition);
      entity.lod.update(this.camera);
      
      // Additional optimization: disable physics for far entities
      if (distance > this.config.distances[2]) {
        entity.body.sleep();
      } else if (entity.body.sleepState === 2) {
        entity.body.wakeUp();
      }
    });
  }
  
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
  
  public setDistances(distances: number[]): void {
    this.config.distances = distances;
  }
  
  public getStats() {
    let sleeping = 0;
    let awake = 0;
    
    this.lodEntities.forEach(entity => {
      if (entity.body.sleepState === 2) {
        sleeping++;
      } else {
        awake++;
      }
    });
    
    return {
      totalLODEntities: this.lodEntities.size,
      sleepingBodies: sleeping,
      awakeBodies: awake,
    };
  }
  
  public clear(): void {
    this.lodEntities.clear();
  }
}
