/**
 * Data Separation System
 * Simpan metadata game terpisah dari scene payload besar untuk memudahkan query & list
 */

interface GameMetadata {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  thumbnail: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  published: boolean;
  playCount: number;
  rating: number;
  ratingCount: number;
  size: number; // Scene payload size in bytes
  complexity: 'simple' | 'medium' | 'complex';
  minPlayers: number;
  maxPlayers: number;
  estimatedPlayTime: number; // minutes
  contentRating: 'everyone' | 'teen' | 'mature';
  featured: boolean;
  verified: boolean;
}

interface ScenePayload {
  gameId: string;
  version: string;
  entities: any[];
  settings: any;
  scripts: any[];
  assets: string[];
  checksum: string;
  compressedSize: number;
  uncompressedSize: number;
}

interface GameIndex {
  [gameId: string]: GameMetadata;
}

interface QueryOptions {
  category?: string;
  tags?: string[];
  author?: string;
  published?: boolean;
  featured?: boolean;
  verified?: boolean;
  minRating?: number;
  maxComplexity?: 'simple' | 'medium' | 'complex';
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'playCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class DataSeparation {
  private metadataCache = new Map<string, GameMetadata>();
  private sceneCache = new Map<string, ScenePayload>();
  private indexCache: GameIndex | null = null;
  private lastIndexUpdate = 0;
  private readonly indexCacheTime = 60000; // 1 minute

  constructor(
    private firebaseRef: any, // Firebase database reference
    private options = {
      enableMetadataCache: true,
      enableSceneCache: false, // Scenes are large, cache selectively
      maxMetadataCache: 1000,
      maxSceneCache: 10,
      compressionEnabled: true
    }
  ) {}

  /**
   * Save game dengan separation
   */
  async saveGame(gameId: string, metadata: Partial<GameMetadata>, sceneData: any): Promise<void> {
    const now = Date.now();
    
    // Prepare metadata
    const fullMetadata: GameMetadata = {
      id: gameId,
      title: metadata.title || 'Untitled Game',
      description: metadata.description || '',
      author: metadata.author || 'Unknown',
      authorId: metadata.authorId || '',
      category: metadata.category || 'other',
      tags: metadata.tags || [],
      thumbnail: metadata.thumbnail || '',
      version: metadata.version || '1.0.0',
      createdAt: metadata.createdAt || now,
      updatedAt: now,
      published: metadata.published || false,
      playCount: metadata.playCount || 0,
      rating: metadata.rating || 0,
      ratingCount: metadata.ratingCount || 0,
      size: 0, // Will be calculated
      complexity: this.calculateComplexity(sceneData),
      minPlayers: metadata.minPlayers || 1,
      maxPlayers: metadata.maxPlayers || 1,
      estimatedPlayTime: metadata.estimatedPlayTime || 10,
      contentRating: metadata.contentRating || 'everyone',
      featured: metadata.featured || false,
      verified: metadata.verified || false
    };

    // Prepare scene payload
    const scenePayload: ScenePayload = {
      gameId,
      version: fullMetadata.version,
      entities: sceneData.entities || [],
      settings: sceneData.settings || {},
      scripts: sceneData.scripts || [],
      assets: sceneData.assets || [],
      checksum: this.calculateChecksum(sceneData),
      compressedSize: 0,
      uncompressedSize: JSON.stringify(sceneData).length
    };

    // Compress scene data if enabled
    if (this.options.compressionEnabled) {
      scenePayload.compressedSize = await this.compressData(sceneData);
    }

    // Update metadata size
    fullMetadata.size = scenePayload.compressedSize || scenePayload.uncompressedSize;

    // Save to Firebase
    const batch = {
      [`games_metadata/${gameId}`]: fullMetadata,
      [`games_scenes/${gameId}`]: scenePayload
    };

    await this.firebaseRef.update(batch);

    // Update caches
    if (this.options.enableMetadataCache) {
      this.metadataCache.set(gameId, fullMetadata);
      this.invalidateIndexCache();
    }

    if (this.options.enableSceneCache) {
      this.sceneCache.set(gameId, scenePayload);
    }
  }

  /**
   * Load game metadata only
   */
  async loadGameMetadata(gameId: string): Promise<GameMetadata | null> {
    // Check cache first
    if (this.options.enableMetadataCache && this.metadataCache.has(gameId)) {
      return this.metadataCache.get(gameId)!;
    }

    // Load from Firebase
    const snapshot = await this.firebaseRef.child(`games_metadata/${gameId}`).once('value');
    const metadata = snapshot.val();

    if (metadata) {
      // Cache metadata
      if (this.options.enableMetadataCache) {
        this.metadataCache.set(gameId, metadata);
      }
      return metadata;
    }

    return null;
  }

