import { errorTracker } from '../utils/error-tracker.js';

/**
 * Base class for all API errors.
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * Global Error Handler Middleware for Express
 */
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Track error with context and traceId
    const traceId = errorTracker.captureError(err, { req });

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            traceId,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: Don't leak stack traces
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                traceId,
                message: err.message
            });
        } else {
            // Programming or other unknown errors: don't leak error details
            res.status(500).json({
                status: 'error',
                traceId,
                message: 'Something went very wrong!'
            });
        }
    }
};
