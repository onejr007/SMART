// 41. Profiling suite
export interface ProfileMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class ProfilingTools {
  private marks = new Map<string, ProfileMark>();
  private measurements: ProfileMark[] = [];

  mark(name: string): void {
    this.marks.set(name, {
      name,
      startTime: performance.now()
    });
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark)?.startTime : performance.now();
    if (!endTime) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = endTime - start.startTime;
    
    this.measurements.push({
      name,
      startTime: start.startTime,
      endTime,
      duration
    });

    return duration;
  }

  getMeasurements(name?: string): ProfileMark[] {
    if (name) {
      return this.measurements.filter(m => m.name === name);
    }
    return [...this.measurements];
  }

  getAverageDuration(name: string): number {
    const measures = this.getMeasurements(name);
    if (measures.length === 0) return 0;

    const sum = measures.reduce((acc, m) => acc + (m.duration || 0), 0);
    return sum / measures.length;
  }

  clear(): void {
    this.marks.clear();
    this.measurements = [];
  }

  exportProfile(): string {
    return JSON.stringify({
      marks: Array.from(this.marks.entries()),
      measurements: this.measurements
    }, null, 2);
  }
}
