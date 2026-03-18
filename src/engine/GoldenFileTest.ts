// 44. Golden-file test untuk SceneVersioning
export interface GoldenFile {
  name: string;
  version: string;
  data: any;
  checksum: string;
}

export class GoldenFileTest {
  private goldenFiles = new Map<string, GoldenFile>();

  async saveGolden(name: string, version: string, data: any): Promise<void> {
    const checksum = await this.calculateChecksum(data);
    
    const golden: GoldenFile = {
      name,
      version,
      data: JSON.parse(JSON.stringify(data)),
      checksum
    };

    this.goldenFiles.set(name, golden);
  }

  async compareWithGolden(name: string, currentData: any): Promise<{
    matches: boolean;
    diff?: any;
  }> {
    const golden = this.goldenFiles.get(name);
    if (!golden) {
      throw new Error(`Golden file "${name}" not found`);
    }

    const currentChecksum = await this.calculateChecksum(currentData);
    
    if (currentChecksum === golden.checksum) {
      return { matches: true };
    }

    const diff = this.calculateDiff(golden.data, currentData);
    return { matches: false, diff };
  }

  private async calculateChecksum(data: any): Promise<string> {
    const json = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private calculateDiff(expected: any, actual: any, path = ''): any {
    const diff: any = {};

    if (typeof expected !== typeof actual) {
      return { path, expected, actual };
    }

    if (typeof expected === 'object' && expected !== null) {
      for (const key in expected) {
        const newPath = path ? `${path}.${key}` : key;
        const subDiff = this.calculateDiff(expected[key], actual[key], newPath);
        if (Object.keys(subDiff).length > 0) {
          diff[key] = subDiff;
        }
      }

      for (const key in actual) {
        if (!(key in expected)) {
          diff[key] = { path: path ? `${path}.${key}` : key, added: actual[key] };
        }
      }
    } else if (expected !== actual) {
      return { path, expected, actual };
    }

    return diff;
  }

  listGoldenFiles(): string[] {
    return Array.from(this.goldenFiles.keys());
  }

  getGoldenFile(name: string): GoldenFile | undefined {
    return this.goldenFiles.get(name);
  }
}
