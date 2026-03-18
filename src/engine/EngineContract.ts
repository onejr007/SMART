/**
 * EngineContract.ts
 * [P0] Standarisasi "Engine Contract" (API surface)
 * Definisikan boundary yang jelas antara Portal ↔ Engine ↔ Systems
 */

export interface EngineEvent {
  type: string;
  timestamp: number;
  data?: any;
}

export interface SystemInterface {
  name: string;
  version: string;
  init(): Promise<void> | void;
  start(): void;
  update(delta: number): void;
  stop(): void;
  dispose(): void;
}

export interface EngineContract {
  // Lifecycle
  start(): void;
  stop(): void;
  dispose(): void;
  
  // State
  isRunning(): boolean;
  getMode(): 'play' | 'editor' | 'headless';
  
  // Core systems
  getScene(): any;
  getRenderer(): any;
  getCamera(): any;
  getPhysicsWorld(): any;
  
  // Event system
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data?: any): void;
  
  // System registry
  registerSystem(system: SystemInterface): void;
  getSystem<T>(name: string): T | null;
}

export class EngineEventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  
  public emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const eventData: EngineEvent = {
        type: event,
        timestamp: performance.now(),
        data
      };
      callbacks.forEach(cb => cb(eventData));
    }
  }
  
  public clear(): void {
    this.listeners.clear();
  }
}
