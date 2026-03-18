/**
 * ReliabilityStrategy.ts
 * P1 Networking #6 - Channel reliability management
 * Pisahkan channel reliable (chat, inventory) vs unreliable (transform)
 */

export type ChannelType = 'reliable' | 'unreliable' | 'reliable-ordered' | 'unreliable-sequenced';
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';

export interface ReliabilityConfig {
  maxRetries: number;
  retryDelay: number;
  ackTimeout: number;
  enableOrdering: boolean;
  enableSequencing: boolean;
}

export interface NetworkMessage {
  id: string;
  channel: ChannelType;
  priority: MessagePriority;
  data: any;
  timestamp: number;
  sequenceNumber?: number;
  requiresAck?: boolean;
}

interface PendingMessage {
  message: NetworkMessage;
  retries: number;
  lastSendTime: number;
  ackReceived: boolean;
}

export class ReliabilityStrategyManager {
  private config: ReliabilityConfig;
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private receivedSequences: Map<ChannelType, number> = new Map();
  private sendSequences: Map<ChannelType, number> = new Map();
  private messageQueue: NetworkMessage[] = [];
  private stats = {
    messagesSent: 0,
    messagesReceived: 0,
    messagesRetried: 0,
    messagesDropped: 0,
    averageLatency: 0,
    packetLoss: 0
  };

  constructor(config: Partial<ReliabilityConfig> = {}) {
    this.config = {
      maxRetries: 5,
      retryDelay: 100,
      ackTimeout: 1000,
      enableOrdering: true,
      enableSequencing: true,
      ...config
    };

    this.initializeChannels();
  }

  private initializeChannels(): void {
    const channels: ChannelType[] = ['reliable', 'unreliable', 'reliable-ordered', 'unreliable-sequenced'];
    for (const channel of channels) {
      this.receivedSequences.set(channel, 0);
      this.sendSequences.set(channel, 0);
    }
  }

  public send(message: Omit<NetworkMessage, 'id' | 'timestamp' | 'sequenceNumber'>): string {
    const fullMessage: NetworkMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      sequenceNumber: this.getNextSequence(message.channel),
      requiresAck: this.requiresAck(message.channel)
    };

    if (fullMessage.requiresAck) {
      this.pendingMessages.set(fullMessage.id, {
        message: fullMessage,
        retries: 0,
        lastSendTime: Date.now(),
        ackReceived: false
      });
    }

    this.messageQueue.push(fullMessage);
    this.stats.messagesSent++;

    return fullMessage.id;
  }

  public receive(message: NetworkMessage): boolean {
    this.stats.messagesReceived++;

    // Handle acknowledgment
    if (message.requiresAck) {
      this.sendAck(message.id);
    }

    // Check sequence for ordered/sequenced channels
    if (this.config.enableSequencing && message.sequenceNumber !== undefined) {
      const lastSequence = this.receivedSequences.get(message.channel) || 0;

      if (message.channel === 'reliable-ordered') {
        // Must be in order
        if (message.sequenceNumber !== lastSequence + 1) {
          console.warn(`Out of order message on ${message.channel}: expected ${lastSequence + 1}, got ${message.sequenceNumber}`);
          return false;
        }
      } else if (message.channel === 'unreliable-sequenced') {
        // Drop old messages
        if (message.sequenceNumber <= lastSequence) {
          console.log(`Dropping old sequenced message: ${message.sequenceNumber} <= ${lastSequence}`);
          this.stats.messagesDropped++;
          return false;
        }
      }

      this.receivedSequences.set(message.channel, message.sequenceNumber);
    }

    return true;
  }

  public handleAck(messageId: string): void {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      pending.ackReceived = true;
      const latency = Date.now() - pending.message.timestamp;
      this.updateLatency(latency);
      this.pendingMessages.delete(messageId);
    }
  }

  public update(currentTime: number): void {
    // Retry pending messages
    for (const [messageId, pending] of this.pendingMessages.entries()) {
      if (pending.ackReceived) continue;

      const timeSinceLastSend = currentTime - pending.lastSendTime;

      if (timeSinceLastSend > this.config.ackTimeout) {
        if (pending.retries >= this.config.maxRetries) {
          console.error(`Message ${messageId} failed after ${this.config.maxRetries} retries`);
          this.pendingMessages.delete(messageId);
          this.stats.messagesDropped++;
          this.updatePacketLoss();
        } else {
          // Retry
          pending.retries++;
          pending.lastSendTime = currentTime;
          this.messageQueue.push(pending.message);
          this.stats.messagesRetried++;
          console.log(`Retrying message ${messageId} (attempt ${pending.retries}/${this.config.maxRetries})`);
        }
      }
    }
  }

  public getQueuedMessages(): NetworkMessage[] {
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    // Sort by priority
    messages.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return messages;
  }

  private requiresAck(channel: ChannelType): boolean {
    return channel === 'reliable' || channel === 'reliable-ordered';
  }

  private getNextSequence(channel: ChannelType): number {
    const current = this.sendSequences.get(channel) || 0;
    const next = current + 1;
    this.sendSequences.set(channel, next);
    return next;
  }

  private sendAck(messageId: string): void {
    // In real implementation, this would send ACK packet
    console.log(`Sending ACK for message: ${messageId}`);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateLatency(latency: number): void {
    this.stats.averageLatency = this.stats.averageLatency * 0.9 + latency * 0.1;
  }

  private updatePacketLoss(): void {
    const total = this.stats.messagesSent;
    const lost = this.stats.messagesDropped;
    this.stats.packetLoss = total > 0 ? (lost / total) * 100 : 0;
  }

  public getStats() {
    return {
      ...this.stats,
      pendingMessages: this.pendingMessages.size,
      queuedMessages: this.messageQueue.length,
      packetLossPercent: this.stats.packetLoss.toFixed(2) + '%',
      averageLatencyMs: Math.round(this.stats.averageLatency)
    };
  }

  public dispose(): void {
    this.pendingMessages.clear();
    this.messageQueue = [];
    this.receivedSequences.clear();
    this.sendSequences.clear();
  }
}
