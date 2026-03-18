export enum JobPriority {
    LOW,
    NORMAL,
    HIGH
}

export interface Job<T = any> {
    id: string;
    type: string;
    data: any;
    priority: JobPriority;
    resolve: (result: T) => void;
    reject: (error: Error) => void;
    cancel?: () => void;
}

export class JobSystem {
    private workers: Worker[] = [];
    private jobQueue: Job[] = [];
    private activeJobs = new Map<string, Job>();
    private workerScriptURL: string;
    private idleWorkers: Worker[] = [];
    private workerToJobId = new Map<Worker, string>();

    constructor(workerScriptURL: string, poolSize = navigator.hardwareConcurrency || 4) {
        this.workerScriptURL = workerScriptURL;
        this.initWorkerPool(poolSize);
    }

    private initWorkerPool(size: number): void {
        for (let i = 0; i < size; i++) {
            const worker = new Worker(this.workerScriptURL);
            worker.onmessage = (e) => this.handleWorkerMessage(e);
            worker.onerror = (e) => this.handleWorkerError(e);
            this.workers.push(worker);
            this.idleWorkers.push(worker);
        }
    }

    async execute<T = any>(type: string, data: any, priority = JobPriority.NORMAL): Promise<T> {
        return new Promise((resolve, reject) => {
            const job: Job<T> = {
                id: crypto.randomUUID(),
                type,
                data,
                priority,
                resolve,
                reject,
                cancel: () => {
                    this.jobQueue = this.jobQueue.filter(j => j.id !== job.id);
                    reject(new Error('Job cancelled'));
                }
            };

            this.jobQueue.push(job);
            this.jobQueue.sort((a, b) => b.priority - a.priority);
            this.processQueue();
        });
    }

    private processQueue(): void {
        while (this.idleWorkers.length > 0 && this.jobQueue.length > 0) {
            const worker = this.idleWorkers.shift()!;
            const job = this.jobQueue.shift()!;
            this.activeJobs.set(job.id, job);
            this.workerToJobId.set(worker, job.id);
            worker.postMessage({ id: job.id, type: job.type, data: job.data });
        }
    }

    private handleWorkerMessage(e: MessageEvent): void {
        const { id, result, error } = e.data;
        const job = this.activeJobs.get(id);
        
        if (job) {
            if (error) {
                job.reject(new Error(error));
            } else {
                job.resolve(result);
            }
            this.activeJobs.delete(id);
            const worker = this.workers.find((w) => this.workerToJobId.get(w) === id) || null;
            if (worker) {
                this.workerToJobId.delete(worker);
                this.idleWorkers.push(worker);
            }
            this.processQueue();
        }
    }

    private handleWorkerError(e: ErrorEvent): void {
        console.error('Worker error:', e);
        const worker = e.target as Worker | null;
        if (!worker) return;
        const jobId = this.workerToJobId.get(worker);
        if (!jobId) return;
        const job = this.activeJobs.get(jobId);
        if (job) {
            job.reject(new Error(e.message));
            this.activeJobs.delete(jobId);
        }
        this.workerToJobId.delete(worker);
        this.idleWorkers.push(worker);
        this.processQueue();
    }

    dispose(): void {
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.idleWorkers = [];
        this.jobQueue = [];
        this.activeJobs.clear();
        this.workerToJobId.clear();
    }
}
