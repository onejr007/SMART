/**
 * CollisionMatrix.ts
 * [P0] Layer/collision matrix
 * Definisikan layer untuk mengurangi pair-check
 */

export enum CollisionLayer {
  DEFAULT = 0,
  PLAYER = 1,
  NPC = 2,
  PROPS = 3,
  TRIGGER = 4,
  TERRAIN = 5,
  PROJECTILE = 6,
  STATIC = 7
}

export class CollisionMatrix {
  private matrix: Map<number, Set<number>> = new Map();
  
  constructor() {
    this.setupDefaultMatrix();
  }
  
  private setupDefaultMatrix(): void {
    // Player collides with: NPC, Props, Terrain, Static
    this.setCollision(CollisionLayer.PLAYER, CollisionLayer.NPC, true);
    this.setCollision(CollisionLayer.PLAYER, CollisionLayer.PROPS, true);
    this.setCollision(CollisionLayer.PLAYER, CollisionLayer.TERRAIN, true);
    this.setCollision(CollisionLayer.PLAYER, CollisionLayer.STATIC, true);
    this.setCollision(CollisionLayer.PLAYER, CollisionLayer.PROJECTILE, true);
    
    // NPC collides with: Player, NPC, Props, Terrain, Static
    this.setCollision(CollisionLayer.NPC, CollisionLayer.NPC, true);
    this.setCollision(CollisionLayer.NPC, CollisionLayer.PROPS, true);
    this.setCollision(CollisionLayer.NPC, CollisionLayer.TERRAIN, true);
    this.setCollision(CollisionLayer.NPC, CollisionLayer.STATIC, true);
    this.setCollision(CollisionLayer.NPC, CollisionLayer.PROJECTILE, true);
    
    // Props collide with: Player, NPC, Props, Terrain, Static
    this.setCollision(CollisionLayer.PROPS, CollisionLayer.PROPS, true);
    this.setCollision(CollisionLayer.PROPS, CollisionLayer.TERRAIN, true);
    this.setCollision(CollisionLayer.PROPS, CollisionLayer.STATIC, true);
    
    // Trigger collides with: Player, NPC (no physical collision, just detection)
    this.setCollision(CollisionLayer.TRIGGER, CollisionLayer.PLAYER, false);
    this.setCollision(CollisionLayer.TRIGGER, CollisionLayer.NPC, false);
    
    // Projectile collides with: Player, NPC, Props, Terrain, Static
    this.setCollision(CollisionLayer.PROJECTILE, CollisionLayer.TERRAIN, true);
    this.setCollision(CollisionLayer.PROJECTILE, CollisionLayer.STATIC, true);
    
    // Terrain and Static don't collide with each other
    this.setCollision(CollisionLayer.TERRAIN, CollisionLayer.STATIC, false);
  }
  
  public setCollision(layerA: CollisionLayer, layerB: CollisionLayer, enabled: boolean): void {
    if (!this.matrix.has(layerA)) {
      this.matrix.set(layerA, new Set());
    }
    if (!this.matrix.has(layerB)) {
      this.matrix.set(layerB, new Set());
    }
    
    if (enabled) {
      this.matrix.get(layerA)!.add(layerB);
      this.matrix.get(layerB)!.add(layerA);
    } else {
      this.matrix.get(layerA)!.delete(layerB);
      this.matrix.get(layerB)!.delete(layerA);
    }
  }
  
  public canCollide(layerA: CollisionLayer, layerB: CollisionLayer): boolean {
    const set = this.matrix.get(layerA);
    return set ? set.has(layerB) : false;
  }
  
  public getCollisionMask(layer: CollisionLayer): number {
    const set = this.matrix.get(layer);
    if (!set) return 0;
    
    let mask = 0;
    set.forEach(otherLayer => {
      mask |= (1 << otherLayer);
    });
    return mask;
  }
  
  public getLayerName(layer: CollisionLayer): string {
    return CollisionLayer[layer];
  }
  
  public printMatrix(): void {
    console.log('🎯 Collision Matrix:');
    for (const [layer, collisions] of this.matrix.entries()) {
      const layerName = this.getLayerName(layer);
      const collidesWith = Array.from(collisions).map(l => this.getLayerName(l)).join(', ');
      console.log(`  ${layerName} → [${collidesWith}]`);
    }
  }
}
