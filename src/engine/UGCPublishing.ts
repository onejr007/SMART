// 31. Signed UGC publish + review queue + pembatasan
export interface UGCAsset {
  id: string;
  authorId: string;
  type: 'model' | 'texture' | 'audio' | 'script';
  data: ArrayBuffer;
  signature: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export class UGCPublishing {
  private reviewQueue: UGCAsset[] = [];
  private publishedAssets = new Map<string, UGCAsset>();
  private maxAssetSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = new Set(['model', 'texture', 'audio']);

  async publishAsset(
    authorId: string,
    type: string,
    data: ArrayBuffer,
    privateKey: CryptoKey
  ): Promise<string | null> {
    // Validate type
    if (!this.allowedTypes.has(type)) {
      console.error('Invalid asset type');
      return null;
    }

    // Validate size
    if (data.byteLength > this.maxAssetSize) {
      console.error('Asset too large');
      return null;
    }

    // Sign asset
    const signature = await this.signAsset(data, privateKey);

    const asset: UGCAsset = {
      id: crypto.randomUUID(),
      authorId,
      type: type as any,
      data,
      signature,
      size: data.byteLength,
      status: 'pending',
      timestamp: Date.now()
    };

    this.reviewQueue.push(asset);
    return asset.id;
  }

  private async signAsset(data: ArrayBuffer, privateKey: CryptoKey): Promise<string> {
    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      data
    );

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyAsset(asset: UGCAsset, publicKey: CryptoKey): Promise<boolean> {
    const signatureBytes = new Uint8Array(
      asset.signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      publicKey,
      signatureBytes,
      asset.data
    );
  }

  approveAsset(assetId: string): boolean {
    const index = this.reviewQueue.findIndex(a => a.id === assetId);
    if (index === -1) return false;

    const asset = this.reviewQueue.splice(index, 1)[0];
    asset.status = 'approved';
    this.publishedAssets.set(assetId, asset);
    return true;
  }

  rejectAsset(assetId: string): boolean {
    const index = this.reviewQueue.findIndex(a => a.id === assetId);
    if (index === -1) return false;

    const asset = this.reviewQueue.splice(index, 1)[0];
    asset.status = 'rejected';
    return true;
  }

  getReviewQueue(): UGCAsset[] {
    return [...this.reviewQueue];
  }

  getPublishedAsset(assetId: string): UGCAsset | undefined {
    return this.publishedAssets.get(assetId);
  }

  setMaxAssetSize(bytes: number): void {
    this.maxAssetSize = bytes;
  }

  addAllowedType(type: string): void {
    this.allowedTypes.add(type);
  }
}
