export interface UserProfile {
    name: string;
    experience: number;
    category: string;
    role: string;
    known_skills: string[];
    goal_role: string;
}
export interface GeneratedQuestion {
    question: string;
    question_type: 'scenario' | 'debugging' | 'short_explanation' | 'MCQ';
    skill_tag: string;
    options?: Record<string, string>;
    correct_answer?: string;
    answer_guidance?: string;
}
export interface AnswerEvaluation {
    score: number;
    scoreTen: number;
    reasoning: string;
    ai_detected: boolean;
}
export interface SkillAnalysisResult {
    strengths: string[];
    weaknesses: string[];
    maturity_level: 'Foundational' | 'Developing' | 'Proficient' | 'Expert';
    summary: string;
    skills_to_assess?: string[];
    difficulty?: 'Foundational' | 'Intermediate' | 'Advanced';
}
export interface LearningPathModule {
    learning_stage: string;
    topic: string;
    topics: string[];
    practice_tasks: string[];
    recommended_resources: string[];
}
export interface LearningPathInput {
    role?: string;
    goalRole?: string;
    experience?: number;
    knownSkills?: string[];
    weaknesses: string[];
    profile?: Partial<UserProfile>;
    skillScores?: Record<string, number>;
    context?: string;
}
export declare class AIService {
    static analyzeProfile(profile: UserProfile): Promise<string[]>;
    static analyzeSkills(input: UserProfile | {
        role: string;
        scores: Record<string, number>;
    }): Promise<SkillAnalysisResult>;
    static generateQuestions(role: string, experience: number, skills: string[]): Promise<GeneratedQuestion[]>;
    static evaluateAnswer(question: string, userAnswer: string, answerGuidance?: string): Promise<AnswerEvaluation>;
    static analyzeSkillGaps(scores: Record<string, number>, role: string): Promise<SkillAnalysisResult>;
    static generateLearningPath(input: LearningPathInput | string[]): Promise<LearningPathModule[]>;
    static generateMasteryChallenge(skill: string): Promise<string>;
    static generateFinalReport(data: any): Promise<string>;
}
//# sourceMappingURL=ai.service.d.ts.map