"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACMiddleware = exports.RowLevelSecurityMiddleware = exports.TenantMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
// =====================================
// Tenant Middleware
// =====================================
class TenantMiddleware {
    middleware() {
        return (req, res, next) => {
            const tenantId = req.headers['x-tenant-id'];
            if (!tenantId) {
                return res.status(400).json({
                    error: 'Tenant ID is required',
                });
            }
            req.tenantId = tenantId;
            return next();
        };
    }
}
exports.TenantMiddleware = TenantMiddleware;
// =====================================
// Row-Level Security Middleware
// =====================================
class RowLevelSecurityMiddleware {
    middleware() {
        return (_req, _res, next) => {
            // Attach row-level filters here if needed
            return next();
        };
    }
}
exports.RowLevelSecurityMiddleware = RowLevelSecurityMiddleware;
// =====================================
// RBAC Middleware
// =====================================
class RBACMiddleware {
    requireRole(role) {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    error: 'Authorization header missing',
                });
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    error: 'Token missing',
                });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.auth.jwtSecret);
                req.user = decoded;
                if (!decoded.roles || !decoded.roles.includes(role)) {
                    return res.status(403).json({
                        error: 'Insufficient permissions',
                    });
                }
                return next();
            }
            catch (error) {
                return res.status(401).json({
                    error: 'Invalid or expired token',
                });
            }
        };
    }
    requirePermission(permissions) {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    error: 'Authorization header missing',
                });
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    error: 'Token missing',
                });
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.auth.jwtSecret);
                req.user = decoded;
                const userPermissions = decoded.permissions || [];
                const hasPermission = permissions.some((permission) => userPermissions.includes(permission));
                if (!hasPermission) {
                    return res.status(403).json({
                        error: 'Insufficient permissions',
                    });
                }
                return next();
            }
            catch (error) {
                return res.status(401).json({
                    error: 'Invalid or expired token',
                });
            }
        };
    }
}
exports.RBACMiddleware = RBACMiddleware;
//# sourceMappingURL=auth.middleware.js.map