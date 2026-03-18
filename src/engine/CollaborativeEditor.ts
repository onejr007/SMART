/**
 * Collaborative Editor System
 * CRDT/OT untuk multi-user editing + presence (cursor/selection) untuk pengalaman metaverse creation
 */

interface EditorOperation {
  id: string;
  type: "insert" | "delete" | "move" | "modify";
  entityId?: string;
  position?: { x: number; y: number; z: number };
  data?: any;
  timestamp: number;
  authorId: string;
  vectorClock: { [userId: string]: number };
}

interface UserPresence {
  userId: string;
  userName: string;
  cursor: { x: number; y: number; z: number };
  selection: string[];
  color: string;
  lastSeen: number;
  isActive: boolean;
}

interface ConflictResolution {
  operationId: string;
  conflictType: "concurrent_edit" | "position_conflict" | "dependency_missing";
  resolution: "accept" | "reject" | "merge";
  mergedOperation?: EditorOperation;
}

interface CollaborativeState {
  entities: { [id: string]: any };
  operations: EditorOperation[];
  users: { [userId: string]: UserPresence };
  vectorClock: { [userId: string]: number };
}

export class CollaborativeEditor {
  private state: CollaborativeState = {
    entities: {},
    operations: [],
    users: {},
    vectorClock: {},
  };

  private currentUserId: string;
  private operationQueue: EditorOperation[] = [];
  private conflictResolver: ConflictResolution[] = [];

  private onStateChanged?: (state: CollaborativeState) => void;
  private onUserJoined?: (user: UserPresence) => void;
  private onUserLeft?: (userId: string) => void;
  private onConflictDetected?: (conflict: ConflictResolution) => void;

  private syncInterval: number | null = null;
  private presenceInterval: number | null = null;

  constructor(
    userId: string,
    private options = {
      syncIntervalMs: 100,
      presenceIntervalMs: 1000,
      maxOperationHistory: 1000,
      enableConflictResolution: true,
      enablePresence: true,
    },
  ) {
    this.currentUserId = userId;
    this.initializeUser();
    this.startSyncLoop();
  }

  /**
   * Initialize current user
   */
  private initializeUser(): void {
    this.state.users[this.currentUserId] = {
      userId: this.currentUserId,
      userName: `User ${this.currentUserId}`,
      cursor: { x: 0, y: 0, z: 0 },
      selection: [],
      color: this.generateUserColor(),
      lastSeen: Date.now(),
      isActive: true,
    };

    this.state.vectorClock[this.currentUserId] = 0;
  }

