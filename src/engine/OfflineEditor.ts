/**
 * OfflineEditor.ts
 * [P1] Offline-first editor
 * Autosave ke local (IndexedDB) lalu sync saat online untuk UX editor lebih kuat
 */

export interface EditorState {
  id: string;
  gameId: string;
  userId: string;
  sceneData: any;
  timestamp: number;
  version: number;
  synced: boolean;
}

export interface OfflineConfig {
  dbName: string;
  storeName: string;
  autoSaveInterval: number; // ms
  maxLocalVersions: number;
  syncOnReconnect: boolean;
}

export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  dbName: 'smart-editor-offline',
  storeName: 'editor-states',
  autoSaveInterval: 5000,
  maxLocalVersions: 10,
  syncOnReconnect: true
};

export class OfflineEditorManager {
  private config: OfflineConfig;
  private db: IDBDatabase | null = null;
  private autoSaveTimer: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private pendingSync: Set<string> = new Set();
  private onSyncCallbacks: ((state: EditorState) => Promise<void>)[] = [];
  
  constructor(config: OfflineConfig = DEFAULT_OFFLINE_CONFIG) {
    this.config = { ...config };
    this.setupOnlineListener();
  }
  
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.isOnline = true;
      if (this.config.syncOnReconnect) {
        this.syncPendingStates();
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Connection lost - switching to offline mode');
      this.isOnline = false;
    });
  }
  
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);
      
      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          store.createIndex('gameId', 'gameId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          console.log('📦 Created object store');
        }
      };
    });
  }
  
  public async saveLocal(state: EditorState): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      const request = store.put(state);
      
      request.onsuccess = () => {
        console.log(`💾 Saved to local: ${state.id}`);
        
        if (!state.synced) {
          this.pendingSync.add(state.id);
        }
        
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to save to local');
        reject(request.error);
      };
    });
  }
  
  public async loadLocal(id: string): Promise<EditorState | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  public async getAllLocal(gameId?: string): Promise<EditorState[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      
      let request: IDBRequest;
      
      if (gameId) {
        const index = store.index('gameId');
        request = index.getAll(gameId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  public async deleteLocal(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        this.pendingSync.delete(id);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  public startAutoSave(getCurrentState: () => EditorState): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = window.setInterval(async () => {
      try {
        const state = getCurrentState();
        await this.saveLocal(state);
        console.log('💾 Auto-saved');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, this.config.autoSaveInterval);
    
    console.log(`⏰ Auto-save started (interval: ${this.config.autoSaveInterval}ms)`);
  }
  
  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('⏸️ Auto-save stopped');
    }
  }
  
  public onSync(callback: (state: EditorState) => Promise<void>): void {
    this.onSyncCallbacks.push(callback);
  }
  
  public async syncPendingStates(): Promise<void> {
    if (!this.isOnline) {
      console.warn('⚠️ Cannot sync: offline');
      return;
    }
    
    console.log(`🔄 Syncing ${this.pendingSync.size} pending states...`);
    
    for (const id of this.pendingSync) {
      try {
        const state = await this.loadLocal(id);
        if (!state) continue;
        
        // Call sync callbacks
        for (const callback of this.onSyncCallbacks) {
          await callback(state);
        }
        
        // Mark as synced
        state.synced = true;
        await this.saveLocal(state);
        this.pendingSync.delete(id);
        
        console.log(`✅ Synced: ${id}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${id}:`, error);
      }
    }
    
    console.log('✅ Sync complete');
  }
  
  public async cleanupOldVersions(gameId: string): Promise<void> {
    const states = await this.getAllLocal(gameId);
    
    // Sort by timestamp descending
    states.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only max versions
    const toDelete = states.slice(this.config.maxLocalVersions);
    
    for (const state of toDelete) {
      if (state.synced) {
        await this.deleteLocal(state.id);
      }
    }
    
    console.log(`🧹 Cleaned up ${toDelete.length} old versions`);
  }
  
  public isOnlineMode(): boolean {
    return this.isOnline;
  }
  
  public getPendingSyncCount(): number {
    return this.pendingSync.size;
  }
  
  public getStats() {
    return {
      isOnline: this.isOnline,
      pendingSync: this.pendingSync.size,
      autoSaveInterval: this.config.autoSaveInterval,
      maxLocalVersions: this.config.maxLocalVersions,
      autoSaveActive: this.autoSaveTimer !== null
    };
  }
  
  public dispose(): void {
    this.stopAutoSave();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
