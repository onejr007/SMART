// 36. Ledger transaksi idempotent
export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'transfer';
  amount: number;
  itemId?: string;
  fromUserId?: string;
  toUserId?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  idempotencyKey: string;
}

export class TransactionLedger {
  private transactions = new Map<string, Transaction>();
  private idempotencyKeys = new Set<string>();
  private balances = new Map<string, number>();

  async executeTransaction(
    userId: string,
    type: Transaction['type'],
    amount: number,
    idempotencyKey: string,
    metadata?: any
  ): Promise<Transaction | null> {
    // Check idempotency
    if (this.idempotencyKeys.has(idempotencyKey)) {
      const existing = Array.from(this.transactions.values())
        .find(t => t.idempotencyKey === idempotencyKey);
      return existing || null;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      type,
      amount,
      ...metadata,
      timestamp: Date.now(),
      status: 'pending',
      idempotencyKey
    };

    this.transactions.set(transaction.id, transaction);
    this.idempotencyKeys.add(idempotencyKey);

    // Execute transaction
    try {
      await this.processTransaction(transaction);
      transaction.status = 'completed';
      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      return null;
    }
  }

  private async processTransaction(transaction: Transaction): Promise<void> {
    const balance = this.balances.get(transaction.userId) || 0;

    switch (transaction.type) {
      case 'purchase':
        if (balance < transaction.amount) {
          throw new Error('Insufficient balance');
        }
        this.balances.set(transaction.userId, balance - transaction.amount);
        break;

      case 'sale':
        this.balances.set(transaction.userId, balance + transaction.amount);
        break;

      case 'transfer':
        if (!transaction.toUserId) throw new Error('Missing recipient');
        if (balance < transaction.amount) throw new Error('Insufficient balance');
        
        const recipientBalance = this.balances.get(transaction.toUserId) || 0;
        this.balances.set(transaction.userId, balance - transaction.amount);
        this.balances.set(transaction.toUserId, recipientBalance + transaction.amount);
        break;
    }
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  getBalance(userId: string): number {
    return this.balances.get(userId) || 0;
  }

  getTransactionHistory(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId || t.toUserId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}
