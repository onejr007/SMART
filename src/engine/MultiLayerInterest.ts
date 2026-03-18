// 24. Interest management multi-layer (spatial, priority, LOS)
import * as THREE from 'three';

export interface InterestLayer {
  spatial: boolean;
  priority: number;
  lineOfSight: boolean;
}

export class MultiLayerInterest {
  private entities = new Map<string, { position: THREE.Vector3; layer: InterestLayer }>();
  private spatialRadius = 100;

  registerEntity(id: string, position: THREE.Vector3, layer: InterestLayer): void {
    this.entities.set(id, { position, layer });
  }

  unregisterEntity(id: string): void {
    this.entities.delete(id);
  }

  getInterestedEntities(observerPos: THREE.Vector3, observerLayer: InterestLayer): string[] {
    const interested: string[] = [];

    for (const [id, entity] of this.entities) {
      let isInterested = true;

      // Spatial check
      if (entity.layer.spatial) {
        const distance = observerPos.distanceTo(entity.position);
        if (distance > this.spatialRadius) {
          isInterested = false;
        }
      }

      // Priority check
      if (entity.layer.priority < observerLayer.priority) {
        isInterested = false;
      }

      // Line of sight check (simplified)
      if (entity.layer.lineOfSight && observerLayer.lineOfSight) {
        // In real implementation, use raycasting
        const distance = observerPos.distanceTo(entity.position);
        if (distance > this.spatialRadius * 0.5) {
          isInterested = false;
        }
      }

      if (isInterested) {
        interested.push(id);
      }
    }

    return interested;
  }

  setSpatialRadius(radius: number): void {
    this.spatialRadius = radius;
  }
}
