// 10. Asset manifest + hashing untuk cache-busting
export interface AssetEntry {
  url: string;
  hash: string;
  size: number;
  type: 'model' | 'texture' | 'audio' | 'script';
  dependencies?: string[];
}

export interface AssetManifest {
  version: string;
  assets: Record<string, AssetEntry>;
}

export class AssetManifestManager {
  private manifest: AssetManifest | null = null;

  async loadManifest(url: string): Promise<void> {
    const response = await fetch(url);
    this.manifest = await response.json();
  }

  getAssetURL(id: string): string | null {
    if (!this.manifest) return null;
    const asset = this.manifest.assets[id];
    if (!asset) return null;
    return `${asset.url}?v=${asset.hash}`;
  }

  async verifyIntegrity(id: string, data: ArrayBuffer): Promise<boolean> {
    if (!this.manifest) return false;
    const asset = this.manifest.assets[id];
    if (!asset) return false;

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === asset.hash;
  }

  getDependencies(id: string): string[] {
    if (!this.manifest) return [];
    return this.manifest.assets[id]?.dependencies || [];
  }
}
