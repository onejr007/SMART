/**
 * BootPipeline.ts
 * [P0] Buat "Boot Pipeline" yang deterministik
 * Urutkan init (renderer → scene → physics → content → network) dan fail-fast
 */

export type BootStage = 
  | 'pre-init'
  | 'renderer'
  | 'scene'
  | 'physics'
  | 'content'
  | 'network'
  | 'systems'
  | 'post-init'
  | 'ready';

export interface BootStep {
  stage: BootStage;
  name: string;
  execute: () => Promise<void> | void;
  required: boolean;
  timeout?: number;
}

export class BootPipeline {
  private steps: BootStep[] = [];
  private currentStage: BootStage = 'pre-init';
  private errors: Error[] = [];
  private startTime: number = 0;
  
  public addStep(step: BootStep): void {
    this.steps.push(step);
  }
  
  public async execute(): Promise<boolean> {
    this.startTime = performance.now();
    console.log('🚀 Boot Pipeline starting...');
    
    const stages: BootStage[] = [
      'pre-init',
      'renderer',
      'scene',
      'physics',
      'content',
      'network',
      'systems',
      'post-init',
      'ready'
    ];
    
    for (const stage of stages) {
      this.currentStage = stage;
      const stageSteps = this.steps.filter(s => s.stage === stage);
      
      console.log(`📦 Stage: ${stage} (${stageSteps.length} steps)`);
      
      for (const step of stageSteps) {
        try {
          const stepStart = performance.now();
          
          if (step.timeout) {
            await this.executeWithTimeout(step.execute, step.timeout);
          } else {
            await step.execute();
          }
          
          const stepTime = performance.now() - stepStart;
          console.log(`  ✅ ${step.name} (${stepTime.toFixed(2)}ms)`);
        } catch (error) {
          const err = error as Error;
          console.error(`  ❌ ${step.name} failed:`, err);
          this.errors.push(err);
          
          if (step.required) {
            console.error('🛑 Boot Pipeline failed at required step');
            return false;
          }
        }
      }
    }
    
    const totalTime = performance.now() - this.startTime;
    console.log(`✅ Boot Pipeline completed in ${totalTime.toFixed(2)}ms`);
    
    return this.errors.length === 0;
  }
  
  private executeWithTimeout(fn: () => Promise<void> | void, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step timeout after ${timeout}ms`));
      }, timeout);
      
      Promise.resolve(fn()).then(() => {
        clearTimeout(timer);
        resolve();
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
  
  public getCurrentStage(): BootStage {
    return this.currentStage;
  }
  
  public getErrors(): Error[] {
    return [...this.errors];
  }
  
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
