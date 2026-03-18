/**
 * Spatial Grid (Rekomendasi #26)
 * Struktur spasial untuk mempercepat raycasting dan culling
 */

import * as THREE from 'three';
import { Entity } from './Entity';

export interface GridCell {
  x: number;
  y: number;
  z: number;
  entities: Set<Entity>;
}

export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, GridCell> = new Map();
  
  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
  }
  
  private getCellKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  private worldToCell(position: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize),
    };
  }
  
  public addEntity(entity: Entity): void {
    const cellCoords = this.worldToCell(entity.mesh.position);
    const key = this.getCellKey(cellCoords.x, cellCoords.y, cellCoords.z);
    
    if (!this.cells.has(key)) {
      this.cells.set(key, {
        ...cellCoords,
        entities: new Set(),
      });
    }
    
    this.cells.get(key)!.entities.add(entity);
  }
  
  public removeEntity(entity: Entity): void {
    const cellCoords = this.worldToCell(entity.mesh.position);
    const key = this.getCellKey(cellCoords.x, cellCoords.y, cellCoords.z);
    
    const cell = this.cells.get(key);
    if (cell) {
      cell.entities.delete(entity);
      
      // Remove empty cells
      if (cell.entities.size === 0) {
        this.cells.delete(key);
      }
    }
  }
  
  public updateEntity(entity: Entity, oldPosition: THREE.Vector3): void {
    const oldCell = this.worldToCell(oldPosition);
    const newCell = this.worldToCell(entity.mesh.position);
    
    // Only update if entity moved to different cell
    if (oldCell.x !== newCell.x || oldCell.y !== newCell.y || oldCell.z !== newCell.z) {
      this.removeEntity(entity);
      this.addEntity(entity);
    }
  }
  
  public getEntitiesInRadius(position: THREE.Vector3, radius: number): Entity[] {
    const entities: Set<Entity> = new Set();
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCell = this.worldToCell(position);
    
    // Check all cells within radius
    for (let x = centerCell.x - cellRadius; x <= centerCell.x + cellRadius; x++) {
      for (let y = centerCell.y - cellRadius; y <= centerCell.y + cellRadius; y++) {
        for (let z = centerCell.z - cellRadius; z <= centerCell.z + cellRadius; z++) {
          const key = this.getCellKey(x, y, z);
          const cell = this.cells.get(key);
          
          if (cell) {
            cell.entities.forEach(entity => {
              const distance = entity.mesh.position.distanceTo(position);
              if (distance <= radius) {
                entities.add(entity);
              }
            });
          }
        }
      }
    }
    
    return Array.from(entities);
  }
  
  public raycast(raycaster: THREE.Raycaster, maxDistance: number = Infinity): Entity[] {
    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;
    
    // Get cells along ray path
    const cellsToCheck = this.getCellsAlongRay(origin, direction, maxDistance);
    const entities: Set<Entity> = new Set();
    
    cellsToCheck.forEach(key => {
      const cell = this.cells.get(key);
      if (cell) {
        cell.entities.forEach(entity => entities.add(entity));
      }
    });
    
    return Array.from(entities);
  }
  
  private getCellsAlongRay(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): string[] {
    const cells: Set<string> = new Set();
    const step = this.cellSize / 2;
    const steps = Math.ceil(maxDistance / step);
    
    for (let i = 0; i <= steps; i++) {
      const point = origin.clone().add(direction.clone().multiplyScalar(i * step));
      const cellCoords = this.worldToCell(point);
      cells.add(this.getCellKey(cellCoords.x, cellCoords.y, cellCoords.z));
    }
    
    return Array.from(cells);
  }
  
  public clear(): void {
    this.cells.clear();
  }
  
  public getCellCount(): number {
    return this.cells.size;
  }
  
  public getEntityCount(): number {
    let count = 0;
    this.cells.forEach(cell => count += cell.entities.size);
    return count;
  }
}
