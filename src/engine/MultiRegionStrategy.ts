// 38. Strategi multi-region untuk latency dan CDN
export interface Region {
  id: string;
  name: string;
  endpoint: string;
  cdnEndpoint: string;
  latency: number;
}

export class MultiRegionStrategy {
  private regions: Region[] = [];
  private selectedRegion: Region | null = null;

  addRegion(region: Region): void {
    this.regions.push(region);
  }

  async measureLatency(region: Region): Promise<number> {
    const start = Date.now();
    
    try {
      await fetch(region.endpoint, { method: 'HEAD' });
      return Date.now() - start;
    } catch (error) {
      return Infinity;
    }
  }

  async selectBestRegion(): Promise<Region | null> {
    if (this.regions.length === 0) return null;

    const latencies = await Promise.all(
      this.regions.map(async (region) => ({
        region,
        latency: await this.measureLatency(region)
      }))
    );

    latencies.sort((a, b) => a.latency - b.latency);
    
    const best = latencies[0];
    best.region.latency = best.latency;
    this.selectedRegion = best.region;

    return this.selectedRegion;
  }

  getSelectedRegion(): Region | null {
    return this.selectedRegion;
  }

  getCDNUrl(assetPath: string): string {
    if (!this.selectedRegion) {
      throw new Error('No region selected');
    }

    return `${this.selectedRegion.cdnEndpoint}/${assetPath}`;
  }

  getRegions(): Region[] {
    return [...this.regions];
  }
}
