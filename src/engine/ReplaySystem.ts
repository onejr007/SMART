/**
 * Replay System (Rekomendasi #49)
 * Record/replay untuk debugging desync dan physics bugs
 */

import * as THREE from 'three';
import { eventBus } from './EventBus';

export interface InputFrame {
  frame: number;
  timestamp: number;
  inputs: Record<string, any>; // Key -> value
}

export interface SnapshotFrame {
  frame: number;
  timestamp: number;
  entities: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number, number];
    velocity: [number, number, number];
  }>;
}

export interface ReplayData {
  version: string;
  metadata: {
    recordedAt: number;
    duration: number;
    frameCount: number;
  };
  inputs: InputFrame[];
  snapshots: SnapshotFrame[];
}

export class ReplaySystem {
  private recording: boolean = false;
  private playing: boolean = false;
  
  private currentFrame: number = 0;
  private startTime: number = 0;
  
  private inputFrames: InputFrame[] = [];
  private snapshotFrames: SnapshotFrame[] = [];
  
  private snapshotInterval: number = 60; // Snapshot every 60 frames (1 second at 60fps)
  
  /**
   * Recording
   */
  public startRecording(): void {
    if (this.recording) {
      console.warn('Already recording');
      return;
    }
    
    this.recording = true;
    this.currentFrame = 0;
    this.startTime = Date.now();
    this.inputFrames = [];
    this.snapshotFrames = [];
    
    eventBus.emit('replay:recording-started');
    console.log('Replay recording started');
  }
  
  public stopRecording(): ReplayData {
    if (!this.recording) {
      throw new Error('Not recording');
    }
    
    this.recording = false;
    
    const data: ReplayData = {
      version: '1.0.0',
      metadata: {
        recordedAt: this.startTime,
        duration: Date.now() - this.startTime,
        frameCount: this.currentFrame,
      },
      inputs: this.inputFrames,
      snapshots: this.snapshotFrames,
    };
    
    eventBus.emit('replay:recording-stopped', { frameCount: this.currentFrame });
    console.log(`Replay recording stopped: ${this.currentFrame} frames`);
    
    return data;
  }
  
  public recordInput(inputs: Record<string, any>): void {
    if (!this.recording) return;
    
    this.inputFrames.push({
      frame: this.currentFrame,
      timestamp: Date.now() - this.startTime,
      inputs: { ...inputs },
    });
  }
  
  public recordSnapshot(entities: any[]): void {
    if (!this.recording) return;
    
    // Only record snapshots at intervals
    if (this.currentFrame % this.snapshotInterval !== 0) return;
    
    const snapshot: SnapshotFrame = {
      frame: this.currentFrame,
      timestamp: Date.now() - this.startTime,
      entities: entities.map(entity => ({
        id: entity.name,
        position: [
          entity.mesh.position.x,
          entity.mesh.position.y,
          entity.mesh.position.z,
        ],
        rotation: [
          entity.mesh.quaternion.x,
          entity.mesh.quaternion.y,
          entity.mesh.quaternion.z,
          entity.mesh.quaternion.w,
        ],
        velocity: [
          entity.body.velocity.x,
          entity.body.velocity.y,
          entity.body.velocity.z,
        ],
      })),
    };
    
    this.snapshotFrames.push(snapshot);
  }
  
  public advanceFrame(): void {
    if (this.recording || this.playing) {
      this.currentFrame++;
    }
  }
  
  /**
   * Playback
   */
  public startPlayback(data: ReplayData): void {
    if (this.playing) {
      console.warn('Already playing');
      return;
    }
    
    this.playing = true;
    this.currentFrame = 0;
    this.startTime = Date.now();
    this.inputFrames = data.inputs;
    this.snapshotFrames = data.snapshots;
    
    eventBus.emit('replay:playback-started', { frameCount: data.metadata.frameCount });
    console.log(`Replay playback started: ${data.metadata.frameCount} frames`);
  }
  
  public stopPlayback(): void {
    if (!this.playing) return;
    
    this.playing = false;
    eventBus.emit('replay:playback-stopped');
    console.log('Replay playback stopped');
  }
  
  public getInputsForFrame(frame: number): Record<string, any> | null {
    const inputFrame = this.inputFrames.find(f => f.frame === frame);
    return inputFrame ? inputFrame.inputs : null;
  }
  
  public getSnapshotForFrame(frame: number): SnapshotFrame | null {
    // Find closest snapshot before or at this frame
    let closest: SnapshotFrame | null = null;
    
    for (const snapshot of this.snapshotFrames) {
      if (snapshot.frame <= frame) {
        if (!closest || snapshot.frame > closest.frame) {
          closest = snapshot;
        }
      }
    }
    
    return closest;
  }
  
  public isRecording(): boolean {
    return this.recording;
  }
  
  public isPlaying(): boolean {
    return this.playing;
  }
  
  public getCurrentFrame(): number {
    return this.currentFrame;
  }
  
  /**
   * Export/Import
   */
  public exportToJSON(data: ReplayData): string {
    return JSON.stringify(data, null, 2);
  }
  
  public importFromJSON(json: string): ReplayData {
    const data = JSON.parse(json) as ReplayData;
    
    // Validate version
    if (data.version !== '1.0.0') {
      console.warn(`Replay version ${data.version} may not be compatible`);
    }
    
    return data;
  }
  
  public saveToFile(data: ReplayData, filename: string = 'replay.json'): void {
    const json = this.exportToJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  public async loadFromFile(file: File): Promise<ReplayData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const data = this.importFromJSON(json);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  /**
   * Analysis
   */
  public analyzeDesync(data: ReplayData): any {
    const analysis = {
      totalFrames: data.metadata.frameCount,
      snapshotCount: data.snapshots.length,
      inputCount: data.inputs.length,
      entityCount: data.snapshots[0]?.entities.length || 0,
      anomalies: [] as any[],
    };
    
    // Check for large position jumps (potential desync)
    for (let i = 1; i < data.snapshots.length; i++) {
      const prev = data.snapshots[i - 1];
      const curr = data.snapshots[i];
      
      curr.entities.forEach((entity, idx) => {
        const prevEntity = prev.entities[idx];
        if (!prevEntity) return;
        
        const dx = entity.position[0] - prevEntity.position[0];
        const dy = entity.position[1] - prevEntity.position[1];
        const dz = entity.position[2] - prevEntity.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Large jump detected
        if (distance > 10) {
          analysis.anomalies.push({
            frame: curr.frame,
            entityId: entity.id,
            type: 'large-position-jump',
            distance,
          });
        }
      });
    }
    
    return analysis;
  }
}

export const replaySystem = new ReplaySystem();
