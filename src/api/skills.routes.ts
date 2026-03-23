import express, { Router } from 'express';
import { SkillIntelligenceService } from '../services/skill-intelligence.service';
import { AuthenticatedRequest, RBACMiddleware } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { db } from '../config/database';
import { logger } from '../config/logger';

const router: Router = express.Router();

const skillIntelligenceService = new SkillIntelligenceService();
const auditService = new AuditService();
const rbac = new RBACMiddleware();

// Calculate promotion readiness
router.get(
  '/employees/:employeeId/promotion-readiness/:roleLevel',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { employeeId, roleLevel } = req.params;

      logger.info('Analyzing promotion readiness', {
        employeeId,
        roleLevel,
      });

      const analysis = await skillIntelligenceService.analyzePromotionReadiness(
        employeeId,
        req.tenantId!,
        roleLevel as any
      );

      // Save to database
      await db.query(
        `WITH updated AS (
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
         WHERE NOT EXISTS (SELECT 1 FROM updated)`,
        [
          employeeId,
          req.tenantId!,
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
        ]
      );

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'GENERATED_ANALYTICS',
        resourceType: 'PromotionReadiness',
        resourceId: employeeId,
        changes: { readinessScore: analysis.readinessScore },
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(200).json(analysis);
    } catch (error) {
      logger.error('Promotion readiness analysis failed', error as Error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Calculate skill risk
router.get(
  '/employees/:employeeId/skill-risk',
  rbac.requirePermission(['read:analytics']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { employeeId } = req.params;

      logger.info('Calculating skill risk', { employeeId });

      const riskAnalysis = await skillIntelligenceService.calculateSkillRisk(
        employeeId,
        req.tenantId!
      );

      // Save to database
      await db.query(
        `WITH updated AS (
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
         WHERE NOT EXISTS (SELECT 1 FROM updated)`,
        [
          employeeId,
          req.tenantId!,
          riskAnalysis.riskScore,
          riskAnalysis.riskCategory,
          JSON.stringify(riskAnalysis.atRiskSkills),
          riskAnalysis.concentrationRisk,
          riskAnalysis.lastApprovedUpdate,
          riskAnalysis.updateDueDate,
        ]
      );

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'GENERATED_ANALYTICS',
        resourceType: 'SkillRisk',
        resourceId: employeeId,
        changes: { riskScore: riskAnalysis.riskScore },
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(200).json(riskAnalysis);
    } catch (error) {
      logger.error('Skill risk calculation failed', error as Error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get employee skill profile
router.get(
  '/employees/:employeeId/skills',
  rbac.requirePermission(['read:skills']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { employeeId } = req.params;

      const result = await db.query(
        `SELECT es.*, s.name, s.category
         FROM employee_skills es
         JOIN skills s ON es.skill_id = s.id
         WHERE es.employee_id = $1
         ORDER BY es.proficiency_level DESC`,
        [employeeId]
      );

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
    } catch (error) {
      logger.error('Skill profile retrieval failed', error as Error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
