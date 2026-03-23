"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_service_1 = require("../services/ai.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const router = express_1.default.Router();
const rbac = new auth_middleware_1.RBACMiddleware();
// POST /api/reports/generate
// Generates and stores a final intelligence report for an assessment result
router.post('/generate', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    try {
        const { assessmentResultId } = req.body;
        // Load assessment result
        const resultRes = await database_1.db.query('SELECT * FROM assessment_results WHERE id = $1', [assessmentResultId]);
        if (resultRes.rowCount === 0) {
            return res.status(404).json({ error: 'Assessment result not found' });
        }
        const ar = resultRes.rows[0];
        // Load AI detection risk score
        const riskRes = await database_1.db.query(`SELECT COALESCE(ROUND(AVG(ai_probability)), 0) AS risk_score
         FROM ai_detection_logs WHERE assessment_id = $1`, [assessmentResultId]);
        const riskScore = Number(riskRes.rows[0]?.risk_score ?? 0);
        const riskLabel = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';
        // Parse JSONB / arrays
        const skillScores = ar.skill_scores ?? [];
        const strengths = typeof ar.strengths === 'string'
            ? JSON.parse(ar.strengths) : (ar.strengths ?? []);
        const weaknesses = typeof ar.weaknesses === 'string'
            ? JSON.parse(ar.weaknesses) : (ar.weaknesses ?? []);
        const learningPath = typeof ar.learning_recommendations === 'string'
            ? JSON.parse(ar.learning_recommendations) : (ar.learning_recommendations ?? []);
        // Roadmap summary (first 4 module titles)
        const roadmapSummary = Array.isArray(learningPath)
            ? learningPath.slice(0, 4).map((m) => ({
                stage: m.learning_stage || m.stage || 'Learning Stage',
                topic: m.topic || '',
            }))
            : [];
        // Generate markdown report from Gemini
        const reportMarkdown = await ai_service_1.AIService.generateFinalReport({
            profile: ar.user_profile || {},
            scores: Array.isArray(skillScores)
                ? skillScores.reduce((acc, s) => ({ ...acc, [s.subskill]: s.score }), {})
                : skillScores,
            weaknesses,
            roadmap: learningPath,
            aiRiskScore: riskScore,
            aiRiskLabel: riskLabel,
        });
        // Store report
        const insertRes = await database_1.db.query(`INSERT INTO final_reports
           (employee_id, tenant_id, assessment_result_id, profile_snapshot,
            skill_breakdown, strengths, weaknesses, roadmap_summary,
            ai_risk_score, ai_risk_label, report_markdown)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`, [
            req.user?.userId ?? null,
            req.tenantId ?? null,
            assessmentResultId,
            JSON.stringify(ar.user_profile || {}),
            JSON.stringify(skillScores),
            JSON.stringify(strengths),
            JSON.stringify(weaknesses),
            JSON.stringify(roadmapSummary),
            riskScore,
            riskLabel,
            reportMarkdown,
        ]);
        return res.status(201).json({
            id: insertRes.rows[0].id,
            assessmentResultId,
            riskScore,
            riskLabel,
            strengths,
            weaknesses,
            roadmapSummary,
            reportMarkdown,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate final report', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/reports/:reportId
router.get('/:reportId', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const result = await database_1.db.query('SELECT * FROM final_reports WHERE id = $1', [req.params.reportId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=reports.routes.js.map