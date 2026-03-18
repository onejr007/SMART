/**
 * Editor Workflow (Rekomendasi #50)
 * Undo/redo, snapping, multi-select, grouping
 */

import * as THREE from 'three';
import { Entity } from './Entity';
import { eventBus } from './EventBus';

export interface EditorCommand {
  execute(): void;
  undo(): void;
  description: string;
}

export interface SelectionGroup {
  id: string;
  name: string;
  entities: Set<string>; // Entity UUIDs
}

export class EditorWorkflow {
  private commandHistory: EditorCommand[] = [];
  private currentCommandIndex: number = -1;
  private maxHistorySize: number = 100;
  
  private selectedEntities: Set<string> = new Set();
  private groups: Map<string, SelectionGroup> = new Map();
  
  // Snapping
  private snapEnabled: boolean = true;
  private snapSize: number = 1.0;
  
  // Grid
  private gridEnabled: boolean = true;
  private gridSize: number = 10;
  
  /**
   * Undo/Redo System
   */
  public executeCommand(command: EditorCommand): void {
    // Remove any commands after current index (branching history)
    if (this.currentCommandIndex < this.commandHistory.length - 1) {
      this.commandHistory.splice(this.currentCommandIndex + 1);
    }
    
    command.execute();
    this.commandHistory.push(command);
    this.currentCommandIndex++;
    
    // Limit history size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
      this.currentCommandIndex--;
    }
    
    eventBus.emit('editor:command-executed', { description: command.description });
  }
  
  public undo(): boolean {
    if (this.currentCommandIndex < 0) {
      return false;
    }
    
    const command = this.commandHistory[this.currentCommandIndex];
    command.undo();
    this.currentCommandIndex--;
    
    eventBus.emit('editor:undo', { description: command.description });
    return true;
  }
  
  public redo(): boolean {
    if (this.currentCommandIndex >= this.commandHistory.length - 1) {
      return false;
    }
    
    this.currentCommandIndex++;
    const command = this.commandHistory[this.currentCommandIndex];
    command.execute();
    
    eventBus.emit('editor:redo', { description: command.description });
    return true;
  }
  
  public canUndo(): boolean {
    return this.currentCommandIndex >= 0;
  }
  
  public canRedo(): boolean {
    return this.currentCommandIndex < this.commandHistory.length - 1;
  }
  
  public clearHistory(): void {
    this.commandHistory = [];
    this.currentCommandIndex = -1;
  }
  
  /**
   * Snapping
   */
  public setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled;
  }
  
  public setSnapSize(size: number): void {
    this.snapSize = size;
  }
  
  public snapPosition(position: THREE.Vector3): THREE.Vector3 {
    if (!this.snapEnabled) {
      return position.clone();
    }
    
    return new THREE.Vector3(
      Math.round(position.x / this.snapSize) * this.snapSize,
      Math.round(position.y / this.snapSize) * this.snapSize,
      Math.round(position.z / this.snapSize) * this.snapSize
    );
  }
  
  public snapRotation(rotation: THREE.Euler, snapAngle: number = 15): THREE.Euler {
    if (!this.snapEnabled) {
      return rotation.clone();
    }
    
    const snapRad = THREE.MathUtils.degToRad(snapAngle);
    
    return new THREE.Euler(
      Math.round(rotation.x / snapRad) * snapRad,
      Math.round(rotation.y / snapRad) * snapRad,
      Math.round(rotation.z / snapRad) * snapRad,
      rotation.order
    );
  }
  
  /**
   * Selection
   */
  public select(entityId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selectedEntities.clear();
    }
    
    this.selectedEntities.add(entityId);
    eventBus.emit('editor:selection-changed', { selected: Array.from(this.selectedEntities) });
  }
  
  public deselect(entityId: string): void {
    this.selectedEntities.delete(entityId);
    eventBus.emit('editor:selection-changed', { selected: Array.from(this.selectedEntities) });
  }
  
  public clearSelection(): void {
    this.selectedEntities.clear();
    eventBus.emit('editor:selection-changed', { selected: [] });
  }
  
  public getSelection(): string[] {
    return Array.from(this.selectedEntities);
  }
  
  public isSelected(entityId: string): boolean {
    return this.selectedEntities.has(entityId);
  }
  
  /**
   * Grouping
   */
  public createGroup(name: string, entityIds: string[]): string {
    const id = `group_${Date.now()}`;
    
    this.groups.set(id, {
      id,
      name,
      entities: new Set(entityIds),
    });
    
    eventBus.emit('editor:group-created', { id, name, entityIds });
    return id;
  }
  
  public removeGroup(groupId: string): void {
    this.groups.delete(groupId);
    eventBus.emit('editor:group-removed', { groupId });
  }
  
  public addToGroup(groupId: string, entityId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.entities.add(entityId);
      eventBus.emit('editor:group-updated', { groupId });
    }
  }
  
  public removeFromGroup(groupId: string, entityId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.entities.delete(entityId);
      eventBus.emit('editor:group-updated', { groupId });
    }
  }
  
  public selectGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      this.selectedEntities.clear();
      group.entities.forEach(id => this.selectedEntities.add(id));
      eventBus.emit('editor:selection-changed', { selected: Array.from(this.selectedEntities) });
    }
  }
  
  public getGroup(groupId: string): SelectionGroup | undefined {
    return this.groups.get(groupId);
  }
  
  public getAllGroups(): SelectionGroup[] {
    return Array.from(this.groups.values());
  }
  
  /**
   * Grid
   */
  public setGridEnabled(enabled: boolean): void {
    this.gridEnabled = enabled;
  }
  
  public setGridSize(size: number): void {
    this.gridSize = size;
  }
  
  public getGridSize(): number {
    return this.gridSize;
  }
  
  public isGridEnabled(): boolean {
    return this.gridEnabled;
  }
}

// Example commands
export class MoveEntityCommand implements EditorCommand {
  constructor(
    private entity: Entity,
    private oldPosition: THREE.Vector3,
    private newPosition: THREE.Vector3
  ) {}
  
  execute(): void {
    this.entity.mesh.position.copy(this.newPosition);
    this.entity.body.position.set(this.newPosition.x, this.newPosition.y, this.newPosition.z);
  }
  
  undo(): void {
    this.entity.mesh.position.copy(this.oldPosition);
    this.entity.body.position.set(this.oldPosition.x, this.oldPosition.y, this.oldPosition.z);
  }
  
  get description(): string {
    return `Move ${this.entity.name}`;
  }
}

export class DeleteEntityCommand implements EditorCommand {
  constructor(
    private entity: Entity,
    private sceneManager: any
  ) {}
  
  execute(): void {
    this.sceneManager.removeEntity(this.entity.name);
  }
  
  undo(): void {
    this.sceneManager.addEntity(this.entity);
  }
  
  get description(): string {
    return `Delete ${this.entity.name}`;
  }
}

export const editorWorkflow = new EditorWorkflow();
