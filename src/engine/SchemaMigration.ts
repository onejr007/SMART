/**
 * SchemaMigration.ts
 * [P0] Schema version + migration
 * Setiap scene/game data punya versi; migrator untuk backward compatibility
 */

export interface SchemaVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
  description: string;
}

export interface SchemaConfig {
  currentVersion: SchemaVersion;
  minSupportedVersion: SchemaVersion;
  autoMigrate: boolean;
}

export const DEFAULT_SCHEMA_CONFIG: SchemaConfig = {
  currentVersion: { major: 1, minor: 0, patch: 0 },
  minSupportedVersion: { major: 1, minor: 0, patch: 0 },
  autoMigrate: true
};

export class SchemaMigrationManager {
  private config: SchemaConfig;
  private migrations: Map<string, MigrationStep> = new Map();
  
  constructor(config: SchemaConfig = DEFAULT_SCHEMA_CONFIG) {
    this.config = { ...config };
    this.registerDefaultMigrations();
  }
  
  private registerDefaultMigrations(): void {
    // Example migration from 1.0.0 to 1.1.0
    this.registerMigration({
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      description: 'Add metadata field to entities',
      migrate: (data: any) => {
        if (data.entities) {
          data.entities = data.entities.map((entity: any) => ({
            ...entity,
            metadata: entity.metadata || {}
          }));
        }
        return data;
      }
    });
  }
  
  public registerMigration(step: MigrationStep): void {
    const key = `${step.fromVersion}->${step.toVersion}`;
    this.migrations.set(key, step);
    console.log(`📝 Registered migration: ${key}`);
  }
  
  public parseVersion(versionString: string): SchemaVersion {
    const parts = versionString.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }
  
  public versionToString(version: SchemaVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }
  
  public compareVersions(v1: SchemaVersion, v2: SchemaVersion): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }
  
  public isVersionSupported(version: SchemaVersion): boolean {
    return this.compareVersions(version, this.config.minSupportedVersion) >= 0;
  }
  
  public needsMigration(dataVersion: SchemaVersion): boolean {
    return this.compareVersions(dataVersion, this.config.currentVersion) < 0;
  }
  
  public async migrateData(data: any): Promise<any> {
    if (!data.version) {
      console.warn('⚠️ Data has no version, assuming oldest supported version');
      data.version = this.versionToString(this.config.minSupportedVersion);
    }
    
    const dataVersion = this.parseVersion(data.version);
    
    // Check if version is supported
    if (!this.isVersionSupported(dataVersion)) {
      throw new Error(`Unsupported data version: ${data.version}. Minimum supported: ${this.versionToString(this.config.minSupportedVersion)}`);
    }
    
    // Check if migration is needed
    if (!this.needsMigration(dataVersion)) {
      return data;
    }
    
    if (!this.config.autoMigrate) {
      throw new Error(`Data version ${data.version} needs migration but auto-migration is disabled`);
    }
    
    console.log(`🔄 Migrating data from ${data.version} to ${this.versionToString(this.config.currentVersion)}`);
    
    // Find migration path
    const migrationPath = this.findMigrationPath(dataVersion, this.config.currentVersion);
    
    if (!migrationPath) {
      throw new Error(`No migration path found from ${data.version} to ${this.versionToString(this.config.currentVersion)}`);
    }
    
    // Apply migrations
    let migratedData = { ...data };
    for (const step of migrationPath) {
      console.log(`  → Applying migration: ${step.description}`);
      migratedData = step.migrate(migratedData);
      migratedData.version = step.toVersion;
    }
    
    console.log(`✅ Migration complete: ${data.version} → ${migratedData.version}`);
    return migratedData;
  }
  
  private findMigrationPath(from: SchemaVersion, to: SchemaVersion): MigrationStep[] | null {
    const path: MigrationStep[] = [];
    let currentVersion = from;
    
    // Simple linear search for migration path
    while (this.compareVersions(currentVersion, to) < 0) {
      const currentVersionStr = this.versionToString(currentVersion);
      let found = false;
      
      // Find next migration step
      for (const [key, step] of this.migrations.entries()) {
        if (step.fromVersion === currentVersionStr) {
          path.push(step);
          currentVersion = this.parseVersion(step.toVersion);
          found = true;
          break;
        }
      }
      
      if (!found) {
        return null; // No migration path found
      }
    }
    
    return path;
  }
  
  public validateData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.version) {
      errors.push('Missing version field');
    }
    
    if (!data.entities) {
      errors.push('Missing entities field');
    }
    
    if (data.version) {
      const version = this.parseVersion(data.version);
      if (!this.isVersionSupported(version)) {
        errors.push(`Unsupported version: ${data.version}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  public getCurrentVersion(): SchemaVersion {
    return { ...this.config.currentVersion };
  }
  
  public getStats() {
    return {
      currentVersion: this.versionToString(this.config.currentVersion),
      minSupportedVersion: this.versionToString(this.config.minSupportedVersion),
      registeredMigrations: this.migrations.size,
      autoMigrate: this.config.autoMigrate
    };
  }
}
