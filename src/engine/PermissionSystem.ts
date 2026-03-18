// 33. Permission model granular per game
export type Permission = 'owner' | 'admin' | 'mod' | 'creator' | 'viewer';

export interface PermissionEntry {
  userId: string;
  permission: Permission;
  grantedAt: number;
  grantedBy: string;
}

export class PermissionSystem {
  private permissions = new Map<string, Map<string, PermissionEntry>>();

  private permissionHierarchy: Record<Permission, number> = {
    owner: 5,
    admin: 4,
    mod: 3,
    creator: 2,
    viewer: 1
  };

  grant(gameId: string, userId: string, permission: Permission, grantedBy: string): void {
    if (!this.permissions.has(gameId)) {
      this.permissions.set(gameId, new Map());
    }

    const entry: PermissionEntry = {
      userId,
      permission,
      grantedAt: Date.now(),
      grantedBy
    };

    this.permissions.get(gameId)!.set(userId, entry);
  }

  revoke(gameId: string, userId: string): void {
    this.permissions.get(gameId)?.delete(userId);
  }

  hasPermission(gameId: string, userId: string, requiredPermission: Permission): boolean {
    const entry = this.permissions.get(gameId)?.get(userId);
    if (!entry) return false;

    return this.permissionHierarchy[entry.permission] >= this.permissionHierarchy[requiredPermission];
  }

  getPermission(gameId: string, userId: string): Permission | null {
    return this.permissions.get(gameId)?.get(userId)?.permission || null;
  }

  listPermissions(gameId: string): PermissionEntry[] {
    return Array.from(this.permissions.get(gameId)?.values() || []);
  }
}
