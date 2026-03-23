import { EmployeeAssessmentResult, Assessment, AssessmentAnswer, ScoringMethod } from '../domain';
import { AssessmentResultRepository } from '../repositories/assessment-result.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { AIService, UserProfile, GeneratedQuestion as AIQuestion } from './ai.service';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';

interface AssessmentExecutionContext {
  assessmentId: string;
  employeeId: string;
  tenantId: string;
  assessment: Assessment;
}

interface ScoringInput {
  assessment: Assessment;
  answers: AssessmentAnswer[];
  scoringMethod: ScoringMethod;
  retryCount: number;
}

interface ScoringOutput {
  score: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  feedback: string;
  normalizedAnswers: AssessmentAnswer[];
}

// --- Question type definitions ---
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

// Question type distributions per role nature
const TECHNICAL_DISTRIBUTION: Record<QuestionType, number> = {
  Scenario: 0.30,
  Debug: 0.25,
  ShortAnswer: 0.20,
  CaseStudy: 0.15,
  MCQ: 0.10,
  Ranking: 0,
};

const BUSINESS_DISTRIBUTION: Record<QuestionType, number> = {
  Scenario: 0.40,
  CaseStudy: 0.25,
  Ranking: 0.20,
  MCQ: 0.15,
  Debug: 0,
  ShortAnswer: 0,
};

export class AssessmentEngineService {
  constructor(
    private assessmentResultRepository: AssessmentResultRepository,
    private employeeRepository: EmployeeRepository
  ) {}

