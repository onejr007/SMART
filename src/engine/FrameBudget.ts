/**
 * FrameBudget.ts
 * Frame Budget System (#6)
 * Dynamic task scheduling berdasarkan frame budget (16.67ms untuk 60fps)
 * Priority queue untuk rendering, physics, dan AI tasks
 */

export enum TaskPriority {
  CRITICAL = 0,  // Must run every frame (input, camera)
  HIGH = 1,      // Important (physics, player)
  NORMAL = 2,    // Standard (AI, animations)
  LOW = 3        // Can skip (particles, effects)
}

export interface FrameTask {
  id: string;
  priority: TaskPriority;
  execute: (delta: number) => void;
  estimatedTime: number; // in ms
  lastRun: number;
  minInterval?: number; // minimum ms between runs
}

export class FrameBudgetSystem {
  private tasks: Map<string, FrameTask> = new Map();
  private targetFrameTime: number = 16.67; // 60 FPS
  private currentFrameTime: number = 0;
  private frameStartTime: number = 0;
  private skippedTasks: Map<string, number> = new Map();
  private performanceMode: 'quality' | 'balanced' | 'performance' = 'balanced';

  constructor(targetFPS: number = 60) {
    this.setTargetFPS(targetFPS);
  }

  public setTargetFPS(fps: number): void {
    this.targetFrameTime = 1000 / fps;
  }

  public setPerformanceMode(mode: 'quality' | 'balanced' | 'performance'): void {
    this.performanceMode = mode;
    
    // Adjust budget based on mode
    switch (mode) {
      case 'quality':
        this.targetFrameTime = 1000 / 60; // 60 FPS
        break;
      case 'balanced':
        this.targetFrameTime = 1000 / 45; // 45 FPS
        break;
      case 'performance':
        this.targetFrameTime = 1000 / 30; // 30 FPS
        break;
    }
  }

  public registerTask(task: FrameTask): void {
    this.tasks.set(task.id, task);
  }

  public unregisterTask(id: string): void {
    this.tasks.delete(id);
    this.skippedTasks.delete(id);
  }

  public update(delta: number): void {
    this.frameStartTime = performance.now();
    this.currentFrameTime = 0;

    // Sort tasks by priority
    const sortedTasks = Array.from(this.tasks.values()).sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Secondary sort by time since last run
      return a.lastRun - b.lastRun;
    });

    const now = performance.now();
    const budgetRemaining = () => this.targetFrameTime - (performance.now() - this.frameStartTime);

    for (const task of sortedTasks) {
      // Check if task should run based on interval
      if (task.minInterval && (now - task.lastRun) < task.minInterval) {
        continue;
      }

      // Check if we have budget for this task
      const budget = budgetRemaining();
      
      if (task.priority === TaskPriority.CRITICAL) {
        // Always run critical tasks
        this.executeTask(task, delta);
      } else if (budget > task.estimatedTime) {
        // Run if we have budget
        this.executeTask(task, delta);
      } else {
        // Skip task, track for next frame
        const skipped = this.skippedTasks.get(task.id) || 0;
        this.skippedTasks.set(task.id, skipped + 1);
        
        // Force run if skipped too many times
        if (skipped > 5 && task.priority <= TaskPriority.HIGH) {
          this.executeTask(task, delta);
          this.skippedTasks.set(task.id, 0);
        }
      }
    }

    this.currentFrameTime = performance.now() - this.frameStartTime;
  }

  private executeTask(task: FrameTask, delta: number): void {
    const startTime = performance.now();
    
    try {
      task.execute(delta);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
    
    const executionTime = performance.now() - startTime;
    
    // Update estimated time with exponential moving average
    task.estimatedTime = task.estimatedTime * 0.8 + executionTime * 0.2;
    task.lastRun = performance.now();
    
    this.skippedTasks.set(task.id, 0);
  }

  public getStats() {
    return {
      targetFrameTime: this.targetFrameTime,
      currentFrameTime: this.currentFrameTime,
      budgetUsed: (this.currentFrameTime / this.targetFrameTime) * 100,
      tasksRegistered: this.tasks.size,
      performanceMode: this.performanceMode,
      skippedTasks: Array.from(this.skippedTasks.entries())
        .filter(([_, count]) => count > 0)
        .map(([id, count]) => ({ id, count }))
    };
  }

  public dispose(): void {
    this.tasks.clear();
    this.skippedTasks.clear();
  }
}
