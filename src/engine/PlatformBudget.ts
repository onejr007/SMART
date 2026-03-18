// 2. Target performa dan budget memori per platform
export interface PlatformBudget {
  targetFPS: number;
  maxMemoryMB: number;
  maxDrawCalls: number;
  maxTriangles: number;
  maxTextureSizeMB: number;
}

export const PLATFORM_BUDGETS: Record<string, PlatformBudget> = {
  desktop: {
    targetFPS: 60,
    maxMemoryMB: 2048,
    maxDrawCalls: 2000,
    maxTriangles: 2000000,
    maxTextureSizeMB: 512
  },
  mobile: {
    targetFPS: 30,
    maxMemoryMB: 512,
    maxDrawCalls: 500,
    maxTriangles: 500000,
    maxTextureSizeMB: 128
  },
  tablet: {
    targetFPS: 45,
    maxMemoryMB: 1024,
    maxDrawCalls: 1000,
    maxTriangles: 1000000,
    maxTextureSizeMB: 256
  }
};

export class PlatformDetector {
  static detect(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  static getBudget(): PlatformBudget {
    return PLATFORM_BUDGETS[this.detect()];
  }
}