  async startAssessment(
    employeeId: string,
    assessmentId: string,
    tenantId: string
  ): Promise<EmployeeAssessmentResult> {
    try {
      logger.info('Starting assessment', {
        employeeId,
        assessmentId,
        tenantId,
      });

      // Check for existing in-progress assessment
      const existingInProgress = await this.assessmentResultRepository.findInProgress(employeeId);
      if (existingInProgress) {
        logger.warn('Employee has in-progress assessment', {
          existingAssessmentId: existingInProgress.id,
        });
        return existingInProgress;
      }

      const result: EmployeeAssessmentResult = {
        id: uuidv4(),
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
    } catch (error) {
      logger.error('Assessment start failed', error as Error);
      throw error;
    }
  }

  async submitAnswers(
    resultId: string,
    tenantId: string,
    answers: AssessmentAnswer[],
    assessment: Assessment,
    completionTimeSeconds: number
  ): Promise<EmployeeAssessmentResult> {
    try {
      logger.info('Submitting assessment answers', {
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
      const aiFeedback = await this.generateAIFeedback(
        assessment,
        scoringOutput,
        answers
      );

      // Update result
      const updatedResult = await this.assessmentResultRepository.update(
        resultId,
        tenantId,
        {
          completedAt: new Date(),
          score: scoringOutput.score,
          maxScore: scoringOutput.maxScore,
          percentageScore: scoringOutput.percentageScore,
          passed: scoringOutput.passed,
          answers: scoringOutput.normalizedAnswers,
          feedbackAIGenerated: aiFeedback,
          status: 'completed',
          completionTimeSeconds,
        }
      );

      logger.info('Assessment completed', {
        resultId,
        score: scoringOutput.score,
        maxScore: scoringOutput.maxScore,
        passed: scoringOutput.passed,
      });

      return updatedResult;
    } catch (error) {
      logger.error('Answer submission failed', error as Error);
      throw error;
    }
  }

  private async scoreAnswers(input: ScoringInput): Promise<ScoringOutput> {
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

  private scoreObjective(
    answers: AssessmentAnswer[],
    assessment: Assessment,
    maxScore: number
  ): ScoringOutput {
    let score = 0;
    const normalizedAnswers = answers.map((answer) => {
      const isCorrect =
        answer.answer?.toLowerCase().trim() ===
        (answer as any).correctAnswer?.toLowerCase().trim();
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

  private async scoreRubricBased(
    answers: AssessmentAnswer[],
    assessment: Assessment,
    maxScore: number
  ): Promise<ScoringOutput> {
    let score = 0;
    const normalizedAnswers: AssessmentAnswer[] = [];

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

  private async scoreAIAssisted(
    answers: AssessmentAnswer[],
    assessment: Assessment,
    maxScore: number
  ): Promise<ScoringOutput> {
    let score = 0;
    const normalizedAnswers: AssessmentAnswer[] = [];

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

  private async evaluateAgainstRubric(answer: AssessmentAnswer): Promise<number> {
    return answer.maxPoints * 0.8;
  }

  private async scoreWithAI(
    answer: AssessmentAnswer,
    assessment: Assessment
  ): Promise<number> {
    try {
      const { score } = await AIService.evaluateAnswer(
        `Part of assessment: ${assessment.name}. Question ID: ${answer.questionId}`,
        answer.answer || '',
        'Score accurately based on professional standards.'
      );
      // Normalized to assessment points (AIService returns 0-100)
      return (score / 100) * answer.maxPoints;
    } catch (error) {
      logger.warn('AI scoring failed, using default', error as Error);
      return answer.maxPoints * 0.5;
    }
  }

  private async generateAIFeedback(
    assessment: Assessment,
    scoringOutput: ScoringOutput,
    answers: AssessmentAnswer[]
  ): Promise<string> {
    try {
      // Use AIService to generate final summary or specific feedback
      const report = await AIService.generateFinalReport({
        profile: { name: 'Employee', experience: 5, category: 'Domain', role: assessment.name, known_skills: [], goal_role: '' },
        scores: { overall: scoringOutput.percentageScore },
        weaknesses: [],
        roadmap: []
      });
      return report.slice(0, 300); // Truncate for feedback field
    } catch (error) {
      logger.warn('AI feedback generation failed', error as Error);
      return `Your assessment result is ${scoringOutput.percentageScore.toFixed(1)}%. ${
        scoringOutput.passed
          ? 'Congratulations on passing!'
          : 'Please review the material and try again.'
      }`;
    }
  }

  // =====================================================================
  //  DYNAMIC MULTI-TYPE ASSESSMENT GENERATION
  // =====================================================================

  /**
   * Determine whether a category is 'technical' or 'business' based on its name.
   * Used as a fallback when the DB role_type column is not yet populated.
   */
  determineRoleNature(categoryName: string): RoleNature {
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
  getQuestionDistribution(roleNature: RoleNature, totalCount: number): Record<QuestionType, number> {
    const dist = roleNature === 'technical' ? TECHNICAL_DISTRIBUTION : BUSINESS_DISTRIBUTION;
    const result: Record<string, number> = {};
    let assigned = 0;

    const entries = Object.entries(dist).filter(([, pct]) => pct > 0);
    for (let i = 0; i < entries.length; i++) {
      const [type, pct] = entries[i];
      if (i === entries.length - 1) {
        // Last type gets the remainder
        result[type] = totalCount - assigned;
      } else {
        const count = Math.round(totalCount * pct);
        result[type] = count;
        assigned += count;
      }
    }

    return result as Record<QuestionType, number>;
  }

  /**
   * Generate a mixed-type adaptive assessment for a specific role.
   */
  async generateAdaptiveAssessment(
    categoryName: string,
    roleName: string,
    expectedSkills: string[],
    experienceLevel: string,
    count: number = 15,
    roleNature?: RoleNature
  ): Promise<GeneratedQuestion[]> {
    try {
      const nature = roleNature || this.determineRoleNature(categoryName);
      const aiQuestions = await AIService.generateQuestions(roleName, experienceLevel === 'Senior' ? 8 : 3, expectedSkills);
      
      const questions: GeneratedQuestion[] = aiQuestions.map(q => ({
        id: uuidv4(),
        question_type: q.question_type as QuestionType,
        subskill: q.skill_tag,
        question_text: q.question,
        difficulty: experienceLevel.toLowerCase(),
        options: q.options,
        correct_answer: q.correct_answer,
        answer_guidance: q.answer_guidance,
        explanation: 'AI generated question'
      }));

      return questions;
    } catch (error) {
      logger.error('Failed to generate adaptive assessment, using fallback', error as Error);
      const nature = roleNature || this.determineRoleNature(categoryName);
      const distribution = this.getQuestionDistribution(nature, count);
      return this.buildFallbackQuestions(categoryName, roleName, expectedSkills, experienceLevel, count, nature, distribution);
    }
  }

  /**
   * Build fallback questions when LLM is unavailable.
   */
  private buildFallbackQuestions(
    categoryName: string,
    roleName: string,
    expectedSkills: string[],
    experienceLevel: string,
    count: number,
    roleNature: RoleNature,
    distribution: Record<QuestionType, number>
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    let qIndex = 0;

    for (const [type, typeCount] of Object.entries(distribution)) {
      if (typeCount <= 0) continue;

      for (let i = 0; i < typeCount; i++) {
        const skill = expectedSkills[qIndex % expectedSkills.length] || 'General';
        const qType = type as QuestionType;

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
        } else if (qType === 'Scenario') {
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
        } else if (qType === 'Debug') {
          questions.push({
            id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
            question_type: 'Debug',
            subskill: skill,
            question_text: `Review the following situation: A ${roleName} has implemented a solution involving ${skill}, but users are reporting intermittent failures. The logs show no errors but response times have doubled. Identify at least three possible causes and explain how you would systematically narrow down the root cause.`,
            difficulty: 'advanced',
            answer_guidance: `Should identify potential causes (resource contention, configuration issues, dependency failures), describe a systematic debugging methodology, and propose monitoring improvements.`
          });
        } else if (qType === 'ShortAnswer') {
          questions.push({
            id: `fallback-${qType.toLowerCase()}-${qIndex}-${Date.now()}`,
            question_type: 'ShortAnswer',
            subskill: skill,
            question_text: `Explain the key principles of ${skill} and why they are critical for a ${roleName} operating at the ${experienceLevel} level. Be concise (3-5 sentences).`,
            difficulty: 'intermediate',
            answer_guidance: `Should demonstrate understanding of core principles, practical application, and awareness of how this skill impacts the broader ${categoryName} domain.`
          });
        } else if (qType === 'CaseStudy') {
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
        } else if (qType === 'Ranking') {
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
  analyzeSkillMaturity(skillScores: Array<{ subskill: string; score: number }>): SkillMaturityEntry[] {
    return skillScores.map(s => ({
      skill: s.subskill,
      score: s.score,
      maturity: s.score >= 80 ? 'Expert' as const
        : s.score >= 60 ? 'Proficient' as const
        : s.score >= 40 ? 'Developing' as const
        : 'Foundational' as const
    }));
  }

  /**
   * Generate adaptive learning recommendations for weak skills.
   */
  async generateLearningRecommendations(
    weakSkills: string[],
    roleName: string
  ): Promise<LearningRecommendation[]> {
    if (weakSkills.length === 0) return [];

    try {
      const recommendations = await AIService.generateLearningPath(weakSkills);
      return recommendations.map(r => ({
        topic: r.topic,
        description: `${r.learning_stage}: ${r.topics.join(', ')}`,
        resource: r.recommended_resources.join(' | '),
        practice_task: r.practice_tasks.join(' | ')
      }));
    } catch (error) {
      logger.warn('Failed to generate learning recommendations via LLM, using fallback', error as Error);
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
  async scoreOpenEndedAnswer(
    questionText: string,
    questionType: QuestionType,
    userAnswer: string,
    answerGuidance: string,
    skillTag: string
  ): Promise<{ score: number; feedback: string }> {
    try {
      const { score, reasoning } = await AIService.evaluateAnswer(
        questionText,
        userAnswer,
        `Type: ${questionType}\nGuidance: ${answerGuidance}\nSkill: ${skillTag}`
      );
      return { score, feedback: reasoning }; 
    } catch (error) {
      logger.warn('AI open-ended scoring failed, using heuristic fallback', error as Error);
      return this.heuristicScoreOpenEnded(userAnswer, answerGuidance);
    }
  }

  /**
   * Heuristic fallback for scoring open-ended answers when AI is unavailable.
   */
  private heuristicScoreOpenEnded(userAnswer: string, answerGuidance: string): { score: number; feedback: string } {
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

    let score: number;
    let feedback: string;

    if (matchRatio >= 0.5 && wordCount >= 40) {
      score = 75;
      feedback = 'Your answer demonstrates solid understanding and covers most key points. Consider adding more specific examples.';
    } else if (matchRatio >= 0.3 && wordCount >= 25) {
      score = 55;
      feedback = 'Your answer addresses some key points but lacks depth in key areas. Expand on your reasoning and provide concrete examples.';
    } else if (matchRatio >= 0.15 && wordCount >= 15) {
      score = 35;
      feedback = 'Your answer touches on the topic but misses several critical aspects. Review the core concepts and try to be more thorough.';
    } else {
      score = 20;
      feedback = 'Your answer does not sufficiently address the question. Focus on the specific aspects asked and provide structured reasoning.';
    }

    return { score, feedback };
  }

  // =====================================================================
  //  INTELLIGENCE REPORT (enhanced)
  // =====================================================================

  async generateSkillIntelligenceReport(
    roleName: string,
    scorePercentage: number,
    strengths: string[],
    weaknesses: string[],
    skillMaturity?: SkillMaturityEntry[]
  ): Promise<string> {
    try {
      const report = await AIService.generateFinalReport({
        profile: { role: roleName },
        scores: { percentage: scorePercentage, maturity: skillMaturity },
        strengths,
        weaknesses,
        roadmap: []
      });
      return report;
    } catch (error) {
      logger.error('Failed to generate intelligence report, using fallback', error as Error);
      return `Executive Summary: Based on our algorithmic evaluation, the candidate achieved ${scorePercentage}% proficiency in the ${roleName} role capabilities. Demonstrated competencies include ${strengths.length > 0 ? strengths.join(', ') : 'general entry-level concepts'}.\n\nStrategic Recommendation: We strongly recommend focused programmatic remediation on ${weaknesses.length > 0 ? weaknesses.join(', ') : 'advanced tier topics'} to achieve full enterprise mastery and cross-functional impact required for this role.`;
    }
  }
}
