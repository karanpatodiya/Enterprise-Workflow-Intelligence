import { AnalyticsSnapshot } from '../domain';
export declare class AnalyticsEngineService {
    generateAnalyticsSnapshot(tenantId: string): Promise<AnalyticsSnapshot>;
    private calculateTeamReadinessScores;
    private calculateDepartmentRiskClusters;
    private calculatePromotionPipelineMetrics;
    private calculatePromotionVelocity;
    private categorizeAggregateRisk;
    private generateExecutiveRecommendations;
    cacheAnalyticsSnapshot(snapshot: AnalyticsSnapshot): Promise<void>;
    getLatestSnapshot(tenantId: string): Promise<AnalyticsSnapshot | null>;
    private parseJsonField;
}
//# sourceMappingURL=analytics-engine.service.d.ts.map