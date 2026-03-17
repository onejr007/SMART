import { database } from '../firebase.js';
import { ref, get, set } from 'firebase/database';
import logger from './logger.js';

/**
 * Simple Migration Manager for Firebase
 * @recommendation Database #17 - Database Migration System
 */
class MigrationManager {
    constructor() {
        this.migrationsRef = ref(database, '_migrations');
    }

    /**
     * Run all pending migrations
     * @param {Array} migrations - Array of { version: string, up: Function }
     */
    async runMigrations(migrations) {
        logger.info('Checking for pending database migrations...');
        
        try {
            const snapshot = await get(this.migrationsRef);
            const appliedMigrations = snapshot.exists() ? snapshot.val() : {};

            for (const migration of migrations) {
                if (!appliedMigrations[migration.version]) {
                    logger.info(`Applying migration: ${migration.version}`);
                    try {
                        await migration.up();
                        appliedMigrations[migration.version] = {
                            appliedAt: new Date().toISOString(),
                            success: true
                        };
                        await set(this.migrationsRef, appliedMigrations);
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
