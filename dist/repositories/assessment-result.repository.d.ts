import { EmployeeAssessmentResult } from '../domain';
export declare class AssessmentResultRepository {
    findById(resultId: string, tenantId: string): Promise<EmployeeAssessmentResult | null>;
    findByEmployee(employeeId: string, tenantId: string): Promise<EmployeeAssessmentResult[]>;
    findByAssessment(assessmentId: string): Promise<EmployeeAssessmentResult[]>;
    findInProgress(employeeId: string): Promise<EmployeeAssessmentResult | null>;
    findCompletedBySkill(employeeId: string, skillId: string): Promise<EmployeeAssessmentResult[]>;
    create(result: Omit<EmployeeAssessmentResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeAssessmentResult>;
    update(resultId: string, tenantId: string, updates: Partial<EmployeeAssessmentResult>): Promise<EmployeeAssessmentResult>;
    getAggregateStats(skillId: string, tenantId: string): Promise<any>;
    private mapToAssessmentResult;
}
//# sourceMappingURL=assessment-result.repository.d.ts.map