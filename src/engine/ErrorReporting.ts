// 13. Crash/error reporting terpusat
export interface ErrorReport {
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: number;
  userAgent: string;
  url: string;
}

export class ErrorReporting {
  private endpoint: string | null = null;
  private context: Record<string, any> = {};

  setEndpoint(url: string): void {
    this.endpoint = url;
  }

  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  init(): void {
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason));
    });
  }

  captureError(error: Error, additionalContext?: Record<string, any>): void {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context: { ...this.context, ...additionalContext },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.sendReport(report);
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    if (!this.endpoint) {
      console.error('Error report:', report);
      return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }
}
