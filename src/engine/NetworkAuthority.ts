/**
 * NetworkAuthority.ts
 * [P0] Network authority model
 * Tentukan server-authoritative, host-authoritative, atau p2p + arbitration
 */

export enum AuthorityMode {
  SERVER_AUTHORITATIVE = 'server-authoritative',
  HOST_AUTHORITATIVE = 'host-authoritative',
  P2P_ARBITRATION = 'p2p-arbitration',
  CLIENT_ONLY = 'client-only'
}

export interface AuthorityConfig {
  mode: AuthorityMode;
  enableAntiCheat: boolean;
  enableStateValidation: boolean;
  maxClientPredictionTime: number; // ms
}

export const DEFAULT_AUTHORITY_CONFIG: AuthorityConfig = {
  mode: AuthorityMode.HOST_AUTHORITATIVE,
  enableAntiCheat: true,
  enableStateValidation: true,
  maxClientPredictionTime: 100
};

export interface EntityAuthority {
  entityId: string;
  ownerId: string;
  authorityLevel: 'full' | 'partial' | 'none';
  canModify: string[]; // list of properties that can be modified
}

export class NetworkAuthorityManager {
  private config: AuthorityConfig;
  private localPlayerId: string = '';
  private authorityMap: Map<string, EntityAuthority> = new Map();
  private serverPlayerId: string = 'server';
  
  constructor(config: AuthorityConfig = DEFAULT_AUTHORITY_CONFIG) {
    this.config = { ...config };
    console.log(`🔐 Network Authority Mode: ${this.config.mode}`);
  }
  
  public setLocalPlayer(playerId: string): void {
    this.localPlayerId = playerId;
  }
  
  public registerEntity(entityId: string, ownerId: string, authorityLevel: 'full' | 'partial' | 'none' = 'full'): void {
    const authority: EntityAuthority = {
      entityId,
      ownerId,
      authorityLevel,
      canModify: authorityLevel === 'full' ? ['*'] : []
    };
    
    this.authorityMap.set(entityId, authority);
  }
  
  public canModifyEntity(entityId: string, playerId: string): boolean {
    const authority = this.authorityMap.get(entityId);
    if (!authority) return false;
    
    switch (this.config.mode) {
      case AuthorityMode.SERVER_AUTHORITATIVE:
        // Only server can modify
        return playerId === this.serverPlayerId;
        
      case AuthorityMode.HOST_AUTHORITATIVE:
        // Server or owner can modify
        return playerId === this.serverPlayerId || playerId === authority.ownerId;
        
      case AuthorityMode.P2P_ARBITRATION:
        // Owner can modify, others need arbitration
        return playerId === authority.ownerId;
        
      case AuthorityMode.CLIENT_ONLY:
        // Anyone can modify (no multiplayer)
        return true;
        
      default:
        return false;
    }
  }
  
  public canModifyProperty(entityId: string, playerId: string, property: string): boolean {
    if (!this.canModifyEntity(entityId, playerId)) return false;
    
    const authority = this.authorityMap.get(entityId);
    if (!authority) return false;
    
    if (authority.canModify.includes('*')) return true;
    return authority.canModify.includes(property);
  }
  
  public validateStateChange(entityId: string, playerId: string, oldState: any, newState: any): boolean {
    if (!this.config.enableStateValidation) return true;
    if (!this.canModifyEntity(entityId, playerId)) return false;
    
    // Basic validation rules
    if (this.config.enableAntiCheat) {
      // Check for impossible state changes
      if (newState.position && oldState.position) {
        const distance = this.calculateDistance(oldState.position, newState.position);
        const maxSpeed = 100; // units per second
        const timeDelta = (newState.timestamp - oldState.timestamp) / 1000;
        
        if (distance > maxSpeed * timeDelta) {
          console.warn(`⚠️ Anti-cheat: Impossible movement detected for entity ${entityId}`);
          return false;
        }
      }
    }
    
    return true;
  }
  
  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  public transferAuthority(entityId: string, newOwnerId: string): boolean {
    const authority = this.authorityMap.get(entityId);
    if (!authority) return false;
    
    // Only server can transfer authority in server-authoritative mode
    if (this.config.mode === AuthorityMode.SERVER_AUTHORITATIVE) {
      console.warn('⚠️ Cannot transfer authority in server-authoritative mode');
      return false;
    }
    
    authority.ownerId = newOwnerId;
    console.log(`🔄 Authority transferred for entity ${entityId} to ${newOwnerId}`);
    return true;
  }
  
  public getEntityAuthority(entityId: string): EntityAuthority | undefined {
    return this.authorityMap.get(entityId);
  }
  
  public isLocalAuthority(entityId: string): boolean {
    return this.canModifyEntity(entityId, this.localPlayerId);
  }
  
  public getStats() {
    return {
      mode: this.config.mode,
      antiCheatEnabled: this.config.enableAntiCheat,
      validationEnabled: this.config.enableStateValidation,
      totalEntities: this.authorityMap.size,
      localAuthority: Array.from(this.authorityMap.values())
        .filter(a => a.ownerId === this.localPlayerId).length
    };
  }
  
  public dispose(): void {
    this.authorityMap.clear();
  }
}
