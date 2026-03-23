import { Request } from 'express';
import { AuditAction, AuditLog } from '../domain';
export interface AuditLogInput {
    tenantId: string;
    userId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    changes?: Record<string, any>;
    status: 'success' | 'failure';
    errorMessage?: string;
    executionTimeMs: number;
    req: Request;
}
export declare class AuditService {
    logAction(input: AuditLogInput): Promise<AuditLog>;
    getAuditHistory(tenantId: string, resourceId?: string, limit?: number): Promise<AuditLog[]>;
    private extractIP;
}
//# sourceMappingURL=audit.service.d.ts.map