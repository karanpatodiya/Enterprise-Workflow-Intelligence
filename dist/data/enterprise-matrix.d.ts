export interface SkillDef {
    name: string;
    expected_proficiency: number;
}
export interface EnterpriseRole {
    slug: string;
    name: string;
    level: string;
    description: string;
    skills: SkillDef[];
}
export interface EnterpriseCategory {
    slug: string;
    name: string;
    description: string;
    role_type: 'technical' | 'business';
    roles: EnterpriseRole[];
}
export declare const ENTERPRISE_MATRIX: EnterpriseCategory[];
//# sourceMappingURL=enterprise-matrix.d.ts.map