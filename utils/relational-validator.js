import { BadRequestError } from '../api/errorHandler.js';
import logger from './logger.js';
import { firebaseGet } from './firebase-rest.js';

/**
 * Relational Data Integrity Helper
 */
export class RelationalValidator {
    /**
     * Memastikan ID referensi ada di node tujuan.
     * @param {string} node - Node Firebase (misal: 'users')
     * @param {string} id - ID yang akan dicek
     */
    static async exists(node, id) {
        if (!id) return false;
        
        try {
            const data = await firebaseGet(`${node}/${id}`);
            return Boolean(data);
        } catch (error) {
            logger.error(`Integrity check failed for ${node}/${id}:`, error);
            return false;
        }
    }

    /**
     * Middleware untuk memvalidasi authorId atau ID referensi lainnya.
     */
    static validateAuthor() {
        return async (req, res, next) => {
            const authorId = req.body.authorId || req.body.userId;
            if (authorId) {
                const isValid = await this.exists('users', authorId);
                if (!isValid) {
                    return next(new BadRequestError(`Relational Integrity Error: User ID ${authorId} does not exist.`));
                }
            }
            next();
        };
    }
}
