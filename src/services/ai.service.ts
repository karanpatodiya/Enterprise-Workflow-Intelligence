import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

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

const DEFAULT_MODEL = 'gemini-1.5-flash';

class GeminiWorkflowClient {
  private genAI?: GoogleGenerativeAI;
  private model?: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY is not configured. AI workflows will use fallbacks.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  }

  isConfigured(): boolean {
    return Boolean(this.model);
  }

  async prompt(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini model is not configured');
    }

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}

const client = new GeminiWorkflowClient();

function extractJsonBlock(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  const arrayMatch = text.match(/\[[\s\S]*\]/);

  if (!objectMatch && !arrayMatch) {
    return text.trim();
  }

  if (!objectMatch) {
    return arrayMatch![0];
  }

  if (!arrayMatch) {
    return objectMatch[0];
  }

  return objectMatch.index! < arrayMatch.index! ? objectMatch[0] : arrayMatch[0];
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const normalized = extractJsonBlock(text);
    return JSON.parse(normalized) as T;
  } catch (error) {
    logger.warn('Failed to parse Gemini JSON response', {
      error: (error as Error).message,
      preview: text.slice(0, 300),
    });
    return fallback;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeGeneratedQuestions(input: unknown): GeneratedQuestion[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: GeneratedQuestion[] = [];

  for (const item of input) {
      const row = item as Record<string, unknown>;
      const type = String(row.question_type || '').trim();
      const normalizedType =
        type === 'scenario' || type === 'debugging' || type === 'short_explanation' || type === 'MCQ'
          ? (type as GeneratedQuestion['question_type'])
          : type.toLowerCase() === 'mcq'
            ? 'MCQ'
            : type.toLowerCase() === 'short answer'
              ? 'short_explanation'
              : null;

      if (!normalizedType || typeof row.question !== 'string' || typeof row.skill_tag !== 'string') {
        continue;
      }

      const options =
        row.options && typeof row.options === 'object' && !Array.isArray(row.options)
          ? (row.options as Record<string, string>)
          : undefined;

      normalized.push({
        question: row.question.trim(),
        question_type: normalizedType,
        skill_tag: row.skill_tag.trim(),
        options,
        correct_answer: typeof row.correct_answer === 'string' ? row.correct_answer.trim() : undefined,
        answer_guidance: typeof row.answer_guidance === 'string' ? row.answer_guidance.trim() : undefined,
      });
    }

  return normalized;
}

function buildDifficulty(profile: UserProfile): SkillAnalysisResult['difficulty'] {
  if (profile.experience >= 8) return 'Advanced';
  if (profile.experience >= 3) return 'Intermediate';
  return 'Foundational';
}

export class AIService {
  static async analyzeProfile(profile: UserProfile): Promise<string[]> {
    const analysis = await this.analyzeSkills(profile);
    return analysis.skills_to_assess || profile.known_skills.slice(0, 6);
  }

  static async analyzeSkills(input: UserProfile | { role: string; scores: Record<string, number> }): Promise<SkillAnalysisResult> {
    if ('scores' in input) {
      return this.analyzeSkillGaps(input.scores, input.role);
    }

    const fallback: SkillAnalysisResult = {
      strengths: [],
      weaknesses: [],
      maturity_level: 'Developing',
      summary: 'Profile-based assessment initialization fallback.',
      difficulty: buildDifficulty(input),
      skills_to_assess: input.known_skills.slice(0, 6),
    };

    const prompt = `
You are designing an AI-driven workforce assessment.

Analyze this user profile and identify the key skills that should be evaluated.

Profile:
${JSON.stringify(input, null, 2)}

Return ONLY valid JSON with this structure:
{
  "skills_to_assess": ["skill 1", "skill 2"],
  "difficulty": "Foundational" | "Intermediate" | "Advanced",
  "summary": "short explanation"
}
`;

    try {
      const response = await client.prompt(prompt);
      const parsed = parseJson<Partial<SkillAnalysisResult>>(response, fallback);
      const skills = Array.isArray(parsed.skills_to_assess)
        ? parsed.skills_to_assess.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
        : fallback.skills_to_assess;

      return {
        ...fallback,
        summary: typeof parsed.summary === 'string' ? parsed.summary : fallback.summary,
        difficulty:
          parsed.difficulty === 'Foundational' || parsed.difficulty === 'Intermediate' || parsed.difficulty === 'Advanced'
            ? parsed.difficulty
            : fallback.difficulty,
        skills_to_assess: skills,
      };
    } catch (error) {
      logger.warn('Gemini profile analysis failed, using fallback', error as Error);
      return fallback;
    }
  }

  static async generateQuestions(role: string, experience: number, skills: string[]): Promise<GeneratedQuestion[]> {
    const fallbackSkills = skills.length > 0 ? skills : ['Problem Solving', 'Communication', 'Execution'];
    const prompt = `
Generate 10 evaluation questions for a professional with the following profile:

Role: ${role}
Experience: ${experience} years
Skills: ${fallbackSkills.join(', ')}

Use a mix of question types:
- scenario
- debugging
- short_explanation
- MCQ

Return ONLY valid JSON as an array of 10 objects:
{
  "question": "clear professional question",
  "question_type": "scenario|debugging|short_explanation|MCQ",
  "skill_tag": "skill being tested",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_answer": "expected answer or option",
  "answer_guidance": "brief scoring rubric"
}

Rules:
- Include options only for MCQ.
- Make questions role-specific and realistic.
- Keep the JSON valid.
`;

    try {
      const response = await client.prompt(prompt);
      const questions = normalizeGeneratedQuestions(parseJson<unknown>(response, []));
      if (questions.length > 0) {
        return questions.slice(0, 10);
      }
    } catch (error) {
      logger.warn('Gemini question generation failed, using fallback', error as Error);
    }

    return fallbackSkills.slice(0, 5).flatMap((skill, index) => {
      const mcqIndex = index * 2;
      return [
        {
          question: `You are working as a ${role}. A project risk appears in the area of ${skill}. How would you assess the issue, decide on the next action, and communicate tradeoffs?`,
          question_type: 'scenario' as const,
          skill_tag: skill,
          correct_answer: 'A strong answer explains prioritization, tradeoffs, stakeholder communication, and measurable outcomes.',
          answer_guidance: 'Assess root cause, prioritize actions, manage risk, communicate clearly, and define measurable success criteria.',
        },
        {
          question: `Which option best demonstrates strong ${skill} judgment for a ${role} with ${experience} years of experience?`,
          question_type: 'MCQ' as const,
          skill_tag: skill,
          options: {
            A: `Use a structured decision-making approach and validate the impact on stakeholders.`,
            B: `Make the fastest decision possible without checking risks.`,
            C: `Delay action until another team provides complete direction.`,
            D: `Optimize only for short-term visibility, not outcomes.`,
          },
          correct_answer: 'A',
          answer_guidance: 'A strong professional balances speed, quality, risks, and stakeholder impact.',
        },
      ];
    }).slice(0, 10);
  }

  static async evaluateAnswer(question: string, userAnswer: string, answerGuidance = ''): Promise<AnswerEvaluation> {
    const fallbackScore = clamp(Math.round((userAnswer.trim().split(/\s+/).filter(Boolean).length / 40) * 100), 10, 65);
    const fallback: AnswerEvaluation = {
      score: fallbackScore,
      scoreTen: Math.round(fallbackScore / 10),
      reasoning: 'Fallback evaluation used because Gemini did not return a valid scoring response.',
      ai_detected: false,
    };

    const prompt = `
Evaluate the following answer from a professional perspective.

Question:
${question}

User Answer:
${userAnswer}

Scoring Guidance:
${answerGuidance || 'Use professional best practices and the intent of the question.'}

Return ONLY valid JSON:
{
  "score": 0-10,
  "reasoning": "brief explanation",
  "ai_detected": true | false
}

Scoring rules:
- 0 means irrelevant or incorrect.
- 10 means excellent, role-appropriate, specific, and actionable.
- Be strict but fair.
`;

    try {
      const response = await client.prompt(prompt);
      const parsed = parseJson<{ score?: number; reasoning?: string; ai_detected?: boolean }>(response, {});
      const scoreTen = clamp(Math.round(Number(parsed.score ?? fallback.scoreTen)), 0, 10);
      return {
        score: scoreTen * 10,
        scoreTen,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : fallback.reasoning,
        ai_detected: Boolean(parsed.ai_detected),
      };
    } catch (error) {
      logger.warn('Gemini answer evaluation failed, using fallback', error as Error);
      return fallback;
    }
  }

  static async analyzeSkillGaps(scores: Record<string, number>, role: string): Promise<SkillAnalysisResult> {
    const entries = Object.entries(scores);
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    const average = entries.length ? sorted.reduce((sum, [, score]) => sum + score, 0) / entries.length : 0;
    const fallback: SkillAnalysisResult = {
      strengths: sorted.slice(0, 3).map(([skill]) => skill),
      weaknesses: [...sorted].reverse().slice(0, 3).map(([skill]) => skill),
      maturity_level: average >= 80 ? 'Expert' : average >= 60 ? 'Proficient' : average >= 40 ? 'Developing' : 'Foundational',
      summary: `Automated fallback analysis for ${role}.`,
    };

    const prompt = `
Analyze these skill scores for a professional in the role of ${role}.

Skill Scores:
${JSON.stringify(scores, null, 2)}

Identify:
- strengths
- weaknesses
- skill maturity level

Return ONLY valid JSON:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "maturity_level": "Foundational" | "Developing" | "Proficient" | "Expert",
  "summary": "brief summary"
}
`;

    try {
      const response = await client.prompt(prompt);
      const parsed = parseJson<Partial<SkillAnalysisResult>>(response, fallback);
      return {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((skill): skill is string => typeof skill === 'string') : fallback.strengths,
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((skill): skill is string => typeof skill === 'string') : fallback.weaknesses,
        maturity_level:
          parsed.maturity_level === 'Foundational' ||
          parsed.maturity_level === 'Developing' ||
          parsed.maturity_level === 'Proficient' ||
          parsed.maturity_level === 'Expert'
            ? parsed.maturity_level
            : fallback.maturity_level,
        summary: typeof parsed.summary === 'string' ? parsed.summary : fallback.summary,
      };
    } catch (error) {
      logger.warn('Gemini skill gap analysis failed, using fallback', error as Error);
      return fallback;
    }
  }

  static async generateLearningPath(input: LearningPathInput | string[]): Promise<LearningPathModule[]> {
    const normalizedInput: LearningPathInput = Array.isArray(input)
      ? { weaknesses: input }
      : input;

    const weaknesses = normalizedInput.weaknesses.length > 0 ? normalizedInput.weaknesses : ['General mastery'];
    const fallback: LearningPathModule[] = weaknesses.slice(0, 4).map((weakness, index) => ({
      learning_stage: `Stage ${index + 1}`,
      topic: weakness,
      topics: [`Core concepts of ${weakness}`, `Applied practice for ${weakness}`],
      practice_tasks: [`Complete a realistic exercise focused on ${weakness}.`],
      recommended_resources: [`Official documentation and trusted practitioner resources for ${weakness}.`],
    }));

    const prompt = `
Create a personalized learning roadmap for a professional with the following weaknesses:
${weaknesses.join(', ')}

Additional context:
${JSON.stringify(
  {
    role: normalizedInput.role,
    goalRole: normalizedInput.goalRole,
    experience: normalizedInput.experience,
    knownSkills: normalizedInput.knownSkills,
    skillScores: normalizedInput.skillScores,
    profile: normalizedInput.profile,
    context: normalizedInput.context,
  },
  null,
  2
)}

Include:
- learning stages
- topics
- practice tasks
- recommended resources

Return ONLY valid JSON as an array:
{
  "learning_stage": "Stage 1",
  "topic": "name",
  "topics": ["topic A", "topic B"],
  "practice_tasks": ["task"],
  "recommended_resources": ["resource"]
}
`;

    try {
      const response = await client.prompt(prompt);
      const parsed = parseJson<unknown[]>(response, fallback);
      const modules = parsed
        .map((item, index) => {
          const row = item as Record<string, unknown>;
          const topics = Array.isArray(row.topics) ? row.topics.filter((value): value is string => typeof value === 'string') : [];
          const practiceTasks = Array.isArray(row.practice_tasks)
            ? row.practice_tasks.filter((value): value is string => typeof value === 'string')
            : [];
          const resources = Array.isArray(row.recommended_resources)
            ? row.recommended_resources.filter((value): value is string => typeof value === 'string')
            : [];

          const topic = typeof row.topic === 'string' ? row.topic : topics[0];
          if (!topic) {
            return null;
          }

          return {
            learning_stage: typeof row.learning_stage === 'string' ? row.learning_stage : `Stage ${index + 1}`,
            topic,
            topics: topics.length > 0 ? topics : [topic],
            practice_tasks: practiceTasks.length > 0 ? practiceTasks : [`Apply ${topic} in a realistic workplace exercise.`],
            recommended_resources: resources.length > 0 ? resources : [`Official docs and practical reference material for ${topic}.`],
          } satisfies LearningPathModule;
        })
        .filter((module): module is LearningPathModule => Boolean(module));

      return modules.length > 0 ? modules : fallback;
    } catch (error) {
      logger.warn('Gemini learning path generation failed, using fallback', error as Error);
      return fallback;
    }
  }

  static async generateMasteryChallenge(skill: string): Promise<string> {
    const prompt = `
Generate a real-world challenge that tests mastery of ${skill}.
The challenge should simulate a realistic workplace scenario and require judgment, prioritization, and execution detail.
Return markdown only.
`;

    try {
      return await client.prompt(prompt);
    } catch (error) {
      logger.warn('Gemini mastery challenge generation failed, using fallback', error as Error);
      return `## Mastery Challenge: ${skill}\n\nYou are responsible for a high-impact initiative involving ${skill}. Define the problem, outline a practical execution plan, identify major risks, and explain how you would measure success in production.`;
    }
  }

  static async generateFinalReport(data: any): Promise<string> {
    const prompt = `
Generate a professional skill evaluation report based on:
${JSON.stringify(data, null, 2)}

The report should summarize:
- current skill level
- areas of improvement
- recommended focus areas
- near-term actions

Write concise professional markdown.
`;

    try {
      return await client.prompt(prompt);
    } catch (error) {
      logger.warn('Gemini final report generation failed, using fallback', error as Error);
      return [
        '## Skill Intelligence Report',
        '',
        `Current skill level: ${data?.scores?.percentage ?? data?.scores?.overall ?? 'Unknown'}`,
        '',
        `Areas of improvement: ${Array.isArray(data?.weaknesses) ? data.weaknesses.join(', ') : 'Not available'}`,
        '',
        'Recommended focus areas: reinforce weak domains with targeted practice, scenario work, and measurable outcome reviews.',
      ].join('\n');
    }
  }
}
