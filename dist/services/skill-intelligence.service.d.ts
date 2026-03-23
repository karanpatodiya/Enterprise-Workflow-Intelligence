import { SkillDelta, PromotionReadinessAnalysis, SkillRisk, RoleLevel } from '../domain';
export declare class SkillIntelligenceService {
    private scoringModel;
    constructor();
    calculateSkillDeltas(employeeId: string, tenantId: string, targetRoleLevel: RoleLevel): Promise<SkillDelta[]>;
    analyzePromotionReadiness(employeeId: string, tenantId: string, targetRoleLevel: RoleLevel): Promise<PromotionReadinessAnalysis>;
    calculateSkillRisk(employeeId: string, tenantId: string): Promise<SkillRisk>;
    private getEmployeeSkillProfile;
    private getRoleCompetencyProfile;
    private calculateReadinessScore;
    private categorizeReadiness;
    private calculateConcentrationRisk;
    private calculateRiskScore;
    private categorizeRisk;
    private estimateGapClosureDays;
    private calculateRecencyFactor;
    private identifyStrengths;
    private determineDevelopmentPriority;
    private identifyRiskFactors;
    private generateRecommendations;
    private getActiveModelOrDefault;
}
//# sourceMappingURL=skill-intelligence.service.d.ts.map