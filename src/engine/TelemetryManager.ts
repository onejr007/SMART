// 12. Telemetry performa ter-sampling
export interface TelemetryData {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  drawCalls: number;
  triangles: number;
  timestamp: number;
}

export class TelemetryManager {
  private samples: TelemetryData[] = [];
  private sampleRate = 0.1; // 10% sampling
  private maxSamples = 1000;
  private endpoint: string | null = null;

  setEndpoint(url: string): void {
    this.endpoint = url;
  }

  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }

  record(data: Omit<TelemetryData, 'timestamp'>): void {
    if (Math.random() > this.sampleRate) return;

    const sample: TelemetryData = {
      ...data,
      timestamp: Date.now()
    };

    this.samples.push(sample);

    if (this.samples.length >= this.maxSamples) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.samples.length === 0 || !this.endpoint) return;

    const payload = {
      samples: this.samples,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      this.samples = [];
    } catch (error) {
      console.error('Telemetry flush failed:', error);
    }
  }

  getStats() {
    if (this.samples.length === 0) return null;

    const fps = this.samples.map(s => s.fps);
    const frameTime = this.samples.map(s => s.frameTime);

    return {
      avgFPS: fps.reduce((a, b) => a + b, 0) / fps.length,
      avgFrameTime: frameTime.reduce((a, b) => a + b, 0) / frameTime.length,
      minFPS: Math.min(...fps),
      maxFPS: Math.max(...fps),
      sampleCount: this.samples.length
    };
  }
}
