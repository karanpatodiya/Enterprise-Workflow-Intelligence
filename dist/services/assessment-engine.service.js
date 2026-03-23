"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentEngineService = void 0;
const ai_service_1 = require("./ai.service");
const logger_1 = require("../config/logger");
const uuid_1 = require("uuid");
// Question type distributions per role nature
const TECHNICAL_DISTRIBUTION = {
    Scenario: 0.30,
    Debug: 0.25,
    ShortAnswer: 0.20,
    CaseStudy: 0.15,
    MCQ: 0.10,
    Ranking: 0,
};
const BUSINESS_DISTRIBUTION = {
    Scenario: 0.40,
    CaseStudy: 0.25,
    Ranking: 0.20,
    MCQ: 0.15,
    Debug: 0,
    ShortAnswer: 0,
};
class AssessmentEngineService {
    constructor(assessmentResultRepository, employeeRepository) {
        this.assessmentResultRepository = assessmentResultRepository;
        this.employeeRepository = employeeRepository;
    }
    async startAssessment(employeeId, assessmentId, tenantId) {
        try {
            logger_1.logger.info('Starting assessment', {
                employeeId,
                assessmentId,
                tenantId,
            });
            // Check for existing in-progress assessment
            const existingInProgress = await this.assessmentResultRepository.findInProgress(employeeId);
            if (existingInProgress) {
                logger_1.logger.warn('Employee has in-progress assessment', {
                    existingAssessmentId: existingInProgress.id,
                });
                return existingInProgress;
            }
            const result = {
                id: (0, uuid_1.v4)(),
                employeeId,
                assessmentId,
                tenantId,
                startedAt: new Date(),
                completedAt: undefined,
                score: 0,
                maxScore: 0,
                percentageScore: 0,
                passed: false,
                completionTimeSeconds: 0,
                retryCount: 0,
                answers: [],
                feedbackAIGenerated: '',
                status: 'in-progress',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return this.assessmentResultRepository.create(result);
        }
        catch (error) {
            logger_1.logger.error('Assessment start failed', error);
            throw error;
        }
    }
    async submitAnswers(resultId, tenantId, answers, assessment, completionTimeSeconds) {
        try {
            logger_1.logger.info('Submitting assessment answers', {
                resultId,
                answerCount: answers.length,
            });
            // Score the answers
            const scoringOutput = await this.scoreAnswers({
                assessment,
                answers,
                scoringMethod: assessment.scoringMethod,
                retryCount: 0,
            });
            // Generate AI feedback
            const aiFeedback = await this.generateAIFeedback(assessment, scoringOutput, answers);
            // Update result
            const updatedResult = await this.assessmentResultRepository.update(resultId, tenantId, {
                completedAt: new Date(),
                score: scoringOutput.score,
                maxScore: scoringOutput.maxScore,
                percentageScore: scoringOutput.percentageScore,
                passed: scoringOutput.passed,
                answers: scoringOutput.normalizedAnswers,
                feedbackAIGenerated: aiFeedback,
                status: 'completed',
                completionTimeSeconds,
            });
            logger_1.logger.info('Assessment completed', {
                resultId,
                score: scoringOutput.score,
                maxScore: scoringOutput.maxScore,
                passed: scoringOutput.passed,
            });
            return updatedResult;
        }
        catch (error) {
            logger_1.logger.error('Answer submission failed', error);
            throw error;
        }
    }
    async scoreAnswers(input) {
        const score = 0;
        const maxScore = input.assessment.totalPoints;
        switch (input.scoringMethod) {
            case 'objective':
                return this.scoreObjective(input.answers, input.assessment, maxScore);
            case 'rubric-based':
                return this.scoreRubricBased(input.answers, input.assessment, maxScore);
            case 'ai-assisted':
                return this.scoreAIAssisted(input.answers, input.assessment, maxScore);
            default:
                throw new Error(`Unknown scoring method: ${input.scoringMethod}`);
        }
    }
    scoreObjective(answers, assessment, maxScore) {
        let score = 0;
        const normalizedAnswers = answers.map((answer) => {
            const isCorrect = answer.answer?.toLowerCase().trim() ===
                answer.correctAnswer?.toLowerCase().trim();
            if (isCorrect) {
                score += answer.maxPoints;
            }
            return {
                ...answer,
                evaluatedCorrect: isCorrect,
            };
        });
        const percentageScore = (score / maxScore) * 100;
        const passed = percentageScore >= assessment.passingScore;
        return {
            score,
            maxScore,
            percentageScore,
            passed,
            feedback: `You scored ${percentageScore.toFixed(1)}% on this assessment.`,
            normalizedAnswers,
        };
    }
    async scoreRubricBased(answers, assessment, maxScore) {
        let score = 0;
        const normalizedAnswers = [];
        for (const answer of answers) {
            const rubricScore = await this.evaluateAgainstRubric(answer);
            score += rubricScore;
            normalizedAnswers.push({
                ...answer,
                score: rubricScore,
                evaluatedCorrect: rubricScore >= answer.maxPoints * 0.7,
            });
        }
        const percentageScore = (score / maxScore) * 100;
        const passed = percentageScore >= assessment.passingScore;
        return {
            score,
            maxScore,
            percentageScore,
            passed,
            feedback: `Your rubric-based score is ${percentageScore.toFixed(1)}%.`,
            normalizedAnswers,
        };
    }
    async scoreAIAssisted(answers, assessment, maxScore) {
        let score = 0;
        const normalizedAnswers = [];
        for (const answer of answers) {
            const aiScore = await this.scoreWithAI(answer, assessment);
            score += aiScore;
            normalizedAnswers.push({
                ...answer,
                score: aiScore,
                evaluatedCorrect: aiScore >= answer.maxPoints * 0.7,
            });
        }
        const percentageScore = (score / maxScore) * 100;
        const passed = percentageScore >= assessment.passingScore;
        return {
            score,
            maxScore,
            percentageScore,
            passed,
            feedback: `AI-assisted evaluation complete. Your score is ${percentageScore.toFixed(1)}%.`,
            normalizedAnswers,
        };
    }
    async evaluateAgainstRubric(answer) {
        return answer.maxPoints * 0.8;
    }
    async scoreWithAI(answer, assessment) {
        try {
            const { score } = await ai_service_1.AIService.evaluateAnswer(`Part of assessment: ${assessment.name}. Question ID: ${answer.questionId}`, answer.answer || '', 'Score accurately based on professional standards.');
            // Normalized to assessment points (AIService returns 0-100)
            return (score / 100) * answer.maxPoints;
        }
        catch (error) {
            logger_1.logger.warn('AI scoring failed, using default', error);
            return answer.maxPoints * 0.5;
        }
    }
    async generateAIFeedback(assessment, scoringOutput, answers) {
        try {
            // Use AIService to generate final summary or specific feedback
            const report = await ai_service_1.AIService.generateFinalReport({
                profile: { name: 'Employee', experience: 5, category: 'Domain', role: assessment.name, known_skills: [], goal_role: '' },
                scores: { overall: scoringOutput.percentageScore },
                weaknesses: [],
                roadmap: []
            });
            return report.slice(0, 300); // Truncate for feedback field
        }
        catch (error) {
            logger_1.logger.warn('AI feedback generation failed', error);
            return `Your assessment result is ${scoringOutput.percentageScore.toFixed(1)}%. ${scoringOutput.passed
                ? 'Congratulations on passing!'
                : 'Please review the material and try again.'}`;
        }
    }
    // =====================================================================
    //  DYNAMIC MULTI-TYPE ASSESSMENT GENERATION
    // =====================================================================
    /**
     * Determine whether a category is 'technical' or 'business' based on its name.
     * Used as a fallback when the DB role_type column is not yet populated.
     */
    determineRoleNature(categoryName) {
        const lower = categoryName.toLowerCase();
        const businessKeywords = ['business', 'sales', 'hr', 'human resource', 'marketing', 'finance', 'management', 'operations', 'talent', 'recruitment'];
        if (businessKeywords.some(kw => lower.includes(kw))) {
            return 'business';
        }
        return 'technical';
    }
    /**
     * Calculate how many questions of each type to generate based on role nature.
     */
    getQuestionDistribution(roleNature, totalCount) {
        const dist = roleNature === 'technical' ? TECHNICAL_DISTRIBUTION : BUSINESS_DISTRIBUTION;
        const result = {};
        let assigned = 0;
        const entries = Object.entries(dist).filter(([, pct]) => pct > 0);
        for (let i = 0; i < entries.length; i++) {
            const [type, pct] = entries[i];
            if (i === entries.length - 1) {
                // Last type gets the remainder
                result[type] = totalCount - assigned;
            }
            else {
                const count = Math.round(totalCount * pct);
                result[type] = count;
                assigned += count;
            }
        }
        return result;
    }
    /**
     * Generate a mixed-type adaptive assessment for a specific role.
     */
    async generateAdaptiveAssessment(categoryName, roleName, expectedSkills, experienceLevel, count = 15, roleNature) {
        try {
            const nature = roleNature || this.determineRoleNature(categoryName);
            const aiQuestions = await ai_service_1.AIService.generateQuestions(roleName, experienceLevel === 'Senior' ? 8 : 3, expectedSkills);
            const questions = aiQuestions.map(q => ({
                id: (0, uuid_1.v4)(),
                question_type: q.question_type,
                subskill: q.skill_tag,
                question_text: q.question,
                difficulty: experienceLevel.toLowerCase(),
                options: q.options,
                correct_answer: q.correct_answer,
                answer_guidance: q.answer_guidance,
                explanation: 'AI generated question'
            }));
            return questions;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate adaptive assessment, using fallback', error);
            const nature = roleNature || this.determineRoleNature(categoryName);
            const distribution = this.getQuestionDistribution(nature, count);
            return this.buildFallbackQuestions(categoryName, roleName, expectedSkills, experienceLevel, count, nature, distribution);
        }
    }
    /**
     * Build fallback questions when LLM is unavailable.
     */
    buildFallbackQuestions(categoryName, roleName, expectedSkills, experienceLevel, count, roleNature, distribution) {
        const questions = [];
        let qIndex = 0;
        for (const [type, typeCount] of Object.entries(distribution)) {
            if (typeCount <= 0)
                continue;
            for (let i = 0; i < typeCount; i++) {
                const skill = expectedSkills[qIndex % expectedSkills.length] || 'General';
                const qType = type;
                if (qType === 'MCQ') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'MCQ',
                        subskill: skill,
                        question_text: `[${experienceLevel} ${roleName}] Which approach best demonstrates mastery of ${skill} in the ${categoryName} domain?`,
                        difficulty: experienceLevel.toLowerCase() === 'senior' ? 'advanced' : 'intermediate',
                        options: {
                            A: `Apply ${skill} best practices with a structured, scalable approach.`,
                            B: `Ignore ${skill} standards and deploy a quick workaround.`,
                            C: `Escalate the ${skill} decision without analyzing root causes.`,
                            D: `Deprioritize ${skill} and wait for conditions to stabilize.`
                        },
                        correct_answer: 'A',
                        explanation: `In professional practice, applying structured ${skill} best practices ensures long-term quality and impact.`
                    });
                }
                else if (qType === 'Scenario') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'Scenario',
                        subskill: skill,
                        question_text: roleNature === 'technical'
                            ? `You are a ${roleName} and your team encounters a critical production issue related to ${skill}. The system is experiencing degraded performance affecting 30% of users. Walk through your approach to diagnosing the root cause, implementing a fix, and preventing future occurrences.`
                            : `As a ${roleName}, a key stakeholder has raised concerns about declining performance metrics in the area of ${skill}. You have conflicting priorities and limited resources. Explain how you would assess the situation, make a decision, and communicate your plan to leadership.`,
                        difficulty: 'advanced',
                        answer_guidance: roleNature === 'technical'
                            ? `Good answers should cover: systematic debugging approach, monitoring/logging analysis, root cause identification methodology, fix validation strategy, post-incident review process, and preventive measures.`
                            : `Good answers should cover: stakeholder analysis, data-driven assessment, prioritization framework, resource allocation strategy, communication plan, and measurable success criteria.`
                    });
                }
                else if (qType === 'Debug') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'Debug',
                        subskill: skill,
                        question_text: `Review the following situation: A ${roleName} has implemented a solution involving ${skill}, but users are reporting intermittent failures. The logs show no errors but response times have doubled. Identify at least three possible causes and explain how you would systematically narrow down the root cause.`,
                        difficulty: 'advanced',
                        answer_guidance: `Should identify potential causes (resource contention, configuration issues, dependency failures), describe a systematic debugging methodology, and propose monitoring improvements.`
                    });
                }
                else if (qType === 'ShortAnswer') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'ShortAnswer',
                        subskill: skill,
                        question_text: `Explain the key principles of ${skill} and why they are critical for a ${roleName} operating at the ${experienceLevel} level. Be concise (3-5 sentences).`,
                        difficulty: 'intermediate',
                        answer_guidance: `Should demonstrate understanding of core principles, practical application, and awareness of how this skill impacts the broader ${categoryName} domain.`
                    });
                }
                else if (qType === 'CaseStudy') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'CaseStudy',
                        subskill: skill,
                        question_text: roleNature === 'technical'
                            ? `A mid-size company is migrating their legacy system. The ${skill} component needs to be redesigned to handle 10x current load while maintaining backward compatibility. Budget is limited and the deadline is 3 months. Analyze the tradeoffs and propose a phased approach with clear milestones.`
                            : `Your organization is undergoing a restructuring. The ${skill} function needs to be consolidated across three business units with different processes and cultures. Employee morale is low and key talent is at risk of leaving. Develop a comprehensive strategy addressing people, process, and outcomes.`,
                        difficulty: 'advanced',
                        answer_guidance: roleNature === 'technical'
                            ? `Should address: requirements analysis, architectural tradeoffs, phased migration plan, risk assessment, backward compatibility strategy, performance benchmarks, and milestone definitions.`
                            : `Should address: stakeholder mapping, change management approach, communication strategy, timeline, risk mitigation, talent retention measures, and success metrics.`
                    });
                }
                else if (qType === 'Ranking') {
                    questions.push({
                        id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
                        question_type: 'Ranking',
                        subskill: skill,
                        question_text: `A crisis has emerged requiring immediate action in the area of ${skill}. Rank the following actions in order of priority (most urgent first):`,
                        difficulty: 'intermediate',
                        options: {
                            '1': 'Assess the immediate impact and gather facts',
                            '2': 'Communicate status to all stakeholders',
                            '3': 'Implement containment measures',
                            '4': 'Conduct a thorough root cause analysis'
                        },
                        correct_answer: '1,3,2,4',
                        answer_guidance: `Correct priority: First assess impact (understand what you're dealing with), then contain the issue, then communicate (with accurate info), and finally do root cause analysis. Acting before understanding leads to wasted effort.`
                    });
                }
                qIndex++;
            }
        }
        return questions;
    }
    // =====================================================================
    //  DEEP SKILL ANALYSIS
    // =====================================================================
    /**
     * Classify skill maturity based on score percentage.
     */
    analyzeSkillMaturity(skillScores) {
        return skillScores.map(s => ({
            skill: s.subskill,
            score: s.score,
            maturity: s.score >= 80 ? 'Expert'
                : s.score >= 60 ? 'Proficient'
                    : s.score >= 40 ? 'Developing'
                        : 'Foundational'
        }));
    }
    /**
     * Generate adaptive learning recommendations for weak skills.
     */
    async generateLearningRecommendations(weakSkills, roleName) {
        if (weakSkills.length === 0)
            return [];
        try {
            const recommendations = await ai_service_1.AIService.generateLearningPath(weakSkills);
            return recommendations.map(r => ({
                topic: r.topic,
                description: `${r.learning_stage}: ${r.topics.join(', ')}`,
                resource: r.recommended_resources.join(' | '),
                practice_task: r.practice_tasks.join(' | ')
            }));
        }
        catch (error) {
            logger_1.logger.warn('Failed to generate learning recommendations via LLM, using fallback', error);
            return weakSkills.map(skill => ({
                topic: `Mastering ${skill}`,
                description: `Strengthen your understanding and practical application of ${skill} to reach professional proficiency for the ${roleName} role.`,
                resource: `Search for "${skill} best practices" on official documentation and industry-standard learning platforms.`,
                practice_task: `Complete a hands-on project that requires applying ${skill} concepts to solve a real-world problem relevant to ${roleName}.`
            }));
        }
    }
    // =====================================================================
    //  AI SCORING FOR NON-MCQ QUESTIONS
    // =====================================================================
    /**
     * Score a non-MCQ answer using AI, comparing against answer guidance.
     */
    async scoreOpenEndedAnswer(questionText, questionType, userAnswer, answerGuidance, skillTag) {
        try {
            const { score, reasoning } = await ai_service_1.AIService.evaluateAnswer(questionText, userAnswer, `Type: ${questionType}\nGuidance: ${answerGuidance}\nSkill: ${skillTag}`);
            return { score, feedback: reasoning };
        }
        catch (error) {
            logger_1.logger.warn('AI open-ended scoring failed, using heuristic fallback', error);
            return this.heuristicScoreOpenEnded(userAnswer, answerGuidance);
        }
    }
    /**
     * Heuristic fallback for scoring open-ended answers when AI is unavailable.
     */
    heuristicScoreOpenEnded(userAnswer, answerGuidance) {
        const answer = (userAnswer || '').trim().toLowerCase();
        const wordCount = answer.split(/\s+/).filter(Boolean).length;
        if (wordCount < 10) {
            return { score: 15, feedback: 'Your answer is too brief. Please provide more detail and address the key aspects of the question.' };
        }
        // Extract key terms from guidance and check for matches
        const guidanceWords = (answerGuidance || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const uniqueGuideWords = [...new Set(guidanceWords)];
        const matches = uniqueGuideWords.filter(w => answer.includes(w)).length;
        const matchRatio = uniqueGuideWords.length > 0 ? matches / uniqueGuideWords.length : 0;
        let score;
        let feedback;
        if (matchRatio >= 0.5 && wordCount >= 40) {
            score = 75;
            feedback = 'Your answer demonstrates solid understanding and covers most key points. Consider adding more specific examples.';
        }
        else if (matchRatio >= 0.3 && wordCount >= 25) {
            score = 55;
            feedback = 'Your answer addresses some key points but lacks depth in key areas. Expand on your reasoning and provide concrete examples.';
        }
        else if (matchRatio >= 0.15 && wordCount >= 15) {
            score = 35;
            feedback = 'Your answer touches on the topic but misses several critical aspects. Review the core concepts and try to be more thorough.';
        }
        else {
            score = 20;
            feedback = 'Your answer does not sufficiently address the question. Focus on the specific aspects asked and provide structured reasoning.';
        }
        return { score, feedback };
    }
    // =====================================================================
    //  INTELLIGENCE REPORT (enhanced)
    // =====================================================================
    async generateSkillIntelligenceReport(roleName, scorePercentage, strengths, weaknesses, skillMaturity) {
        try {
            const report = await ai_service_1.AIService.generateFinalReport({
                profile: { role: roleName },
                scores: { percentage: scorePercentage, maturity: skillMaturity },
                strengths,
                weaknesses,
                roadmap: []
            });
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate intelligence report, using fallback', error);
            return `Executive Summary: Based on our algorithmic evaluation, the candidate achieved ${scorePercentage}% proficiency in the ${roleName} role capabilities. Demonstrated competencies include ${strengths.length > 0 ? strengths.join(', ') : 'general entry-level concepts'}.\n\nStrategic Recommendation: We strongly recommend focused programmatic remediation on ${weaknesses.length > 0 ? weaknesses.join(', ') : 'advanced tier topics'} to achieve full enterprise mastery and cross-functional impact required for this role.`;
        }
    }
}
exports.AssessmentEngineService = AssessmentEngineService;
//# sourceMappingURL=assessment-engine.service.js.map