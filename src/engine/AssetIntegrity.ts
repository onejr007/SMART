/**
 * AssetIntegrity.ts
 * [P0] Asset integrity & hashing
 * Manifest berbasis hash (SHA-256) untuk cache-busting dan validasi
 */

export interface AssetManifestEntry {
  path: string;
  hash: string;
  size: number;
  type: string;
  timestamp: number;
}

export interface AssetManifest {
  version: string;
  generated: number;
  assets: AssetManifestEntry[];
}

export class AssetIntegrityManager {
  private manifest: AssetManifest | null = null;
  private verifiedAssets: Set<string> = new Set();
  
  public async loadManifest(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      this.manifest = await response.json();
      console.log(`✅ Asset manifest loaded: ${this.manifest?.assets.length || 0} assets`);
    } catch (error) {
      console.error('❌ Failed to load asset manifest:', error);
      throw error;
    }
  }
  
  public async verifyAsset(path: string, data: ArrayBuffer): Promise<boolean> {
    if (!this.manifest) {
      console.warn('⚠️ No manifest loaded, skipping verification');
      return true;
    }
    
    const entry = this.manifest.assets.find(a => a.path === path);
    if (!entry) {
      console.warn(`⚠️ Asset not in manifest: ${path}`);
      return false;
    }
    
    const hash = await this.computeHash(data);
    const isValid = hash === entry.hash;
    
    if (isValid) {
      this.verifiedAssets.add(path);
      console.log(`✅ Asset verified: ${path}`);
    } else {
      console.error(`❌ Asset hash mismatch: ${path}`);
    }
    
    return isValid;
  }
  
  private async computeHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  public getAssetUrl(path: string): string {
    if (!this.manifest) {
      return path;
    }
    
    const entry = this.manifest.assets.find(a => a.path === path);
    if (!entry) {
      return path;
    }
    
    // Cache-busting dengan hash
    const url = new URL(path, window.location.origin);
    url.searchParams.set('v', entry.hash.substring(0, 8));
    return url.toString();
  }
  
  public isVerified(path: string): boolean {
    return this.verifiedAssets.has(path);
  }
  
  public getManifest(): AssetManifest | null {
    return this.manifest;
  }
  
  public getStats() {
    return {
      totalAssets: this.manifest?.assets.length || 0,
      verifiedAssets: this.verifiedAssets.size,
      manifestVersion: this.manifest?.version || 'none'
    };
  }
}
