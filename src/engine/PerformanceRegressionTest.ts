// 42. Performance regression test
export interface PerformanceBenchmark {
  name: string;
  targetFPS: number;
  targetFrameTime: number;
  maxMemoryMB: number;
}

export interface BenchmarkResult {
  name: string;
  avgFPS: number;
  avgFrameTime: number;
  memoryUsed: number;
  passed: boolean;
  timestamp: number;
}

export class PerformanceRegressionTest {
  private benchmarks: PerformanceBenchmark[] = [
    {
      name: 'Empty Scene',
      targetFPS: 60,
      targetFrameTime: 16.6,
      maxMemoryMB: 100
    },
    {
      name: '100 Static Objects',
      targetFPS: 60,
      targetFrameTime: 16.6,
      maxMemoryMB: 200
    },
    {
      name: '50 Dynamic Objects',
      targetFPS: 45,
      targetFrameTime: 22.2,
      maxMemoryMB: 300
    }
  ];

  private results: BenchmarkResult[] = [];

  async runBenchmark(
    name: string,
    testFn: () => Promise<{ fps: number; frameTime: number; memory: number }>
  ): Promise<BenchmarkResult> {
    const benchmark = this.benchmarks.find(b => b.name === name);
    if (!benchmark) {
      throw new Error(`Benchmark "${name}" not found`);
    }

    const metrics = await testFn();

    const result: BenchmarkResult = {
      name,
      avgFPS: metrics.fps,
      avgFrameTime: metrics.frameTime,
      memoryUsed: metrics.memory,
      passed: 
        metrics.fps >= benchmark.targetFPS &&
        metrics.frameTime <= benchmark.targetFrameTime &&
        metrics.memory <= benchmark.maxMemoryMB,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  async runAllBenchmarks(
    testFn: (name: string) => Promise<{ fps: number; frameTime: number; memory: number }>
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const benchmark of this.benchmarks) {
      const result = await this.runBenchmark(benchmark.name, () => testFn(benchmark.name));
      results.push(result);
    }

    return results;
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  compareWithBaseline(baseline: BenchmarkResult[]): { regressions: string[]; improvements: string[] } {
    const regressions: string[] = [];
    const improvements: string[] = [];

    for (const current of this.results) {
      const base = baseline.find(b => b.name === current.name);
      if (!base) continue;

      const fpsDiff = ((current.avgFPS - base.avgFPS) / base.avgFPS) * 100;
      
      if (fpsDiff < -10) {
        regressions.push(`${current.name}: FPS dropped by ${Math.abs(fpsDiff).toFixed(1)}%`);
      } else if (fpsDiff > 10) {
        improvements.push(`${current.name}: FPS improved by ${fpsDiff.toFixed(1)}%`);
      }
    }

    return { regressions, improvements };
  }
}
