/**
 * StateSnapshot.ts
 * [P0] Snapshot + interpolation
 * State replication dengan snapshot ring buffer + interpolation untuk smooth movement
 */

export interface Snapshot {
  timestamp: number;
  entities: Map<string, EntityState>;
}

export interface EntityState {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  velocity?: { x: number; y: number; z: number };
  [key: string]: any;
}

export interface SnapshotConfig {
  bufferSize: number;
  interpolationDelay: number; // ms
  extrapolationLimit: number; // ms
  snapshotRate: number; // snapshots per second
}

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  bufferSize: 32,
  interpolationDelay: 100,
  extrapolationLimit: 200,
  snapshotRate: 20
};

export class StateSnapshotManager {
  private config: SnapshotConfig;
  private snapshotBuffer: Snapshot[] = [];
  private lastSnapshotTime: number = 0;
  private renderTime: number = 0;
  
  constructor(config: SnapshotConfig = DEFAULT_SNAPSHOT_CONFIG) {
    this.config = { ...config };
  }
  
  public addSnapshot(snapshot: Snapshot): void {
    // Add to buffer
    this.snapshotBuffer.push(snapshot);
    
    // Keep buffer size limited
    if (this.snapshotBuffer.length > this.config.bufferSize) {
      this.snapshotBuffer.shift();
    }
    
    // Sort by timestamp
    this.snapshotBuffer.sort((a, b) => a.timestamp - b.timestamp);
    
    this.lastSnapshotTime = snapshot.timestamp;
  }
  
  public getInterpolatedState(entityId: string, currentTime: number): EntityState | null {
    if (this.snapshotBuffer.length < 2) return null;
    
    // Calculate render time with interpolation delay
    this.renderTime = currentTime - this.config.interpolationDelay;
    
    // Find two snapshots to interpolate between
    let from: Snapshot | null = null;
    let to: Snapshot | null = null;
    
    for (let i = 0; i < this.snapshotBuffer.length - 1; i++) {
      if (this.snapshotBuffer[i].timestamp <= this.renderTime &&
          this.snapshotBuffer[i + 1].timestamp >= this.renderTime) {
        from = this.snapshotBuffer[i];
        to = this.snapshotBuffer[i + 1];
        break;
      }
    }
    
    // If no valid snapshots found, try extrapolation
    if (!from || !to) {
      return this.extrapolateState(entityId, currentTime);
    }
    
    const fromState = from.entities.get(entityId);
    const toState = to.entities.get(entityId);
    
    if (!fromState || !toState) return null;
    
    // Calculate interpolation factor
    const t = (this.renderTime - from.timestamp) / (to.timestamp - from.timestamp);
    
    // Interpolate position
    const position = {
      x: this.lerp(fromState.position.x, toState.position.x, t),
      y: this.lerp(fromState.position.y, toState.position.y, t),
      z: this.lerp(fromState.position.z, toState.position.z, t)
    };
    
    // Interpolate rotation (quaternion slerp would be better)
    const rotation = {
      x: this.lerp(fromState.rotation.x, toState.rotation.x, t),
      y: this.lerp(fromState.rotation.y, toState.rotation.y, t),
      z: this.lerp(fromState.rotation.z, toState.rotation.z, t),
      w: this.lerp(fromState.rotation.w, toState.rotation.w, t)
    };
    
    return {
      position,
      rotation,
      velocity: toState.velocity
    };
  }
  
  private extrapolateState(entityId: string, currentTime: number): EntityState | null {
    if (this.snapshotBuffer.length === 0) return null;
    
    const lastSnapshot = this.snapshotBuffer[this.snapshotBuffer.length - 1];
    const lastState = lastSnapshot.entities.get(entityId);
    
    if (!lastState || !lastState.velocity) return lastState || null;
    
    // Check if extrapolation is within limit
    const timeSinceLastSnapshot = currentTime - lastSnapshot.timestamp;
    if (timeSinceLastSnapshot > this.config.extrapolationLimit) {
      return lastState; // Don't extrapolate too far
    }
    
    // Extrapolate position based on velocity
    const dt = timeSinceLastSnapshot / 1000; // Convert to seconds
    const position = {
      x: lastState.position.x + lastState.velocity.x * dt,
      y: lastState.position.y + lastState.velocity.y * dt,
      z: lastState.position.z + lastState.velocity.z * dt
    };
    
    return {
      ...lastState,
      position
    };
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
  
  public createSnapshot(entities: Map<string, EntityState>): Snapshot {
    return {
      timestamp: Date.now(),
      entities: new Map(entities)
    };
  }
  
  public shouldSendSnapshot(): boolean {
    const now = Date.now();
    const interval = 1000 / this.config.snapshotRate;
    return (now - this.lastSnapshotTime) >= interval;
  }
  
  public clearOldSnapshots(maxAge: number): void {
    const cutoffTime = Date.now() - maxAge;
    this.snapshotBuffer = this.snapshotBuffer.filter(s => s.timestamp > cutoffTime);
  }
  
  public getStats() {
    return {
      bufferSize: this.snapshotBuffer.length,
      maxBufferSize: this.config.bufferSize,
      interpolationDelay: this.config.interpolationDelay,
      snapshotRate: this.config.snapshotRate,
      oldestSnapshot: this.snapshotBuffer[0]?.timestamp || 0,
      newestSnapshot: this.snapshotBuffer[this.snapshotBuffer.length - 1]?.timestamp || 0
    };
  }
  
  public dispose(): void {
    this.snapshotBuffer = [];
  }
}