  /**
   * Load scene data only
   */
  async loadSceneData(gameId: string): Promise<any | null> {
    // Check cache first
    if (this.options.enableSceneCache && this.sceneCache.has(gameId)) {
      const payload = this.sceneCache.get(gameId)!;
      return this.reconstructSceneData(payload);
    }

    // Load from Firebase
    const snapshot = await this.firebaseRef.child(`games_scenes/${gameId}`).once('value');
    const payload = snapshot.val();

    if (payload) {
      // Cache scene
      if (this.options.enableSceneCache) {
        this.manageSceneCache();
        this.sceneCache.set(gameId, payload);
      }
      
      return this.reconstructSceneData(payload);
    }

    return null;
  }

  /**
   * Query games by metadata
   */
  async queryGames(options: QueryOptions = {}): Promise<GameMetadata[]> {
    const index = await this.getGameIndex();
    let results = Object.values(index);

    // Apply filters
    if (options.category) {
      results = results.filter(game => game.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(game => 
        options.tags!.some(tag => game.tags.includes(tag))
      );
    }

    if (options.author) {
      results = results.filter(game => game.author === options.author);
    }

    if (options.published !== undefined) {
      results = results.filter(game => game.published === options.published);
    }

    if (options.featured !== undefined) {
      results = results.filter(game => game.featured === options.featured);
    }

    if (options.verified !== undefined) {
      results = results.filter(game => game.verified === options.verified);
    }

    if (options.minRating !== undefined) {
      results = results.filter(game => game.rating >= options.minRating!);
    }

    if (options.maxComplexity) {
      const complexityOrder = { simple: 0, medium: 1, complex: 2 };
      const maxLevel = complexityOrder[options.maxComplexity];
      results = results.filter(game => complexityOrder[game.complexity] <= maxLevel);
    }

    // Sort results
    if (options.sortBy) {
      results.sort((a, b) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];
        const order = options.sortOrder === 'desc' ? -1 : 1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        
        return 0;
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    
    return results.slice(offset, offset + limit);
  }

  /**
   * Get game index (cached)
   */
  private async getGameIndex(): Promise<GameIndex> {
    const now = Date.now();
    
    if (this.indexCache && (now - this.lastIndexUpdate) < this.indexCacheTime) {
      return this.indexCache;
    }

    // Load fresh index
    const snapshot = await this.firebaseRef.child('games_metadata').once('value');
    this.indexCache = snapshot.val() || {};
    this.lastIndexUpdate = now;

    return this.indexCache || {};
  }

  /**
   * Calculate scene complexity
   */
  private calculateComplexity(sceneData: any): 'simple' | 'medium' | 'complex' {
    const entityCount = sceneData.entities?.length || 0;
    const scriptCount = sceneData.scripts?.length || 0;
    const assetCount = sceneData.assets?.length || 0;
    
    const totalComplexity = entityCount + (scriptCount * 2) + (assetCount * 0.5);
    
    if (totalComplexity < 50) return 'simple';
    if (totalComplexity < 200) return 'medium';
    return 'complex';
  }

  /**
   * Calculate data checksum
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * Compress data (mock implementation)
   */
  private async compressData(data: any): Promise<number> {
    // In real implementation, use compression library
    const str = JSON.stringify(data);
    return Math.floor(str.length * 0.7); // Mock 30% compression
  }

  /**
   * Reconstruct scene data from payload
   */
  private reconstructSceneData(payload: ScenePayload): any {
    return {
      entities: payload.entities,
      settings: payload.settings,
      scripts: payload.scripts,
      assets: payload.assets
    };
  }

  /**
   * Manage scene cache size
   */
  private manageSceneCache(): void {
    if (this.sceneCache.size >= this.options.maxSceneCache) {
      // Remove oldest entry
      const firstKey = this.sceneCache.keys().next().value;
      if (firstKey) {
        this.sceneCache.delete(firstKey);
      }
    }
  }

  /**
   * Invalidate index cache
   */
  private invalidateIndexCache(): void {
    this.indexCache = null;
    this.lastIndexUpdate = 0;
  }

  /**
   * Update game stats
   */
  async updateGameStats(gameId: string, stats: Partial<Pick<GameMetadata, 'playCount' | 'rating' | 'ratingCount'>>): Promise<void> {
    const updates: any = {};
    
    if (stats.playCount !== undefined) {
      updates[`games_metadata/${gameId}/playCount`] = stats.playCount;
    }
    
    if (stats.rating !== undefined) {
      updates[`games_metadata/${gameId}/rating`] = stats.rating;
    }
    
    if (stats.ratingCount !== undefined) {
      updates[`games_metadata/${gameId}/ratingCount`] = stats.ratingCount;
    }

    await this.firebaseRef.update(updates);

    // Update cache
    if (this.metadataCache.has(gameId)) {
      const metadata = this.metadataCache.get(gameId)!;
      Object.assign(metadata, stats);
    }

    this.invalidateIndexCache();
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.metadataCache.clear();
    this.sceneCache.clear();
    this.invalidateIndexCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      metadataCache: {
        size: this.metadataCache.size,
        maxSize: this.options.maxMetadataCache
      },
      sceneCache: {
        size: this.sceneCache.size,
        maxSize: this.options.maxSceneCache
      },
      indexCacheAge: Date.now() - this.lastIndexUpdate
    };
  }
}