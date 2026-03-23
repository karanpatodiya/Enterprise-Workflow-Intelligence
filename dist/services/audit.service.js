"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const uuid_1 = require("uuid");
class AuditService {
    async logAction(input) {
        const auditLog = {
            id: (0, uuid_1.v4)(),
            tenantId: input.tenantId,
            userId: input.userId,
            action: input.action,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            changes: input.changes,
            ipAddress: this.extractIP(input.req),
            userAgent: input.req.get('user-agent') || 'Unknown',
            status: input.status,
            errorMessage: input.errorMessage,
            executionTimeMs: input.executionTimeMs,
            createdAt: new Date(),
        };
        try {
            await database_1.db.query(`INSERT INTO audit_logs
         (id, tenant_id, user_id, action, resource_type, resource_id, changes, ip_address, user_agent, status, error_message, execution_time_ms, created_at)
         VALUES (
           $1,
           $2,
           CASE
             WHEN EXISTS (SELECT 1 FROM users WHERE id = $3::uuid) THEN $3::uuid
             ELSE NULL
           END,
           $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
         )`, [
                auditLog.id,
                auditLog.tenantId,
                auditLog.userId,
                auditLog.action,
                auditLog.resourceType,
                auditLog.resourceId,
                auditLog.changes ? JSON.stringify(auditLog.changes) : null,
                auditLog.ipAddress,
                auditLog.userAgent,
                auditLog.status,
                auditLog.errorMessage,
                auditLog.executionTimeMs,
                auditLog.createdAt,
            ]);
            logger_1.logger.auditLog(input.action, input.resourceType, input.changes || {});
        }
        catch (error) {
            logger_1.logger.error('Audit log creation failed', error);
            // Dont re-throw - audit failure shouldn't block the operation
        }
        return auditLog;
    }
    async getAuditHistory(tenantId, resourceId, limit = 100) {
        let query = 'SELECT * FROM audit_logs WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (resourceId) {
            query += ` AND resource_id = $${paramIndex++}`;
            params.push(resourceId);
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);
        const result = await database_1.db.query(query, params);
        return result.rows.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            userId: row.user_id,
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            changes: row.changes ? JSON.parse(row.changes) : undefined,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            status: row.status,
            errorMessage: row.error_message,
            executionTimeMs: row.execution_time_ms,
            createdAt: row.created_at,
        }));
    }
    extractIP(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket.remoteAddress ||
            'Unknown');
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map