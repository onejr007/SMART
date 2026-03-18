// 39. Load testing RTDB
export interface LoadTestConfig {
  concurrentConnections: number;
  operationsPerSecond: number;
  duration: number;
  operationType: 'read' | 'write' | 'mixed';
}

export interface LoadTestResult {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  throughput: number;
}

export class LoadTesting {
  private results: number[] = [];
  private failures = 0;
  private successes = 0;

  async runTest(config: LoadTestConfig, operationFn: () => Promise<void>): Promise<LoadTestResult> {
    const startTime = Date.now();
    const endTime = startTime + config.duration;
    const operationInterval = 1000 / config.operationsPerSecond;

    const promises: Promise<void>[] = [];

    for (let i = 0; i < config.concurrentConnections; i++) {
      promises.push(this.runConnection(operationFn, operationInterval, endTime));
    }

    await Promise.all(promises);

    return this.calculateResults(Date.now() - startTime);
  }

  private async runConnection(
    operationFn: () => Promise<void>,
    interval: number,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime) {
      const opStart = Date.now();
      
      try {
        await operationFn();
        const latency = Date.now() - opStart;
        this.results.push(latency);
        this.successes++;
      } catch (error) {
        this.failures++;
      }

      const elapsed = Date.now() - opStart;
      if (elapsed < interval) {
        await new Promise(resolve => setTimeout(resolve, interval - elapsed));
      }
    }
  }

  private calculateResults(duration: number): LoadTestResult {
    const totalOps = this.successes + this.failures;
    
    return {
      totalOperations: totalOps,
      successfulOperations: this.successes,
      failedOperations: this.failures,
      averageLatency: this.results.reduce((a, b) => a + b, 0) / this.results.length,
      maxLatency: Math.max(...this.results),
      minLatency: Math.min(...this.results),
      throughput: (this.successes / duration) * 1000
    };
  }

  reset(): void {
    this.results = [];
    this.failures = 0;
    this.successes = 0;
  }
}
