// 40. Observability network: RTT, jitter, loss, bandwidth
export interface NetworkMetrics {
  rtt: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  timestamp: number;
}

export class NetworkObservability {
  private metrics: NetworkMetrics[] = [];
  private maxSamples = 100;
  private lastPacketTime = 0;
  private packetTimes: number[] = [];
  private sentPackets = 0;
  private receivedPackets = 0;

  recordPacketSent(): void {
    this.sentPackets++;
  }

  recordPacketReceived(rtt: number): void {
    this.receivedPackets++;
    const now = Date.now();
    
    if (this.lastPacketTime > 0) {
      this.packetTimes.push(now - this.lastPacketTime);
      if (this.packetTimes.length > 20) {
        this.packetTimes.shift();
      }
    }
    
    this.lastPacketTime = now;

    const jitter = this.calculateJitter();
    const packetLoss = this.calculatePacketLoss();

    const metric: NetworkMetrics = {
      rtt,
      jitter,
      packetLoss,
      bandwidth: 0, // Calculate based on data transfer
      timestamp: now
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxSamples) {
      this.metrics.shift();
    }
  }

  private calculateJitter(): number {
    if (this.packetTimes.length < 2) return 0;

    let sum = 0;
    for (let i = 1; i < this.packetTimes.length; i++) {
      sum += Math.abs(this.packetTimes[i] - this.packetTimes[i - 1]);
    }

    return sum / (this.packetTimes.length - 1);
  }

  private calculatePacketLoss(): number {
    if (this.sentPackets === 0) return 0;
    return (this.sentPackets - this.receivedPackets) / this.sentPackets;
  }

  getAverageRTT(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.rtt, 0) / this.metrics.length;
  }

  getAverageJitter(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.jitter, 0) / this.metrics.length;
  }

  getCurrentPacketLoss(): number {
    return this.calculatePacketLoss();
  }

  getMetrics(): NetworkMetrics[] {
    return [...this.metrics];
  }

  reset(): void {
    this.metrics = [];
    this.packetTimes = [];
    this.sentPackets = 0;
    this.receivedPackets = 0;
  }
}
