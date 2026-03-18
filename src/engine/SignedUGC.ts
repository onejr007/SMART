/**
 * Signed UGC System
 * Sign asset/scene yang dipublish (publisher key) + verifikasi sebelum load untuk mencegah tampering
 */

interface UGCSignature {
  signature: string;
  publicKey: string;
  timestamp: number;
  algorithm: 'RSA-SHA256' | 'ECDSA-SHA256';
}

interface SignedUGCPackage {
  id: string;
  content: any;
  metadata: {
    author: string;
    version: string;
    createdAt: number;
    contentHash: string;
  };
  signature: UGCSignature;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface VerificationResult {
  isValid: boolean;
  error?: string;
  trustedPublisher: boolean;
  signatureValid: boolean;
  contentIntact: boolean;
}

export class SignedUGC {
  private trustedPublishers = new Set<string>();
  private keyCache = new Map<string, CryptoKey>();
  private signatureCache = new Map<string, VerificationResult>();

  constructor(
    private options = {
      enableCaching: true,
      cacheTimeout: 3600000, // 1 hour
      requireTrustedPublisher: false,
      algorithm: 'RSA-SHA256' as const
    }
  ) {}

  /**
   * Generate key pair untuk publisher
   */
  async generateKeyPair(): Promise<KeyPair> {
    let keyPair: CryptoKeyPair;

    if (this.options.algorithm === 'RSA-SHA256') {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-PSS',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      );
    } else {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );
    }

    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey)
    };
  }

  /**
   * Sign UGC content
   */
  async signContent(content: any, privateKeyPem: string, metadata: {
    author: string;
    version: string;
  }): Promise<SignedUGCPackage> {
    // Calculate content hash
    const contentHash = await this.calculateContentHash(content);
    
    // Create package metadata
    const packageMetadata = {
      ...metadata,
      createdAt: Date.now(),
      contentHash
    };

    // Create signing payload
    const signingPayload = {
      content,
      metadata: packageMetadata
    };

    const payloadString = JSON.stringify(signingPayload, Object.keys(signingPayload).sort());
    const payloadBuffer = new TextEncoder().encode(payloadString);

    // Import private key
    const privateKey = await this.importPrivateKey(privateKeyPem);

    // Sign payload
    let signature: ArrayBuffer;
    if (this.options.algorithm === 'RSA-SHA256') {
      signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        privateKey,
        payloadBuffer
      );
    } else {
      signature = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256'
        },
        privateKey,
        payloadBuffer
      );
    }

    // Get public key for verification
    const publicKeyPem = await this.getPublicKeyFromPrivate(privateKeyPem);

    const signedPackage: SignedUGCPackage = {
      id: `ugc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata: packageMetadata,
      signature: {
        signature: this.arrayBufferToBase64(signature),
        publicKey: publicKeyPem,
        timestamp: Date.now(),
        algorithm: this.options.algorithm
      }
    };

    return signedPackage;
  }

  /**
   * Verify signed UGC package
   */
  async verifyPackage(signedPackage: SignedUGCPackage): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: false,
      trustedPublisher: false,
      signatureValid: false,
      contentIntact: false
    };

    try {
      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.signatureCache.get(signedPackage.id);
        if (cached && Date.now() - signedPackage.signature.timestamp < this.options.cacheTimeout) {
          return cached;
        }
      }

      // Verify content hash
      const expectedHash = await this.calculateContentHash(signedPackage.content);
      if (expectedHash !== signedPackage.metadata.contentHash) {
        result.error = 'Content hash mismatch - content may have been tampered with';
        return result;
      }
      result.contentIntact = true;

      // Check if publisher is trusted
      result.trustedPublisher = this.trustedPublishers.has(signedPackage.signature.publicKey);
      
      if (this.options.requireTrustedPublisher && !result.trustedPublisher) {
        result.error = 'Publisher not in trusted list';
        return result;
      }

      // Verify signature
      const signatureValid = await this.verifySignature(signedPackage);
      result.signatureValid = signatureValid;

      if (!signatureValid) {
        result.error = 'Invalid signature';
        return result;
      }

      result.isValid = true;

      // Cache result
      if (this.options.enableCaching) {
        this.signatureCache.set(signedPackage.id, result);
      }

    } catch (error) {
      result.error = `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  /**
   * Verify signature
   */
  private async verifySignature(signedPackage: SignedUGCPackage): Promise<boolean> {
    try {
      // Import public key
      const publicKey = await this.importPublicKey(signedPackage.signature.publicKey);

      // Recreate signing payload
      const signingPayload = {
        content: signedPackage.content,
        metadata: signedPackage.metadata
      };

      const payloadString = JSON.stringify(signingPayload, Object.keys(signingPayload).sort());
      const payloadBuffer = new TextEncoder().encode(payloadString);

      // Convert signature from base64
      const signatureBuffer = this.base64ToArrayBuffer(signedPackage.signature.signature);

      // Verify signature
      let isValid: boolean;
      if (signedPackage.signature.algorithm === 'RSA-SHA256') {
        isValid = await crypto.subtle.verify(
          {
            name: 'RSA-PSS',
            saltLength: 32
          },
          publicKey,
          signatureBuffer,
          payloadBuffer
        );
      } else {
        isValid = await crypto.subtle.verify(
          {
            name: 'ECDSA',
            hash: 'SHA-256'
          },
          publicKey,
          signatureBuffer,
          payloadBuffer
        );
      }

      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Calculate content hash
   */
  private async calculateContentHash(content: any): Promise<string> {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    const contentBuffer = new TextEncoder().encode(contentString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', contentBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Import private key
   */
  private async importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(privateKeyPem);
    
    if (this.options.algorithm === 'RSA-SHA256') {
      return await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );
    } else {
      return await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['sign']
      );
    }
  }

  /**
   * Import public key
   */
  private async importPublicKey(publicKeyPem: string): Promise<CryptoKey> {
    // Check cache first
    if (this.keyCache.has(publicKeyPem)) {
      return this.keyCache.get(publicKeyPem)!;
    }

    const keyData = this.base64ToArrayBuffer(publicKeyPem);
    
    let publicKey: CryptoKey;
    if (this.options.algorithm === 'RSA-SHA256') {
      publicKey = await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['verify']
      );
    } else {
      publicKey = await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['verify']
      );
    }

    // Cache the key
    this.keyCache.set(publicKeyPem, publicKey);
    return publicKey;
  }

  /**
   * Get public key from private key (mock implementation)
   */
  private async getPublicKeyFromPrivate(privateKeyPem: string): Promise<string> {
    // In a real implementation, you would derive the public key from the private key
    // For now, we'll return a placeholder
    return `public_key_for_${privateKeyPem.substring(0, 20)}`;
  }

  /**
   * Add trusted publisher
   */
  addTrustedPublisher(publicKey: string): void {
    this.trustedPublishers.add(publicKey);
  }

  /**
   * Remove trusted publisher
   */
  removeTrustedPublisher(publicKey: string): void {
    this.trustedPublishers.delete(publicKey);
  }

  /**
   * Get trusted publishers
   */
  getTrustedPublishers(): string[] {
    return Array.from(this.trustedPublishers);
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.keyCache.clear();
    this.signatureCache.clear();
  }

  /**
   * Utility: ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      trustedPublishers: this.trustedPublishers.size,
      cachedKeys: this.keyCache.size,
      cachedSignatures: this.signatureCache.size,
      algorithm: this.options.algorithm,
      requireTrustedPublisher: this.options.requireTrustedPublisher
    };
  }

  /**
   * Dispose system
   */
  dispose(): void {
    this.clearCaches();
    this.trustedPublishers.clear();
  }
}