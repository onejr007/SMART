/**
 * OcclusionCulling.ts
 * P1 Rendering #5 - Hierarchical occlusion culling
 * Cell → Cluster → Object untuk scalability di world besar
 */

import * as THREE from 'three';

export interface OcclusionConfig {
  enableHierarchical: boolean;
  cellSize: number;
  clusterSize: number;
  updateInterval: number;
  maxOcclusionTests: number;
}

interface OcclusionCell {
  id: string;
  bounds: THREE.Box3;
  clusters: OcclusionCluster[];
  visible: boolean;
}

interface OcclusionCluster {
  id: string;
  bounds: THREE.Box3;
  objects: THREE.Object3D[];
  visible: boolean;
}

export class OcclusionCullingManager {
  private config: OcclusionConfig;
  private cells: Map<string, OcclusionCell> = new Map();
  private camera?: THREE.Camera;
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private lastUpdateTime: number = 0;
  private stats = {
    totalCells: 0,
    visibleCells: 0,
    totalClusters: 0,
    visibleClusters: 0,
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0
  };

  constructor(config: Partial<OcclusionConfig> = {}) {
    this.config = {
      enableHierarchical: true,
      cellSize: 100,
      clusterSize: 25,
      updateInterval: 100,
      maxOcclusionTests: 1000,
      ...config
    };
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public setEnabled(enabled: boolean): void {
    this.config.enableHierarchical = enabled;
  }

  public addOccluder(mesh: THREE.Mesh): void {
    this.addObject(mesh);
  }

  public cullScene(scene: THREE.Scene, camera: THREE.Camera): void {
    this.setCamera(camera);
    this.update(Date.now());
  }

  public addObject(object: THREE.Object3D): void {
    const cellId = this.getCellId(object.position);
    let cell = this.cells.get(cellId);

    if (!cell) {
      cell = this.createCell(cellId, object.position);
      this.cells.set(cellId, cell);
    }

    const clusterId = this.getClusterId(object.position);
    let cluster = cell.clusters.find(c => c.id === clusterId);

    if (!cluster) {
      cluster = this.createCluster(clusterId, object.position);
      cell.clusters.push(cluster);
    }

    cluster.objects.push(object);
    this.updateBounds(cluster);
    this.updateBounds(cell);
  }

  public removeObject(object: THREE.Object3D): void {
    for (const cell of this.cells.values()) {
      for (const cluster of cell.clusters) {
        const index = cluster.objects.indexOf(object);
        if (index !== -1) {
          cluster.objects.splice(index, 1);
          this.updateBounds(cluster);
          this.updateBounds(cell);
          return;
        }
      }
    }
  }

  public update(currentTime: number): void {
    if (!this.camera) return;
    if (currentTime - this.lastUpdateTime < this.config.updateInterval) return;

    this.lastUpdateTime = currentTime;
    this.updateFrustum();
    this.performCulling();
  }

  private updateFrustum(): void {
    if (!this.camera) return;
    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  private performCulling(): void {
    this.resetStats();

    for (const cell of this.cells.values()) {
      this.stats.totalCells++;
      
      // Level 1: Cell culling
      cell.visible = this.frustum.intersectsBox(cell.bounds);
      
      if (!cell.visible) {
        this.hideCell(cell);
        continue;
      }

      this.stats.visibleCells++;

      // Level 2: Cluster culling
      for (const cluster of cell.clusters) {
        this.stats.totalClusters++;
        
        cluster.visible = this.frustum.intersectsBox(cluster.bounds);
        
        if (!cluster.visible) {
          this.hideCluster(cluster);
          continue;
        }

        this.stats.visibleClusters++;

        // Level 3: Object culling
        for (const object of cluster.objects) {
          this.stats.totalObjects++;
          
          const visible = this.isObjectVisible(object);
          object.visible = visible;
          
          if (visible) {
            this.stats.visibleObjects++;
          } else {
            this.stats.culledObjects++;
          }
        }
      }
    }
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    // Simple sphere test for individual objects
    const sphere = new THREE.Sphere();
    const box = new THREE.Box3().setFromObject(object);
    box.getBoundingSphere(sphere);
    return this.frustum.intersectsSphere(sphere);
  }

  private hideCell(cell: OcclusionCell): void {
    for (const cluster of cell.clusters) {
      this.hideCluster(cluster);
    }
  }

  private hideCluster(cluster: OcclusionCluster): void {
    for (const object of cluster.objects) {
      object.visible = false;
      this.stats.totalObjects++;
      this.stats.culledObjects++;
    }
  }

  private getCellId(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.config.cellSize);
    const z = Math.floor(position.z / this.config.cellSize);
    return `cell_${x}_${z}`;
  }

  private getClusterId(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.config.clusterSize);
    const z = Math.floor(position.z / this.config.clusterSize);
    return `cluster_${x}_${z}`;
  }

  private createCell(id: string, position: THREE.Vector3): OcclusionCell {
    const x = Math.floor(position.x / this.config.cellSize) * this.config.cellSize;
    const z = Math.floor(position.z / this.config.cellSize) * this.config.cellSize;
    
    return {
      id,
      bounds: new THREE.Box3(
        new THREE.Vector3(x, -1000, z),
        new THREE.Vector3(x + this.config.cellSize, 1000, z + this.config.cellSize)
      ),
      clusters: [],
      visible: true
    };
  }

  private createCluster(id: string, position: THREE.Vector3): OcclusionCluster {
    const x = Math.floor(position.x / this.config.clusterSize) * this.config.clusterSize;
    const z = Math.floor(position.z / this.config.clusterSize) * this.config.clusterSize;
    
    return {
      id,
      bounds: new THREE.Box3(
        new THREE.Vector3(x, -1000, z),
        new THREE.Vector3(x + this.config.clusterSize, 1000, z + this.config.clusterSize)
      ),
      objects: [],
      visible: true
    };
  }

  private updateBounds(item: OcclusionCell | OcclusionCluster): void {
    if ('clusters' in item) {
      // Cell
      item.bounds.makeEmpty();
      for (const cluster of item.clusters) {
        item.bounds.union(cluster.bounds);
      }
    } else {
      // Cluster
      item.bounds.makeEmpty();
      for (const object of item.objects) {
        const box = new THREE.Box3().setFromObject(object);
        item.bounds.union(box);
      }
    }
  }

  private resetStats(): void {
    this.stats = {
      totalCells: 0,
      visibleCells: 0,
      totalClusters: 0,
      visibleClusters: 0,
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0
    };
  }

  public getStats() {
    return {
      ...this.stats,
      cullingEfficiency: this.stats.totalObjects > 0 
        ? (this.stats.culledObjects / this.stats.totalObjects * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  public dispose(): void {
    this.cells.clear();
  }
}
