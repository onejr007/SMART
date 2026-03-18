// 21. Replication layer berbasis komponen dengan diff + bitpacking
export interface ReplicatedComponent {
  componentType: string;
  data: Record<string, any>;
  dirty: boolean;
}

export class ReplicationLayer {
  private replicatedEntities = new Map<string, Map<string, ReplicatedComponent>>();
  private lastSnapshot = new Map<string, Map<string, any>>();

  registerEntity(entityId: string): void {
    if (!this.replicatedEntities.has(entityId)) {
      this.replicatedEntities.set(entityId, new Map());
      this.lastSnapshot.set(entityId, new Map());
    }
  }

  unregisterEntity(entityId: string): void {
    this.replicatedEntities.delete(entityId);
    this.lastSnapshot.delete(entityId);
  }

  setComponentData(entityId: string, componentType: string, data: Record<string, any>): void {
    const entity = this.replicatedEntities.get(entityId);
    if (!entity) return;

    const component = entity.get(componentType) || { componentType, data: {}, dirty: false };
    
    // Check for changes
    const lastData = this.lastSnapshot.get(entityId)?.get(componentType);
    const hasChanges = !lastData || JSON.stringify(data) !== JSON.stringify(lastData);
    
    component.data = data;
    component.dirty = hasChanges;
    entity.set(componentType, component);
  }

  getDiff(entityId: string): Map<string, any> | null {
    const entity = this.replicatedEntities.get(entityId);
    if (!entity) return null;

    const diff = new Map<string, any>();
    
    for (const [type, component] of entity) {
      if (component.dirty) {
        diff.set(type, component.data);
        component.dirty = false;
        
        // Update snapshot
        const snapshot = this.lastSnapshot.get(entityId)!;
        snapshot.set(type, { ...component.data });
      }
    }

    return diff.size > 0 ? diff : null;
  }

  packDiff(diff: Map<string, any>): Uint8Array {
    const json = JSON.stringify(Array.from(diff.entries()));
    const encoder = new TextEncoder();
    return encoder.encode(json);
  }

  unpackDiff(data: Uint8Array): Map<string, any> {
    const decoder = new TextDecoder();
    const json = decoder.decode(data);
    const entries = JSON.parse(json);
    return new Map(entries);
  }

  applyDiff(entityId: string, diff: Map<string, any>): void {
    const entity = this.replicatedEntities.get(entityId);
    if (!entity) return;

    for (const [type, data] of diff) {
      entity.set(type, { componentType: type, data, dirty: false });
    }
  }
}
