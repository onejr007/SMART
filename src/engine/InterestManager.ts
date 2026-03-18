/**
 * Interest Manager (Rekomendasi #42)
 * Area-based interest management untuk multiplayer
 */

import * as THREE from 'three';
import { Entity } from './Entity';

export interface InterestArea {
  id: string;
  center: THREE.Vector3;
  radius: number;
  entities: Set<string>; // Entity UUIDs
  subscribers: Set<string>; // Player UUIDs
}

export class InterestManager {
  private areas: Map<string, InterestArea> = new Map();
  private entityToAreas: Map<string, Set<string>> = new Map(); // Entity UUID -> Area IDs
  private playerToAreas: Map<string, Set<string>> = new Map(); // Player UUID -> Area IDs
  
  /**
   * Create interest area
   */
  public createArea(id: string, center: THREE.Vector3, radius: number): InterestArea {
    const area: InterestArea = {
      id,
      center: center.clone(),
      radius,
      entities: new Set(),
      subscribers: new Set(),
    };
    
    this.areas.set(id, area);
    return area;
  }
  
  /**
   * Remove interest area
   */
  public removeArea(id: string): void {
    const area = this.areas.get(id);
    if (!area) return;
    
    // Clean up entity mappings
    area.entities.forEach(entityId => {
      const areas = this.entityToAreas.get(entityId);
      if (areas) {
        areas.delete(id);
        if (areas.size === 0) {
          this.entityToAreas.delete(entityId);
        }
      }
    });
    
    // Clean up player mappings
    area.subscribers.forEach(playerId => {
      const areas = this.playerToAreas.get(playerId);
      if (areas) {
        areas.delete(id);
        if (areas.size === 0) {
          this.playerToAreas.delete(playerId);
        }
      }
    });
    
    this.areas.delete(id);
  }
  
  /**
   * Update entity position and area membership
   */
  public updateEntity(entityId: string, position: THREE.Vector3): string[] {
    const oldAreas = this.entityToAreas.get(entityId) || new Set();
    const newAreas = new Set<string>();
    
    // Find which areas this entity is now in
    this.areas.forEach((area, areaId) => {
      const distance = position.distanceTo(area.center);
      if (distance <= area.radius) {
        newAreas.add(areaId);
        area.entities.add(entityId);
      } else {
        area.entities.delete(entityId);
      }
    });
    
    // Update mapping
    if (newAreas.size > 0) {
      this.entityToAreas.set(entityId, newAreas);
    } else {
      this.entityToAreas.delete(entityId);
    }
    
    // Return areas that changed
    const changedAreas: string[] = [];
    
    oldAreas.forEach(areaId => {
      if (!newAreas.has(areaId)) {
        changedAreas.push(areaId);
      }
    });
    
    newAreas.forEach(areaId => {
      if (!oldAreas.has(areaId)) {
        changedAreas.push(areaId);
      }
    });
    
    return changedAreas;
  }
  
  /**
   * Subscribe player to areas based on position
   */
  public updatePlayer(playerId: string, position: THREE.Vector3): void {
    const oldAreas = this.playerToAreas.get(playerId) || new Set();
    const newAreas = new Set<string>();
    
    // Find which areas this player can see
    this.areas.forEach((area, areaId) => {
      const distance = position.distanceTo(area.center);
      if (distance <= area.radius) {
        newAreas.add(areaId);
        area.subscribers.add(playerId);
      } else {
        area.subscribers.delete(playerId);
      }
    });
    
    // Update mapping
    if (newAreas.size > 0) {
      this.playerToAreas.set(playerId, newAreas);
    } else {
      this.playerToAreas.delete(playerId);
    }
  }
  
  /**
   * Get entities visible to a player
   */
  public getVisibleEntities(playerId: string): string[] {
    const areas = this.playerToAreas.get(playerId);
    if (!areas) return [];
    
    const entities = new Set<string>();
    
    areas.forEach(areaId => {
      const area = this.areas.get(areaId);
      if (area) {
        area.entities.forEach(entityId => entities.add(entityId));
      }
    });
    
    return Array.from(entities);
  }
  
  /**
   * Get players that can see an entity
   */
  public getInterestedPlayers(entityId: string): string[] {
    const areas = this.entityToAreas.get(entityId);
    if (!areas) return [];
    
    const players = new Set<string>();
    
    areas.forEach(areaId => {
      const area = this.areas.get(areaId);
      if (area) {
        area.subscribers.forEach(playerId => players.add(playerId));
      }
    });
    
    return Array.from(players);
  }
  
  /**
   * Remove entity from all areas
   */
  public removeEntity(entityId: string): void {
    const areas = this.entityToAreas.get(entityId);
    if (!areas) return;
    
    areas.forEach(areaId => {
      const area = this.areas.get(areaId);
      if (area) {
        area.entities.delete(entityId);
      }
    });
    
    this.entityToAreas.delete(entityId);
  }
  
  /**
   * Remove player from all areas
   */
  public removePlayer(playerId: string): void {
    const areas = this.playerToAreas.get(playerId);
    if (!areas) return;
    
    areas.forEach(areaId => {
      const area = this.areas.get(areaId);
      if (area) {
        area.subscribers.delete(playerId);
      }
    });
    
    this.playerToAreas.delete(playerId);
  }
  
  /**
   * Get statistics
   */
  public getStats() {
    return {
      areaCount: this.areas.size,
      entityCount: this.entityToAreas.size,
      playerCount: this.playerToAreas.size,
      areas: Array.from(this.areas.values()).map(area => ({
        id: area.id,
        entityCount: area.entities.size,
        subscriberCount: area.subscribers.size,
      })),
    };
  }
  
  public clear(): void {
    this.areas.clear();
    this.entityToAreas.clear();
    this.playerToAreas.clear();
  }
}

export const interestManager = new InterestManager();
