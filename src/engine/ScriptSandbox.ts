// 32. Scripting UGC dalam sandbox dengan capability-based + time quota
export interface ScriptCapabilities {
  canAccessNetwork: boolean;
  canAccessStorage: boolean;
  canModifyScene: boolean;
  maxExecutionTime: number;
}

export class ScriptSandbox {
  private worker: Worker | null = null;
  private executionStartTime = 0;
  private timeQuota = 100; // ms per frame
  private capabilities: ScriptCapabilities = {
    canAccessNetwork: false,
    canAccessStorage: false,
    canModifyScene: true,
    maxExecutionTime: 1000,
  };

  setCapabilities(capabilities: Partial<ScriptCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }

  async executeScript(code: string, context: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const sandboxedCode = this.wrapInSandbox(code);

      this.worker = new Worker(
        URL.createObjectURL(
          new Blob([sandboxedCode], { type: "application/javascript" }),
        ),
      );

      this.executionStartTime = Date.now();

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        reject(new Error("Script execution timeout"));
      }, this.capabilities.maxExecutionTime);

      this.worker.onmessage = (e) => {
        clearTimeout(timeout);
        this.worker?.terminate();
        resolve(e.data);
      };

      this.worker.onerror = (e) => {
        clearTimeout(timeout);
        this.worker?.terminate();
        reject(e);
      };

      this.worker.postMessage({ context, capabilities: this.capabilities });
    });
  }

  private wrapInSandbox(code: string): string {
    return `
      // Harden environment by freezing prototypes
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
      Object.freeze(String.prototype);
      Object.freeze(Number.prototype);
      Object.freeze(Boolean.prototype);

      // Remove dangerous APIs
      self.importScripts = undefined;
      self.fetch = undefined;
      self.XMLHttpRequest = undefined;
      self.eval = undefined;
      self.Function = undefined;

      const __postMessage = self.postMessage.bind(self);

      self.onmessage = function(e) {
        const { context, capabilities } = e.data;

        // Provide custom console
        const console = {
          log: (...args) => __postMessage({ type: 'log', data: args })
        };

        try {
          // Execute code directly within an IIFE rather than using new Function
          const result = (function(context, console) {
            "use strict";
            ${code}
          })(context, console);

          __postMessage({ type: 'result', data: result });
        } catch (error) {
          __postMessage({ type: 'error', data: error?.message || String(error) });
        }
      };
    `;
  }

  checkTimeQuota(): boolean {
    const elapsed = Date.now() - this.executionStartTime;
    return elapsed < this.timeQuota;
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
