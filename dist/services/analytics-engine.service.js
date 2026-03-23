"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsEngineService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const config_1 = require("../config");
class AnalyticsEngineService {
    async generateAnalyticsSnapshot(tenantId) {
        try {
            logger_1.logger.info('Generating analytics snapshot', { tenantId });
            const [teamReadiness, departmentRisks, promotionMetrics] = await Promise.all([
                this.calculateTeamReadinessScores(tenantId),
                this.calculateDepartmentRiskClusters(tenantId),
                this.calculatePromotionPipelineMetrics(tenantId),
            ]);
            // Calculate aggregate scores
            const aggregateReadinessScore = teamReadiness.length > 0
                ? teamReadiness.reduce((sum, t) => sum + t.averageReadinessScore, 0) /
                    teamReadiness.length
                : 0;
            const aggregateRiskLevel = this.categorizeAggregateRisk(departmentRisks);
            const executiveRecommendations = this.generateExecutiveRecommendations(teamReadiness, departmentRisks, promotionMetrics);
            const snapshot = {
                tenantId,
                snapshotDate: new Date(),
                teamReadinessScores: teamReadiness,
                departmentRiskClusters: departmentRisks,
                promotionPipelineMetrics: promotionMetrics,
                aggregateReadinessScore,
                aggregateRiskLevel,
                executiveRecommendations,
            };
            logger_1.logger.info('Analytics snapshot generated', {
                tenantId,
                aggregateReadinessScore,
                aggregateRiskLevel,
            });
            return snapshot;
        }
        catch (error) {
            logger_1.logger.error('Analytics snapshot generation failed', error);
            throw error;
        }
    }
    async calculateTeamReadinessScores(tenantId) {
        const result = await database_1.db.query(`SELECT
        d.id,
        d.name,
        COUNT(DISTINCT e.id) as team_size,
        COUNT(DISTINCT CASE WHEN pra.readiness_category = 'ready' OR pra.readiness_category = 'ready-plus' THEN e.id END) as ready_count,
        COUNT(DISTINCT CASE WHEN pra.readiness_category = 'developing' THEN e.id END) as developing_count,
        COUNT(DISTINCT CASE WHEN pra.readiness_category = 'not-ready' THEN e.id END) as not_ready_count,
        ROUND(AVG(COALESCE(pra.readiness_score, 50))::numeric, 2) as avg_readiness_score
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.tenant_id = $1 AND e.status = 'active'
       LEFT JOIN promotion_readiness_analysis pra ON e.id = pra.employee_id AND pra.target_role_level = e.role_level
       WHERE d.tenant_id = $1
       GROUP BY d.id, d.name
       ORDER BY avg_readiness_score DESC`, [tenantId]);
        return result.rows.map((row) => {
            const readyCount = parseInt(row.ready_count) || 0;
            const teamSize = parseInt(row.team_size) || 1;
            const readinessPercentage = (readyCount / Math.max(teamSize, 1)) * 100;
            return {
                departmentId: row.id,
                departmentName: row.name,
                teamSize: parseInt(row.team_size) || 0,
                averageReadinessScore: parseFloat(row.avg_readiness_score) || 0,
                readyCount,
                developingCount: parseInt(row.developing_count) || 0,
                notReadyCount: parseInt(row.not_ready_count) || 0,
                readinessPercentage: Math.round(readinessPercentage * 100) / 100,
                trend: 'stable',
                calculatedAt: new Date(),
            };
        });
    }
    async calculateDepartmentRiskClusters(tenantId) {
        const result = await database_1.db.query(`SELECT
        d.id,
        d.name,
        COUNT(DISTINCT CASE WHEN sr.risk_category = 'critical' THEN e.id END) as critical_count,
        COUNT(DISTINCT CASE WHEN sr.risk_category = 'high' THEN e.id END) as high_count,
        COUNT(DISTINCT CASE WHEN sr.risk_category = 'medium' THEN e.id END) as medium_count,
        ROUND(AVG(COALESCE(sr.risk_score, 0))::numeric, 2) as avg_risk_score
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.tenant_id = $1 AND e.status = 'active'
       LEFT JOIN skill_risks sr ON e.id = sr.employee_id
       WHERE d.tenant_id = $1
       GROUP BY d.id, d.name
       ORDER BY avg_risk_score DESC`, [tenantId]);
        return result.rows.map((row) => {
            const criticalCount = parseInt(row.critical_count) || 0;
            const highCount = parseInt(row.high_count) || 0;
            return {
                departmentId: row.id,
                departmentName: row.name,
                criticalRiskEmployeeCount: criticalCount,
                highRiskEmployeeCount: highCount,
                mediumRiskEmployeeCount: parseInt(row.medium_count) || 0,
                clusterScore: parseFloat(row.avg_risk_score) || 0,
                topAtriskSkills: [],
                concernFlag: criticalCount > 0 || highCount > 2,
                lastAnalysisDate: new Date(),
            };
        });
    }
    async calculatePromotionPipelineMetrics(tenantId) {
        const result = await database_1.db.query(`SELECT
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN pra.readiness_category = 'ready' OR pra.readiness_category = 'ready-plus' THEN e.id END) as ready_for_promotion,
        COUNT(DISTINCT CASE WHEN pra.readiness_category = 'developing' THEN e.id END) as developing_for_promotion,
        ROUND(AVG(COALESCE(pra.timeline_to_readiness, 0))::numeric, 0) as avg_timeline
       FROM employees e
       LEFT JOIN promotion_readiness_analysis pra ON e.id = pra.employee_id
       WHERE e.tenant_id = $1 AND e.status = 'active'`, [tenantId]);
        const row = result.rows[0] || {};
        const totalEmployees = parseInt(row.total_employees) || 0;
        const readyCount = parseInt(row.ready_for_promotion) || 0;
        return {
            totalEmployees,
            readyForPromotion: readyCount,
            developingForPromotion: parseInt(row.developing_for_promotion) || 0,
            promotionVelocity: await this.calculatePromotionVelocity(tenantId),
            averageTimeToReadiness: parseInt(row.avg_timeline) || 0,
            bottleneckSkills: [],
            forecastedReadyNextQuarter: Math.round(readyCount * 1.15),
            calculatedAt: new Date(),
        };
    }
    async calculatePromotionVelocity(tenantId) {
        const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
        const result = await database_1.db.query(`SELECT COUNT(*) as promotion_count
       FROM employees
       WHERE tenant_id = $1 AND updated_at >= $2 AND status = 'active'`, [tenantId, thirtyDaysAgo]);
        return parseInt(result.rows[0]?.promotion_count) || 0;
    }
    categorizeAggregateRisk(departmentRisks) {
        if (departmentRisks.length === 0)
            return 'low';
        const averageClusterScore = departmentRisks.reduce((sum, d) => sum + d.clusterScore, 0) /
            departmentRisks.length;
        const concernCount = departmentRisks.filter((d) => d.concernFlag).length;
        if (averageClusterScore >= 75 || concernCount > departmentRisks.length * 0.5) {
            return 'critical';
        }
        else if (averageClusterScore >= 55 || concernCount > departmentRisks.length * 0.25) {
            return 'high';
        }
        else if (averageClusterScore >= 35) {
            return 'medium';
        }
        return 'low';
    }
    generateExecutiveRecommendations(teamReadiness, departmentRisks, promotionMetrics) {
        const recommendations = [];
        // Check readiness
        const lowReadinessDepts = teamReadiness.filter((t) => t.averageReadinessScore < 60);
        if (lowReadinessDepts.length > 0) {
            recommendations.push(`${lowReadinessDepts.length} department(s) show below-target readiness scores. Consider targeted development programs.`);
        }
        // Check risks
        const atRiskDepts = departmentRisks.filter((d) => d.concernFlag);
        if (atRiskDepts.length > 0) {
            recommendations.push(`${atRiskDepts.length} department(s) have critical skill risk exposure. Prioritize risk mitigation.`);
        }
        // Check promotion pipeline
        if (promotionMetrics.readyForPromotion < promotionMetrics.totalEmployees * 0.2) {
            recommendations.push('Promotion pipeline below target levels. Increase development investment.');
        }
        // Check velocity
        if (promotionMetrics.promotionVelocity === 0) {
            recommendations.push('No recent promotion velocity detected. Consider succession planning initiatives.');
        }
        if (recommendations.length === 0) {
            recommendations.push('Organization performing well on readiness and risk metrics.');
        }
        return recommendations;
    }
    async cacheAnalyticsSnapshot(snapshot) {
        if (!config_1.config.features.enableAnalyticsCache) {
            return;
        }
        try {
            await database_1.db.query(`INSERT INTO analytics_snapshots (tenant_id, snapshot_date, team_readiness_scores, department_risk_clusters, promotion_pipeline_metrics, aggregate_readiness_score, aggregate_risk_level, executive_recommendations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                snapshot.tenantId,
                snapshot.snapshotDate,
                JSON.stringify(snapshot.teamReadinessScores),
                JSON.stringify(snapshot.departmentRiskClusters),
                JSON.stringify(snapshot.promotionPipelineMetrics),
                snapshot.aggregateReadinessScore,
                snapshot.aggregateRiskLevel,
                snapshot.executiveRecommendations,
            ]);
            logger_1.logger.debug('Analytics snapshot cached', {
                tenantId: snapshot.tenantId,
            });
        }
        catch (error) {
            logger_1.logger.warn('Analytics cache failed', error);
        }
    }
    async getLatestSnapshot(tenantId) {
        if (!config_1.config.features.enableAnalyticsCache) {
            return null;
        }
        try {
            const result = await database_1.db.query(`SELECT * FROM analytics_snapshots WHERE tenant_id = $1 ORDER BY snapshot_date DESC LIMIT 1`, [tenantId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                tenantId: row.tenant_id,
                snapshotDate: row.snapshot_date,
                teamReadinessScores: this.parseJsonField(row.team_readiness_scores, []),
                departmentRiskClusters: this.parseJsonField(row.department_risk_clusters, []),
                promotionPipelineMetrics: this.parseJsonField(row.promotion_pipeline_metrics, {
                    totalEmployees: 0,
                    readyForPromotion: 0,
                    developingForPromotion: 0,
                    promotionVelocity: 0,
                    averageTimeToReadiness: 0,
                    bottleneckSkills: [],
                    forecastedReadyNextQuarter: 0,
                    calculatedAt: new Date(),
                }),
                aggregateReadinessScore: row.aggregate_readiness_score,
                aggregateRiskLevel: row.aggregate_risk_level,
                executiveRecommendations: Array.isArray(row.executive_recommendations)
                    ? row.executive_recommendations
                    : this.parseJsonField(row.executive_recommendations, []),
            };
        }
        catch (error) {
            logger_1.logger.warn('Analytics cache retrieval failed', error);
            return null;
        }
    }
    parseJsonField(value, fallback) {
        if (value === null || value === undefined) {
            return fallback;
        }
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return fallback;
            }
        }
        return value;
    }
}
exports.AnalyticsEngineService = AnalyticsEngineService;
//# sourceMappingURL=analytics-engine.service.js.map