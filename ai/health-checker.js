/**
 * @file ai/health-checker.js
 * @description System health monitoring dan diagnostics
 */

import fs from 'fs/promises';
import path from 'path';

class HealthChecker {
  constructor() {
    this.checks = [];
  }

  async checkFileSystem() {
    try {
      const requiredDirs = ['src/components', 'src/pages', 'public', 'ai', 'api'];
      const results = [];

      for (const dir of requiredDirs) {
        try {
          await fs.access(dir);
          results.push({ path: dir, status: 'ok' });
        } catch {
          results.push({ path: dir, status: 'missing' });
        }
      }

      return {
        healthy: results.every(r => r.status === 'ok'),
        details: results
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkContextFile() {
    try {
      const contextPath = path.join(process.cwd(), 'ai', 'context.json');
      await fs.access(contextPath);
      const content = await fs.readFile(contextPath, 'utf8');
      JSON.parse(content); // Validate JSON
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: 'Context file invalid or missing' };
    }
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    return {
      healthy: heapUsagePercent < 90,
      heapUsed: `${heapUsedMB.toFixed(2)} MB`,
      heapTotal: `${heapTotalMB.toFixed(2)} MB`,
      usage: `${heapUsagePercent.toFixed(2)}%`,
      warning: heapUsagePercent > 80 ? 'High memory usage' : null
    };
  }

  async runAllChecks() {
    const results = {
      timestamp: Date.now(),
      overall: 'healthy',
      checks: {}
    };

    results.checks.filesystem = await this.checkFileSystem();
    results.checks.context = await this.checkContextFile();
    results.checks.memory = this.checkMemory();

    // Determine overall health
    const allHealthy = Object.values(results.checks).every(
      check => check.healthy !== false
    );

    results.overall = allHealthy ? 'healthy' : 'degraded';

    return results;
  }
}

export default HealthChecker;
