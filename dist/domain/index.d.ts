export interface Tenant {
    id: string;
    name: string;
    slug: string;
    industry: string;
    size: 'startup' | 'scale-up' | 'enterprise';
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface Department {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    parentDepartmentId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type RoleLevel = 'individual-contributor' | 'team-lead' | 'manager' | 'director' | 'executive';
export type EmployeeStatus = 'active' | 'inactive' | 'departed';
export interface Employee {
    id: string;
    tenantId: string;
    departmentId: string;
    email: string;
    firstName: string;
    lastName: string;
    currentRole: string;
    roleLevel: RoleLevel;
    managerEmployeeId?: string;
    status: EmployeeStatus;
    hireDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RoleCompetency {
    id: string;
    tenantId: string;
    roleLevel: RoleLevel;
    skillId: string;
    requiredProficiencyLevel: number;
    weight: number;
    createdAt: Date;
    updatedAt: Date;
}
export type SkillCategory = 'technical' | 'leadership' | 'communication' | 'strategic' | 'operational';
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export interface Skill {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    category: SkillCategory;
    createdAt: Date;
    updatedAt: Date;
}
export interface EmployeeSkill {
    id: string;
    employeeId: string;
    skillId: string;
    proficiencyLevel: ProficiencyLevel;
    yearsOfExperience: number;
    lastAssessmentDate: Date;
    assessmentScores: number[];
    rawScore: number;
    createdAt: Date;
    updatedAt: Date;
}
export type AssessmentType = 'scenario' | 'question-based' | 'practical' | 'review-based';
export type ScoringMethod = 'objective' | 'rubric-based' | 'ai-assisted';
export interface Assessment {
    id: string;
    tenantId: string;
    skillId: string;
    name: string;
    description: string;
    type: AssessmentType;
    scoringMethod: ScoringMethod;
    totalPoints: number;
    passingScore: number;
    estimatedDurationMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AssessmentQuestion {
    id: string;
    assessmentId: string;
    questionText: string;
    questionType: 'multiple-choice' | 'open-ended' | 'practical' | 'scenario';
    points: number;
    rubricId?: string;
    correctAnswer?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ScoringRubric {
    id: string;
    assessmentId: string;
    name: string;
    criteria: RubricCriterion[];
    createdAt: Date;
    updatedAt: Date;
}
export interface RubricCriterion {
    level: number;
    descriptor: string;
    points: number;
}
export interface EmployeeAssessmentResult {
    id: string;
    employeeId: string;
    assessmentId: string;
    tenantId: string;
    startedAt: Date;
    completedAt?: Date;
    score: number;
    maxScore: number;
    percentageScore: number;
    passed: boolean;
    completionTimeSeconds: number;
    retryCount: number;
    answers: AssessmentAnswer[];
    feedbackAIGenerated: string;
    status: 'in-progress' | 'completed' | 'failed-timeout' | 'abandoned';
    createdAt: Date;
    updatedAt: Date;
}
export interface AssessmentAnswer {
    questionId: string;
    answer: string;
    score: number;
    maxPoints: number;
    evaluatedCorrect: boolean;
    evaluationNote?: string;
}
export interface IncidentSimulation {
    id: string;
    tenantId: string;
    skillId: string;
    name: string;
    description: string;
    scenario: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDurationMinutes: number;
    successCriteria: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface EmployeeSimulationResult {
    id: string;
    employeeId: string;
    simulationId: string;
    tenantId: string;
    startedAt: Date;
    completedAt?: Date;
    successScore: number;
    decisionsLog: DecisionLog[];
    overallFeedback: string;
    aiAssessment: SimulationAIAssessment;
    createdAt: Date;
    updatedAt: Date;
}
export interface DecisionLog {
    timestamp: Date;
    decision: string;
    rationale: string;
    outcome: string;
    correctnessScore: number;
}
export interface SimulationAIAssessment {
    strengthsIdentified: string[];
    areasForImprovement: string[];
    confidenceInAssessment: number;
    suggestedDevelopmentPlan: string;
}
export type DocumentType = 'policy' | 'procedure' | 'role-guide' | 'competency-framework' | 'training-material' | 'best-practice';
export interface CompanyKnowledgeDocument {
    id: string;
    tenantId: string;
    departmentId?: string;
    title: string;
    description: string;
    type: DocumentType;
    originalFilePath: string;
    fileType: 'pdf' | 'docx' | 'md';
    fileSize: number;
    uploadedBy: string;
    isIndexed: boolean;
    vectorStoreId?: string;
    version: number;
    metadata: DocumentMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export interface DocumentMetadata {
    company_id: string;
    department?: string;
    role_level?: RoleLevel;
    document_type: DocumentType;
    version: number;
    tags?: string[];
    relevantSkillIds?: string[];
}
export interface DocumentChunk {
    id: string;
    documentId: string;
    tenantId: string;
    chunkIndex: number;
    content: string;
    embedding?: number[];
    vectorStoreChunkId?: string;
    metadata: ChunkMetadata;
    createdAt: Date;
}
export interface ChunkMetadata extends DocumentMetadata {
    chunk_index: number;
    source_page?: number;
}
export interface RAGQuery {
    employeeId: string;
    tenantId: string;
    contextType: 'promotion_analysis' | 'incident_simulation' | 'skill_explanation' | 'general_knowledge';
    query: string;
    filters?: RAGFilter;
    modelVersion?: string;
}
export interface RAGFilter {
    documentTypes?: DocumentType[];
    departmentId?: string;
    roleLevel?: RoleLevel;
    skillIds?: string[];
}
export interface RAGResult {
    query: string;
    answer: string;
    sourceChunks: RAGSourceChunk[];
    confidenceScore: number;
    halluccinationMitigationApplied: boolean;
    executionTimeMs: number;
}
export interface RAGSourceChunk {
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    content: string;
    relevanceScore: number;
    metadata: ChunkMetadata;
}
export interface SkillDelta {
    skillId: string;
    currentProficiencyLevel: ProficiencyLevel;
    requiredProficiencyLevel: ProficiencyLevel;
    gapDays: number;
    assessmentEvidenceCount: number;
    lastAssessmentDate: Date;
}
export interface PromotionReadinessAnalysis {
    employeeId: string;
    targetRoleLevel: RoleLevel;
    readinessScore: number;
    readinessCategory: 'not-ready' | 'developing' | 'ready' | 'ready-plus';
    skillGaps: SkillDelta[];
    strengths: SkillStrength[];
    developmentAreas: DevelopmentArea[];
    timelineToReadiness: number;
    riskFactors: string[];
    recommendations: string[];
    analysisDate: Date;
    modelVersion: string;
}
export interface SkillStrength {
    skillId: string;
    skillName: string;
    proficiencyLevel: ProficiencyLevel;
    overMasteryFactor: number;
}
export interface DevelopmentArea {
    skillId: string;
    skillName: string;
    currentLevel: ProficiencyLevel;
    requiredLevel: ProficiencyLevel;
    developmentPriority: 'critical' | 'high' | 'medium' | 'low';
}
export interface SkillRisk {
    employeeId: string;
    riskScore: number;
    riskCategory: 'low' | 'medium' | 'high' | 'critical';
    atRiskSkills: AtRiskSkill[];
    concentrationRisk: number;
    lastApprovedUpdate: Date;
    updateDueDate: Date;
}
export interface AtRiskSkill {
    skillId: string;
    skillName: string;
    riskReason: string;
    daysWithoutAssessment: number;
    riskLevel: 'medium' | 'high' | 'critical';
}
export interface SkillScoringModel {
    version: string;
    name: string;
    algorithmDescription: string;
    weights: ScoringWeights;
    calibrationFactors: CalibrationFactor[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface ScoringWeights {
    assessmentScore: number;
    experienceYears: number;
    assessmentRecency: number;
    assessmentFrequency: number;
    roleRelevance: number;
}
export interface CalibrationFactor {
    factor: string;
    multiplier: number;
}
export interface TeamReadinessScore {
    departmentId: string;
    departmentName: string;
    teamSize: number;
    averageReadinessScore: number;
    readyCount: number;
    developingCount: number;
    notReadyCount: number;
    readinessPercentage: number;
    trend: 'improving' | 'stable' | 'declining';
    calculatedAt: Date;
}
export interface DepartmentRiskCluster {
    departmentId: string;
    departmentName: string;
    criticalRiskEmployeeCount: number;
    highRiskEmployeeCount: number;
    mediumRiskEmployeeCount: number;
    clusterScore: number;
    topAtriskSkills: SkillRiskSummary[];
    concernFlag: boolean;
    lastAnalysisDate: Date;
}
export interface SkillRiskSummary {
    skillId: string;
    skillName: string;
    affectedEmployeeCount: number;
    departmentConcentration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface PromotionPipelineMetrics {
    totalEmployees: number;
    readyForPromotion: number;
    developingForPromotion: number;
    promotionVelocity: number;
    averageTimeToReadiness: number;
    bottleneckSkills: SkillBottleneck[];
    forecastedReadyNextQuarter: number;
    calculatedAt: Date;
}
export interface SkillBottleneck {
    skillId: string;
    skillName: string;
    employeesAboveRequired: number;
    employeesBelowRequired: number;
    concentrationRisk: boolean;
}
export interface AnalyticsSnapshot {
    tenantId: string;
    snapshotDate: Date;
    teamReadinessScores: TeamReadinessScore[];
    departmentRiskClusters: DepartmentRiskCluster[];
    promotionPipelineMetrics: PromotionPipelineMetrics;
    aggregateReadinessScore: number;
    aggregateRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    executiveRecommendations: string[];
}
export type Permission = 'read:employees' | 'write:employees' | 'read:skills' | 'write:skills' | 'read:assessments' | 'write:assessments' | 'execute:assessments' | 'read:analytics' | 'write:documents' | 'read:documents' | 'execute:rag-queries' | 'manage:roles';
export type UserRole = 'tenant-admin' | 'department-manager' | 'hr-specialist' | 'data-analyst' | 'viewer';
export interface User {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    permissions: Permission[];
    departmentIds?: string[];
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type AuditAction = 'INGESTED_DOCUMENT' | 'UPDATED_SKILL_SCORE' | 'EXECUTED_RAG_QUERY' | 'GENERATED_ANALYTICS' | 'USER_LOGIN' | 'DATA_EXPORT' | 'STARTED_ASSESSMENT' | 'SUBMITTED_ASSESSMENT';
export interface AuditLog {
    id: string;
    tenantId: string;
    userId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    changes?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    executionTimeMs: number;
    createdAt: Date;
}
export declare class ValidationError extends Error {
    code: string;
    details?: Record<string, any> | undefined;
    constructor(code: string, message: string, details?: Record<string, any> | undefined);
}
export declare class TenantIsolationError extends Error {
    constructor(message: string);
}
export declare class RAGError extends Error {
    code: string;
    retryable: boolean;
    constructor(code: string, message: string, retryable?: boolean);
}
//# sourceMappingURL=index.d.ts.map