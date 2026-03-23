import { RAGOrchestrationService } from '../integration/rag-orchestration';
import { LLMProvider } from '../integration/llm-provider';
export interface GeneratePathRequest {
    employeeId: string;
    tenantId: string;
    currentRole: string;
    yearsOfExperience: number;
    categoryId?: string;
    knownSkills: string[];
    strengths?: string[];
    weaknesses?: string[];
    userProfile?: Record<string, unknown>;
    skillScores?: Record<string, number>;
    sourceAssessmentResultId?: string;
}
export declare class LearningPathService {
    private ragOrchestration;
    private llmProvider;
    constructor(ragOrchestration: RAGOrchestrationService, llmProvider: LLMProvider);
    generateLearningPath(req: GeneratePathRequest): Promise<any>;
    private saveCurriculumToDatabase;
    getActiveLearningPath(employeeId: string, tenantId: string): Promise<any>;
    submitScenarioAnswer(exerciseId: string, userAnswer: string): Promise<any>;
    private buildFallbackCurriculum;
    private fallbackGrade;
}
//# sourceMappingURL=learning-path.service.d.ts.map