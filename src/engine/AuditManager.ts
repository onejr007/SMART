export interface AuditLog {
    timestamp: string;
    action: string;
    userId: string;
    metadata: any;
    status: 'success' | 'failure';
}

class AuditManager {
    private static instance: AuditManager;

    private constructor() {}

    public static getInstance(): AuditManager {
        if (!AuditManager.instance) {
            AuditManager.instance = new AuditManager();
        }
        return AuditManager.instance;
    }

    public async log(action: string, userId: string, metadata: any, status: 'success' | 'failure' = 'success') {
        const auditLog: AuditLog = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            metadata,
            status
        };

        try {
            await fetch('/api/v1/portal/audit', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, metadata, status })
            });
        } catch (error) {
            console.error("Failed to write audit log:", error);
        }
    }
}

export const auditManager = AuditManager.getInstance();
