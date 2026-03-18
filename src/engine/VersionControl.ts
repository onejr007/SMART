// 47. Version control untuk scene/UGC
export interface Commit {
  id: string;
  parentId: string | null;
  author: string;
  message: string;
  timestamp: number;
  snapshot: any;
  diff?: any;
}

export interface Branch {
  name: string;
  headCommitId: string;
}

export class VersionControl {
  private commits = new Map<string, Commit>();
  private branches = new Map<string, Branch>();
  private currentBranch = 'main';

  init(): void {
    const initialCommit: Commit = {
      id: crypto.randomUUID(),
      parentId: null,
      author: 'system',
      message: 'Initial commit',
      timestamp: Date.now(),
      snapshot: {}
    };

    this.commits.set(initialCommit.id, initialCommit);
    this.branches.set('main', {
      name: 'main',
      headCommitId: initialCommit.id
    });
  }

  commit(author: string, message: string, snapshot: any): string {
    const branch = this.branches.get(this.currentBranch);
    if (!branch) throw new Error('Branch not found');

    const parentCommit = this.commits.get(branch.headCommitId);
    const diff = this.calculateDiff(parentCommit?.snapshot, snapshot);

    const commit: Commit = {
      id: crypto.randomUUID(),
      parentId: branch.headCommitId,
      author,
      message,
      timestamp: Date.now(),
      snapshot,
      diff
    };

    this.commits.set(commit.id, commit);
    branch.headCommitId = commit.id;

    return commit.id;
  }

  checkout(commitId: string): any {
    const commit = this.commits.get(commitId);
    if (!commit) throw new Error('Commit not found');

    return commit.snapshot;
  }

  createBranch(name: string, fromCommitId?: string): void {
    const branch = this.branches.get(this.currentBranch);
    const headCommitId = fromCommitId || branch!.headCommitId;

    this.branches.set(name, {
      name,
      headCommitId
    });
  }

  switchBranch(name: string): void {
    if (!this.branches.has(name)) {
      throw new Error('Branch not found');
    }
    this.currentBranch = name;
  }

  getHistory(limit = 10): Commit[] {
    const branch = this.branches.get(this.currentBranch);
    if (!branch) return [];

    const history: Commit[] = [];
    let currentId: string | null = branch.headCommitId;

    while (currentId && history.length < limit) {
      const commit = this.commits.get(currentId);
      if (!commit) break;

      history.push(commit);
      currentId = commit.parentId;
    }

    return history;
  }

  diff(commitId1: string, commitId2: string): any {
    const commit1 = this.commits.get(commitId1);
    const commit2 = this.commits.get(commitId2);
    
    if (!commit1 || !commit2) return null;
    
    return this.calculateDiff(commit1.snapshot, commit2.snapshot);
  }

  revert(commitId: string): void {
    const commit = this.commits.get(commitId);
    if (!commit) throw new Error('Commit not found');
    
    const branch = this.branches.get(this.currentBranch);
    if (branch) {
      branch.headCommitId = commitId;
    }
  }

  private calculateDiff(oldSnapshot: any, newSnapshot: any): any {
    // Simple diff implementation
    const diff: any = {};

    for (const key in newSnapshot) {
      if (JSON.stringify(oldSnapshot?.[key]) !== JSON.stringify(newSnapshot[key])) {
        diff[key] = newSnapshot[key];
      }
    }

    return diff;
  }

  restore(commitId: string): any {
    return this.checkout(commitId);
  }
}
