"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const skill_intelligence_service_1 = require("../services/skill-intelligence.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const audit_service_1 = require("../services/audit.service");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const router = express_1.default.Router();
const skillIntelligenceService = new skill_intelligence_service_1.SkillIntelligenceService();
const auditService = new audit_service_1.AuditService();
const rbac = new auth_middleware_1.RBACMiddleware();
// Calculate promotion readiness
router.get('/employees/:employeeId/promotion-readiness/:roleLevel', rbac.requirePermission(['read:analytics']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { employeeId, roleLevel } = req.params;
        logger_1.logger.info('Analyzing promotion readiness', {
            employeeId,
            roleLevel,
        });
        const analysis = await skillIntelligenceService.analyzePromotionReadiness(employeeId, req.tenantId, roleLevel);
        // Save to database
        await database_1.db.query(`WITH updated AS (
           UPDATE promotion_readiness_analysis
           SET readiness_score = $4,
               readiness_category = $5,
               skill_gaps = $6,
               strengths = $7,
               development_areas = $8,
               timeline_to_readiness = $9,
               risk_factors = $10,
               recommendations = $11,
               analysis_date = $12,
               model_version = $13,
               updated_at = CURRENT_TIMESTAMP
           WHERE employee_id = $1
             AND tenant_id = $2
             AND target_role_level = $3
           RETURNING id
         )
         INSERT INTO promotion_readiness_analysis
         (employee_id, tenant_id, target_role_level, readiness_score, readiness_category, skill_gaps, strengths, development_areas, timeline_to_readiness, risk_factors, recommendations, analysis_date, model_version)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
         WHERE NOT EXISTS (SELECT 1 FROM updated)`, [
            employeeId,
            req.tenantId,
            roleLevel,
            analysis.readinessScore,
            analysis.readinessCategory,
            JSON.stringify(analysis.skillGaps),
            JSON.stringify(analysis.strengths),
            JSON.stringify(analysis.developmentAreas),
            analysis.timelineToReadiness,
            JSON.stringify(analysis.riskFactors),
            JSON.stringify(analysis.recommendations),
            analysis.analysisDate,
            analysis.modelVersion,
        ]);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'GENERATED_ANALYTICS',
            resourceType: 'PromotionReadiness',
            resourceId: employeeId,
            changes: { readinessScore: analysis.readinessScore },
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            req,
        });
        res.status(200).json(analysis);
    }
    catch (error) {
        logger_1.logger.error('Promotion readiness analysis failed', error);
        res.status(500).json({ error: error.message });
    }
});
// Calculate skill risk
router.get('/employees/:employeeId/skill-risk', rbac.requirePermission(['read:analytics']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { employeeId } = req.params;
        logger_1.logger.info('Calculating skill risk', { employeeId });
        const riskAnalysis = await skillIntelligenceService.calculateSkillRisk(employeeId, req.tenantId);
        // Save to database
        await database_1.db.query(`WITH updated AS (
           UPDATE skill_risks
           SET risk_score = $3,
               risk_category = $4,
               at_risk_skills = $5,
               concentration_risk = $6,
               last_approved_update = $7,
               update_due_date = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE employee_id = $1
             AND tenant_id = $2
           RETURNING id
         )
         INSERT INTO skill_risks
         (employee_id, tenant_id, risk_score, risk_category, at_risk_skills, concentration_risk, last_approved_update, update_due_date)
         SELECT $1, $2, $3, $4, $5, $6, $7, $8
         WHERE NOT EXISTS (SELECT 1 FROM updated)`, [
            employeeId,
            req.tenantId,
            riskAnalysis.riskScore,
            riskAnalysis.riskCategory,
            JSON.stringify(riskAnalysis.atRiskSkills),
            riskAnalysis.concentrationRisk,
            riskAnalysis.lastApprovedUpdate,
            riskAnalysis.updateDueDate,
        ]);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'GENERATED_ANALYTICS',
            resourceType: 'SkillRisk',
            resourceId: employeeId,
            changes: { riskScore: riskAnalysis.riskScore },
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            req,
        });
        res.status(200).json(riskAnalysis);
    }
    catch (error) {
        logger_1.logger.error('Skill risk calculation failed', error);
        res.status(500).json({ error: error.message });
    }
});
// Get employee skill profile
router.get('/employees/:employeeId/skills', rbac.requirePermission(['read:skills']), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const result = await database_1.db.query(`SELECT es.*, s.name, s.category
         FROM employee_skills es
         JOIN skills s ON es.skill_id = s.id
         WHERE es.employee_id = $1
         ORDER BY es.proficiency_level DESC`, [employeeId]);
        const skills = result.rows.map((row) => ({
            skillId: row.skill_id,
            skillName: row.name,
            category: row.category,
            proficiencyLevel: row.proficiency_level,
            yearsOfExperience: row.years_of_experience,
            lastAssessmentDate: row.last_assessment_date,
            rawScore: row.raw_score,
            assessmentScores: row.assessment_scores,
        }));
        res.status(200).json(skills);
    }
    catch (error) {
        logger_1.logger.error('Skill profile retrieval failed', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=skills.routes.js.map