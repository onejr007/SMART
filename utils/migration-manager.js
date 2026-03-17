import logger from './logger.js';
import { firebaseGet, firebasePut } from './firebase-rest.js';

/**
 * Simple Migration Manager for Firebase
 */
class MigrationManager {
    constructor() {
        this.migrationsPath = '_migrations';
    }

    /**
     * Run all pending migrations
     * @param {Array} migrations - Array of { version: string, up: Function }
     */
    async runMigrations(migrations) {
        logger.info('Checking for pending database migrations...');
        
        try {
            const appliedMigrations = (await firebaseGet(this.migrationsPath)) || {};

            for (const migration of migrations) {
                if (!appliedMigrations[migration.version]) {
                    logger.info(`Applying migration: ${migration.version}`);
                    try {
                        await migration.up();
                        appliedMigrations[migration.version] = {
                            appliedAt: new Date().toISOString(),
                            success: true
                        };
                        await firebasePut(this.migrationsPath, appliedMigrations);
                        logger.info(`Migration ${migration.version} applied successfully.`);
                    } catch (error) {
                        logger.error(`Migration ${migration.version} failed:`, error);
                        throw error;
                    }
                }
            }
            logger.info('Database migrations check completed.');
        } catch (error) {
            logger.error('Failed to run migrations:', error);
        }
    }
}

export const migrationManager = new MigrationManager();
