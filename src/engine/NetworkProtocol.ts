/**
 * Network Protocol (Rekomendasi #43, #44, #45, #46)
 * Time sync, snapshot buffer, delta compression, message taxonomy
 */

import * as THREE from 'three';

export enum MessageType {
  // State updates (high frequency)
  ENTITY_STATE = 0,
  PLAYER_INPUT = 1,
  
  // Reliable events (low frequency)
  ENTITY_SPAWN = 10,
  ENTITY_DESTROY = 11,
  GAME_EVENT = 12,
  
  // Social
  CHAT_MESSAGE = 20,
  PLAYER_JOIN = 21,
  PLAYER_LEAVE = 22,
  
  // System
  TIME_SYNC = 30,
  PING = 31,
  PONG = 32,
}

export interface NetworkMessage {
  type: MessageType;
  timestamp: number;
  data: any;
}

export interface EntitySnapshot {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  velocity?: [number, number, number];
  timestamp: number;
}

export interface SnapshotBuffer {
  snapshots: EntitySnapshot[];
  timestamp: number;
}

export class NetworkProtocol {
  private serverTimeOffset: number = 0;
  private snapshotHistory: SnapshotBuffer[] = [];
  private maxHistorySize: number = 60; // 1 second at 60fps
  
  /**
   * Time Synchronization (Rekomendasi #43)
   */
  public syncTime(serverTimestamp: number, rtt: number): void {
    const clientTimestamp = Date.now();
    const estimatedServerTime = serverTimestamp + (rtt / 2);
    this.serverTimeOffset = estimatedServerTime - clientTimestamp;
  }
  
  public getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }
  
  /**
   * Snapshot Buffer (Rekomendasi #43)
   */
  public addSnapshot(snapshot: SnapshotBuffer): void {
    this.snapshotHistory.push(snapshot);
    
    // Keep only recent history
    if (this.snapshotHistory.length > this.maxHistorySize) {
      this.snapshotHistory.shift();
    }
  }
  
  public interpolateState(entityId: string, renderTime: number): EntitySnapshot | null {
    // Find two snapshots to interpolate between
    let before: EntitySnapshot | null = null;
    let after: EntitySnapshot | null = null;
    
    for (let i = 0; i < this.snapshotHistory.length - 1; i++) {
      const current = this.snapshotHistory[i].snapshots.find(s => s.id === entityId);
      const next = this.snapshotHistory[i + 1].snapshots.find(s => s.id === entityId);
      
      if (current && next) {
        if (current.timestamp <= renderTime && next.timestamp >= renderTime) {
          before = current;
          after = next;
          break;
        }
      }
    }
    
    if (!before || !after) {
      return before || after || null;
    }
    
    // Interpolate
    const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
    
    return {
      id: entityId,
      position: [
        THREE.MathUtils.lerp(before.position[0], after.position[0], t),
        THREE.MathUtils.lerp(before.position[1], after.position[1], t),
        THREE.MathUtils.lerp(before.position[2], after.position[2], t),
      ],
      rotation: this.slerpQuaternion(before.rotation, after.rotation, t),
      timestamp: renderTime,
    };
  }
  
  private slerpQuaternion(
    q1: [number, number, number, number],
    q2: [number, number, number, number],
    t: number
  ): [number, number, number, number] {
    const quat1 = new THREE.Quaternion(...q1);
    const quat2 = new THREE.Quaternion(...q2);
    quat1.slerp(quat2, t);
    return [quat1.x, quat1.y, quat1.z, quat1.w];
  }
  
  /**
   * Delta Compression (Rekomendasi #45)
   */
  public compressEntityState(current: EntitySnapshot, previous?: EntitySnapshot): any {
    if (!previous) {
      return current; // Full state
    }
    
    const delta: any = { id: current.id };
    
    // Only send changed values
    if (!this.vectorsEqual(current.position, previous.position)) {
      delta.position = this.quantizeVector(current.position);
    }
    
    if (!this.quaternionsEqual(current.rotation, previous.rotation)) {
      delta.rotation = this.quantizeQuaternion(current.rotation);
    }
    
    if (current.velocity && previous.velocity) {
      if (!this.vectorsEqual(current.velocity, previous.velocity)) {
        delta.velocity = this.quantizeVector(current.velocity);
      }
    }
    
    return delta;
  }
  
  private quantizeVector(vec: [number, number, number], precision: number = 100): [number, number, number] {
    return [
      Math.round(vec[0] * precision) / precision,
      Math.round(vec[1] * precision) / precision,
      Math.round(vec[2] * precision) / precision,
    ];
  }
  
  private quantizeQuaternion(
    quat: [number, number, number, number],
    precision: number = 1000
  ): [number, number, number, number] {
    return [
      Math.round(quat[0] * precision) / precision,
      Math.round(quat[1] * precision) / precision,
      Math.round(quat[2] * precision) / precision,
      Math.round(quat[3] * precision) / precision,
    ];
  }
  
  private vectorsEqual(v1: [number, number, number], v2: [number, number, number]): boolean {
    const epsilon = 0.01;
    return Math.abs(v1[0] - v2[0]) < epsilon &&
           Math.abs(v1[1] - v2[1]) < epsilon &&
           Math.abs(v1[2] - v2[2]) < epsilon;
  }
  
  private quaternionsEqual(
    q1: [number, number, number, number],
    q2: [number, number, number, number]
  ): boolean {
    const epsilon = 0.001;
    return Math.abs(q1[0] - q2[0]) < epsilon &&
           Math.abs(q1[1] - q2[1]) < epsilon &&
           Math.abs(q1[2] - q2[2]) < epsilon &&
           Math.abs(q1[3] - q2[3]) < epsilon;
  }
  
  /**
   * Message Taxonomy (Rekomendasi #46)
   */
  public createMessage(type: MessageType, data: any): NetworkMessage {
    return {
      type,
      timestamp: this.getServerTime(),
      data,
    };
  }
  
  public isHighFrequency(type: MessageType): boolean {
    return type === MessageType.ENTITY_STATE || type === MessageType.PLAYER_INPUT;
  }
  
  public isReliable(type: MessageType): boolean {
    return type >= MessageType.ENTITY_SPAWN && type < MessageType.CHAT_MESSAGE;
  }
  
  public isSocial(type: MessageType): boolean {
    return type >= MessageType.CHAT_MESSAGE && type < MessageType.TIME_SYNC;
  }
}

export const networkProtocol = new NetworkProtocol();
