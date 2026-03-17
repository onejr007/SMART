import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Data Sanitization Pipeline
 * @recommendation Database #15 - Data Sanitization Pipeline
 */
export const sanitizeData = (data) => {
    if (typeof data === 'string') {
        // Sanitize string from potential XSS or unwanted HTML
        return DOMPurify.sanitize(data, { ALLOWED_TAGS: [] }).trim();
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(data)) {
            // Recursively sanitize objects
            sanitizedObj[key] = sanitizeData(value);
        }
        return sanitizedObj;
    }

    return data;
};

/**
 * Firebase Path & Query Sanitizer
 * @recommendation Security #3 - SQL/NoSQL Injection Protection
 */
export const sanitizePath = (path) => {
    if (typeof path !== 'string') return '';
    
    // Remove any Firebase restricted characters or path traversal attempts
    // Restricted in Firebase keys: . $ # [ ] /
    // We allow / for path structure but sanitize each segment
    return path
        .split('/')
        .map(segment => segment.replace(/[.$#\[\]]/g, ''))
        .filter(segment => segment.length > 0)
        .join('/');
};

/**
 * Validates that a path only contains allowed root segments
 * @param {string} path 
 * @param {string[]} allowedRoots 
 */
export const validateRootPath = (path, allowedRoots) => {
    const sanitized = sanitizePath(path);
    const root = sanitized.split('/')[0];
    return allowedRoots.includes(root);
};

/**
 * Middleware for Express to sanitize request body
 */
export const sanitizationMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeData(req.body);
    }
    next();
};
