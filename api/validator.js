import { BadRequestError } from './errorHandler.js';
import { validateComponent, validatePage } from '../schemas/ai-schemas.js';

/**
 * Middleware to validate request body using Ajv schemas
 * @param {string} type - 'component' or 'page'
 */
export const validateRequest = (type) => {
    return (req, res, next) => {
        let result;
        
        if (type === 'component') {
            result = validateComponent(req.body);
        } else if (type === 'page') {
            result = validatePage(req.body);
        } else {
            return next();
        }

        if (!result.valid) {
            const message = `Validation failed: ${result.errors.join(', ')}`;
            return next(new BadRequestError(message));
        }

        next();
    };
};
