// 3. Pisahkan simulation tick (fixed) dari render tick (variable)
export class SimulationTick {
  private accumulator = 0;
  private readonly fixedDelta: number;
  private readonly maxAccumulator: number;

  constructor(fixedFPS = 60, maxFrameSkip = 5) {
    this.fixedDelta = 1 / fixedFPS;
    this.maxAccumulator = this.fixedDelta * maxFrameSkip;
  }

  update(delta: number, simulationCallback: (dt: number) => void): number {
    this.accumulator += Math.min(delta, this.maxAccumulator);
    
    let steps = 0;
    while (this.accumulator >= this.fixedDelta) {
      simulationCallback(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
      steps++;
    }
    
    return this.accumulator / this.fixedDelta; // Alpha for interpolation
  }

  reset(): void {
    this.accumulator = 0;
  }
}
