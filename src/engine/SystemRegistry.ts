/**
 * SystemRegistry.ts
 * [P1] Buat "System Registry" + dependency graph
 * Deklarasikan dependency antar system dan validasi sebelum start
 */

import { ISystem, SystemState } from './SystemLifecycle';

export interface SystemDependency {
  name: string;
  required: boolean;
}

export interface SystemMetadata {
  name: string;
  version: string;
  dependencies: SystemDependency[];
  priority: number;
}

export class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map();
  private metadata: Map<string, SystemMetadata> = new Map();
  
  public addSystem(meta: SystemMetadata): void {
    this.metadata.set(meta.name, meta);
    this.graph.set(meta.name, new Set());
    
    for (const dep of meta.dependencies) {
      this.graph.get(meta.name)!.add(dep.name);
    }
  }
  
  public validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [system, deps] of this.graph.entries()) {
      for (const dep of deps) {
        if (!this.metadata.has(dep)) {
          const meta = this.metadata.get(system)!;
          const depInfo = meta.dependencies.find(d => d.name === dep);
          
          if (depInfo?.required) {
            errors.push(`System ${system} requires ${dep} but it's not registered`);
          }
        }
      }
    }
    
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      
      const deps = this.graph.get(node) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recursionStack.has(dep)) {
          errors.push(`Circular dependency detected: ${node} → ${dep}`);
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const system of this.graph.keys()) {
      if (!visited.has(system)) {
        hasCycle(system);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  public getInitializationOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      const deps = this.graph.get(node) || new Set();
      for (const dep of deps) {
        if (this.metadata.has(dep)) {
          visit(dep);
        }
      }
      
      order.push(node);
    };
    
    // Sort by priority first
    const systems = Array.from(this.metadata.values())
      .sort((a, b) => b.priority - a.priority);
    
    for (const meta of systems) {
      visit(meta.name);
    }
    
    return order;
  }
  
  public getDependencies(systemName: string): string[] {
    return Array.from(this.graph.get(systemName) || []);
  }
  
  public getDependents(systemName: string): string[] {
    const dependents: string[] = [];
    
    for (const [system, deps] of this.graph.entries()) {
      if (deps.has(systemName)) {
        dependents.push(system);
      }
    }
    
    return dependents;
  }
}

export class EnhancedSystemRegistry {
  private systems: Map<string, ISystem> = new Map();
  private dependencyGraph: DependencyGraph = new DependencyGraph();
  private initOrder: string[] = [];
  
  public register(system: ISystem, metadata: SystemMetadata): void {
    if (this.systems.has(system.name)) {
      throw new Error(`System ${system.name} already registered`);
    }
    
    this.systems.set(system.name, system);
    this.dependencyGraph.addSystem(metadata);
    console.log(`📝 Registered system: ${system.name} v${system.version}`);
  }
  
  public validate(): boolean {
    const result = this.dependencyGraph.validateDependencies();
    
    if (!result.valid) {
      console.error('❌ Dependency validation failed:');
      result.errors.forEach(err => console.error(`  - ${err}`));
      return false;
    }
    
    this.initOrder = this.dependencyGraph.getInitializationOrder();
    console.log('✅ Dependency validation passed');
    console.log('📋 Initialization order:', this.initOrder);
    
    return true;
  }
  
  public async initAll(): Promise<void> {
    if (this.initOrder.length === 0) {
      if (!this.validate()) {
        throw new Error('Dependency validation failed');
      }
    }
    
    console.log('🔧 Initializing systems in dependency order...');
    
    for (const name of this.initOrder) {
      const system = this.systems.get(name);
      if (system) {
        await system.init();
      }
    }
  }
  
  public startAll(): void {
    console.log('▶️ Starting systems...');
    
    for (const name of this.initOrder) {
      const system = this.systems.get(name);
      if (system && system.getState() === SystemState.INITIALIZED) {
        system.start();
      }
    }
  }
  
  public updateAll(delta: number): void {
    for (const name of this.initOrder) {
      const system = this.systems.get(name);
      if (system) {
        system.update(delta);
      }
    }
  }
  
  public stopAll(): void {
    console.log('⏸️ Stopping systems...');
    
    for (let i = this.initOrder.length - 1; i >= 0; i--) {
      const system = this.systems.get(this.initOrder[i]);
      if (system) {
        system.stop();
      }
    }
  }
  
  public disposeAll(): void {
    console.log('🗑️ Disposing systems...');
    
    for (let i = this.initOrder.length - 1; i >= 0; i--) {
      const system = this.systems.get(this.initOrder[i]);
      if (system) {
        system.dispose();
      }
    }
    
    this.systems.clear();
    this.initOrder = [];
  }
  
  public get<T extends ISystem>(name: string): T | null {
    return (this.systems.get(name) as T) || null;
  }
  
  public getAll(): ISystem[] {
    return Array.from(this.systems.values());
  }
  
  public getDependencyInfo(systemName: string) {
    return {
      dependencies: this.dependencyGraph.getDependencies(systemName),
      dependents: this.dependencyGraph.getDependents(systemName)
    };
  }
}
