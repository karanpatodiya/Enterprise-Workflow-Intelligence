"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_engine_service_1 = require("../services/analytics-engine.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../config/logger");
const audit_service_1 = require("../services/audit.service");
const router = express_1.default.Router();
const analyticsService = new analytics_engine_service_1.AnalyticsEngineService();
const auditService = new audit_service_1.AuditService();
const rbac = new auth_middleware_1.RBACMiddleware();
// Generate analytics snapshot
router.get('/snapshot', rbac.requirePermission(['read:analytics']), async (req, res) => {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Generating analytics snapshot', {
            tenantId: req.tenantId,
        });
        // Check cache first
        const cached = await analyticsService.getLatestSnapshot(req.tenantId);
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
        const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId);
        // Cache the snapshot
        await analyticsService.cacheAnalyticsSnapshot(snapshot);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'GENERATED_ANALYTICS',
            resourceType: 'AnalyticsSnapshot',
            resourceId: req.tenantId,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            req,
        });
        return res.status(200).json({
            ...snapshot,
            fromCache: false,
        });
    }
    catch (error) {
        logger_1.logger.error('Analytics snapshot generation failed', error);
        return res.status(500).json({ error: error.message });
    }
});
// Get team readiness scores
router.get('/team-readiness', rbac.requirePermission(['read:analytics']), async (req, res) => {
    try {
        const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId);
        return res.status(200).json(snapshot.teamReadinessScores);
    }
    catch (error) {
        logger_1.logger.error('Team readiness retrieval failed', error);
        return res.status(500).json({ error: error.message });
    }
});
// Get department risk clusters
router.get('/department-risks', rbac.requirePermission(['read:analytics']), async (req, res) => {
    try {
        const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId);
        return res.status(200).json(snapshot.departmentRiskClusters);
    }
    catch (error) {
        logger_1.logger.error('Department risks retrieval failed', error);
        return res.status(500).json({ error: error.message });
    }
});
// Get promotion pipeline metrics
router.get('/promotion-pipeline', rbac.requirePermission(['read:analytics']), async (req, res) => {
    try {
        const snapshot = await analyticsService.generateAnalyticsSnapshot(req.tenantId);
        return res.status(200).json(snapshot.promotionPipelineMetrics);
    }
    catch (error) {
        logger_1.logger.error('Promotion pipeline retrieval failed', error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map