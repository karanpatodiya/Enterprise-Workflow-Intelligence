import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { RAGOrchestrationService } from '../integration/rag-orchestration';
import { LLMProvider } from '../integration/llm-provider';
import { AIService } from './ai.service';

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

export class LearningPathService {
  constructor(
    private ragOrchestration: RAGOrchestrationService,
    private llmProvider: LLMProvider
  ) { }

  async generateLearningPath(req: GeneratePathRequest): Promise<any> {
    try {
      logger.info('Generating learning path', { employeeId: req.employeeId, currentRole: req.currentRole });

      // 1. Gather context from RAG about the target role expectations within the company.
      // In local/dev mode without external AI credentials, we gracefully fall back.
      const query = `What are the distinct responsibilities, required skills, and core competencies to achieve true mastery and senior-level impact in a ${req.currentRole} role?`;
      let ragAnswer = '';
      try {
        const ragContext = await this.ragOrchestration.executeRAGQuery({
          employeeId: req.employeeId,
          tenantId: req.tenantId,
          query,
          contextType: 'promotion_analysis',
          filters: { roleLevel: req.currentRole as any },
        });
        ragAnswer = ragContext.answer;
      } catch (error) {
        logger.warn('RAG unavailable, using fallback curriculum context', error as Error);
      }

      const targetedWeaknesses = req.weaknesses?.length ? req.weaknesses : ['General mastery'];

      let modulesData: any[];
      try {
        const roadmap = await AIService.generateLearningPath({
          role: req.currentRole,
          experience: req.yearsOfExperience,
          knownSkills: req.knownSkills,
          weaknesses: targetedWeaknesses,
          profile: req.userProfile,
          skillScores: req.skillScores,
          context: ragAnswer,
        });

        modulesData = roadmap.map((module, index) => {
          const isMCQ = index % 2 === 1;
          const moduleTopics = module.topics.join(', ');
          const practiceSummary = module.practice_tasks.map((task) => `- ${task}`).join('\n');
          const resourceSummary = module.recommended_resources.map((resource) => `- ${resource}`).join('\n');

          return {
            title: module.topic,
            content_markdown: [
              `## ${module.learning_stage}: ${module.topic}`,
              '',
              `### Focus Topics`,
              ...module.topics.map((topic) => `- ${topic}`),
              '',
              `### Practice Tasks`,
              practiceSummary,
              '',
              `### Recommended Resources`,
              resourceSummary,
              '',
              ragAnswer ? `### Company Context\n${ragAnswer}` : '',
            ].filter(Boolean).join('\n'),
            scenario: isMCQ
              ? {
                  exercise_type: 'mcq',
                  scenario_text: `Which action best advances the learner from ${module.learning_stage} to measurable competence in ${module.topic}?`,
                  mcq_options: {
                    A: `Apply ${module.topic} through a scoped exercise with measurable success criteria.`,
                    B: `Read summaries only and avoid hands-on validation.`,
                    C: `Delay any practice until every dependency is perfect.`,
                    D: `Rely on general familiarity instead of targeted repetition.`,
                  },
                  mcq_correct_option: 'A',
                }
              : {
                  exercise_type: 'scenario',
                  scenario_text: `You are applying ${module.topic} in a real workplace situation. Describe your approach, tradeoffs, risks, and expected outcomes using these focus areas: ${moduleTopics}.`,
                  expected_rubric: module.practice_tasks.join('; '),
                },
          };
        });
      } catch (error) {
        logger.warn('AI learning path generation failed, generating fallback curriculum', error as Error);
        modulesData = this.buildFallbackCurriculum(req, ragAnswer);
      }

      if (!Array.isArray(modulesData) || modulesData.length === 0) {
        modulesData = this.buildFallbackCurriculum(req, ragAnswer);
      }

      // 3. Save to database transactionally
      const report = await AIService.generateFinalReport({
        profile: req.userProfile,
        scores: req.skillScores,
        weaknesses: targetedWeaknesses,
        roadmap: modulesData.map((module) => ({ title: module.title, scenario: module.scenario?.exercise_type })),
      });

      const pathId = await this.saveCurriculumToDatabase(req, modulesData, report);

      return { pathId, status: 'success' };
    } catch (error) {
      logger.error('Failed to generate learning path', error as Error);
      throw error;
    }
  }

