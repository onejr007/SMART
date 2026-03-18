/**
 * DeltaCompression.ts
 * [P1] Delta compression + quantization
 * Kirim perubahan kecil (pos/rot quantized) untuk hemat bandwidth
 */

export interface Vector3Delta {
  x?: number;
  y?: number;
  z?: number;
}

export interface QuaternionDelta {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export interface EntityDelta {
  id: string;
  position?: Vector3Delta;
  rotation?: QuaternionDelta;
  velocity?: Vector3Delta;
  [key: string]: any;
}

export interface CompressionConfig {
  positionPrecision: number; // decimal places
  rotationPrecision: number;
  velocityPrecision: number;
  minDeltaThreshold: number; // minimum change to send
  enableQuantization: boolean;
}

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  positionPrecision: 2,
  rotationPrecision: 3,
  velocityPrecision: 2,
  minDeltaThreshold: 0.01,
  enableQuantization: true
};

export class DeltaCompressionManager {
  private config: CompressionConfig;
  private lastStates: Map<string, any> = new Map();
  private bytesSaved: number = 0;
  private totalBytes: number = 0;
  
  constructor(config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG) {
    this.config = { ...config };
  }
  
  public quantize(value: number, precision: number): number {
    if (!this.config.enableQuantization) return value;
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  }
  
  public quantizeVector3(vec: { x: number; y: number; z: number }, precision: number): Vector3Delta {
    return {
      x: this.quantize(vec.x, precision),
      y: this.quantize(vec.y, precision),
      z: this.quantize(vec.z, precision)
    };
  }
  
  public quantizeQuaternion(quat: { x: number; y: number; z: number; w: number }, precision: number): QuaternionDelta {
    return {
      x: this.quantize(quat.x, precision),
      y: this.quantize(quat.y, precision),
      z: this.quantize(quat.z, precision),
      w: this.quantize(quat.w, precision)
    };
  }
  
