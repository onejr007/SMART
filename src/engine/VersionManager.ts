/**
 * VersionManager.ts
 * [P1] Buat "Compatibility & Versioning"
 * Versi engine, schema scene, network protocol terpisah
 */

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export interface VersionInfo {
  engine: Version;
  sceneSchema: Version;
  networkProtocol: Version;
  buildNumber: string;
  buildDate: string;
}

export class VersionManager {
  private static instance: VersionManager;
  private versionInfo: VersionInfo;
  
  private constructor() {
    this.versionInfo = {
      engine: { major: 1, minor: 0, patch: 0 },
      sceneSchema: { major: 1, minor: 0, patch: 0 },
      networkProtocol: { major: 1, minor: 0, patch: 0 },
      buildNumber: this.generateBuildNumber(),
      buildDate: new Date().toISOString()
    };
  }
  
  public static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }
  
  private generateBuildNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`;
  }
  
  public getVersionInfo(): VersionInfo {
    return { ...this.versionInfo };
  }
  
  public getEngineVersion(): string {
    const v = this.versionInfo.engine;
    return `${v.major}.${v.minor}.${v.patch}`;
  }
  
  public getSceneSchemaVersion(): string {
    const v = this.versionInfo.sceneSchema;
    return `${v.major}.${v.minor}.${v.patch}`;
  }
  
  public getNetworkProtocolVersion(): string {
    const v = this.versionInfo.networkProtocol;
    return `${v.major}.${v.minor}.${v.patch}`;
  }
  
  public isCompatible(other: VersionInfo): { compatible: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Engine compatibility: major version must match
    if (this.versionInfo.engine.major !== other.engine.major) {
      reasons.push(`Engine major version mismatch: ${this.versionInfo.engine.major} vs ${other.engine.major}`);
    }
    
    // Scene schema: major version must match, minor can be backward compatible
    if (this.versionInfo.sceneSchema.major !== other.sceneSchema.major) {
      reasons.push(`Scene schema major version mismatch: ${this.versionInfo.sceneSchema.major} vs ${other.sceneSchema.major}`);
    } else if (this.versionInfo.sceneSchema.minor < other.sceneSchema.minor) {
      reasons.push(`Scene schema too new: ${other.sceneSchema.minor} > ${this.versionInfo.sceneSchema.minor}`);
    }
    
    // Network protocol: must match exactly for multiplayer
    if (this.versionInfo.networkProtocol.major !== other.networkProtocol.major ||
        this.versionInfo.networkProtocol.minor !== other.networkProtocol.minor) {
      reasons.push(`Network protocol mismatch: ${this.getNetworkProtocolVersion()} vs ${other.networkProtocol.major}.${other.networkProtocol.minor}.${other.networkProtocol.patch}`);
    }
    
    return {
      compatible: reasons.length === 0,
      reasons
    };
  }
  
  public compareVersions(a: Version, b: Version): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }
  
  public parseVersion(versionString: string): Version | null {
    const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;
    
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  }
  
  public setEngineVersion(version: Version): void {
    this.versionInfo.engine = version;
  }
  
  public setSceneSchemaVersion(version: Version): void {
    this.versionInfo.sceneSchema = version;
  }
  
  public setNetworkProtocolVersion(version: Version): void {
    this.versionInfo.networkProtocol = version;
  }
  
  public getFullVersionString(): string {
    return `Engine v${this.getEngineVersion()} | Schema v${this.getSceneSchemaVersion()} | Protocol v${this.getNetworkProtocolVersion()} | Build ${this.versionInfo.buildNumber}`;
  }
  
  public logVersionInfo(): void {
    console.log('📦 Version Information:');
    console.log(`  Engine: v${this.getEngineVersion()}`);
    console.log(`  Scene Schema: v${this.getSceneSchemaVersion()}`);
    console.log(`  Network Protocol: v${this.getNetworkProtocolVersion()}`);
    console.log(`  Build: ${this.versionInfo.buildNumber}`);
    console.log(`  Date: ${this.versionInfo.buildDate}`);
  }
}

export const versionManager = VersionManager.getInstance();
