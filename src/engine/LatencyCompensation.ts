// 19. Latency compensation (interpolation, extrapolation, rewind)
import * as THREE from 'three';

export interface Snapshot {
  timestamp: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
}

export class LatencyCompensation {
  private snapshots: Snapshot[] = [];
  private maxSnapshots = 60; // 1 second at 60fps
  private interpolationDelay = 100; // ms

  addSnapshot(snapshot: Snapshot): void {
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  interpolate(currentTime: number): { position: THREE.Vector3; rotation: THREE.Quaternion } | null {
    const renderTime = currentTime - this.interpolationDelay;
    
    if (this.snapshots.length < 2) return null;

    let from: Snapshot | null = null;
    let to: Snapshot | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime && this.snapshots[i + 1].timestamp >= renderTime) {
        from = this.snapshots[i];
        to = this.snapshots[i + 1];
        break;
      }
    }

    if (!from || !to) {
      return {
        position: this.snapshots[this.snapshots.length - 1].position.clone(),
        rotation: this.snapshots[this.snapshots.length - 1].rotation.clone()
      };
    }

    const t = (renderTime - from.timestamp) / (to.timestamp - from.timestamp);
    
    return {
      position: from.position.clone().lerp(to.position, t),
      rotation: from.rotation.clone().slerp(to.rotation, t)
    };
  }

  extrapolate(currentTime: number, maxExtrapolation = 50): { position: THREE.Vector3; rotation: THREE.Quaternion } | null {
    if (this.snapshots.length < 2) return null;

    const last = this.snapshots[this.snapshots.length - 1];
    const secondLast = this.snapshots[this.snapshots.length - 2];
    
    const dt = (last.timestamp - secondLast.timestamp) / 1000;
    const extrapolationTime = Math.min(currentTime - last.timestamp, maxExtrapolation) / 1000;
    
    const velocity = last.position.clone().sub(secondLast.position).divideScalar(dt);
    const extrapolatedPosition = last.position.clone().add(velocity.multiplyScalar(extrapolationTime));
    
    return {
      position: extrapolatedPosition,
      rotation: last.rotation.clone()
    };
  }

  rewind(timestamp: number): { position: THREE.Vector3; rotation: THREE.Quaternion } | null {
    const snapshot = this.snapshots.find(s => Math.abs(s.timestamp - timestamp) < 16);
    if (!snapshot) return null;
    
    return {
      position: snapshot.position.clone(),
      rotation: snapshot.rotation.clone()
    };
  }

  clear(): void {
    this.snapshots = [];
  }
}
