/**
 * Asset Streaming with Priority (Rekomendasi #31)
 * Prioritas loading berdasarkan jarak ke kamera
 */

import * as THREE from 'three';

export enum AssetPriority {
  CRITICAL = 0,  // UI, player character
  HIGH = 1,      // Near camera
  MEDIUM = 2,    // Mid distance
  LOW = 3,       // Far distance
  BACKGROUND = 4 // Very far, can be cancelled
}

export interface AssetRequest {
  id: string;
  url: string;
  priority: AssetPriority;
  distance?: number;
  onLoad: (asset: any) => void;
  onError?: (error: Error) => void;
  cancelled?: boolean;
}

export class AssetStreamingManager {
  private queue: AssetRequest[] = [];
  private loading: Map<string, AssetRequest> = new Map();
  private maxConcurrent: number = 4;
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();
  
  public setCameraPosition(position: THREE.Vector3): void {
    this.cameraPosition.copy(position);
  }
  
  public request(request: AssetRequest): void {
    // Check if already loading or queued
    if (this.loading.has(request.id)) {
      return;
    }
    
    const existing = this.queue.find(r => r.id === request.id);
    if (existing) {
      // Update priority if higher
      if (request.priority < existing.priority) {
        existing.priority = request.priority;
        this.sortQueue();
      }
      return;
    }
    
    this.queue.push(request);
    this.sortQueue();
    this.processQueue();
  }
  
  public cancel(id: string): void {
    // Remove from queue
    const queueIndex = this.queue.findIndex(r => r.id === id);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }
    
    // Mark loading request as cancelled
    const loadingRequest = this.loading.get(id);
    if (loadingRequest) {
      loadingRequest.cancelled = true;
    }
  }
  
  public updatePriorities(entityPositions: Map<string, THREE.Vector3>): void {
    // Update priorities based on distance to camera
    this.queue.forEach(request => {
      const position = entityPositions.get(request.id);
      if (position) {
        const distance = this.cameraPosition.distanceTo(position);
        request.distance = distance;
        
        // Auto-adjust priority based on distance
        if (distance < 10) {
          request.priority = AssetPriority.HIGH;
        } else if (distance < 50) {
          request.priority = AssetPriority.MEDIUM;
        } else if (distance < 100) {
          request.priority = AssetPriority.LOW;
        } else {
          request.priority = AssetPriority.BACKGROUND;
        }
      }
    });
    
    this.sortQueue();
  }
  
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority first
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by distance (closer first)
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      return 0;
    });
  }
  
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.loading.size < this.maxConcurrent) {
      const request = this.queue.shift();
      if (!request) break;
      
      this.loading.set(request.id, request);
      
      try {
        // Simulate asset loading (replace with actual loader)
        const asset = await this.loadAsset(request.url);
        
        if (!request.cancelled) {
          request.onLoad(asset);
        }
      } catch (error) {
        if (!request.cancelled && request.onError) {
          request.onError(error as Error);
        }
      } finally {
        this.loading.delete(request.id);
        this.processQueue(); // Continue processing
      }
    }
  }
  
  private async loadAsset(url: string): Promise<any> {
    // Placeholder - integrate with AssetManager
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ url });
      }, Math.random() * 1000);
    });
  }
  
  public getStats() {
    return {
      queued: this.queue.length,
      loading: this.loading.size,
      queueByPriority: {
        critical: this.queue.filter(r => r.priority === AssetPriority.CRITICAL).length,
        high: this.queue.filter(r => r.priority === AssetPriority.HIGH).length,
        medium: this.queue.filter(r => r.priority === AssetPriority.MEDIUM).length,
        low: this.queue.filter(r => r.priority === AssetPriority.LOW).length,
        background: this.queue.filter(r => r.priority === AssetPriority.BACKGROUND).length,
      },
    };
  }
  
  public clear(): void {
    this.queue = [];
    this.loading.forEach(request => request.cancelled = true);
    this.loading.clear();
  }
}

export const assetStreaming = new AssetStreamingManager();
