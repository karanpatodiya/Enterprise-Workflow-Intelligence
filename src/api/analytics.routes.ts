import express, { Router } from 'express';
import { AnalyticsEngineService } from '../services/analytics-engine.service';
import { AuthenticatedRequest, RBACMiddleware } from '../middleware/auth.middleware';
import { logger } from '../config/logger';
import { AuditService } from '../services/audit.service';

const router: Router = express.Router();

const analyticsService = new AnalyticsEngineService();
const auditService = new AuditService();
const rbac = new RBACMiddleware();

// Generate analytics snapshot
router.get(
  '/snapshot',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      logger.info('Generating analytics snapshot', {
        tenantId: req.tenantId,
      });

      // Check cache first
      const cached = await analyticsService.getLatestSnapshot(req.tenantId!);
      if (cached) {
        // If cache is less than 1 hour old, return it
        const cacheAgeMs = Date.now() - cached.snapshotDate.getTime();
        if (cacheAgeMs < 60 * 60 * 1000) {
          return res.status(200).json({
            ...cached,
            fromCache: true,
            cacheAgeSeconds: Math.floor(cacheAgeMs / 1000),
          });
        }
      }

      const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId!);

      // Cache the snapshot
      await analyticsService.cacheAnalyticsSnapshot(snapshot);

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'GENERATED_ANALYTICS',
        resourceType: 'AnalyticsSnapshot',
        resourceId: req.tenantId!,
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      return res.status(200).json({
        ...snapshot,
        fromCache: false,
      });
    } catch (error) {
      logger.error('Analytics snapshot generation failed', error as Error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get team readiness scores
router.get(
  '/team-readiness',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId!);

      return res.status(200).json(snapshot.teamReadinessScores);
    } catch (error) {
      logger.error('Team readiness retrieval failed', error as Error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get department risk clusters
router.get(
  '/department-risks',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId!);

      return res.status(200).json(snapshot.departmentRiskClusters);
    } catch (error) {
      logger.error('Department risks retrieval failed', error as Error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get promotion pipeline metrics
router.get(
  '/promotion-pipeline',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId!);

      return res.status(200).json(snapshot.promotionPipelineMetrics);
    } catch (error) {
      logger.error('Promotion pipeline retrieval failed', error as Error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
