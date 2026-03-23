import express, { Router } from 'express';
import { RAGOrchestrationService } from '../integration/rag-orchestration';
import { LLMFactory } from '../integration/llm-provider';
import { VectorStoreFactory } from '../integration/vector-store';
import { AuthenticatedRequest, RBACMiddleware } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';
import { config } from '../config';

const router: Router = express.Router();

const ragOrchestration = new RAGOrchestrationService(
  LLMFactory.create(config.llm.provider),
  VectorStoreFactory.create(config.vectorStore.provider)
);
const auditService = new AuditService();
const rbac = new RBACMiddleware();

// Execute RAG query
router.post(
  '/query',
  rbac.requirePermission(['execute:rag-queries']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { employeeId, query, contextType, filters } = req.body;

      logger.info('Executing RAG query', {
        employeeId,
        contextType,
      });

      const ragQuery = {
        employeeId: employeeId || req.user!.userId,
        tenantId: req.tenantId!,
        query,
        contextType: contextType || 'general_knowledge',
        filters,
        modelVersion: config.llm.openai?.model,
      };

      const result = await ragOrchestration.executeRAGQuery(ragQuery);

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'EXECUTED_RAG_QUERY',
        resourceType: 'RAGQuery',
        resourceId: ragQuery.employeeId,
        changes: {
          contextType,
          confidenceScore: result.confidenceScore,
        },
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('RAG query execution failed', error as Error);

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'EXECUTED_RAG_QUERY',
        resourceType: 'RAGQuery',
        resourceId: req.body.employeeId || 'unknown',
        status: 'failure',
        errorMessage: (error as Error).message,
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Promotion analysis with RAG
router.post(
  '/promotion-analysis/:employeeId',
  rbac.requirePermission(['execute:rag-queries']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { employeeId } = req.params;
      const { targetRoleLevel } = req.body;

      logger.info('Generating promotion analysis with RAG', {
        employeeId,
        targetRoleLevel,
      });

      const query = `What are the key competencies and requirements for ${targetRoleLevel} role? What development areas are most critical?`;

      const ragQuery = {
        employeeId,
        tenantId: req.tenantId!,
        query,
        contextType: 'promotion_analysis' as const,
        filters: {
          roleLevel: targetRoleLevel,
          documentTypes: ['competency-framework', 'role-guide'] as any,
        },
      };

      const result = await ragOrchestration.executeRAGQuery(ragQuery);

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'EXECUTED_RAG_QUERY',
        resourceType: 'PromotionAnalysis',
        resourceId: employeeId,
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(200).json({
        employeeId,
        targetRoleLevel,
        analysisContext: result,
      });
    } catch (error) {
      logger.error('Promotion analysis failed', error as Error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Incident simulation with RAG
router.post(
  '/incident-simulation/:skillId',
  rbac.requirePermission(['execute:rag-queries']),
  async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { skillId } = req.params;
      const { scenario } = req.body;

      logger.info('Generating incident simulation guidance', {
        skillId,
      });

      const query = `For this incident scenario: ${scenario}. What are the best practices and recommended procedures from our knowledge base?`;

      const ragQuery = {
        employeeId: req.user!.userId,
        tenantId: req.tenantId!,
        query,
        contextType: 'incident_simulation' as const,
        filters: {
          skillIds: [skillId],
          documentTypes: ['procedure', 'best-practice', 'policy'] as any,
        },
      };

      const result = await ragOrchestration.executeRAGQuery(ragQuery);

      await auditService.logAction({
        tenantId: req.tenantId!,
        userId: req.user!.userId,
        action: 'EXECUTED_RAG_QUERY',
        resourceType: 'IncidentSimulation',
        resourceId: skillId,
        status: 'success',
        executionTimeMs: Date.now() - startTime,
        req,
      });

      res.status(200).json({
        skillId,
        scenario,
        guidanceContext: result,
      });
    } catch (error) {
      logger.error('Incident simulation guidance failed', error as Error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
