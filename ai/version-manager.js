/**
 * @file ai/version-manager.js
 * @description Version control and rollback for AI-generated components
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

class VersionManager {
  constructor() {
    this.versionsDir = '.ai-versions';
    this.maxVersions = 10; // Keep last 10 versions per file
  }

  /**
   * Save a version of a file
   * @param {string} filePath - Path to the file
   * @param {string} content - File content
   * @param {Object} metadata - Version metadata
   */
  async saveVersion(filePath, content, metadata = {}) {
    try {
      const hash = this.generateHash(content);
      const versionPath = this.getVersionPath(filePath, hash);
      
      await fs.mkdir(path.dirname(versionPath), { recursive: true });
      
      const versionData = {
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          hash,
          originalPath: filePath
        }
      };

      await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2));
      
      // Cleanup old versions
      await this.cleanupOldVersions(filePath);
      
      return hash;
    } catch (error) {
      console.error('Failed to save version:', error);
      throw error;
    }
  }

  /**
   * Get all versions of a file
   * @param {string} filePath - Path to the file
   * @returns {Array} List of versions
   */
  async getVersions(filePath) {
    try {
      const versionDir = path.join(this.versionsDir, this.sanitizePath(filePath));
      const files = await fs.readdir(versionDir);
      
      const versions = await Promise.all(
        files.map(async (file) => {
          const content = await fs.readFile(path.join(versionDir, file), 'utf8');
          const data = JSON.parse(content);
          return {
            hash: data.metadata.hash,
            timestamp: data.metadata.timestamp,
            metadata: data.metadata
          };
        })
      );

      return versions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  /**
   * Restore a specific version
   * @param {string} filePath - Path to the file
   * @param {string} hash - Version hash
   * @returns {string} Restored content
   */
  async restoreVersion(filePath, hash) {
    try {
      const versionPath = this.getVersionPath(filePath, hash);
      const content = await fs.readFile(versionPath, 'utf8');
      const data = JSON.parse(content);
      
      // Save current version before restoring
      const currentContent = await fs.readFile(filePath, 'utf8');
      await this.saveVersion(filePath, currentContent, { 
        type: 'pre-restore-backup' 
      });
      
      // Restore the version
      await fs.writeFile(filePath, data.content);
      
      return data.content;
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  }

  /**
   * Generate hash for content
   * @param {string} content - Content to hash
   * @returns {string} Hash
   */
  generateHash(content) {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Get version file path
   * @param {string} filePath - Original file path
   * @param {string} hash - Version hash
   * @returns {string} Version file path
   */
  getVersionPath(filePath, hash) {
    const sanitized = this.sanitizePath(filePath);
    return path.join(this.versionsDir, sanitized, `${hash}.json`);
  }

  /**
   * Sanitize file path for storage
   * @param {string} filePath - File path
   * @returns {string} Sanitized path
   */
  sanitizePath(filePath) {
    return filePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Cleanup old versions
   * @param {string} filePath - File path
   */
  async cleanupOldVersions(filePath) {
    try {
      const versions = await this.getVersions(filePath);
      
      if (versions.length > this.maxVersions) {
        const toDelete = versions.slice(this.maxVersions);
        
        for (const version of toDelete) {
          const versionPath = this.getVersionPath(filePath, version.hash);
          await fs.unlink(versionPath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old versions:', error);
    }
  }
}

export default VersionManager;
