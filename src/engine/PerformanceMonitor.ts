export class EnginePerformanceMonitor {
    private metrics: Map<string, { startTime: number; startMemory?: number }>;
    private thresholds: Record<string, number>;
    private static instance: EnginePerformanceMonitor;

    private constructor() {
        this.metrics = new Map();
        this.thresholds = {
            render: 16.67, // 60 FPS = 16.67ms per frame
            physics: 5.0,  // 5ms per physics step
            update: 5.0,   // 5ms per entity update
            total: 20.0    // Total frame budget
        };
    }

    public static getInstance(): EnginePerformanceMonitor {
        if (!EnginePerformanceMonitor.instance) {
            EnginePerformanceMonitor.instance = new EnginePerformanceMonitor();
        }
        return EnginePerformanceMonitor.instance;
    }

    public start(opId: string) {
        this.metrics.set(opId, {
            startTime: performance.now(),
            // startMemory is not as useful in the browser as in Node
        });
    }

    public end(opId: string): number {
        const metric = this.metrics.get(opId);
        if (!metric) return 0;

        const duration = performance.now() - metric.startTime;
        this.metrics.delete(opId);

        const threshold = this.thresholds[opId] || 16.67;
        if (duration > threshold) {
            // Optional: Notify performance event
            // console.warn(`[Performance] ${opId} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
        }

        return duration;
    }

    public getFPS(): number {
        // Basic FPS calculation would be handled in Core.ts
        return 0;
    }
}

export const perfMonitor = EnginePerformanceMonitor.getInstance();
