import { database } from '../firebase.js';
import { ref, get } from 'firebase/database';
import { BadRequestError } from '../api/errorHandler.js';
import logger from './logger.js';

/**
 * Relational Data Integrity Helper
 * @recommendation Database #18 - Relational Data Integrity
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
            const dbRef = ref(database, `${node}/${id}`);
            const snapshot = await get(dbRef);
            return snapshot.exists();
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
