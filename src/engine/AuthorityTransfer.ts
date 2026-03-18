// 25. Authority transfer saat lintas area/shard
export interface AuthorityTransferRequest {
  entityId: string;
  fromShard: string;
  toShard: string;
  timestamp: number;
}

export class AuthorityTransfer {
  private pendingTransfers = new Map<string, AuthorityTransferRequest>();
  private entityAuthority = new Map<string, string>();

  requestTransfer(entityId: string, fromShard: string, toShard: string): void {
    const request: AuthorityTransferRequest = {
      entityId,
      fromShard,
      toShard,
      timestamp: Date.now()
    };

    this.pendingTransfers.set(entityId, request);
  }

  approveTransfer(entityId: string): boolean {
    const request = this.pendingTransfers.get(entityId);
    if (!request) return false;

    const currentAuthority = this.entityAuthority.get(entityId);
    if (currentAuthority !== request.fromShard) {
      return false;
    }

    this.entityAuthority.set(entityId, request.toShard);
    this.pendingTransfers.delete(entityId);
    return true;
  }

  rejectTransfer(entityId: string): void {
    this.pendingTransfers.delete(entityId);
  }

  getAuthority(entityId: string): string | undefined {
    return this.entityAuthority.get(entityId);
  }

  hasAuthority(entityId: string, shardId: string): boolean {
    return this.entityAuthority.get(entityId) === shardId;
  }

  setAuthority(entityId: string, shardId: string): void {
    this.entityAuthority.set(entityId, shardId);
  }

  clearAuthority(entityId: string): void {
    this.entityAuthority.delete(entityId);
    this.pendingTransfers.delete(entityId);
  }
}
