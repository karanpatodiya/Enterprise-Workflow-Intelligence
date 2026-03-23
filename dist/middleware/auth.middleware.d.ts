import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: any;
    tenantId?: string;
}
export declare class TenantMiddleware {
    middleware(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response | void;
}
export declare class RowLevelSecurityMiddleware {
    middleware(): (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
}
export declare class RBACMiddleware {
    requireRole(role: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response | void;
    requirePermission(permissions: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response | void;
}
//# sourceMappingURL=auth.middleware.d.ts.map