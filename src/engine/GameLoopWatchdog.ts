// 14. Watchdog game loop untuk recovery dari hang
export class GameLoopWatchdog {
  private lastHeartbeat = 0;
  private timeout: number;
  private checkInterval: number;
  private intervalId: number | null = null;
  private onHang: (() => void) | null = null;

  constructor(timeout = 5000, checkInterval = 1000) {
    this.timeout = timeout;
    this.checkInterval = checkInterval;
  }

  start(onHang: () => void): void {
    this.onHang = onHang;
    this.lastHeartbeat = Date.now();
    
    this.intervalId = window.setInterval(() => {
      const elapsed = Date.now() - this.lastHeartbeat;
      if (elapsed > this.timeout) {
        console.error('Game loop hang detected!');
        this.onHang?.();
        this.stop();
      }
    }, this.checkInterval);
  }

  heartbeat(): void {
    this.lastHeartbeat = Date.now();
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
