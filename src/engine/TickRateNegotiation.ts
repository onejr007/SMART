// 23. Tick-rate negotiation dan bandwidth throttling
export class TickRateNegotiation {
  private currentTickRate = 60;
  private minTickRate = 20;
  private maxTickRate = 120;
  private bandwidthLimit = 1000000; // bytes per second
  private currentBandwidth = 0;

  setTickRate(rate: number): void {
    this.currentTickRate = Math.max(this.minTickRate, Math.min(this.maxTickRate, rate));
  }

  getTickRate(): number {
    return this.currentTickRate;
  }

  setBandwidthLimit(bytesPerSecond: number): void {
    this.bandwidthLimit = bytesPerSecond;
  }

  updateBandwidthUsage(bytes: number): void {
    this.currentBandwidth = bytes;
  }

  shouldThrottle(): boolean {
    return this.currentBandwidth > this.bandwidthLimit;
  }

  adaptTickRate(latency: number, packetLoss: number): void {
    if (latency > 200 || packetLoss > 0.05) {
      this.setTickRate(this.currentTickRate - 10);
    } else if (latency < 50 && packetLoss < 0.01) {
      this.setTickRate(this.currentTickRate + 10);
    }
  }

  getTickInterval(): number {
    return 1000 / this.currentTickRate;
  }
}