  public createDelta(entityId: string, currentState: any): EntityDelta | null {
    const lastState = this.lastStates.get(entityId);
    
    if (!lastState) {
      // First time, send full state
      const fullState = this.createFullState(entityId, currentState);
      this.lastStates.set(entityId, currentState);
      return fullState;
    }
    
    const delta: EntityDelta = { id: entityId };
    let hasChanges = false;
    
    // Check position delta
    if (currentState.position && lastState.position) {
      const posDelta = this.calculateVector3Delta(
        lastState.position,
        currentState.position,
        this.config.positionPrecision
      );
      
      if (posDelta) {
        delta.position = posDelta;
        hasChanges = true;
      }
    }
    
    // Check rotation delta
    if (currentState.rotation && lastState.rotation) {
      const rotDelta = this.calculateQuaternionDelta(
        lastState.rotation,
        currentState.rotation,
        this.config.rotationPrecision
      );
      
      if (rotDelta) {
        delta.rotation = rotDelta;
        hasChanges = true;
      }
    }
    
    // Check velocity delta
    if (currentState.velocity && lastState.velocity) {
      const velDelta = this.calculateVector3Delta(
        lastState.velocity,
        currentState.velocity,
        this.config.velocityPrecision
      );
      
      if (velDelta) {
        delta.velocity = velDelta;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      this.lastStates.set(entityId, currentState);
      this.updateStats(lastState, delta);
      return delta;
    }
    
    return null; // No significant changes
  }
  
  private createFullState(entityId: string, state: any): EntityDelta {
    const fullState: EntityDelta = { id: entityId };
    
    if (state.position) {
      fullState.position = this.quantizeVector3(state.position, this.config.positionPrecision);
    }
    
    if (state.rotation) {
      fullState.rotation = this.quantizeQuaternion(state.rotation, this.config.rotationPrecision);
    }
    
    if (state.velocity) {
      fullState.velocity = this.quantizeVector3(state.velocity, this.config.velocityPrecision);
    }
    
    return fullState;
  }
  
  private calculateVector3Delta(
    oldVec: { x: number; y: number; z: number },
    newVec: { x: number; y: number; z: number },
    precision: number
  ): Vector3Delta | null {
    const delta: Vector3Delta = {};
    let hasChanges = false;
    
    const dx = Math.abs(newVec.x - oldVec.x);
    const dy = Math.abs(newVec.y - oldVec.y);
    const dz = Math.abs(newVec.z - oldVec.z);
    
    if (dx > this.config.minDeltaThreshold) {
      delta.x = this.quantize(newVec.x, precision);
      hasChanges = true;
    }
    
    if (dy > this.config.minDeltaThreshold) {
      delta.y = this.quantize(newVec.y, precision);
      hasChanges = true;
    }
    
    if (dz > this.config.minDeltaThreshold) {
      delta.z = this.quantize(newVec.z, precision);
      hasChanges = true;
    }
    
    return hasChanges ? delta : null;
  }
  
  private calculateQuaternionDelta(
    oldQuat: { x: number; y: number; z: number; w: number },
    newQuat: { x: number; y: number; z: number; w: number },
    precision: number
  ): QuaternionDelta | null {
    const delta: QuaternionDelta = {};
    let hasChanges = false;
    
    const dx = Math.abs(newQuat.x - oldQuat.x);
    const dy = Math.abs(newQuat.y - oldQuat.y);
    const dz = Math.abs(newQuat.z - oldQuat.z);
    const dw = Math.abs(newQuat.w - oldQuat.w);
    
    if (dx > this.config.minDeltaThreshold) {
      delta.x = this.quantize(newQuat.x, precision);
      hasChanges = true;
    }
    
    if (dy > this.config.minDeltaThreshold) {
      delta.y = this.quantize(newQuat.y, precision);
      hasChanges = true;
    }
    
    if (dz > this.config.minDeltaThreshold) {
      delta.z = this.quantize(newQuat.z, precision);
      hasChanges = true;
    }
    
    if (dw > this.config.minDeltaThreshold) {
      delta.w = this.quantize(newQuat.w, precision);
      hasChanges = true;
    }
    
    return hasChanges ? delta : null;
  }
  
  private updateStats(fullState: any, delta: EntityDelta): void {
    // Estimate byte sizes (rough approximation)
    const fullSize = JSON.stringify(fullState).length;
    const deltaSize = JSON.stringify(delta).length;
    
    this.totalBytes += fullSize;
    this.bytesSaved += (fullSize - deltaSize);
  }
  
  public applyDelta(baseState: any, delta: EntityDelta): any {
    const newState = { ...baseState };
    
    if (delta.position) {
      newState.position = {
        x: delta.position.x !== undefined ? delta.position.x : baseState.position.x,
        y: delta.position.y !== undefined ? delta.position.y : baseState.position.y,
        z: delta.position.z !== undefined ? delta.position.z : baseState.position.z
      };
    }
    
    if (delta.rotation) {
      newState.rotation = {
        x: delta.rotation.x !== undefined ? delta.rotation.x : baseState.rotation.x,
        y: delta.rotation.y !== undefined ? delta.rotation.y : baseState.rotation.y,
        z: delta.rotation.z !== undefined ? delta.rotation.z : baseState.rotation.z,
        w: delta.rotation.w !== undefined ? delta.rotation.w : baseState.rotation.w
      };
    }
    
    if (delta.velocity) {
      newState.velocity = {
        x: delta.velocity.x !== undefined ? delta.velocity.x : baseState.velocity.x,
        y: delta.velocity.y !== undefined ? delta.velocity.y : baseState.velocity.y,
        z: delta.velocity.z !== undefined ? delta.velocity.z : baseState.velocity.z
      };
    }
    
    return newState;
  }
  
  public reset(entityId?: string): void {
    if (entityId) {
      this.lastStates.delete(entityId);
    } else {
      this.lastStates.clear();
    }
  }
  
  public getCompressionRatio(): number {
    return this.totalBytes > 0 ? (this.bytesSaved / this.totalBytes) * 100 : 0;
  }
  
  public getStats() {
    return {
      trackedEntities: this.lastStates.size,
      totalBytes: this.totalBytes,
      bytesSaved: this.bytesSaved,
      compressionRatio: this.getCompressionRatio(),
      config: this.config
    };
  }
  
  public dispose(): void {
    this.lastStates.clear();
    this.bytesSaved = 0;
    this.totalBytes = 0;
  }
}
