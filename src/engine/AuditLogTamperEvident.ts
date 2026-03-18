// 35. Audit log tamper-evident
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  data: any;
  timestamp: number;
  previousHash: string;
  hash: string;
}

export class AuditLogTamperEvident {
  private logs: AuditLogEntry[] = [];
  private lastHash = '0';

  async log(userId: string, action: string, data: any): Promise<string> {
    const entry: Omit<AuditLogEntry, 'hash'> = {
      id: crypto.randomUUID(),
      userId,
      action,
      data,
      timestamp: Date.now(),
      previousHash: this.lastHash
    };

    const hash = await this.calculateHash(entry);
    const fullEntry: AuditLogEntry = { ...entry, hash };

    this.logs.push(fullEntry);
    this.lastHash = hash;

    return fullEntry.id;
  }

  private async calculateHash(entry: Omit<AuditLogEntry, 'hash'>): Promise<string> {
    const data = JSON.stringify(entry);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verify(): Promise<boolean> {
    let expectedHash = '0';

    for (const entry of this.logs) {
      if (entry.previousHash !== expectedHash) {
        console.error(`Chain broken at entry ${entry.id}`);
        return false;
      }

      const calculatedHash = await this.calculateHash({
        id: entry.id,
        userId: entry.userId,
        action: entry.action,
        data: entry.data,
        timestamp: entry.timestamp,
        previousHash: entry.previousHash
      });

      if (calculatedHash !== entry.hash) {
        console.error(`Hash mismatch at entry ${entry.id}`);
        return false;
      }

      expectedHash = entry.hash;
    }

    return true;
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }
}
