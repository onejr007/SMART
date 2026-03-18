/**
 * UUID Manager (Rekomendasi #7)
 * ID entitas yang stabil untuk runtime/network/save
 */

export class UUIDManager {
  private static instance: UUIDManager;
  private uuidMap: Map<string, string> = new Map(); // name -> uuid
  private nameMap: Map<string, string> = new Map(); // uuid -> name
  
  private constructor() {}
  
  public static getInstance(): UUIDManager {
    if (!UUIDManager.instance) {
      UUIDManager.instance = new UUIDManager();
    }
    return UUIDManager.instance;
  }
  
  public generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  public register(name: string, uuid?: string): string {
    const id = uuid || this.generateUUID();
    
    if (this.uuidMap.has(name)) {
      console.warn(`Name ${name} already registered with UUID ${this.uuidMap.get(name)}`);
    }
    
    this.uuidMap.set(name, id);
    this.nameMap.set(id, name);
    return id;
  }
  
  public getUUID(name: string): string | undefined {
    return this.uuidMap.get(name);
  }
  
  public getName(uuid: string): string | undefined {
    return this.nameMap.get(uuid);
  }
  
  public unregister(name: string): void {
    const uuid = this.uuidMap.get(name);
    if (uuid) {
      this.nameMap.delete(uuid);
      this.uuidMap.delete(name);
    }
  }
  
  public clear(): void {
    this.uuidMap.clear();
    this.nameMap.clear();
  }
}

export const uuidManager = UUIDManager.getInstance();
