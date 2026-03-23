import {
  SkillDelta,
  PromotionReadinessAnalysis,
  SkillRisk,
  RoleLevel,
  ProficiencyLevel,
  SkillScoringModel,
  ScoringWeights,
  AtRiskSkill,
} from '../domain';
import { db } from '../config/database';
import { logger } from '../config/logger';

interface EmployeeSkillProfile {
  employeeId: string;
  skills: {
    skillId: string;
    skillName: string;
    currentLevel: ProficiencyLevel;
    yearsOfExperience: number;
    assessmentScores: number[];
    lastAssessmentDate: Date;
  }[];
}

interface RoleCompetencyProfile {
  roleLevel: RoleLevel;
  requiredSkills: {
    skillId: string;
    skillName: string;
    requiredLevel: ProficiencyLevel;
    weight: number;
  }[];
}

export class SkillIntelligenceService {
  private scoringModel: SkillScoringModel;

  constructor() {
    this.scoringModel = this.getActiveModelOrDefault();
  }

  async calculateSkillDeltas(
    employeeId: string,
    tenantId: string,
    targetRoleLevel: RoleLevel
  ): Promise<SkillDelta[]> {
    try {
      logger.info('Calculating skill deltas', {
        employeeId,
        targetRoleLevel,
      });

      // Get employee skill profile
      const employeeProfile = await this.getEmployeeSkillProfile(employeeId, tenantId);

      // Get required competencies for role
      const roleProfile = await this.getRoleCompetencyProfile(targetRoleLevel, tenantId);

      const deltas: SkillDelta[] = [];

      // Calculate gaps
      for (const requiredSkill of roleProfile.requiredSkills) {
        const employeeSkill = employeeProfile.skills.find(
          (s) => s.skillId === requiredSkill.skillId
        );

        const currentLevel = employeeSkill?.currentLevel || (1 as ProficiencyLevel);
        const gap = requiredSkill.requiredLevel - currentLevel;

        if (gap > 0) {
          deltas.push({
            skillId: requiredSkill.skillId,
            currentProficiencyLevel: currentLevel,
            requiredProficiencyLevel: requiredSkill.requiredLevel,
            gapDays: this.estimateGapClosureDays(gap, employeeSkill?.yearsOfExperience || 0),
            assessmentEvidenceCount: employeeSkill?.assessmentScores.length || 0,
            lastAssessmentDate: employeeSkill?.lastAssessmentDate || new Date(),
          });
        }
      }

      logger.debug('Skill deltas calculated', {
        employeeId,
        deltaCount: deltas.length,
      });

      return deltas;
    } catch (error) {
      logger.error('Skill delta calculation failed', error as Error);
      throw error;
    }
  }

