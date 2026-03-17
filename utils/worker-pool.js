import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';

/**
 * Simple Worker Pool for CPU-intensive tasks
 * @recommendation Optimization #37 - Worker Threads for CPU Tasks
 */
class WorkerPool {
    constructor(workerPath, numThreads = os.cpus().length) {
        this.workerPath = workerPath;
        this.numThreads = numThreads;
        this.workers = [];
        this.freeWorkers = [];
        this.queue = [];

        for (let i = 0; i < numThreads; i++) {
            this.createWorker();
        }
    }

    createWorker() {
        const worker = new Worker(this.workerPath);
        worker.on('message', (result) => {
            const { resolve, task } = worker.currentTask;
            worker.currentTask = null;
            this.freeWorkers.push(worker);
            resolve(result);
            this.next();
        });

        worker.on('error', (err) => {
            if (worker.currentTask) {
                const { reject } = worker.currentTask;
                reject(err);
            }
            this.workers = this.workers.filter(w => w !== worker);
            this.createWorker();
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }

    run(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.next();
        });
    }

    next() {
        if (this.queue.length === 0 || this.freeWorkers.length === 0) return;

        const worker = this.freeWorkers.pop();
        const taskData = this.queue.shift();
        worker.currentTask = taskData;
        worker.postMessage(taskData.task);
    }

    terminate() {
        this.workers.forEach(worker => worker.terminate());
    }
}

export default WorkerPool;
