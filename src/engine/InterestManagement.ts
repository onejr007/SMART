/**
 * InterestManagement.ts
 * [P0] Interest management (AOI - Area of Interest)
 * Publish state hanya untuk entitas yang relevan (grid/cell) untuk scale
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Entity {
  id: string;
  position: Vector3;
  radius: number;
  type: string;
}

export interface InterestConfig {
  cellSize: number;
  interestRadius: number;
  updateInterval: number; // ms
  enableDynamicRadius: boolean;
}

export const DEFAULT_INTEREST_CONFIG: InterestConfig = {
  cellSize: 50,
  interestRadius: 100,
  updateInterval: 100,
  enableDynamicRadius: true
};

interface Cell {
  x: number;
  y: number;
  z: number;
  entities: Set<string>;
}

export class InterestManagementSystem {
  private config: InterestConfig;
  private grid: Map<string, Cell> = new Map();
  private entities: Map<string, Entity> = new Map();
  private playerInterests: Map<string, Set<string>> = new Map(); // playerId -> entityIds
  private lastUpdateTime: number = 0;
  
  constructor(config: InterestConfig = DEFAULT_INTEREST_CONFIG) {
    this.config = { ...config };
  }
  
  private getCellKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  private getCellCoords(position: Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(position.x / this.config.cellSize),
      y: Math.floor(position.y / this.config.cellSize),
      z: Math.floor(position.z / this.config.cellSize)
    };
  }
  
  private getOrCreateCell(x: number, y: number, z: number): Cell {
    const key = this.getCellKey(x, y, z);
    
    if (!this.grid.has(key)) {
      this.grid.set(key, {
        x, y, z,
        entities: new Set()
      });
    }
    
    return this.grid.get(key)!;
  }
  
  public registerEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.updateEntityCell(entity);
  }
  
  public unregisterEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    
    const coords = this.getCellCoords(entity.position);
    const cell = this.grid.get(this.getCellKey(coords.x, coords.y, coords.z));
    
    if (cell) {
      cell.entities.delete(entityId);
    }
    
    this.entities.delete(entityId);
  }
  
  public updateEntityPosition(entityId: string, newPosition: Vector3): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    
    const oldCoords = this.getCellCoords(entity.position);
    const newCoords = this.getCellCoords(newPosition);
    
    // Update position
    entity.position = newPosition;
    
    // If cell changed, update grid
    if (oldCoords.x !== newCoords.x || 
        oldCoords.y !== newCoords.y || 
        oldCoords.z !== newCoords.z) {
      this.updateEntityCell(entity);
    }
  }
  
  private updateEntityCell(entity: Entity): void {
    // Remove from old cell
    for (const cell of this.grid.values()) {
      cell.entities.delete(entity.id);
    }
    
    // Add to new cell
    const coords = this.getCellCoords(entity.position);
    const cell = this.getOrCreateCell(coords.x, coords.y, coords.z);
    cell.entities.add(entity.id);
  }
  
  public getEntitiesInRadius(position: Vector3, radius: number): string[] {
    const entities: string[] = [];
    const radiusSq = radius * radius;
    
    // Calculate cell range to check
    const cellRadius = Math.ceil(radius / this.config.cellSize);
    const centerCoords = this.getCellCoords(position);
    
    // Check all cells in range
    for (let x = centerCoords.x - cellRadius; x <= centerCoords.x + cellRadius; x++) {
      for (let y = centerCoords.y - cellRadius; y <= centerCoords.y + cellRadius; y++) {
        for (let z = centerCoords.z - cellRadius; z <= centerCoords.z + cellRadius; z++) {
          const cell = this.grid.get(this.getCellKey(x, y, z));
          if (!cell) continue;
          
          // Check each entity in cell
          for (const entityId of cell.entities) {
            const entity = this.entities.get(entityId);
            if (!entity) continue;
            
            const distSq = this.distanceSquared(position, entity.position);
            if (distSq <= radiusSq) {
              entities.push(entityId);
            }
          }
        }
      }
    }
    
    return entities;
  }
  
  private distanceSquared(a: Vector3, b: Vector3): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return dx * dx + dy * dy + dz * dz;
  }
  
  public updatePlayerInterest(playerId: string, playerPosition: Vector3): Set<string> {
    const radius = this.config.interestRadius;
    const interestedEntities = new Set(this.getEntitiesInRadius(playerPosition, radius));
    
    this.playerInterests.set(playerId, interestedEntities);
    return interestedEntities;
  }
  
  public getPlayerInterest(playerId: string): Set<string> {
    return this.playerInterests.get(playerId) || new Set();
  }
  
  public shouldSendToPlayer(playerId: string, entityId: string): boolean {
    const interest = this.playerInterests.get(playerId);
    return interest ? interest.has(entityId) : false;
  }
  
  public update(currentTime: number): void {
    if (currentTime - this.lastUpdateTime < this.config.updateInterval) {
      return;
    }
    
    // Update all player interests
    for (const [playerId, _] of this.playerInterests.entries()) {
      const playerEntity = this.entities.get(playerId);
      if (playerEntity) {
        this.updatePlayerInterest(playerId, playerEntity.position);
      }
    }
    
    this.lastUpdateTime = currentTime;
  }
  
  public getRelevantPlayers(entityId: string): string[] {
    const players: string[] = [];
    
    for (const [playerId, interest] of this.playerInterests.entries()) {
      if (interest.has(entityId)) {
        players.push(playerId);
      }
    }
    
    return players;
  }
  
  public getStats() {
    let totalEntitiesInCells = 0;
    for (const cell of this.grid.values()) {
      totalEntitiesInCells += cell.entities.size;
    }
    
    return {
      totalCells: this.grid.size,
      totalEntities: this.entities.size,
      totalPlayers: this.playerInterests.size,
      cellSize: this.config.cellSize,
      interestRadius: this.config.interestRadius,
      avgEntitiesPerCell: this.grid.size > 0 ? totalEntitiesInCells / this.grid.size : 0
    };
  }
  
  public dispose(): void {
    this.grid.clear();
    this.entities.clear();
    this.playerInterests.clear();
  }
}
