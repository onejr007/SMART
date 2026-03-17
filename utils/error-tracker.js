import logger from './logger.js';
import { randomUUID } from 'node:crypto';

/**
 * Foundation for Error Tracking and Distributed Tracing
 * @recommendation Production #24 - Error Tracking (Sentry)
 * @recommendation Production #20 - Distributed Tracing
 */
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxStoredErrors = 100;
    }

    /**
     * Capture an error with context and trace ID
     * @param {Error} error 
     * @param {object} context 
     * @returns {string} traceId
     */
    captureError(error, context = {}) {
        const traceId = context.traceId || uuid();
        
        const errorData = {
            traceId,
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            context: {
                ...context,
                url: context.req?.originalUrl,
                method: context.req?.method,
                user: context.req?.user?.userId
            }
        };

        // Log the error
        logger.error(`[TraceID: ${traceId}] ${error.message}`, { 
            stack: error.stack,
            context: errorData.context
        });

        // Store for recent errors (limit memory)
        this.errors.unshift(errorData);
        if (this.errors.length > this.maxStoredErrors) {
            this.errors.pop();
        }

        // In a real production app, you would send this to Sentry/DataDog here
        // Sentry.captureException(error, { extra: context });

        return traceId;
    }

    /**
     * Get recent errors for debugging/analytics
     * @returns {Array}
     */
    getRecentErrors() {
        return this.errors;
    }

    /**
     * Clear captured errors
     */
    clear() {
        this.errors = [];
    }
}

const uuid = () => {
    if (typeof randomUUID === 'function') return randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const errorTracker = new ErrorTracker();
