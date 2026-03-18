/**
 * Visibility Cache System
 * Cache hasil visibility untuk beberapa frame jika kamera stabil untuk menghemat CPU
 */

import * as THREE from 'three';
import { Camera, Object3D, Vector3, Frustum, Matrix4 } from 'three';

interface VisibilityEntry {
  visible: boolean;
  lastChecked: number;
  distance: number;
  frustumCulled: boolean;
}

interface CacheStats {
  totalObjects: number;
  cachedObjects: number;
  cacheHitRate: number;
  avgCheckTime: number;
}

export class VisibilityCache {
  private cache = new Map<string, VisibilityEntry>();
  private lastCameraPosition = new Vector3();
  private lastCameraRotation = new Vector3();
  private cameraStableTime = 0;
  private readonly stableThreshold = 100; // ms
  private readonly cacheValidTime = 200; // ms
  private readonly positionThreshold = 0.1;
  private readonly rotationThreshold = 0.01;
  
  private frustum = new Frustum();
  private cameraMatrix = new Matrix4();
  
  private stats = {
    totalChecks: 0,
    cacheHits: 0,
    totalCheckTime: 0
  };

  constructor(
    private camera: Camera,
    private options = {
      maxCacheSize: 1000,
      enableDistanceCulling: true,
      maxDistance: 1000,
      enableFrustumCulling: true
    }
  ) {}

  /**
   * Check visibility dengan caching
   */
  isVisible(object: Object3D, currentTime: number): boolean {
    const startTime = performance.now();
    this.stats.totalChecks++;

    const objectId = this.getObjectId(object);
    const cached = this.cache.get(objectId);

    // Update camera stability
    this.updateCameraStability(currentTime);

    // Check cache validity
    if (cached && this.isCacheValid(cached, currentTime)) {
      this.stats.cacheHits++;
      return cached.visible;
    }

    // Perform visibility check
    const visible = this.performVisibilityCheck(object);
    
    // Cache result
    this.cacheResult(objectId, visible, currentTime, object);

    const checkTime = performance.now() - startTime;
    this.stats.totalCheckTime += checkTime;

    return visible;
  }

  /**
   * Batch visibility check untuk multiple objects
   */
  checkBatch(objects: Object3D[], currentTime: number): boolean[] {
    this.updateFrustum();
    
    return objects.map(obj => this.isVisible(obj, currentTime));
  }

  /**
   * Update camera stability tracking
   */
  private updateCameraStability(currentTime: number): void {
    const currentPos = this.camera.position.clone();
    const currentRot = new Vector3().setFromEuler(this.camera.rotation);

    const positionDelta = currentPos.distanceTo(this.lastCameraPosition);
    const rotationDelta = currentRot.distanceTo(this.lastCameraRotation);

    if (positionDelta < this.positionThreshold && rotationDelta < this.rotationThreshold) {
      this.cameraStableTime = currentTime;
    } else {
      this.cameraStableTime = 0;
      this.lastCameraPosition.copy(currentPos);
      this.lastCameraRotation.copy(currentRot);
      
      // Invalidate cache when camera moves significantly
      this.invalidateCache();
    }
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(entry: VisibilityEntry, currentTime: number): boolean {
    const timeDelta = currentTime - entry.lastChecked;
    const cameraStable = this.cameraStableTime > 0 && 
                        (currentTime - this.cameraStableTime) > this.stableThreshold;

    return timeDelta < this.cacheValidTime || cameraStable;
  }

  /**
   * Perform actual visibility check
   */
  private performVisibilityCheck(object: Object3D): boolean {
    // Distance culling
    if (this.options.enableDistanceCulling) {
      const distance = this.camera.position.distanceTo(object.position);
      if (distance > this.options.maxDistance) {
        return false;
      }
    }

    // Frustum culling
    if (this.options.enableFrustumCulling) {
      this.updateFrustum();
      
      // Check bounding sphere
      const mesh = object as THREE.Mesh;
      if (mesh.geometry && mesh.geometry.boundingSphere) {
        const sphere = mesh.geometry.boundingSphere.clone();
        sphere.applyMatrix4(object.matrixWorld);
        
        if (!this.frustum.intersectsSphere(sphere)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Cache visibility result
   */
  private cacheResult(objectId: string, visible: boolean, currentTime: number, object: Object3D): void {
    // Limit cache size
    if (this.cache.size >= this.options.maxCacheSize) {
      this.evictOldEntries(currentTime);
    }

    const distance = this.camera.position.distanceTo(object.position);
    
    this.cache.set(objectId, {
      visible,
      lastChecked: currentTime,
      distance,
      frustumCulled: !visible
    });
  }

  /**
   * Update frustum from camera
   */
  private updateFrustum(): void {
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Get unique object identifier
   */
  private getObjectId(object: Object3D): string {
    return object.uuid || `${object.id}`;
  }

  /**
   * Invalidate entire cache
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Evict old cache entries
   */
  private evictOldEntries(currentTime: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last checked time (oldest first)
    entries.sort((a, b) => a[1].lastChecked - b[1].lastChecked);
    
    // Remove oldest 25% of entries
    const removeCount = Math.floor(entries.length * 0.25);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const cacheHitRate = this.stats.totalChecks > 0 ? 
      (this.stats.cacheHits / this.stats.totalChecks) * 100 : 0;
    
    const avgCheckTime = this.stats.totalChecks > 0 ?
      this.stats.totalCheckTime / this.stats.totalChecks : 0;

    return {
      totalObjects: this.cache.size,
      cachedObjects: this.cache.size,
      cacheHitRate,
      avgCheckTime
    };
  }

  /**
   * Clear cache and reset stats
   */
  reset(): void {
    this.cache.clear();
    this.stats = {
      totalChecks: 0,
      cacheHits: 0,
      totalCheckTime: 0
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.cache.clear();
  }
}