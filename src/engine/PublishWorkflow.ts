/**
 * PublishWorkflow.ts
 * P1 Persistence #4 - Publish workflow management
 * Draft → Review → Published + rollback untuk kualitas UGC
 */

export type PublishStatus = 'draft' | 'review' | 'published' | 'archived';

export interface PublishVersion {
  versionId: string;
  status: PublishStatus;
  data: any;
  timestamp: number;
  author: string;
  changeLog?: string;
  reviewNotes?: string;
}

export interface PublishConfig {
  requireReview: boolean;
  maxVersionHistory: number;
  autoArchiveOldVersions: boolean;
  enableRollback: boolean;
}

export class PublishWorkflowManager {
  private config: PublishConfig;
  private versions: Map<string, PublishVersion[]> = new Map();
  private currentVersions: Map<string, string> = new Map();
  private stats = {
    totalDrafts: 0,
    totalReviews: 0,
    totalPublished: 0,
    totalRollbacks: 0
  };

  constructor(config: Partial<PublishConfig> = {}) {
    this.config = {
      requireReview: true,
      maxVersionHistory: 10,
      autoArchiveOldVersions: true,
      enableRollback: true,
      ...config
    };
  }

  public createDraft(contentId: string, data: any, author: string): string {
    const version: PublishVersion = {
      versionId: this.generateVersionId(),
      status: 'draft',
      data,
      timestamp: Date.now(),
      author
    };

    this.addVersion(contentId, version);
    this.stats.totalDrafts++;
    
    return version.versionId;
  }

  public submitForReview(contentId: string, versionId: string, changeLog?: string): boolean {
    const version = this.getVersion(contentId, versionId);
    if (!version || version.status !== 'draft') {
      console.error('Cannot submit: version not found or not a draft');
      return false;
    }

    version.status = 'review';
    version.changeLog = changeLog;
    this.stats.totalReviews++;
    
    return true;
  }

  public publish(contentId: string, versionId: string, reviewNotes?: string): boolean {
    const version = this.getVersion(contentId, versionId);
    if (!version) {
      console.error('Cannot publish: version not found');
      return false;
    }

    if (this.config.requireReview && version.status !== 'review') {
      console.error('Cannot publish: version must be reviewed first');
      return false;
    }

    version.status = 'published';
    version.reviewNotes = reviewNotes;
    this.currentVersions.set(contentId, versionId);
    this.stats.totalPublished++;

    if (this.config.autoArchiveOldVersions) {
      this.archiveOldVersions(contentId, versionId);
    }

    return true;
  }

  public rollback(contentId: string, targetVersionId: string): boolean {
    if (!this.config.enableRollback) {
      console.error('Rollback is disabled');
      return false;
    }

    const targetVersion = this.getVersion(contentId, targetVersionId);
    if (!targetVersion || targetVersion.status !== 'published') {
      console.error('Cannot rollback: target version not found or not published');
      return false;
    }

    this.currentVersions.set(contentId, targetVersionId);
    this.stats.totalRollbacks++;
    console.log(`Rolled back ${contentId} to version ${targetVersionId}`);

    return true;
  }

  public getCurrentVersion(contentId: string): PublishVersion | null {
    const versionId = this.currentVersions.get(contentId);
    if (!versionId) return null;
    return this.getVersion(contentId, versionId);
  }

  public getVersionHistory(contentId: string): PublishVersion[] {
    return this.versions.get(contentId) || [];
  }

  private addVersion(contentId: string, version: PublishVersion): void {
    let versions = this.versions.get(contentId);
    if (!versions) {
      versions = [];
      this.versions.set(contentId, versions);
    }

    versions.push(version);

    if (versions.length > this.config.maxVersionHistory) {
      versions.shift();
    }
  }

  private getVersion(contentId: string, versionId: string): PublishVersion | null {
    const versions = this.versions.get(contentId);
    if (!versions) return null;
    return versions.find(v => v.versionId === versionId) || null;
  }

  private archiveOldVersions(contentId: string, currentVersionId: string): void {
    const versions = this.versions.get(contentId);
    if (!versions) return;

    for (const version of versions) {
      if (version.versionId !== currentVersionId && version.status === 'published') {
        version.status = 'archived';
      }
    }
  }

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getStats() {
    return {
      ...this.stats,
      totalContents: this.versions.size,
      averageVersionsPerContent: this.versions.size > 0
        ? Array.from(this.versions.values()).reduce((sum, v) => sum + v.length, 0) / this.versions.size
        : 0
    };
  }

  public dispose(): void {
    this.versions.clear();
    this.currentVersions.clear();
  }
}