  /**
   * Generate unique color for user
   */
  private generateUserColor(): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    const hash = this.currentUserId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Start sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) return;

    this.syncInterval = window.setInterval(() => {
      this.processOperationQueue();
    }, this.options.syncIntervalMs);

    if (this.options.enablePresence) {
      this.presenceInterval = window.setInterval(() => {
        this.updatePresence();
      }, this.options.presenceIntervalMs);
    }
  }

  /**
   * Stop sync loop
   */
  private stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  /**
   * Add entity operation
   */
  addEntity(entityData: any): string {
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const operation: EditorOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "insert",
      entityId,
      data: entityData,
      timestamp: Date.now(),
      authorId: this.currentUserId,
      vectorClock: { ...this.state.vectorClock },
    };

    this.applyOperation(operation);
    return entityId;
  }

  /**
   * Delete entity operation
   */
  deleteEntity(entityId: string): void {
    const operation: EditorOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "delete",
      entityId,
      timestamp: Date.now(),
      authorId: this.currentUserId,
      vectorClock: { ...this.state.vectorClock },
    };

    this.applyOperation(operation);
  }

  /**
   * Move entity operation
   */
  moveEntity(
    entityId: string,
    newPosition: { x: number; y: number; z: number },
  ): void {
    const operation: EditorOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "move",
      entityId,
      position: newPosition,
      timestamp: Date.now(),
      authorId: this.currentUserId,
      vectorClock: { ...this.state.vectorClock },
    };

    this.applyOperation(operation);
  }

  /**
   * Modify entity operation
   */
  modifyEntity(entityId: string, modifications: any): void {
    const operation: EditorOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "modify",
      entityId,
      data: modifications,
      timestamp: Date.now(),
      authorId: this.currentUserId,
      vectorClock: { ...this.state.vectorClock },
    };

    this.applyOperation(operation);
  }

  /**
   * Apply operation to state
   */
  public applyOperation(operation: EditorOperation): void {
    // Increment vector clock
    this.state.vectorClock[this.currentUserId]++;
    operation.vectorClock[this.currentUserId] =
      this.state.vectorClock[this.currentUserId];

    // Check for conflicts
    if (this.options.enableConflictResolution) {
      const conflict = this.detectConflict(operation);
      if (conflict) {
        this.handleConflict(conflict);
        return;
      }
    }

    // Apply operation
    this.executeOperation(operation);

    // Add to operation history
    this.state.operations.push(operation);
    this.trimOperationHistory();

    // Queue for sync
    this.operationQueue.push(operation);

    // Notify state change
    this.onStateChanged?.(this.state);
  }

  /**
   * Execute operation on state
   */
  private executeOperation(operation: EditorOperation): void {
    switch (operation.type) {
      case "insert":
        if (operation.entityId && operation.data) {
          this.state.entities[operation.entityId] = operation.data;
        }
        break;

      case "delete":
        if (operation.entityId) {
          delete this.state.entities[operation.entityId];
        }
        break;

      case "move":
        if (operation.entityId && operation.position) {
          const entity = this.state.entities[operation.entityId];
          if (entity) {
            entity.position = operation.position;
          }
        }
        break;

      case "modify":
        if (operation.entityId && operation.data) {
          const entity = this.state.entities[operation.entityId];
          if (entity) {
            Object.assign(entity, operation.data);
          }
        }
        break;
    }
  }

  /**
   * Detect operation conflicts
   */
  private detectConflict(
    operation: EditorOperation,
  ): ConflictResolution | null {
    // Check for concurrent edits on same entity
    const recentOps = this.state.operations.filter(
      (op) =>
        op.entityId === operation.entityId &&
        op.authorId !== operation.authorId &&
        Math.abs(op.timestamp - operation.timestamp) < 5000, // 5 second window
    );

    if (recentOps.length > 0) {
      return {
        operationId: operation.id,
        conflictType: "concurrent_edit",
        resolution: "merge", // Default resolution
      };
    }

    // Check for position conflicts
    if (operation.type === "move" && operation.position) {
      const conflictingEntity = Object.values(this.state.entities).find(
        (entity: any) =>
          entity.position &&
          Math.abs(entity.position.x - operation.position!.x) < 0.1 &&
          Math.abs(entity.position.y - operation.position!.y) < 0.1 &&
          Math.abs(entity.position.z - operation.position!.z) < 0.1,
      );

      if (conflictingEntity) {
        return {
          operationId: operation.id,
          conflictType: "position_conflict",
          resolution: "accept", // Move slightly
        };
      }
    }

    return null;
  }

  /**
   * Handle conflict resolution
   */
  private handleConflict(conflict: ConflictResolution): void {
    this.conflictResolver.push(conflict);
    this.onConflictDetected?.(conflict);

    // Auto-resolve based on strategy
    switch (conflict.resolution) {
      case "accept":
        // Apply operation as-is
        break;

      case "reject":
        // Skip operation
        return;

      case "merge":
        // Create merged operation
        // Implementation would depend on specific conflict type
        break;
    }
  }

  /**
   * Process operation queue
   */
  private processOperationQueue(): void {
    if (this.operationQueue.length === 0) return;

    // In a real implementation, this would sync with server/peers
    console.log(`Syncing ${this.operationQueue.length} operations`);
    this.operationQueue = [];
  }

  /**
   * Update user presence
   */
  updateCursor(position: { x: number; y: number; z: number }): void {
    const user = this.state.users[this.currentUserId];
    if (user) {
      user.cursor = position;
      user.lastSeen = Date.now();
    }
  }

  /**
   * Update selection
   */
  updateSelection(entityIds: string[]): void {
    const user = this.state.users[this.currentUserId];
    if (user) {
      user.selection = entityIds;
      user.lastSeen = Date.now();
    }
  }

  /**
   * Update presence information
   */
  private updatePresence(): void {
    const user = this.state.users[this.currentUserId];
    if (user) {
      user.lastSeen = Date.now();
      user.isActive = true;
    }

    // Mark inactive users
    const now = Date.now();
    for (const user of Object.values(this.state.users)) {
      if (now - user.lastSeen > 30000) {
        // 30 seconds
        user.isActive = false;
      }
    }
  }

  /**
   * Add remote user
   */
  addUser(user: UserPresence): void {
    this.state.users[user.userId] = user;
    this.state.vectorClock[user.userId] = 0;
    this.onUserJoined?.(user);
  }

  /**
   * Remove user
   */
  removeUser(userId: string): void {
    delete this.state.users[userId];
    delete this.state.vectorClock[userId];
    this.onUserLeft?.(userId);
  }

  /**
   * Apply remote operation
   */
  applyRemoteOperation(operation: EditorOperation): void {
    // Update vector clock
    for (const [userId, clock] of Object.entries(operation.vectorClock)) {
      this.state.vectorClock[userId] = Math.max(
        this.state.vectorClock[userId] || 0,
        clock,
      );
    }

    // Check if operation can be applied (causal ordering)
    if (this.canApplyOperation(operation)) {
      this.executeOperation(operation);
      this.state.operations.push(operation);
      this.trimOperationHistory();
      this.onStateChanged?.(this.state);
    } else {
      // Queue for later application
      console.warn("Operation cannot be applied yet, queuing:", operation.id);
    }
  }

  /**
   * Check if operation can be applied (causal ordering)
   */
  private canApplyOperation(operation: EditorOperation): boolean {
    for (const [userId, clock] of Object.entries(operation.vectorClock)) {
      if (userId === operation.authorId) {
        // Author's clock should be exactly one more than current
        if (clock !== (this.state.vectorClock[userId] || 0) + 1) {
          return false;
        }
      } else {
        // Other users' clocks should not exceed current
        if (clock > (this.state.vectorClock[userId] || 0)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Trim operation history
   */
  private trimOperationHistory(): void {
    if (this.state.operations.length > this.options.maxOperationHistory) {
      this.state.operations = this.state.operations.slice(
        -this.options.maxOperationHistory,
      );
    }
  }

  /**
   * Get current state
   */
  getState(): CollaborativeState {
    return { ...this.state };
  }

  /**
   * Get active users
   */
  getActiveUsers(): UserPresence[] {
    return Object.values(this.state.users).filter((user) => user.isActive);
  }

  /**
   * Get all active collaborators
   */
  getCollaborators(): UserPresence[] {
    return this.getActiveUsers();
  }

  /**
   * Leave collaboration session
   */
  leave(): void {
    this.removeUser(this.currentUserId);
    this.stopSyncLoop();
  }

  /**
   * Send operation directly
   */
  sendOperation(operation: EditorOperation): void {
    this.operationQueue.push(operation);
  }

  /**
   * Set event handlers
   */
  setOnStateChanged(handler: (state: CollaborativeState) => void): void {
    this.onStateChanged = handler;
  }

  setOnUserJoined(handler: (user: UserPresence) => void): void {
    this.onUserJoined = handler;
  }

  setOnUserLeft(handler: (userId: string) => void): void {
    this.onUserLeft = handler;
  }

  setOnConflictDetected(handler: (conflict: ConflictResolution) => void): void {
    this.onConflictDetected = handler;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalEntities: Object.keys(this.state.entities).length,
      totalOperations: this.state.operations.length,
      activeUsers: this.getActiveUsers().length,
      totalUsers: Object.keys(this.state.users).length,
      queuedOperations: this.operationQueue.length,
      conflicts: this.conflictResolver.length,
      vectorClock: { ...this.state.vectorClock },
    };
  }

  /**
   * Dispose system
   */
  dispose(): void {
    this.stopSyncLoop();
    this.state = {
      entities: {},
      operations: [],
      users: {},
      vectorClock: {},
    };
    this.operationQueue = [];
    this.conflictResolver = [];
  }
}
