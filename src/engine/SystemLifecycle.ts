/**
 * SystemLifecycle.ts
 * [P0] Perketat lifecycle untuk semua system
 * Setiap system wajib init/start/update/stop/dispose
 */

export enum SystemState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  DISPOSING = 'disposing',
  DISPOSED = 'disposed',
  ERROR = 'error'
}

export interface ISystem {
  readonly name: string;
  readonly version: string;
  getState(): SystemState;
  init(): Promise<void>;
  start(): void;
  update(delta: number): void;
  stop(): void;
  dispose(): void;
}

export abstract class BaseSystem implements ISystem {
  public readonly name: string;
  public readonly version: string;
  protected state: SystemState = SystemState.UNINITIALIZED;
  protected error: Error | null = null;
  
  constructor(name: string, version: string = '1.0.0') {
    this.name = name;
    this.version = version;
  }
  
  public getState(): SystemState {
    return this.state;
  }
  
  public getError(): Error | null {
    return this.error;
  }
  
  public async init(): Promise<void> {
    if (this.state !== SystemState.UNINITIALIZED) {
      throw new Error(`Cannot init ${this.name}: already ${this.state}`);
    }
    
    this.state = SystemState.INITIALIZING;
    try {
      await this.onInit();
      this.state = SystemState.INITIALIZED;
      console.log(`✅ ${this.name} initialized`);
    } catch (error) {
      this.error = error as Error;
      this.state = SystemState.ERROR;
      console.error(`❌ ${this.name} init failed:`, error);
      throw error;
    }
  }
  
  public start(): void {
    if (this.state !== SystemState.INITIALIZED && this.state !== SystemState.STOPPED) {
      throw new Error(`Cannot start ${this.name}: current state is ${this.state}`);
    }
    
    this.state = SystemState.STARTING;
    try {
      this.onStart();
      this.state = SystemState.RUNNING;
      console.log(`▶️ ${this.name} started`);
    } catch (error) {
      this.error = error as Error;
      this.state = SystemState.ERROR;
      console.error(`❌ ${this.name} start failed:`, error);
      throw error;
    }
  }
  
  public update(delta: number): void {
    if (this.state !== SystemState.RUNNING) {
      return;
    }
    
    try {
      this.onUpdate(delta);
    } catch (error) {
      this.error = error as Error;
      this.state = SystemState.ERROR;
      console.error(`❌ ${this.name} update failed:`, error);
    }
  }
  
  public stop(): void {
    if (this.state !== SystemState.RUNNING) {
      return;
    }
    
    this.state = SystemState.STOPPING;
    try {
      this.onStop();
      this.state = SystemState.STOPPED;
      console.log(`⏸️ ${this.name} stopped`);
    } catch (error) {
      this.error = error as Error;
      this.state = SystemState.ERROR;
      console.error(`❌ ${this.name} stop failed:`, error);
    }
  }
  
  public dispose(): void {
    if (this.state === SystemState.DISPOSED || this.state === SystemState.DISPOSING) {
      return;
    }
    
    if (this.state === SystemState.RUNNING) {
      this.stop();
    }
    
    this.state = SystemState.DISPOSING;
    try {
      this.onDispose();
      this.state = SystemState.DISPOSED;
      console.log(`🗑️ ${this.name} disposed`);
    } catch (error) {
      this.error = error as Error;
      this.state = SystemState.ERROR;
      console.error(`❌ ${this.name} dispose failed:`, error);
    }
  }
  
  protected abstract onInit(): Promise<void> | void;
  protected abstract onStart(): void;
  protected abstract onUpdate(delta: number): void;
  protected abstract onStop(): void;
  protected abstract onDispose(): void;
}

export class SystemRegistry {
  private systems: Map<string, ISystem> = new Map();
  private updateOrder: string[] = [];
  
  public register(system: ISystem): void {
    if (this.systems.has(system.name)) {
      throw new Error(`System ${system.name} already registered`);
    }
    
    this.systems.set(system.name, system);
    this.updateOrder.push(system.name);
    console.log(`📝 Registered system: ${system.name}`);
  }
  
  public get<T extends ISystem>(name: string): T | null {
    return (this.systems.get(name) as T) || null;
  }
  
  public async initAll(): Promise<void> {
    console.log('🔧 Initializing all systems...');
    for (const name of this.updateOrder) {
      const system = this.systems.get(name)!;
      await system.init();
    }
  }
  
  public startAll(): void {
    console.log('▶️ Starting all systems...');
    for (const name of this.updateOrder) {
      const system = this.systems.get(name)!;
      if (system.getState() === SystemState.INITIALIZED) {
        system.start();
      }
    }
  }
  
  public updateAll(delta: number): void {
    for (const name of this.updateOrder) {
      const system = this.systems.get(name)!;
      system.update(delta);
    }
  }
  
  public stopAll(): void {
    console.log('⏸️ Stopping all systems...');
    for (let i = this.updateOrder.length - 1; i >= 0; i--) {
      const system = this.systems.get(this.updateOrder[i])!;
      system.stop();
    }
  }
  
  public disposeAll(): void {
    console.log('🗑️ Disposing all systems...');
    for (let i = this.updateOrder.length - 1; i >= 0; i--) {
      const system = this.systems.get(this.updateOrder[i])!;
      system.dispose();
    }
    this.systems.clear();
    this.updateOrder = [];
  }
  
  public getAll(): ISystem[] {
    return Array.from(this.systems.values());
  }
  
  public getSystemStates(): Record<string, SystemState> {
    const states: Record<string, SystemState> = {};
    this.systems.forEach((system, name) => {
      states[name] = system.getState();
    });
    return states;
  }
}
