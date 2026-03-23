import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: string;
}

// =====================================
// Tenant Middleware
// =====================================
export class TenantMiddleware {
  middleware() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Response | void => {
      const tenantId = req.headers['x-tenant-id'] as string;

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

// =====================================
// Row-Level Security Middleware
// =====================================
export class RowLevelSecurityMiddleware {
  middleware() {
    return (
      _req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): void => {
      // Attach row-level filters here if needed
      return next();
    };
  }
}

// =====================================
// RBAC Middleware
// =====================================
export class RBACMiddleware {
  requireRole(role: string) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Response | void => {
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
        const decoded = jwt.verify(
          token,
          config.auth.jwtSecret
        ) as any;

        req.user = decoded;

        if (!decoded.roles || !decoded.roles.includes(role)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
          });
        }

        return next();
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid or expired token',
        });
      }
    };
  }

  requirePermission(permissions: string[]) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Response | void => {
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
        const decoded = jwt.verify(
          token,
          config.auth.jwtSecret
        ) as any;

        req.user = decoded;

        const userPermissions = decoded.permissions || [];
        const hasPermission = permissions.some((permission) =>
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
          });
        }

        return next();
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid or expired token',
        });
      }
    };
  }
}