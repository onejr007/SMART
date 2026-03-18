/**
 * PrefabSystem.ts
 * Prefab System (#48)
 * Reusable entity templates
 * Nested prefabs support
 */

import { Entity } from './Entity';
import { Component } from './Component';

export interface PrefabData {
  id: string;
  name: string;
  description: string;
  category: string;
  entityData: any;
  components: any[];
  children?: PrefabData[];
  overrides?: Map<string, any>;
}

export class Prefab {
  public id: string;
  public name: string;
  public description: string;
  public category: string;
  private template: PrefabData;

  constructor(data: PrefabData) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.template = data;
  }

  public instantiate(overrides?: Record<string, any>): Entity {
    // Create entity from template
    const entity = this.createEntityFromData(this.template.entityData);
    
    // Add components
    this.template.components.forEach(compData => {
      const component = this.createComponentFromData(compData);
      if (component) {
        entity.addComponent(component);
      }
    });

    // Apply overrides
    if (overrides) {
      this.applyOverrides(entity, overrides);
    }

    // Instantiate children
    if (this.template.children) {
      this.template.children.forEach(childData => {
        const childPrefab = new Prefab(childData);
        const childEntity = childPrefab.instantiate();
        // Attach child to parent (implementation depends on your entity system)
      });
    }

    return entity;
  }

  private createEntityFromData(data: any): Entity {
    // Implementation depends on your Entity class
    // This is a placeholder
    return new Entity(data.name || 'Entity');
  }

  private createComponentFromData(data: any): Component | null {
    // Implementation depends on your Component system
    // This is a placeholder
    return null;
  }

  private applyOverrides(entity: Entity, overrides: Record<string, any>): void {
    Object.entries(overrides).forEach(([key, value]) => {
      // Apply override to entity or components
      // Implementation depends on your system
    });
  }

  public serialize(): PrefabData {
    return this.template;
  }
}

export class PrefabManager {
  private static instance: PrefabManager;
  private prefabs: Map<string, Prefab> = new Map();
  private categories: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): PrefabManager {
    if (!PrefabManager.instance) {
      PrefabManager.instance = new PrefabManager();
    }
    return PrefabManager.instance;
  }

  public registerPrefab(prefab: Prefab): void {
    this.prefabs.set(prefab.id, prefab);
    this.categories.add(prefab.category);
  }

  public getPrefab(id: string): Prefab | undefined {
    return this.prefabs.get(id);
  }

  public getAllPrefabs(): Prefab[] {
    return Array.from(this.prefabs.values());
  }

  public getPrefabsByCategory(category: string): Prefab[] {
    return Array.from(this.prefabs.values()).filter(
      prefab => prefab.category === category
    );
  }

  public getCategories(): string[] {
    return Array.from(this.categories);
  }

  public instantiate(prefabId: string, overrides?: Record<string, any>): Entity | null {
    const prefab = this.prefabs.get(prefabId);
    if (!prefab) {
      console.error(`Prefab ${prefabId} not found`);
      return null;
    }
    return prefab.instantiate(overrides);
  }

  public deletePrefab(id: string): boolean {
    return this.prefabs.delete(id);
  }

  public clear(): void {
    this.prefabs.clear();
    this.categories.clear();
  }
}
