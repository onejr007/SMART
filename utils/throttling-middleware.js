import logger from './logger.js';

/**
 * Middleware to simulate network latency and throttling
 */
export const throttlingMiddleware = (req, res, next) => {
    // Only apply in development or when explicitly requested via header
    const isDev = process.env.NODE_ENV !== 'production';
    const throttleHeader = req.headers['x-simulate-lag'];

    if (isDev && throttleHeader) {
        const lagMs = parseInt(throttleHeader) || 500;
        logger.info(`Simulating ${lagMs}ms network lag for ${req.method} ${req.path}`);
        
        setTimeout(() => {
            next();
        }, lagMs);
    } else {
        next();
    }
};
