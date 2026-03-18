// 1. World/Room/Shard management dengan batas entity
export interface ShardConfig {
  maxEntities: number;
  maxPlayers: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

export class WorldManager {
  private shards: Map<string, Shard> = new Map();
  private defaultConfig: ShardConfig = {
    maxEntities: 1000,
    maxPlayers: 50,
    bounds: { min: [-500, -100, -500], max: [500, 100, 500] }
  };

  createShard(id: string, config?: Partial<ShardConfig>): Shard {
    const shard = new Shard(id, { ...this.defaultConfig, ...config });
    this.shards.set(id, shard);
    return shard;
  }

  getShard(id: string): Shard | undefined {
    return this.shards.get(id);
  }

  removeShard(id: string): void {
    const shard = this.shards.get(id);
    if (shard) {
      shard.dispose();
      this.shards.delete(id);
    }
  }
}

export class Shard {
  private entities: Set<string> = new Set();
  private players: Set<string> = new Set();

  constructor(public id: string, public config: ShardConfig) {}

  canAddEntity(): boolean {
    return this.entities.size < this.config.maxEntities;
  }

  canAddPlayer(): boolean {
    return this.players.size < this.config.maxPlayers;
  }

  addEntity(entityId: string): boolean {
    if (!this.canAddEntity()) return false;
    this.entities.add(entityId);
    return true;
  }

  addPlayer(playerId: string): boolean {
    if (!this.canAddPlayer()) return false;
    this.players.add(playerId);
    return true;
  }

  removeEntity(entityId: string): void {
    this.entities.delete(entityId);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  dispose(): void {
    this.entities.clear();
    this.players.clear();
  }
}
