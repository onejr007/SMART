/**
 * Scene Versioning & Migration (Rekomendasi #11, #20)
 * Versioning untuk format scene JSON dengan migrator
 */

export interface SceneData {
  version: string;
  metadata: {
    title: string;
    author: string;
    createdAt: number;
    updatedAt: number;
  };
  entities: any[];
  config?: any;
}

export interface MigrationFunction {
  from: string;
  to: string;
  migrate: (data: any) => any;
}

export class SceneVersioning {
  private static CURRENT_VERSION = '1.0.0';
  private static migrations: MigrationFunction[] = [];
  
  public static registerMigration(migration: MigrationFunction): void {
    this.migrations.push(migration);
  }
  
  public static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }
  
  public static createNewScene(metadata: Partial<SceneData['metadata']>): SceneData {
    return {
      version: this.CURRENT_VERSION,
      metadata: {
        title: metadata.title || 'Untitled Scene',
        author: metadata.author || 'Unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      entities: [],
      config: {},
    };
  }
  
  public static migrateScene(data: any): SceneData {
    if (!data.version) {
      console.warn('Scene data has no version, assuming legacy format');
      data.version = '0.0.0';
    }
    
    let currentData = { ...data };
    let currentVersion = data.version;
    
    // Apply migrations in sequence
    while (currentVersion !== this.CURRENT_VERSION) {
      const migration = this.migrations.find(m => m.from === currentVersion);
      
      if (!migration) {
        console.error(`No migration path from ${currentVersion} to ${this.CURRENT_VERSION}`);
        break;
      }
      
      console.log(`Migrating scene from ${migration.from} to ${migration.to}`);
      currentData = migration.migrate(currentData);
      currentData.version = migration.to;
      currentVersion = migration.to;
    }
    
    return currentData as SceneData;
  }
  
  public static validateScene(data: any): boolean {
    if (!data.version) return false;
    if (!data.metadata) return false;
    if (!Array.isArray(data.entities)) return false;
    return true;
  }
}

// Example migration from 0.0.0 to 1.0.0
SceneVersioning.registerMigration({
  from: '0.0.0',
  to: '1.0.0',
  migrate: (data: any) => {
    return {
      version: '1.0.0',
      metadata: {
        title: data.title || 'Migrated Scene',
        author: data.author || 'Unknown',
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      entities: data.entities || [],
      config: data.config || {},
    };
  },
});
