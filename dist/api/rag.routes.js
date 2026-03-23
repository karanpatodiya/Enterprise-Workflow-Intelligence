"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rag_orchestration_1 = require("../integration/rag-orchestration");
const llm_provider_1 = require("../integration/llm-provider");
const vector_store_1 = require("../integration/vector-store");
const auth_middleware_1 = require("../middleware/auth.middleware");
const audit_service_1 = require("../services/audit.service");
const logger_1 = require("../config/logger");
const config_1 = require("../config");
const router = express_1.default.Router();
const ragOrchestration = new rag_orchestration_1.RAGOrchestrationService(llm_provider_1.LLMFactory.create(config_1.config.llm.provider), vector_store_1.VectorStoreFactory.create(config_1.config.vectorStore.provider));
const auditService = new audit_service_1.AuditService();
const rbac = new auth_middleware_1.RBACMiddleware();
// Execute RAG query
router.post('/query', rbac.requirePermission(['execute:rag-queries']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { employeeId, query, contextType, filters } = req.body;
        logger_1.logger.info('Executing RAG query', {
            employeeId,
            contextType,
        });
        const ragQuery = {
            employeeId: employeeId || req.user.userId,
            tenantId: req.tenantId,
            query,
            contextType: contextType || 'general_knowledge',
            filters,
            modelVersion: config_1.config.llm.openai?.model,
        };
        const result = await ragOrchestration.executeRAGQuery(ragQuery);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
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
    }
    catch (error) {
        logger_1.logger.error('RAG query execution failed', error);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'EXECUTED_RAG_QUERY',
            resourceType: 'RAGQuery',
            resourceId: req.body.employeeId || 'unknown',
            status: 'failure',
            errorMessage: error.message,
            executionTimeMs: Date.now() - startTime,
            req,
        });
        res.status(500).json({ error: error.message });
    }
});
// Promotion analysis with RAG
router.post('/promotion-analysis/:employeeId', rbac.requirePermission(['execute:rag-queries']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { employeeId } = req.params;
        const { targetRoleLevel } = req.body;
        logger_1.logger.info('Generating promotion analysis with RAG', {
            employeeId,
            targetRoleLevel,
        });
        const query = `What are the key competencies and requirements for ${targetRoleLevel} role? What development areas are most critical?`;
        const ragQuery = {
            employeeId,
            tenantId: req.tenantId,
            query,
            contextType: 'promotion_analysis',
            filters: {
                roleLevel: targetRoleLevel,
                documentTypes: ['competency-framework', 'role-guide'],
            },
        };
        const result = await ragOrchestration.executeRAGQuery(ragQuery);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
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
    }
    catch (error) {
        logger_1.logger.error('Promotion analysis failed', error);
        res.status(500).json({ error: error.message });
    }
});
// Incident simulation with RAG
router.post('/incident-simulation/:skillId', rbac.requirePermission(['execute:rag-queries']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { skillId } = req.params;
        const { scenario } = req.body;
        logger_1.logger.info('Generating incident simulation guidance', {
            skillId,
        });
        const query = `For this incident scenario: ${scenario}. What are the best practices and recommended procedures from our knowledge base?`;
        const ragQuery = {
            employeeId: req.user.userId,
            tenantId: req.tenantId,
            query,
            contextType: 'incident_simulation',
            filters: {
                skillIds: [skillId],
                documentTypes: ['procedure', 'best-practice', 'policy'],
            },
        };
        const result = await ragOrchestration.executeRAGQuery(ragQuery);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
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
    }
    catch (error) {
        logger_1.logger.error('Incident simulation guidance failed', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=rag.routes.js.map