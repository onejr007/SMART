/**
 * CommandStack.ts
 * [P0] Command-based undo/redo
 * Semua aksi editor masuk command stack untuk undo/redo
 */

export interface Command {
  id: string;
  type: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  redo?(): void;
  canMerge?(other: Command): boolean;
  merge?(other: Command): void;
}

export interface CommandStackConfig {
  maxStackSize: number;
  enableMerging: boolean;
  mergingTimeWindow: number; // ms
}

export const DEFAULT_COMMAND_STACK_CONFIG: CommandStackConfig = {
  maxStackSize: 100,
  enableMerging: true,
  mergingTimeWindow: 500
};

export class CommandStackManager {
  private config: CommandStackConfig;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private currentCommand: Command | null = null;
  private onChangeCallbacks: (() => void)[] = [];
  
  constructor(config: CommandStackConfig = DEFAULT_COMMAND_STACK_CONFIG) {
    this.config = { ...config };
  }
  
  public execute(command: Command): void {
    // Try to merge with previous command if enabled
    if (this.config.enableMerging && this.undoStack.length > 0) {
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      const timeDiff = command.timestamp - lastCommand.timestamp;
      
      if (timeDiff < this.config.mergingTimeWindow &&
          lastCommand.canMerge && lastCommand.canMerge(command)) {
        lastCommand.merge!(command);
        this.notifyChange();
        return;
      }
    }
    
    // Execute the command
    command.execute();
    
    // Add to undo stack
    this.undoStack.push(command);
    
    // Limit stack size
    if (this.undoStack.length > this.config.maxStackSize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack
    this.redoStack = [];
    
    this.currentCommand = command;
    this.notifyChange();
    
    console.log(`✅ Executed command: ${command.type} (${command.id})`);
  }
  
  public undo(): boolean {
    if (this.undoStack.length === 0) {
      console.warn('⚠️ Nothing to undo');
      return false;
    }
    
    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
    
    this.currentCommand = this.undoStack[this.undoStack.length - 1] || null;
    this.notifyChange();
    
    console.log(`↩️ Undid command: ${command.type} (${command.id})`);
    return true;
  }
  
  public redo(): boolean {
    if (this.redoStack.length === 0) {
      console.warn('⚠️ Nothing to redo');
      return false;
    }
    
    const command = this.redoStack.pop()!;
    
    // Use redo method if available, otherwise use execute
    if (command.redo) {
      command.redo();
    } else {
      command.execute();
    }
    
    this.undoStack.push(command);
    this.currentCommand = command;
    this.notifyChange();
    
    console.log(`↪️ Redid command: ${command.type} (${command.id})`);
    return true;
  }
  
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentCommand = null;
    this.notifyChange();
    console.log('🧹 Command stack cleared');
  }
  
  public getUndoStack(): Command[] {
    return [...this.undoStack];
  }
  
  public getRedoStack(): Command[] {
    return [...this.redoStack];
  }
  
  public getCurrentCommand(): Command | null {
    return this.currentCommand;
  }
  
  public onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }
  
  private notifyChange(): void {
    for (const callback of this.onChangeCallbacks) {
      callback();
    }
  }
  
  public getStats() {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      maxStackSize: this.config.maxStackSize,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentCommand: this.currentCommand?.type || null
    };
  }
}

// Example command implementations
export class AddEntityCommand implements Command {
  id: string;
  type = 'add-entity';
  timestamp: number;
  private entityId: string;
  private entityData: any;
  private scene: any;
  
  constructor(scene: any, entityData: any) {
    this.id = `add-${Date.now()}-${Math.random()}`;
    this.timestamp = Date.now();
    this.scene = scene;
    this.entityData = entityData;
    this.entityId = entityData.id;
  }
  
  execute(): void {
    this.scene.addEntity(this.entityData);
  }
  
  undo(): void {
    this.scene.removeEntity(this.entityId);
  }
}

export class DeleteEntityCommand implements Command {
  id: string;
  type = 'delete-entity';
  timestamp: number;
  private entityId: string;
  private entityData: any;
  private scene: any;
  
  constructor(scene: any, entityId: string) {
    this.id = `delete-${Date.now()}-${Math.random()}`;
    this.timestamp = Date.now();
    this.scene = scene;
    this.entityId = entityId;
    this.entityData = scene.getEntity(entityId);
  }
  
  execute(): void {
    this.scene.removeEntity(this.entityId);
  }
  
  undo(): void {
    this.scene.addEntity(this.entityData);
  }
}

export class MoveEntityCommand implements Command {
  id: string;
  type = 'move-entity';
  timestamp: number;
  private entityId: string;
  private oldPosition: any;
  private newPosition: any;
  private scene: any;
  
  constructor(scene: any, entityId: string, oldPosition: any, newPosition: any) {
    this.id = `move-${Date.now()}-${Math.random()}`;
    this.timestamp = Date.now();
    this.scene = scene;
    this.entityId = entityId;
    this.oldPosition = { ...oldPosition };
    this.newPosition = { ...newPosition };
  }
  
  execute(): void {
    this.scene.setEntityPosition(this.entityId, this.newPosition);
  }
  
  undo(): void {
    this.scene.setEntityPosition(this.entityId, this.oldPosition);
  }
  
  canMerge(other: Command): boolean {
    return other.type === 'move-entity' && 
           (other as MoveEntityCommand).entityId === this.entityId;
  }
  
  merge(other: Command): void {
    const otherMove = other as MoveEntityCommand;
    this.newPosition = { ...otherMove.newPosition };
    this.timestamp = otherMove.timestamp;
  }
}
