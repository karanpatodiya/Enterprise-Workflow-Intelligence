import express, { Router } from 'express';
import { LearningPathService } from '../services/learning-path.service';
import { RAGOrchestrationService } from '../integration/rag-orchestration';
import { LLMFactory } from '../integration/llm-provider';
import { VectorStoreFactory } from '../integration/vector-store';
import { AuthenticatedRequest, RBACMiddleware } from '../middleware/auth.middleware';
import { config } from '../config';
import { db } from '../config/database';

const router: Router = express.Router();

const ragService = new RAGOrchestrationService(
  LLMFactory.create(config.llm.provider),
  VectorStoreFactory.create(config.vectorStore.provider)
);
const learningService = new LearningPathService(
  ragService,
  LLMFactory.create(config.llm.provider)
);
const rbac = new RBACMiddleware();

// Generate a new learning path
router.post(
  '/generate',
  rbac.requirePermission(['execute:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { currentRole, yearsOfExperience, knownSkills, weaknesses, categoryId } = req.body;
      const result = await learningService.generateLearningPath({
        employeeId: req.user!.userId,
        tenantId: req.tenantId!,
        currentRole,
        yearsOfExperience: yearsOfExperience || 3,
        knownSkills: knownSkills || [],
        strengths: req.body.strengths || [],
        weaknesses: weaknesses || [],
        categoryId,
        userProfile: req.body.userProfile || {},
        skillScores: req.body.skillScores || {},
        sourceAssessmentResultId: req.body.assessmentResultId || undefined,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Generate a learning path directly from an assessment result ID
// This lets the frontend trigger path generation with a single call after MCQ submit
router.post(
  '/generate-from-result/:resultId',
  rbac.requirePermission(['execute:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { resultId } = req.params;

      // Load the assessment result
      const resultRes = await db.query(
        `SELECT * FROM assessment_results WHERE id = $1 AND employee_id = $2`,
        [resultId, req.user!.userId]
      );

      if (resultRes.rowCount === 0) {
        return res.status(404).json({ error: 'Assessment result not found' });
      }

      const assessment = resultRes.rows[0];

      const strengths: string[] = typeof assessment.strengths === 'string'
        ? JSON.parse(assessment.strengths)
        : (assessment.strengths || []);

      const weaknesses: string[] = typeof assessment.weaknesses === 'string'
        ? JSON.parse(assessment.weaknesses)
        : (assessment.weaknesses || []);

      const result = await learningService.generateLearningPath({
        employeeId: req.user!.userId,
        tenantId: req.tenantId!,
        currentRole: assessment.role_name || 'Professional',
        yearsOfExperience: 3,
        knownSkills: strengths,
        strengths,
        weaknesses: weaknesses.length > 0 ? weaknesses : ['general mastery'],
        categoryId: assessment.category,
        userProfile: assessment.user_profile || {},
        skillScores: Array.isArray(assessment.skill_scores)
          ? assessment.skill_scores.reduce((acc: Record<string, number>, entry: any) => {
              if (entry?.subskill && typeof entry?.score === 'number') {
                acc[entry.subskill] = entry.score;
              }
              return acc;
            }, {})
          : {},
        sourceAssessmentResultId: resultId,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get the current active learning path
router.get(
  '/current',
  rbac.requirePermission(['read:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const path = await learningService.getActiveLearningPath(req.user!.userId, req.tenantId!);
      if (!path) {
        return res.status(404).json({ message: 'No active learning path found' });
      }
      res.status(200).json(path);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Abandon current active path
router.post(
  '/abandon',
  rbac.requirePermission(['read:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      await db.query(
        `UPDATE learning_paths SET status = 'abandoned' WHERE employee_id = $1 AND tenant_id = $2 AND status = 'in_progress'`,
        [req.user!.userId, req.tenantId!]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Get certificate data for a completed path
router.get(
  '/certificate/:pathId',
  rbac.requirePermission(['read:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { pathId } = req.params;

      const pathRes = await db.query(
        `SELECT lp.*, 
          ar.role_name, ar.skill_level, ar.score, ar.total_questions, ar.strengths, ar.weaknesses
         FROM learning_paths lp
         LEFT JOIN assessment_results ar ON ar.employee_id = lp.employee_id AND ar.role_name = lp.target_role
         WHERE lp.id = $1 AND lp.employee_id = $2
         ORDER BY ar.created_at DESC
         LIMIT 1`,
        [pathId, req.user!.userId]
      );

      if (pathRes.rowCount === 0) {
        return res.status(404).json({ error: 'Learning path not found' });
      }

      const row = pathRes.rows[0];
      res.json({
        pathId: row.id,
        targetRole: row.target_role,
        roleName: row.role_name || row.target_role,
        skillLevel: row.skill_level || 'Advanced',
        score: row.score,
        totalQuestions: row.total_questions,
        completedAt: new Date().toISOString(),
        strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : (row.strengths || []),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Submit an answer to a scenario exercise
router.post(
  '/scenarios/:exerciseId/submit',
  rbac.requirePermission(['execute:assessments']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { exerciseId } = req.params;
      const { answer } = req.body;
      if (!answer || typeof answer !== 'string' || !answer.trim()) {
        return res.status(400).json({ error: 'Answer is required' });
      }

      const grading = await learningService.submitScenarioAnswer(exerciseId, answer);
      res.status(200).json(grading);
    } catch (error) {
      const message = (error as Error).message || 'Failed to submit scenario answer';
      if (message.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: message });
      }
      res.status(500).json({ error: message });
    }
  }
);

export default router;