  async analyzePromotionReadiness(
    employeeId: string,
    tenantId: string,
    targetRoleLevel: RoleLevel
  ): Promise<PromotionReadinessAnalysis> {
    try {
      logger.info('Analyzing promotion readiness', {
        employeeId,
        targetRoleLevel,
      });

      const skillDeltas = await this.calculateSkillDeltas(
        employeeId,
        tenantId,
        targetRoleLevel
      );

      const employeeProfile = await this.getEmployeeSkillProfile(employeeId, tenantId);
      const roleProfile = await this.getRoleCompetencyProfile(targetRoleLevel, tenantId);

      // Calculate readiness score
      const readinessScore = this.calculateReadinessScore(
        skillDeltas,
        employeeProfile,
        roleProfile
      );

      // Categorize readiness
      const readinessCategory = this.categorizeReadiness(readinessScore);

      // Identify strengths
      const strengths = this.identifyStrengths(employeeProfile, roleProfile);

      // Identify development areas
      const developmentAreas = skillDeltas.map((delta) => ({
        skillId: delta.skillId,
        skillName: roleProfile.requiredSkills.find((s) => s.skillId === delta.skillId)
          ?.skillName || 'Unknown',
        currentLevel: delta.currentProficiencyLevel,
        requiredLevel: delta.requiredProficiencyLevel,
        developmentPriority: this.determineDevelopmentPriority(delta),
      }));

      // Calculate timeline
      const timelineToReadiness = Math.max(
        ...skillDeltas.map((d) => d.gapDays),
        0
      );

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(employeeId, skillDeltas, developmentAreas);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        employeeProfile,
        skillDeltas,
        developmentAreas
      );

      const analysis: PromotionReadinessAnalysis = {
        employeeId,
        targetRoleLevel,
        readinessScore,
        readinessCategory,
        skillGaps: skillDeltas,
        strengths,
        developmentAreas,
        timelineToReadiness,
        riskFactors,
        recommendations,
        analysisDate: new Date(),
        modelVersion: this.scoringModel.version,
      };

      logger.info('Promotion readiness analysis complete', {
        employeeId,
        readinessScore,
        readinessCategory,
      });

      return analysis;
    } catch (error) {
      logger.error('Promotion readiness analysis failed', error as Error);
      throw error;
    }
  }

  async calculateSkillRisk(
    employeeId: string,
    tenantId: string
  ): Promise<SkillRisk> {
    try {
      logger.info('Calculating skill risk', { employeeId });

      const result = await db.query(
        `SELECT es.skill_id, s.name, es.last_assessment_date, es.proficiency_level, es.years_of_experience
         FROM employee_skills es
         JOIN skills s ON es.skill_id = s.id
         WHERE es.employee_id = $1`,
        [employeeId]
      );

      const skills = result.rows;
      const atRiskSkills: AtRiskSkill[] = [];
      let concentrationRisk = 0;

      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const skill of skills) {
        const lastAssessmentDate = new Date(skill.last_assessment_date);
        const daysSinceAssessment = Math.floor(
          (today.getTime() - lastAssessmentDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceAssessment > 365) {
          atRiskSkills.push({
            skillId: skill.skill_id,
            skillName: skill.name,
            riskReason: 'No assessment in 12 months',
            daysWithoutAssessment: daysSinceAssessment,
            riskLevel: daysSinceAssessment > 730 ? 'critical' : 'high',
          });
        } else if (daysSinceAssessment > 180) {
          atRiskSkills.push({
            skillId: skill.skill_id,
            skillName: skill.name,
            riskReason: 'No recent assessment',
            daysWithoutAssessment: daysSinceAssessment,
            riskLevel: 'medium',
          });
        }
      }

      // Calculate concentration risk (how concentrated are their skills)
      concentrationRisk = this.calculateConcentrationRisk(skills);

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(
        atRiskSkills,
        concentrationRisk,
        skills.length
      );

      const riskCategory = this.categorizeRisk(riskScore);

      const skillRisk: SkillRisk = {
        employeeId,
        riskScore,
        riskCategory,
        atRiskSkills,
        concentrationRisk,
        lastApprovedUpdate: new Date(),
        updateDueDate: new Date(
          new Date().getTime() + 90 * 24 * 60 * 60 * 1000
        ), // 90 days
      };

      logger.debug('Skill risk calculated', {
        employeeId,
        riskScore,
        riskCategory,
      });

      return skillRisk;
    } catch (error) {
      logger.error('Skill risk calculation failed', error as Error);
      throw error;
    }
  }

  private async getEmployeeSkillProfile(
    employeeId: string,
    tenantId: string
  ): Promise<EmployeeSkillProfile> {
    const result = await db.query(
      `SELECT es.skill_id, s.name, es.proficiency_level, es.years_of_experience, es.assessment_scores, es.last_assessment_date
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       JOIN employees e ON es.employee_id = e.id
       WHERE es.employee_id = $1 AND e.tenant_id = $2`,
      [employeeId, tenantId]
    );

    return {
      employeeId,
      skills: result.rows.map((row) => ({
        skillId: row.skill_id,
        skillName: row.name,
        currentLevel: row.proficiency_level as ProficiencyLevel,
        yearsOfExperience: row.years_of_experience,
        assessmentScores: row.assessment_scores || [],
        lastAssessmentDate: row.last_assessment_date,
      })),
    };
  }

  private async getRoleCompetencyProfile(
    roleLevel: RoleLevel,
    tenantId: string
  ): Promise<RoleCompetencyProfile> {
    const result = await db.query(
      `SELECT rc.skill_id, s.name, rc.required_proficiency_level, rc.weight
       FROM role_competencies rc
       JOIN skills s ON rc.skill_id = s.id
       WHERE rc.role_level = $1 AND rc.tenant_id = $2`,
      [roleLevel, tenantId]
    );

    return {
      roleLevel,
      requiredSkills: result.rows.map((row) => ({
        skillId: row.skill_id,
        skillName: row.name,
        requiredLevel: row.required_proficiency_level as ProficiencyLevel,
        weight: row.weight,
      })),
    };
  }

  private calculateReadinessScore(
    skillDeltas: SkillDelta[],
    employeeProfile: EmployeeSkillProfile,
    roleProfile: RoleCompetencyProfile
  ): number {
    if (roleProfile.requiredSkills.length === 0) return 100;

    let weightedScore = 0;
    let totalWeight = 0;

    for (const requiredSkill of roleProfile.requiredSkills) {
      const delta = skillDeltas.find((d) => d.skillId === requiredSkill.skillId);
      const employeeSkill = employeeProfile.skills.find(
        (s) => s.skillId === requiredSkill.skillId
      );

      // Calculate proficiency score
      const currentLevel = employeeSkill?.currentLevel || 1;
      const proficiencyScore = Math.min(
        (currentLevel / requiredSkill.requiredLevel) * 100,
        100
      );

      // Apply assessment recency factor
      const recencyFactor = this.calculateRecencyFactor(
        employeeSkill?.lastAssessmentDate
      );

      // Combine scores
      const skillScore = proficiencyScore * recencyFactor;
      weightedScore += skillScore * requiredSkill.weight;
      totalWeight += requiredSkill.weight;
    }

    return Math.round(weightedScore / totalWeight);
  }

  private categorizeReadiness(score: number): 'not-ready' | 'developing' | 'ready' | 'ready-plus' {
    if (score >= 95) return 'ready-plus';
    if (score >= 80) return 'ready';
    if (score >= 60) return 'developing';
    return 'not-ready';
  }

  private calculateConcentrationRisk(skills: any[]): number {
    if (skills.length === 0) return 0;

    // Calculate how concentrated the skill scores are using coefficient of variation
    const levels = skills.map((s) => s.proficiency_level);
    const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
    const variance =
      levels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / levels.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation

    // Return as concentration score (0-1)
    return Math.min(cv / 2, 1);
  }

  private calculateRiskScore(
    atRiskSkills: any[],
    concentrationRisk: number,
    totalSkills: number
  ): number {
    const atRiskPercentage = (atRiskSkills.length / Math.max(totalSkills, 1)) * 100;
    const riskScore = atRiskPercentage * 0.6 + concentrationRisk * 100 * 0.4;
    return Math.min(100, riskScore);
  }

  private categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private estimateGapClosureDays(gapLevels: number, yearsOfExperience: number): number {
    // Estimate based on gap size and experience
    const baseDaysPerLevel = 30; // 30 days per proficiency level
    const experienceFactor = Math.max(0.5, Math.min(1.5, yearsOfExperience / 5));
    return Math.round(gapLevels * baseDaysPerLevel / experienceFactor);
  }

  private calculateRecencyFactor(lastAssessmentDate?: Date): number {
    if (!lastAssessmentDate) return 0.5;

    const daysSinceAssessment = Math.floor(
      (new Date().getTime() - lastAssessmentDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceAssessment < 30) return 1.0;
    if (daysSinceAssessment < 90) return 0.9;
    if (daysSinceAssessment < 180) return 0.7;
    if (daysSinceAssessment < 365) return 0.5;
    return 0.3;
  }

  private identifyStrengths(
    employeeProfile: EmployeeSkillProfile,
    roleProfile: RoleCompetencyProfile
  ) {
    return employeeProfile.skills
      .filter((skill) => {
        const requiredSkill = roleProfile.requiredSkills.find(
          (rs) => rs.skillId === skill.skillId
        );
        return requiredSkill && skill.currentLevel >= requiredSkill.requiredLevel;
      })
      .map((skill) => ({
        skillId: skill.skillId,
        skillName: skill.skillName,
        proficiencyLevel: skill.currentLevel,
        overMasteryFactor: 1.2,
      }));
  }

  private determineDevelopmentPriority(delta: SkillDelta): 'critical' | 'high' | 'medium' | 'low' {
    if (delta.gapDays <= 30) return 'critical';
    if (delta.gapDays <= 90) return 'high';
    if (delta.gapDays <= 180) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(
    employeeId: string,
    skillDeltas: SkillDelta[],
    developmentAreas: any[]
  ): string[] {
    const risks: string[] = [];

    if (skillDeltas.length > 5) {
      risks.push('Multiple significant skill gaps identified');
    }

    const criticalGaps = developmentAreas.filter((da) => da.developmentPriority === 'critical');
    if (criticalGaps.length > 0) {
      risks.push(`Critical skill gaps in: ${criticalGaps.map((dca) => dca.skillName).join(', ')}`);
    }

    return risks;
  }

  private generateRecommendations(
    employeeProfile: EmployeeSkillProfile,
    skillDeltas: SkillDelta[],
    developmentAreas: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Sort by development priority
    const prioritized = [...developmentAreas].sort((a, b) => {
      const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
      return priorityMap[a.developmentPriority] - priorityMap[b.developmentPriority];
    });

    // Top 3 recommendations
    for (let i = 0; i < Math.min(3, prioritized.length); i++) {
      const area = prioritized[i];
      recommendations.push(
        `Develop ${area.skillName} from level ${area.currentLevel} to level ${area.requiredLevel}`
      );
    }

    if (developmentAreas.length === 0) {
      recommendations.push('Continue current skill development trajectory');
    }

    return recommendations;
  }

  private getActiveModelOrDefault(): SkillScoringModel {
    return {
      version: '1.0',
      name: 'Default Skill Scoring Model',
      algorithmDescription:
        'Weighted proficiency+recency+experience-based scoring model',
      weights: {
        assessmentScore: 0.4,
        experienceYears: 0.2,
        assessmentRecency: 0.25,
        assessmentFrequency: 0.1,
        roleRelevance: 0.05,
      },
      calibrationFactors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
  }
}
