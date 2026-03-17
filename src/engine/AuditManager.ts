import { database, auth } from '../firebase';
import { ref, push, set } from 'firebase/database';

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
            const user = auth.currentUser;
            if (!user) {
                console.warn('Cannot log audit: user not authenticated');
                return;
            }

            const auditLogsRef = ref(database, 'audit_logs');
            const newLogRef = push(auditLogsRef);
            await set(newLogRef, auditLog);
        } catch (error) {
            console.error("Failed to write audit log:", error);
        }
    }
}

export const auditManager = AuditManager.getInstance();
