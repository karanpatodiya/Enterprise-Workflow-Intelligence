"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assessment_engine_service_1 = require("../services/assessment-engine.service");
const ai_service_1 = require("../services/ai.service");
const assessment_result_repository_1 = require("../repositories/assessment-result.repository");
const employee_repository_1 = require("../repositories/employee.repository");
const auth_middleware_1 = require("../middleware/auth.middleware");
const uuid_1 = require("uuid");
const audit_service_1 = require("../services/audit.service");
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
const router = express_1.default.Router();
const assessmentResultRepo = new assessment_result_repository_1.AssessmentResultRepository();
const employeeRepo = new employee_repository_1.EmployeeRepository();
const assessmentEngine = new assessment_engine_service_1.AssessmentEngineService(assessmentResultRepo, employeeRepo);
const auditService = new audit_service_1.AuditService();
const rbac = new auth_middleware_1.RBACMiddleware();
// --- ENHANCED MULTI-TYPE ASSESSMENT ENDPOINTS ---
router.get('/categories', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const result = await database_1.db.query('SELECT slug as id, name, description, role_type FROM platform_categories ORDER BY name ASC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/categories/:slug/roles', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { slug } = req.params;
        const catRes = await database_1.db.query('SELECT id FROM platform_categories WHERE slug = $1', [slug]);
        if (catRes.rowCount === 0)
            return res.status(404).json({ error: 'Category not found' });
        const rolesRes = await database_1.db.query('SELECT id, slug, name, level, description FROM platform_roles WHERE category_id = $1 ORDER BY level ASC', [catRes.rows[0].id]);
        res.json(rolesRes.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/analyze-profile', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const profile = req.body;
        const analysis = await ai_service_1.AIService.analyzeSkills(profile);
        res.json({
            skills: analysis.skills_to_assess || [],
            difficulty: analysis.difficulty,
            summary: analysis.summary,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/adaptive-generate', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { categoryId, roleId, experienceLevel, categoryName: fallbackCatName, roleName: fallbackRoleName, skillsToAssess } = req.body;
        let catName = fallbackCatName || 'Domain';
        let rName = fallbackRoleName || 'Role';
        let expectedSkills = skillsToAssess || ['Advanced System Architecture', 'Enterprise Patterns', 'Scalability'];
        let roleNature = 'technical';
        if (categoryId !== 'mastery-challenge') {
            const catRes = await database_1.db.query('SELECT name, role_type FROM platform_categories WHERE slug = $1', [categoryId]);
            const roleRes = await database_1.db.query('SELECT name FROM platform_roles WHERE id = $1', [roleId]);
            if (catRes.rowCount === 0 || roleRes.rowCount === 0) {
                return res.status(404).json({ error: 'Category or Role not found' });
            }
            catName = catRes.rows[0].name;
            rName = roleRes.rows[0].name;
            roleNature = catRes.rows[0].role_type || assessmentEngine.determineRoleNature(catName);
            if (!skillsToAssess) {
                const skillsRes = await database_1.db.query('SELECT skill_name FROM platform_role_skills WHERE role_id = $1', [roleId]);
                expectedSkills = skillsRes.rows.map(r => r.skill_name);
            }
            // Generate questions dynamically using Gemini
            const questions = await assessmentEngine.generateAdaptiveAssessment(catName, rName, expectedSkills, experienceLevel || 'Intermediate', 10, roleNature);
            const persistedQuestions = [];
            for (const q of questions) {
                const insertResult = await database_1.db.query(`INSERT INTO generated_questions (role_name, experience_level, skills_assessed, question_text, question_type, skill_tag, options, correct_answer, answer_guidance)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`, [
                    rName,
                    experienceLevel,
                    JSON.stringify(expectedSkills),
                    q.question_text,
                    q.question_type,
                    q.subskill,
                    q.options ? JSON.stringify(q.options) : null,
                    q.correct_answer,
                    q.answer_guidance,
                ]);
                persistedQuestions.push({
                    ...q,
                    id: insertResult.rows[0].id,
                });
            }
            return res.json(persistedQuestions);
        }
        else {
            // Mastery Challenge
            const masterySkill = expectedSkills[0] || 'Modern Architecture';
            const challenge = await ai_service_1.AIService.generateMasteryChallenge(masterySkill);
            return res.json([{
                    id: (0, uuid_1.v4)(),
                    question_type: 'Scenario',
                    subskill: masterySkill,
                    question_text: challenge,
                    difficulty: 'advanced',
                    answer_guidance: 'Demonstrate deep expertise and strategic thinking.'
                }]);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/submit-mcq', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    try {
        const { categoryId, roleId, experienceLevel, evaluatedQuestions, categoryName: fallbackCatName, roleName: fallbackRoleName } = req.body;
        let catName = fallbackCatName || 'Mastery Category';
        let rName = fallbackRoleName || 'Mastery Role';
        let finalRoleId = roleId;
        if (categoryId !== 'mastery-challenge') {
            const catRes = await database_1.db.query('SELECT name FROM platform_categories WHERE slug = $1', [categoryId]);
            const roleRes = await database_1.db.query('SELECT name FROM platform_roles WHERE id = $1', [roleId]);
            if (catRes.rowCount === 0 || roleRes.rowCount === 0) {
                return res.status(404).json({ error: 'Category or Role not found' });
            }
            catName = catRes.rows[0].name;
            rName = roleRes.rows[0].name;
        }
        else {
            const fallbackRole = await database_1.db.query('SELECT id FROM platform_roles LIMIT 1');
            finalRoleId = fallbackRole.rowCount > 0 ? fallbackRole.rows[0].id : null;
        }
        // Evaluate all questions
        let score = 0;
        const total_questions = evaluatedQuestions.length || 0;
        const weaknesses = [];
        const strengths = [];
        const subskillStats = {};
        const answerRows = [];
        for (const q of evaluatedQuestions) {
            if (!subskillStats[q.subskill]) {
                subskillStats[q.subskill] = { total: 0, correct: 0, totalScore: 0 };
            }
            subskillStats[q.subskill].total++;
            const questionType = q.question_type || 'MCQ';
            if (questionType === 'MCQ') {
                // Auto-grade MCQ
                const isCorrect = Boolean(q.isCorrect);
                if (isCorrect) {
                    score++;
                    subskillStats[q.subskill].correct++;
                    subskillStats[q.subskill].totalScore += 100;
                    if (!strengths.includes(q.subskill))
                        strengths.push(q.subskill);
                }
                else {
                    if (!weaknesses.includes(q.subskill))
                        weaknesses.push(q.subskill);
                }
                answerRows.push({
                    questionId: q.id || null,
                    userAnswer: q.userAnswer || '',
                    aiScore: isCorrect ? 10 : 0,
                    aiReasoning: isCorrect ? 'MCQ answer matched the expected option.' : 'MCQ answer did not match the expected option.',
                    isCorrect,
                });
            }
            else if (questionType === 'Ranking') {
                // Auto-grade Ranking: compare submitted order to correct order
                const isCorrect = Boolean(q.isCorrect);
                if (isCorrect) {
                    score++;
                    subskillStats[q.subskill].correct++;
                    subskillStats[q.subskill].totalScore += 100;
                    if (!strengths.includes(q.subskill))
                        strengths.push(q.subskill);
                }
                else {
                    subskillStats[q.subskill].totalScore += 30; // Partial credit for attempt
                    if (!weaknesses.includes(q.subskill))
                        weaknesses.push(q.subskill);
                }
                answerRows.push({
                    questionId: q.id || null,
                    userAnswer: q.userAnswer || '',
                    aiScore: isCorrect ? 10 : 3,
                    aiReasoning: isCorrect ? 'Ranking matched the expected order.' : 'Ranking only partially matched the expected order.',
                    isCorrect,
                });
            }
            else {
                const evaluation = q.userAnswer
                    ? await ai_service_1.AIService.evaluateAnswer(q.question_text || `Role assessment question for ${q.subskill}`, q.userAnswer, q.answerGuidance || q.answer_guidance || '')
                    : {
                        score: typeof q.openEndedScore === 'number' ? q.openEndedScore : 0,
                        scoreTen: Math.round((typeof q.openEndedScore === 'number' ? q.openEndedScore : 0) / 10),
                        reasoning: 'No answer provided for open-ended question.',
                        ai_detected: false,
                    };
                const openScore = typeof q.openEndedScore === 'number' && !q.userAnswer ? q.openEndedScore : evaluation.score;
                const normalized = openScore / 100; // 0-1
                score += normalized;
                subskillStats[q.subskill].totalScore += openScore;
                if (openScore >= 60) {
                    subskillStats[q.subskill].correct++;
                    if (!strengths.includes(q.subskill))
                        strengths.push(q.subskill);
                }
                else {
                    if (!weaknesses.includes(q.subskill))
                        weaknesses.push(q.subskill);
                }
                answerRows.push({
                    questionId: q.id || null,
                    userAnswer: q.userAnswer || '',
                    aiScore: Math.round(openScore / 10),
                    aiReasoning: evaluation.reasoning,
                    isCorrect: openScore >= 60 && !evaluation.ai_detected,
                });
            }
        }
        const skill_scores = Object.entries(subskillStats).map(([subskill, stats]) => ({
            subskill,
            score: Math.round(stats.totalScore / stats.total)
        }));
        // Calculate Skill Level
        const percentage = (score / total_questions) * 100;
        // AI Skill Gap Analysis
        const gapAnalysis = await ai_service_1.AIService.analyzeSkillGaps(skill_scores.reduce((acc, s) => ({ ...acc, [s.subskill]: s.score }), {}), rName);
        // Deep Skill Analysis: Maturity Levels
        const skillMaturity = assessmentEngine.analyzeSkillMaturity(skill_scores);
        // Generate Learning Recommendations using Gemini Learning Path Generator
        const learningRecommendations = await ai_service_1.AIService.generateLearningPath({
            role: rName,
            goalRole: req.body.userProfile?.goal_role,
            experience: req.body.userProfile?.experience,
            knownSkills: req.body.userProfile?.known_skills || strengths,
            weaknesses: gapAnalysis.weaknesses || weaknesses,
            profile: req.body.userProfile || {},
            skillScores: skill_scores.reduce((acc, entry) => ({ ...acc, [entry.subskill]: entry.score }), {}),
        });
        // Generate the Intelligence Report
        const intelligenceReport = await assessmentEngine.generateSkillIntelligenceReport(rName, percentage, gapAnalysis.strengths || strengths, gapAnalysis.weaknesses || weaknesses, skillMaturity);
        const finalReport = await ai_service_1.AIService.generateFinalReport({
            profile: req.body.userProfile || {},
            scores: skill_scores.reduce((acc, entry) => ({ ...acc, [entry.subskill]: entry.score }), {}),
            weaknesses: gapAnalysis.weaknesses || weaknesses,
            roadmap: learningRecommendations,
        });
        const client = await database_1.db.getClient();
        let assessmentResultId;
        try {
            await client.query('BEGIN');
            const insertResult = await client.query(`INSERT INTO assessment_results (
             employee_id,
             tenant_id,
             category,
             role_id,
             role_name,
             experience_level,
             score,
             total_questions,
             skill_level,
             strengths,
             weaknesses,
             ai_insight_report,
             skill_scores,
             skill_maturity,
             learning_recommendations,
             user_profile,
             gap_analysis,
             final_report
           ) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           RETURNING id`, [
                req.user.userId,
                req.tenantId,
                catName,
                finalRoleId,
                rName,
                experienceLevel || 'Intermediate',
                Math.round(score),
                total_questions,
                gapAnalysis.maturity_level || 'Developing',
                JSON.stringify(gapAnalysis.strengths || strengths),
                JSON.stringify(gapAnalysis.weaknesses || weaknesses),
                intelligenceReport,
                JSON.stringify(skill_scores),
                JSON.stringify(skillMaturity),
                JSON.stringify(learningRecommendations),
                JSON.stringify(req.body.userProfile || {}),
                JSON.stringify(gapAnalysis),
                finalReport,
            ]);
            assessmentResultId = insertResult.rows[0].id;
            for (const answerRow of answerRows) {
                await client.query(`INSERT INTO assessment_answers (assessment_id, question_id, user_answer, ai_score, ai_reasoning, is_correct)
             VALUES ($1, $2, $3, $4, $5, $6)`, [
                    assessmentResultId,
                    answerRow.questionId,
                    answerRow.userAnswer,
                    answerRow.aiScore,
                    answerRow.aiReasoning,
                    answerRow.isCorrect,
                ]);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        return res.status(201).json({
            id: assessmentResultId,
            score: Math.round(score),
            total_questions,
            skill_level: gapAnalysis.maturity_level || 'Developing',
            experience_level: experienceLevel || 'Intermediate',
            strengths: gapAnalysis.strengths || strengths,
            weaknesses: gapAnalysis.weaknesses || weaknesses,
            skill_scores,
            skill_maturity: skillMaturity,
            learning_recommendations: learningRecommendations,
            ai_insight_report: intelligenceReport,
            final_report: finalReport,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to submit adaptive assessment', error);
        return res.status(500).json({ error: error.message });
    }
});
// --- Score open-ended answer (called by frontend for non-MCQ questions) ---
router.post('/score-open-ended', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    try {
        const { questionText, questionType, userAnswer, answerGuidance, skillTag } = req.body;
        const result = await assessmentEngine.scoreOpenEndedAnswer(questionText, questionType, userAnswer, answerGuidance || '', skillTag || 'General');
        // Log the answer evaluation to assessment_answers table as requested
        await database_1.db.query(`INSERT INTO assessment_answers (question_id, user_answer, ai_score, ai_reasoning, is_correct)
         VALUES ($1, $2, $3, $4, $5)`, [req.body.questionId || null, userAnswer, Math.round(result.score / 10), result.feedback, result.score >= 60]);
        return res.json(result);
    }
    catch (error) {
        logger_1.logger.error('Failed to score open-ended answer', error);
        return res.status(500).json({ error: error.message });
    }
});
// --- Generate Final AI Skill Intelligence Report ---
router.get('/results/:resultId/final-report', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await database_1.db.query('SELECT * FROM assessment_results WHERE id = $1', [resultId]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'Result not found' });
        const resData = result.rows[0];
        const report = await ai_service_1.AIService.generateFinalReport({
            profile: resData.user_profile,
            scores: resData.skill_scores,
            weaknesses: resData.weaknesses,
            roadmap: resData.learning_recommendations
        });
        res.json({ report, storedReport: resData.final_report || null });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- END ENHANCED ASSESSMENT ENDPOINTS ---
// Start assessment
router.post('/:assessmentId/start', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { employeeId } = req.body;
        const { assessmentId } = req.params;
        logger_1.logger.info('Starting assessment', {
            employeeId,
            assessmentId,
        });
        const result = await assessmentEngine.startAssessment(employeeId, assessmentId, req.tenantId);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'STARTED_ASSESSMENT',
            resourceType: 'Assessment',
            resourceId: assessmentId,
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            req,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        logger_1.logger.error('Assessment start failed', error);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'STARTED_ASSESSMENT',
            resourceType: 'Assessment',
            resourceId: req.params.assessmentId,
            status: 'failure',
            errorMessage: error.message,
            executionTimeMs: Date.now() - startTime,
            req,
        });
        return res.status(500).json({ error: error.message });
    }
});
// Submit answers
router.post('/:resultId/submit', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    const startTime = Date.now();
    try {
        const { resultId } = req.params;
        const { answers, completionTimeSeconds, assessment } = req.body;
        logger_1.logger.info('Submitting assessment answers', {
            resultId,
            answerCount: answers?.length || 0,
        });
        const result = await assessmentEngine.submitAnswers(resultId, req.tenantId, answers, assessment, completionTimeSeconds);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'SUBMITTED_ASSESSMENT',
            resourceType: 'AssessmentResult',
            resourceId: resultId,
            changes: { score: result.score, passed: result.passed },
            status: 'success',
            executionTimeMs: Date.now() - startTime,
            req,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Assessment submission failed', error);
        await auditService.logAction({
            tenantId: req.tenantId,
            userId: req.user.userId,
            action: 'SUBMITTED_ASSESSMENT',
            resourceType: 'AssessmentResult',
            resourceId: req.params.resultId,
            status: 'failure',
            errorMessage: error.message,
            executionTimeMs: Date.now() - startTime,
            req,
        });
        return res.status(500).json({ error: error.message });
    }
});
// Get assessment results for employee
router.get('/employees/:employeeId/assessments', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const results = await assessmentResultRepo.findByEmployee(employeeId, req.tenantId);
        return res.status(200).json(results);
    }
    catch (error) {
        logger_1.logger.error('Assessment retrieval failed', error);
        return res.status(500).json({ error: error.message });
    }
});
// Get assessment result detail
router.get('/:resultId', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await assessmentResultRepo.findById(resultId, req.tenantId);
        if (!result) {
            return res.status(404).json({ error: 'Assessment result not found' });
        }
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.logger.error('Assessment detail retrieval failed', error);
        return res.status(500).json({ error: error.message });
    }
});
// ─── AI DETECTION LOGGING ────────────────────────────────────────────────────
router.post('/log-detection', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    try {
        const { assessmentId, questionId, pasteDetected, pasteCount, typingSpeedWpm, responseTimeMs, characterBurstCount, rawEvents, } = req.body;
        // Simple risk score heuristic
        let aiProbability = 0;
        if (pasteDetected)
            aiProbability += 40;
        if ((typingSpeedWpm ?? 0) > 120)
            aiProbability += 20;
        if ((characterBurstCount ?? 0) > 3)
            aiProbability += 20;
        if ((pasteCount ?? 0) > 1)
            aiProbability += 20;
        aiProbability = Math.min(100, aiProbability);
        await database_1.db.query(`INSERT INTO ai_detection_logs
           (employee_id, assessment_id, question_id, paste_detected, paste_count,
            typing_speed_wpm, response_time_ms, character_burst_count,
            ai_probability, raw_events)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
            req.user?.userId ?? null,
            assessmentId ?? null,
            questionId ?? null,
            pasteDetected ?? false,
            pasteCount ?? 0,
            typingSpeedWpm ?? null,
            responseTimeMs ?? null,
            characterBurstCount ?? 0,
            aiProbability,
            rawEvents ? JSON.stringify(rawEvents) : null,
        ]);
        res.json({ ok: true, aiProbability });
    }
    catch (error) {
        logger_1.logger.error('Failed to log detection event', error);
        res.status(500).json({ error: error.message });
    }
});
// ─── AI RISK SCORE FOR AN ASSESSMENT ─────────────────────────────────────────
router.get('/ai-risk/:resultId', rbac.requirePermission(['read:assessments']), async (req, res) => {
    try {
        const { resultId } = req.params;
        const logsRes = await database_1.db.query(`SELECT ai_probability, paste_detected, paste_count, typing_speed_wpm
         FROM ai_detection_logs
         WHERE assessment_id = $1`, [resultId]);
        if (logsRes.rowCount === 0) {
            return res.json({ riskScore: 0, riskLabel: 'Low', eventsLogged: 0 });
        }
        const rows = logsRes.rows;
        const avg = rows.reduce((s, r) => s + Number(r.ai_probability), 0) / rows.length;
        const riskScore = Math.round(avg);
        const riskLabel = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';
        res.json({ riskScore, riskLabel, eventsLogged: rows.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── MASTERY CHALLENGE SUBMISSION ────────────────────────────────────────────
router.post('/mastery/submit', rbac.requirePermission(['execute:assessments']), async (req, res) => {
    try {
        const { skill, challengeText, userResponse } = req.body;
        if (!userResponse || !userResponse.trim()) {
            return res.status(400).json({ error: 'Response is required' });
        }
        // Evaluate with Gemini
        const evaluation = await ai_service_1.AIService.evaluateAnswer(challengeText || `Mastery challenge for ${skill}`, userResponse, 'Demonstrate deep expertise, strategic thinking, and practical execution detail.');
        const aiScore = Math.round(evaluation.score);
        const passed = aiScore >= 60;
        await database_1.db.query(`INSERT INTO mastery_results
           (employee_id, tenant_id, skill, challenge_text, user_response, ai_score, ai_reasoning, passed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [
            req.user?.userId ?? null,
            req.tenantId ?? null,
            skill ?? 'General Mastery',
            challengeText ?? '',
            userResponse,
            aiScore,
            evaluation.reasoning,
            passed,
        ]);
        res.json({
            aiScore,
            reasoning: evaluation.reasoning,
            passed,
            skill_level: aiScore >= 80 ? 'Expert' : aiScore >= 60 ? 'Proficient' : 'Developing',
            strengths: [],
        });
    }
    catch (error) {
        logger_1.logger.error('Mastery submission failed', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=assessment.routes.js.map