  private async saveCurriculumToDatabase(req: GeneratePathRequest, modulesData: any[], report: string): Promise<string> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Create Path
      const pathRes = await client.query(
        `INSERT INTO learning_paths (
           employee_id,
           tenant_id,
           target_role,
           source_assessment_result_id,
           profile_snapshot,
           strengths,
           weaknesses,
           ai_summary,
           final_report
         ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          req.employeeId,
          req.tenantId,
          req.currentRole,
          req.sourceAssessmentResultId || null,
          JSON.stringify(req.userProfile || {}),
          JSON.stringify(req.strengths || []),
          JSON.stringify(req.weaknesses || []),
          `AI learning path generated for ${req.currentRole}.`,
          report,
        ]
      );
      const pathId = pathRes.rows[0].id;

      // Create Modules & Scenarios
      for (let i = 0; i < modulesData.length; i++) {
        const mod = modulesData[i];

        const modRes = await client.query(
          `INSERT INTO learning_modules (path_id, title, content_markdown, order_index)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [pathId, mod.title, mod.content_markdown, i]
        );
        const moduleId = modRes.rows[0].id;

        if (mod.scenario) {
          await client.query(
            `INSERT INTO scenario_exercises (module_id, scenario_text, expected_rubric, exercise_type, mcq_options, mcq_correct_option)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              moduleId,
              mod.scenario.scenario_text,
              mod.scenario.expected_rubric || '',
              mod.scenario.exercise_type || 'scenario',
              mod.scenario.mcq_options ? mod.scenario.mcq_options : null,
              mod.scenario.mcq_correct_option || null
            ]
          );
        }
      }

      await client.query('COMMIT');
      return pathId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveLearningPath(employeeId: string, tenantId: string): Promise<any> {
    const pathRes = await db.query(
      `SELECT * FROM learning_paths WHERE employee_id = $1 AND tenant_id = $2 AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1`,
      [employeeId, tenantId]
    );

    if (pathRes.rows.length === 0) return null;
    const path = pathRes.rows[0];

    const modulesRes = await db.query(
      `SELECT m.*, 
        json_build_object(
          'id', s.id, 
          'scenario_text', s.scenario_text, 
          'exercise_type', s.exercise_type,
          'mcq_options', s.mcq_options,
          'user_answer', s.user_answer,
          'grade', s.grade,
          'ai_feedback', s.ai_feedback
        ) as scenario
       FROM learning_modules m
       LEFT JOIN scenario_exercises s ON m.id = s.module_id
       WHERE m.path_id = $1
       ORDER BY m.order_index ASC`,
      [path.id]
    );

    return {
      ...path,
      modules: modulesRes.rows
    };
  }

  async submitScenarioAnswer(exerciseId: string, userAnswer: string): Promise<any> {
    // 1. Fetch scenario and rubric
    const exerciseRes = await db.query(
      `SELECT e.*, m.title FROM scenario_exercises e JOIN learning_modules m ON e.module_id = m.id WHERE e.id = $1`,
      [exerciseId]
    );
    if (exerciseRes.rows.length === 0) throw new Error('Exercise not found');
    const exercise = exerciseRes.rows[0];

    let grading: any;

    if (exercise.exercise_type === 'mcq') {
      const isCorrect = userAnswer === exercise.mcq_correct_option;
      grading = {
        ai_detected: false,
        grade: isCorrect ? 'pass' : 'fail',
        feedback: isCorrect ? 'Correct answer. Excellent choice.' : `Incorrect. The correct answer was ${exercise.mcq_correct_option}.`
      };
    } else {
      // 2. Ask LLM to grade it and detect cheating
      try {
        const result = await AIService.evaluateAnswer(
          exercise.scenario_text,
          userAnswer,
          exercise.expected_rubric || ''
        );
        
        grading = {
          ai_detected: result.ai_detected,
          grade: result.score >= 60 ? 'pass' : 'fail',
          feedback: result.reasoning
        };
      } catch (e) {
        // Fallback grading if provider is unavailable or response is malformed.
        grading = this.fallbackGrade(exercise.expected_rubric, userAnswer);
      }

      // Force failure if AI detected
      if (grading.ai_detected) {
        grading.grade = 'fail';
      }
    }

    // 3. Update database
    await db.query(
      `UPDATE scenario_exercises SET user_answer = $1, grade = $2, ai_feedback = $3 WHERE id = $4`,
      [userAnswer, grading.grade, grading.feedback, exerciseId]
    );

    // If passed, mark module complete
    if (grading.grade === 'pass') {
      await db.query(`UPDATE learning_modules SET status = 'completed' WHERE id = $1`, [exercise.module_id]);
    }

    return grading;
  }

  private buildFallbackCurriculum(req: GeneratePathRequest, ragAnswer: string): any[] {
    const known = new Set(req.knownSkills.map((s) => s.toLowerCase()));
    const coreTopics = [
      'System Design for Scalable Services',
      'Leadership and Cross-Team Communication',
      'Operational Excellence and Incident Response',
    ].filter((topic) => !known.has(topic.toLowerCase()));

    const topics = coreTopics.slice(0, 5);
    while (topics.length < 5) {
      topics.push(`Mastering Advanced ${req.currentRole} Mechanics ${topics.length + 1}`);
    }

    return topics.map((topic, index) => {
      const isMCQ = index % 2 === 1; // Make every other one an MCQ

      return {
        title: topic,
        content_markdown:
          `### ${topic}\n\n` +
          `This module establishes absolute mastery within your role as a **${req.currentRole}** with practical emphasis on execution quality.\n\n` +
          `Focus areas:\n` +
          `- Applying structured decision making under constraints\n` +
          `- Communicating tradeoffs and execution plans clearly\n` +
          `- Delivering outcomes with measurable impact\n\n` +
          (ragAnswer ? `Reference context: ${ragAnswer.substring(0, 500)}\n` : ''),
        scenario: isMCQ ? {
          exercise_type: 'mcq',
          scenario_text: `You are evaluating a critical tradeoff for "${topic}". Which of the following approaches is generally recommended for maximizing scalable impact?`,
          mcq_options: {
            A: 'Focus solely on immediate delivery speed, ignoring technical debt.',
            B: 'Implement the most complex architecture possible to handle all future edge cases.',
            C: 'Balance short-term delivery with sustainable architecture, carefully documenting tradeoffs.',
            D: 'Delegate the decision entirely to an external consultant.'
          },
          mcq_correct_option: 'C'
        } : {
          exercise_type: 'scenario',
          scenario_text:
            `You are leading a high-impact initiative related to "${topic}". Describe your approach, key decisions, risk handling, and success criteria.`,
          expected_rubric:
            'Clear problem framing; prioritized plan; explicit tradeoffs; risk mitigation; measurable outcomes',
        },
        order_index: index,
      }
    });
  }

  private fallbackGrade(expectedRubric: string, userAnswer: string): { grade: 'pass' | 'fail'; feedback: string; ai_detected: boolean } {
    const answer = (userAnswer || '').trim();
    const answerLower = answer.toLowerCase();
    const wordCount = answer.split(/\s+/).filter(Boolean).length;

    // Very basic heuristic for anti-cheat
    const aiPhrases = [
      'certainly, i can help',
      'as an ai',
      'as a language model',
      'in summary',
      'in conclusion',
      'it is important to note',
      'delve into',
      'multifaceted',
      'paramount',
      'crucial',
      'testament',
      'foster',
      'comprehensive'
    ];
    const isAi = aiPhrases.some((phrase) => answerLower.includes(phrase));

    if (isAi || wordCount > 300) {
      return {
        ai_detected: true,
        grade: 'fail',
        feedback: 'AI generated response detected. Please answer in your own words with concise, strategic insight.',
      };
    }

    const keySignals = [
      'risk',
      'tradeoff',
      'impact',
      'measure',
      'outcome',
      'plan',
      'stakeholder',
      'mitigation',
      'decision',
      'communication',
    ];
    const signalMatches = keySignals.filter((signal) => answerLower.includes(signal)).length;

    // Local fallback should be user-friendly:
    // pass when response is substantive and demonstrates at least some structured reasoning.
    const pass = wordCount >= 20 && signalMatches >= 2;

    if (pass) {
      return {
        ai_detected: false,
        grade: 'pass',
        feedback: 'Your response covers key rubric expectations with sufficient depth and structure.',
      };
    }

    return {
      ai_detected: false,
      grade: 'fail',
      feedback:
        'Please provide a bit more detail. Include your plan, key tradeoffs, risks, and at least one measurable outcome.',
    };
  }
}
