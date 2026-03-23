import { EmployeeAssessmentResult, Assessment, AssessmentAnswer } from '../domain';
import { AssessmentResultRepository } from '../repositories/assessment-result.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
export type QuestionType = 'MCQ' | 'Scenario' | 'CaseStudy' | 'Debug' | 'ShortAnswer' | 'Ranking';
export type RoleNature = 'technical' | 'business';
export interface GeneratedQuestion {
    id: string;
    question_type: QuestionType;
    subskill: string;
    question_text: string;
    difficulty: string;
    options?: Record<string, string>;
    correct_answer?: string;
    answer_guidance?: string;
    explanation?: string;
}
export interface SkillMaturityEntry {
    skill: string;
    score: number;
    maturity: 'Foundational' | 'Developing' | 'Proficient' | 'Expert';
}
export interface LearningRecommendation {
    topic: string;
    description: string;
    resource: string;
    practice_task: string;
}
export declare class AssessmentEngineService {
    private assessmentResultRepository;
    private employeeRepository;
    constructor(assessmentResultRepository: AssessmentResultRepository, employeeRepository: EmployeeRepository);
    startAssessment(employeeId: string, assessmentId: string, tenantId: string): Promise<EmployeeAssessmentResult>;
    submitAnswers(resultId: string, tenantId: string, answers: AssessmentAnswer[], assessment: Assessment, completionTimeSeconds: number): Promise<EmployeeAssessmentResult>;
    private scoreAnswers;
    private scoreObjective;
    private scoreRubricBased;
    private scoreAIAssisted;
    private evaluateAgainstRubric;
    private scoreWithAI;
    private generateAIFeedback;
    /**
     * Determine whether a category is 'technical' or 'business' based on its name.
     * Used as a fallback when the DB role_type column is not yet populated.
     */
    determineRoleNature(categoryName: string): RoleNature;
    /**
     * Calculate how many questions of each type to generate based on role nature.
     */
    getQuestionDistribution(roleNature: RoleNature, totalCount: number): Record<QuestionType, number>;
    /**
     * Generate a mixed-type adaptive assessment for a specific role.
     */
    generateAdaptiveAssessment(categoryName: string, roleName: string, expectedSkills: string[], experienceLevel: string, count?: number, roleNature?: RoleNature): Promise<GeneratedQuestion[]>;
    /**
     * Build fallback questions when LLM is unavailable.
     */
    private buildFallbackQuestions;
    /**
     * Classify skill maturity based on score percentage.
     */
    analyzeSkillMaturity(skillScores: Array<{
        subskill: string;
        score: number;
    }>): SkillMaturityEntry[];
    /**
     * Generate adaptive learning recommendations for weak skills.
     */
    generateLearningRecommendations(weakSkills: string[], roleName: string): Promise<LearningRecommendation[]>;
    /**
     * Score a non-MCQ answer using AI, comparing against answer guidance.
     */
    scoreOpenEndedAnswer(questionText: string, questionType: QuestionType, userAnswer: string, answerGuidance: string, skillTag: string): Promise<{
        score: number;
        feedback: string;
    }>;
    /**
     * Heuristic fallback for scoring open-ended answers when AI is unavailable.
     */
    private heuristicScoreOpenEnded;
    generateSkillIntelligenceReport(roleName: string, scorePercentage: number, strengths: string[], weaknesses: string[], skillMaturity?: SkillMaturityEntry[]): Promise<string>;
}
//# sourceMappingURL=assessment-engine.service.d.ts.map