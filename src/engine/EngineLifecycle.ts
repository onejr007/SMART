/**
 * Engine Lifecycle Manager (Rekomendasi #2)
 * Standarisasi lifecycle: init → start → pause → resume → stop → dispose
 */

import { eventBus } from './EventBus';

export enum EngineState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  DISPOSED = 'disposed',
}

export interface LifecycleCallbacks {
  onInit?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onDispose?: () => void;
}

export class EngineLifecycle {
  private state: EngineState = EngineState.UNINITIALIZED;
  private callbacks: LifecycleCallbacks = {};
  
  public getState(): EngineState {
    return this.state;
  }
  
  public isRunning(): boolean {
    return this.state === EngineState.RUNNING;
  }
  
  public isPaused(): boolean {
    return this.state === EngineState.PAUSED;
  }
  
  public registerCallbacks(callbacks: LifecycleCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  public init(): void {
    if (this.state !== EngineState.UNINITIALIZED) {
      console.warn('Engine already initialized');
      return;
    }
    
    this.state = EngineState.INITIALIZED;
    this.callbacks.onInit?.();
    eventBus.emit('lifecycle:init');
  }
  
  public start(): void {
    if (this.state !== EngineState.INITIALIZED && this.state !== EngineState.STOPPED) {
      console.warn('Cannot start engine from state:', this.state);
      return;
    }
    
    this.state = EngineState.RUNNING;
    this.callbacks.onStart?.();
    eventBus.emit('lifecycle:start');
  }
  
  public pause(): void {
    if (this.state !== EngineState.RUNNING) {
      console.warn('Cannot pause engine from state:', this.state);
      return;
    }
    
    this.state = EngineState.PAUSED;
    this.callbacks.onPause?.();
    eventBus.emit('lifecycle:pause');
  }
  
  public resume(): void {
    if (this.state !== EngineState.PAUSED) {
      console.warn('Cannot resume engine from state:', this.state);
      return;
    }
    
    this.state = EngineState.RUNNING;
    this.callbacks.onResume?.();
    eventBus.emit('lifecycle:resume');
  }
  
  public stop(): void {
    if (this.state !== EngineState.RUNNING && this.state !== EngineState.PAUSED) {
      console.warn('Cannot stop engine from state:', this.state);
      return;
    }
    
    this.state = EngineState.STOPPED;
    this.callbacks.onStop?.();
    eventBus.emit('lifecycle:stop');
  }
  
  public dispose(): void {
    if (this.state === EngineState.DISPOSED) {
      console.warn('Engine already disposed');
      return;
    }
    
    this.state = EngineState.DISPOSED;
    this.callbacks.onDispose?.();
    eventBus.emit('lifecycle:dispose');
  }
}
