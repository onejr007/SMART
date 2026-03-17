import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

/**
 * Secret Management Abstraction Layer
 * @recommendation Security #1 - Environment Secret Management
 */
class SecretManager {
    constructor() {
        this.cache = new Map();
        this.provider = process.env.SECRET_PROVIDER || 'env';
    }

    /**
     * Get a secret by name
     * @param {string} name 
     * @param {string} defaultValue 
     * @returns {string}
     */
    async getSecret(name, defaultValue = null) {
        // Check cache first
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        let value;
        try {
            switch (this.provider) {
                case 'aws':
                    // In a real implementation:
                    // const client = new SecretsManagerClient({ region: "us-east-1" });
                    // const command = new GetSecretValueCommand({ SecretId: name });
                    // const response = await client.send(command);
                    // value = response.SecretString;
                    value = process.env[name]; 
                    break;
                case 'vault':
                    // In a real implementation:
                    // value = await vault.read(`secret/data/${name}`);
                    value = process.env[name];
                    break;
                default:
                    value = process.env[name];
            }
        } catch (error) {
            logger.error(`Failed to fetch secret ${name} from ${this.provider}:`, error);
        }

        const finalValue = value || defaultValue;
        
        if (finalValue) {
            this.cache.set(name, finalValue);
        } else {
            logger.warn(`Secret ${name} not found in ${this.provider}, no default provided.`);
        }

        return finalValue;
    }

    /**
     * Clear the secret cache (e.g. for rotation)
     */
    clearCache() {
        this.cache.clear();
        logger.info('Secret cache cleared');
    }
}

export const secretManager = new SecretManager();
