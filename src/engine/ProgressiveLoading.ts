/**
 * ProgressiveLoading.ts
 * [P0] Progressive loading UX
 * Loading state per-stream (world cells, textures, audio) + placeholder
 */

export enum LoadingStreamType {
  WORLD = 'world',
  TEXTURES = 'textures',
  AUDIO = 'audio',
  SCRIPTS = 'scripts',
  MODELS = 'models'
}

export interface LoadingStream {
  type: LoadingStreamType;
  total: number;
  loaded: number;
  progress: number;
  status: 'pending' | 'loading' | 'complete' | 'error';
  error?: string;
}

export interface ProgressiveLoadingConfig {
  showPlaceholders: boolean;
  parallelStreams: number;
  priorityOrder: LoadingStreamType[];
}

export const DEFAULT_PROGRESSIVE_LOADING_CONFIG: ProgressiveLoadingConfig = {
  showPlaceholders: true,
  parallelStreams: 3,
  priorityOrder: [
    LoadingStreamType.WORLD,
    LoadingStreamType.MODELS,
    LoadingStreamType.TEXTURES,
    LoadingStreamType.AUDIO,
    LoadingStreamType.SCRIPTS
  ]
};

export class ProgressiveLoadingManager {
  private config: ProgressiveLoadingConfig;
  private streams: Map<LoadingStreamType, LoadingStream> = new Map();
  private onProgressCallbacks: ((progress: number, streams: LoadingStream[]) => void)[] = [];
  private onStreamCompleteCallbacks: ((stream: LoadingStream) => void)[] = [];
  private onAllCompleteCallbacks: (() => void)[] = [];
  
  constructor(config: ProgressiveLoadingConfig = DEFAULT_PROGRESSIVE_LOADING_CONFIG) {
    this.config = { ...config };
    this.initializeStreams();
  }
  
  private initializeStreams(): void {
    for (const type of this.config.priorityOrder) {
      this.streams.set(type, {
        type,
        total: 0,
        loaded: 0,
        progress: 0,
        status: 'pending'
      });
    }
  }
  
  public registerStream(type: LoadingStreamType, total: number): void {
    const stream = this.streams.get(type);
    if (stream) {
      stream.total = total;
      stream.status = 'loading';
      console.log(`📦 Registered ${type} stream: ${total} items`);
    }
  }
  
  public updateStreamProgress(type: LoadingStreamType, loaded: number): void {
    const stream = this.streams.get(type);
    if (!stream) return;
    
    stream.loaded = loaded;
    stream.progress = stream.total > 0 ? (loaded / stream.total) * 100 : 0;
    
    if (loaded >= stream.total && stream.total > 0) {
      stream.status = 'complete';
      this.handleStreamComplete(stream);
    }
    
    this.notifyProgress();
  }
  
  public incrementStreamProgress(type: LoadingStreamType): void {
    const stream = this.streams.get(type);
    if (!stream) return;
    
    this.updateStreamProgress(type, stream.loaded + 1);
  }
  
  public setStreamError(type: LoadingStreamType, error: string): void {
    const stream = this.streams.get(type);
    if (!stream) return;
    
    stream.status = 'error';
    stream.error = error;
    console.error(`❌ Stream ${type} error: ${error}`);
    
    this.notifyProgress();
  }
  
  private handleStreamComplete(stream: LoadingStream): void {
    console.log(`✅ Stream ${stream.type} complete: ${stream.loaded}/${stream.total}`);
    
    for (const callback of this.onStreamCompleteCallbacks) {
      callback(stream);
    }
    
    // Check if all streams are complete
    if (this.isAllComplete()) {
      this.handleAllComplete();
    }
  }
  
  private handleAllComplete(): void {
    console.log('🎉 All loading streams complete!');
    
    for (const callback of this.onAllCompleteCallbacks) {
      callback();
    }
  }
  
  private notifyProgress(): void {
    const overallProgress = this.getOverallProgress();
    const streamArray = Array.from(this.streams.values());
    
    for (const callback of this.onProgressCallbacks) {
      callback(overallProgress, streamArray);
    }
  }
  
  public getOverallProgress(): number {
    let totalItems = 0;
    let loadedItems = 0;
    
    for (const stream of this.streams.values()) {
      totalItems += stream.total;
      loadedItems += stream.loaded;
    }
    
    return totalItems > 0 ? (loadedItems / totalItems) * 100 : 0;
  }
  
  public isAllComplete(): boolean {
    for (const stream of this.streams.values()) {
      if (stream.total > 0 && stream.status !== 'complete') {
        return false;
      }
    }
    return true;
  }
  
  public getStream(type: LoadingStreamType): LoadingStream | undefined {
    return this.streams.get(type);
  }
  
  public getAllStreams(): LoadingStream[] {
    return Array.from(this.streams.values());
  }
  
  public onProgress(callback: (progress: number, streams: LoadingStream[]) => void): void {
    this.onProgressCallbacks.push(callback);
  }
  
  public onStreamComplete(callback: (stream: LoadingStream) => void): void {
    this.onStreamCompleteCallbacks.push(callback);
  }
  
  public onAllComplete(callback: () => void): void {
    this.onAllCompleteCallbacks.push(callback);
  }
  
  public reset(): void {
    for (const stream of this.streams.values()) {
      stream.loaded = 0;
      stream.progress = 0;
      stream.status = 'pending';
      stream.error = undefined;
    }
  }
  
  public getStats() {
    const streams = Array.from(this.streams.values());
    const completed = streams.filter(s => s.status === 'complete').length;
    const errors = streams.filter(s => s.status === 'error').length;
    
    return {
      overallProgress: this.getOverallProgress(),
      totalStreams: streams.length,
      completedStreams: completed,
      errorStreams: errors,
      isComplete: this.isAllComplete(),
      streams: streams.map(s => ({
        type: s.type,
        progress: s.progress,
        status: s.status
      }))
    };
  }
}
