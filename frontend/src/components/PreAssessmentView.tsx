import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, CheckCircle, ChevronRight, Activity, Bug, FileText,
  MessageSquare, ListOrdered, HelpCircle, Lightbulb, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { cn } from '../react-utils';
import apiClient from '../services/api';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';

// ─── Types ────────────────────────────────────────────────────────────────────

// All possible type strings that can arrive from the backend (mixed case, snake_case)
type RawQuestionType = string;

// Normalised type used internally by the frontend
type NormalisedType = 'MCQ' | 'Scenario' | 'CaseStudy' | 'Debug' | 'ShortAnswer' | 'Ranking';

interface AssessmentQuestion {
  id: string;
  // Backend may send 'question_type' or 'type'; both are accepted
  question_type?: RawQuestionType;
  type?: RawQuestionType;
  question_text?: string;
  question?: string;                // alternative field name from some AI responses
  // Options may be a Record<string,string> already OR a JSON string from the DB
  options?: Record<string, string> | string | null;
  correct_answer?: string;
  explanation?: string;
  answer_guidance?: string;
  subskill?: string;
  skill_tag?: string;
  difficulty?: string;
}

interface PreAssessmentViewProps {
  categoryId: string;
  categoryName: string;
  roleId: string;
  experienceLevel: string;
  skillsToAssess?: string[];
  userProfile?: any;
  onCompleted: (result: any) => void;
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

/**
 * Maps any backend question_type string to one of the 6 canonical frontend types.
 * Handles casing differences (MCQ/mcq), underscore variants (short_answer → ShortAnswer),
 * and unknown types (fallback to ShortAnswer so the user is never stuck).
 */
function normaliseType(raw: RawQuestionType | undefined | null): NormalisedType {
  if (!raw) return 'ShortAnswer';
  const t = raw.trim().toLowerCase().replace(/_/g, '');
  if (t === 'mcq' || t === 'multiplechoice') return 'MCQ';
  if (t === 'scenario') return 'Scenario';
  if (t === 'casestudy' || t === 'case') return 'CaseStudy';
  if (t === 'debug' || t === 'debugging') return 'Debug';
  if (t === 'shortanswer' || t === 'short' || t === 'text') return 'ShortAnswer';
  if (t === 'ranking' || t === 'rank') return 'Ranking';
  console.warn(`[PreAssessmentView] Unknown question_type "${raw}" → defaulting to ShortAnswer`);
  return 'ShortAnswer';
}

/**
 * Safely parse options field which may be:
 * - already a Record<string,string>
 * - a JSON string  e.g. '{"A":"...","B":"..."}'
 * - an array of strings ['A: foo', 'B: bar']  (from some AI responses)
 * - null / undefined
 */
function parseOptions(raw: Record<string, string> | string | string[] | null | undefined): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, string>;
  if (Array.isArray(raw)) {
    // Convert ['A: foo', 'B: bar'] → {A: 'foo', B: 'bar'}
    const result: Record<string, string> = {};
    (raw as string[]).forEach((item, idx) => {
      const colon = item.indexOf(':');
      if (colon > -1) {
        result[item.slice(0, colon).trim()] = item.slice(colon + 1).trim();
      } else {
        result[String.fromCharCode(65 + idx)] = item;
      }
    });
    return Object.keys(result).length > 0 ? result : null;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, string>;
      if (Array.isArray(parsed)) return parseOptions(parsed as string[]);
    } catch {
      console.warn('[PreAssessmentView] Could not parse options string:', raw);
    }
  }
  return null;
}

/**
 * Normalise a raw question from the API into a clean, consistent shape.
 */
function normaliseQuestion(raw: AssessmentQuestion, index: number) {
  const rawType = raw.question_type ?? raw.type ?? 'ShortAnswer';
  const normType = normaliseType(rawType);
  const text = raw.question_text ?? raw.question ?? `Question ${index + 1}`;
  const id = raw.id ?? `gen-${index}-${Date.now()}`;
  const options = normType === 'MCQ' || normType === 'Ranking' ? parseOptions(raw.options) : null;
  const subskill = raw.subskill ?? raw.skill_tag ?? 'General';

  // Debug log for each question
  console.debug(`[Q${index + 1}] raw_type="${rawType}" → norm="${normType}" | options=${options ? Object.keys(options).length + ' opts' : 'none'} | id=${id}`);

  return { id, normType, text, options, subskill, difficulty: raw.difficulty, correct_answer: raw.correct_answer, answer_guidance: raw.answer_guidance };
}

type NormalisedQuestion = ReturnType<typeof normaliseQuestion>;

// ─── Question type display metadata ──────────────────────────────────────────

const QUESTION_META: Record<NormalisedType, { icon: any; label: string; color: string; bgColor: string; instruction: string }> = {
  MCQ:         { icon: HelpCircle,   label: 'Knowledge Check',   color: 'text-violet-400', bgColor: 'bg-violet-500/10 border-violet-500/30', instruction: 'Select the best answer:' },
  Scenario:    { icon: Lightbulb,    label: 'Scenario Analysis', color: 'text-cyan-400',   bgColor: 'bg-cyan-500/10 border-cyan-500/30',    instruction: 'Analyze the scenario and explain your approach:' },
  CaseStudy:   { icon: FileText,     label: 'Case Study',        color: 'text-amber-400',  bgColor: 'bg-amber-500/10 border-amber-500/30',  instruction: 'Read the case and provide your analysis:' },
  Debug:       { icon: Bug,          label: 'Debug Challenge',   color: 'text-rose-400',   bgColor: 'bg-rose-500/10 border-rose-500/30',    instruction: 'Identify the issue and explain how to fix it:' },
  ShortAnswer: { icon: MessageSquare,label: 'Short Explanation', color: 'text-emerald-400',bgColor: 'bg-emerald-500/10 border-emerald-500/30',instruction: 'Provide a concise explanation (3–5 sentences):' },
  Ranking:     { icon: ListOrdered,  label: 'Priority Ranking',  color: 'text-fuchsia-400',bgColor: 'bg-fuchsia-500/10 border-fuchsia-500/30',instruction: 'Rank the items in order of priority (1 = highest):' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PreAssessmentView({
  categoryId, categoryName, roleId, experienceLevel, skillsToAssess, userProfile, onCompleted
}: PreAssessmentViewProps) {
  const [questions, setQuestions] = useState<NormalisedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  // answers keyed by question id → user's answer string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openEndedScores, setOpenEndedScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoringAnswer, setIsScoringAnswer] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Behaviour tracking (paste / typing speed detection)
  const detectionLogsRef = useRef<Record<string, any>>({});
  const currentQId = questions[currentIdx]?.id ?? `q-${currentIdx}`;
  const { onPaste, onKeyDown, onInput, getSummary } = useBehaviorTracking(currentQId);

  const recordCurrentDetection = useCallback(() => {
    detectionLogsRef.current[currentQId] = getSummary();
  }, [currentQId, getSummary]);

  // ── Fetch questions ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchQuestions() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data } = await apiClient.post('/assessments/adaptive-generate', {
          categoryId,
          categoryName,
          roleId,
          experienceLevel,
          roleName: categoryName,
          skillsToAssess,
        });

        if (cancelled) return;

        const rawArray: AssessmentQuestion[] = Array.isArray(data) ? data : [data];
        if (rawArray.length === 0) throw new Error('No questions returned from server');

        const normalised = rawArray.map((q, i) => normaliseQuestion(q, i));
        console.log(`[PreAssessmentView] Loaded ${normalised.length} questions.`, normalised.map(q => ({ id: q.id, type: q.normType })));
        setQuestions(normalised);
      } catch (err: any) {
        console.error('[PreAssessmentView] Failed to load questions:', err);
        if (!cancelled) {
          setLoadError(err.response?.data?.error || err.message || 'Failed to load assessment questions.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchQuestions();
    return () => { cancelled = true; };
  }, [categoryId, roleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    recordCurrentDetection();
    const q = questions[currentIdx];

    // Score open-ended types before advancing
    if (['Scenario', 'CaseStudy', 'Debug', 'ShortAnswer'].includes(q.normType) && answers[q.id] && !openEndedScores[q.id]) {
      setIsScoringAnswer(true);
      try {
        const { data } = await apiClient.post('/assessments/score-open-ended', {
          questionText: q.text,
          questionType: q.normType,
          userAnswer: answers[q.id],
          answerGuidance: q.answer_guidance || '',
          skillTag: q.subskill,
        });
        setOpenEndedScores(prev => ({ ...prev, [q.id]: data }));
      } catch {
        setOpenEndedScores(prev => ({ ...prev, [q.id]: { score: 50, feedback: 'Answer recorded.' } }));
      } finally {
        setIsScoringAnswer(false);
      }
    }

    setCurrentIdx(i => i + 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    recordCurrentDetection();

    // Score last question if open-ended and not yet scored
    const lastQ = questions[currentIdx];
    if (['Scenario', 'CaseStudy', 'Debug', 'ShortAnswer'].includes(lastQ.normType) && answers[lastQ.id] && !openEndedScores[lastQ.id]) {
      try {
        const { data } = await apiClient.post('/assessments/score-open-ended', {
          questionText: lastQ.text,
          questionType: lastQ.normType,
          userAnswer: answers[lastQ.id],
          answerGuidance: lastQ.answer_guidance || '',
          skillTag: lastQ.subskill,
        });
        openEndedScores[lastQ.id] = data;
      } catch {
        openEndedScores[lastQ.id] = { score: 50, feedback: 'Answer recorded.' };
      }
    }

    try {
      const evaluatedQuestions = questions.map(q => {
        if (q.normType === 'MCQ') {
          return { id: q.id, subskill: q.subskill, question_type: 'MCQ', isCorrect: answers[q.id] === q.correct_answer };
        } else if (q.normType === 'Ranking') {
          return { id: q.id, subskill: q.subskill, question_type: 'Ranking', isCorrect: answers[q.id] === q.correct_answer, userAnswer: answers[q.id] };
        } else {
          const scoreData = openEndedScores[q.id];
          return { id: q.id, subskill: q.subskill, question_type: q.normType, isCorrect: (scoreData?.score ?? 50) >= 60, openEndedScore: scoreData?.score ?? 50, userAnswer: answers[q.id] };
        }
      });

      const { data } = await apiClient.post('/assessments/submit-mcq', {
        categoryId, categoryName, roleId, experienceLevel, roleName: categoryName, evaluatedQuestions, userProfile,
      });

      // Fire-and-forget detection logging
      for (const [, summary] of Object.entries(detectionLogsRef.current)) {
        apiClient.post('/assessments/log-detection', {
          assessmentId: data.id,
          pasteDetected: (summary as any).pasteDetected,
          pasteCount: (summary as any).pasteCount,
          typingSpeedWpm: (summary as any).typingSpeedWpm,
          responseTimeMs: (summary as any).responseTimeMs,
          characterBurstCount: (summary as any).characterBurstCount,
          rawEvents: (summary as any).rawEvents,
        }).catch(() => {/* non-blocking */});
      }

      onCompleted(data);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center space-y-6">
        <div className="w-14 h-14 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
        <h3 className="text-xl font-bold text-slate-200">Constructing Evaluation</h3>
        <p className="text-slate-400 max-w-md">
          Generating dynamic, role-specific questions for <span className="text-cyan-400 font-semibold">{categoryName}</span>…
        </p>
      </div>
    );
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400" />
        <h3 className="text-xl font-bold text-rose-300">Failed to Load Questions</h3>
        <p className="text-slate-400 max-w-md">{loadError ?? 'No questions were returned. Please try again.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg transition-colors text-sm font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render question ────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx];
  const { normType: qType, text: qText, options: qOptions, id: qId, subskill, difficulty } = currentQ;
  const currentAnswer = answers[qId] ?? '';
  const hasAnswer = currentAnswer.trim().length > 0;
  const isLast = currentIdx === questions.length - 1;
  const progress = (currentIdx / questions.length) * 100;
  const meta = QUESTION_META[qType] ?? QUESTION_META.ShortAnswer;
  const IconComponent = meta.icon;

  // type breakdown for header chips
  const typeCounts = questions.reduce((acc, q) => { acc[q.normType] = (acc[q.normType] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="w-full max-w-3xl mx-auto reveal-up">

      {/* Progress bar + header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" /> Evaluation in Progress
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70 flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Integrity Monitoring
            </span>
            <span className="text-sm text-slate-400 font-mono">Q {currentIdx + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Type breakdown chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(typeCounts).map(([type, count]) => {
            const m = QUESTION_META[type as NormalisedType] ?? QUESTION_META.ShortAnswer;
            return (
              <span key={type} className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', m.bgColor, m.color)}>
                {type} × {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <div className="dash-card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* Type badge */}
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 border', meta.bgColor, meta.color)}>
          <IconComponent className="w-3.5 h-3.5" />
          {meta.label}
          {difficulty && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-[10px]',
              difficulty === 'advanced' ? 'bg-rose-500/20 text-rose-300' :
              difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-300' :
              'bg-emerald-500/20 text-emerald-300'
            )}>
              {difficulty}
            </span>
          )}
        </div>

        {/* Subskill tag */}
        <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Testing: {subskill}</p>

        {/* Question text */}
        <h3 className="text-2xl font-semibold text-slate-100 mb-5 leading-snug whitespace-pre-wrap relative z-10">
          {qText}
        </h3>

        <p className="text-sm font-medium text-slate-400 mb-5">{meta.instruction}</p>

        {/* ── Answer input area ─────────────────────────────────────────── */}
        <div className="space-y-4 relative z-10">

          {/* MCQ */}
          {qType === 'MCQ' && qOptions && (
            <div className="space-y-3">
              {Object.entries(qOptions).map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, [qId]: key }))}
                  className={cn(
                    'w-full flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left',
                    currentAnswer === key
                      ? 'bg-violet-500/10 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/80'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    currentAnswer === key ? 'border-violet-400 bg-violet-400 text-slate-900' : 'border-slate-500'
                  )}>
                    {currentAnswer === key && <CheckCircle className="w-4 h-4" />}
                  </div>
                  <span className="text-slate-200 text-base leading-relaxed">
                    <span className="font-bold text-slate-400 mr-2">{key}.</span>{text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* MCQ fallback — options missing */}
          {qType === 'MCQ' && !qOptions && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Options unavailable — please type your answer below.
              </div>
              <textarea
                value={currentAnswer}
                onChange={e => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                onPaste={onPaste as any}
                onKeyDown={onKeyDown as any}
                rows={4}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none leading-relaxed"
                placeholder="Type your answer here…"
              />
            </div>
          )}

          {/* Ranking */}
          {qType === 'Ranking' && qOptions && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">Assign a rank (1 = highest priority) to each item:</p>
              {Object.entries(qOptions).map(([key, text]) => {
                const rankings = (currentAnswer || '').split(',').filter(Boolean);
                const currentRank = rankings.indexOf(key) + 1;
                const totalItems = Object.keys(qOptions).length;
                return (
                  <div key={key} className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/50">
                    <select
                      value={currentRank || ''}
                      onChange={e => {
                        const newRank = parseInt(e.target.value);
                        const prev = (currentAnswer || '').split(',').filter(Boolean);
                        const cleaned = prev.filter(k => k !== key);
                        if (newRank > 0) cleaned.splice(newRank - 1, 0, key);
                        setAnswers(p => ({ ...p, [qId]: cleaned.join(',') }));
                      }}
                      className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-center text-white font-bold focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                    >
                      <option value="">-</option>
                      {Array.from({ length: totalItems }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <span className="text-slate-200 leading-relaxed">{text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scenario / CaseStudy / Debug — rich textarea */}
          {['Scenario', 'CaseStudy', 'Debug'].includes(qType) && (
            <div>
              <textarea
                value={currentAnswer}
                onChange={e => {
                  onInput(e as any);
                  setAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                }}
                onPaste={onPaste as any}
                onKeyDown={onKeyDown as any}
                rows={9}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none leading-relaxed"
                placeholder={
                  qType === 'Debug' ? "Describe the issue and your fix…" :
                  qType === 'CaseStudy' ? "Provide your analysis, reasoning, and recommendations…" :
                  "Explain your approach, key decisions, and rationale…"
                }
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{currentAnswer.split(/\s+/).filter(Boolean).length} words</span>
                <span>Minimum 20 words recommended</span>
              </div>
            </div>
          )}

          {/* ShortAnswer — compact textarea */}
          {qType === 'ShortAnswer' && (
            <div>
              <textarea
                value={currentAnswer}
                onChange={e => {
                  onInput(e as any);
                  setAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                }}
                onPaste={onPaste as any}
                onKeyDown={onKeyDown as any}
                rows={5}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none leading-relaxed"
                placeholder="Provide a concise, focused explanation…"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{currentAnswer.split(/\s+/).filter(Boolean).length} words</span>
                <span>3–5 sentences recommended</span>
              </div>
            </div>
          )}

          {/* Fallback — catches any unrecognised type so user is NEVER stuck */}
          {qType === 'ShortAnswer' || ['Scenario','CaseStudy','Debug','MCQ','Ranking'].includes(qType) ? null : (
            <div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-xs mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Question type "{qType}" — text input provided.
              </div>
              <textarea
                value={currentAnswer}
                onChange={e => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                rows={5}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all resize-none leading-relaxed"
                placeholder="Type your answer here…"
              />
            </div>
          )}

          {/* Open-ended score feedback */}
          {openEndedScores[qId] && (
            <div className={cn(
              'mt-4 p-4 rounded-xl border text-sm',
              openEndedScores[qId].score >= 60
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            )}>
              <p className="font-bold mb-1">Score: {openEndedScores[qId].score}%</p>
              <p className="opacity-80 text-xs">{openEndedScores[qId].feedback}</p>
            </div>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="mt-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {/* Answer status hint */}
          <span className={cn('text-xs font-medium', hasAnswer ? 'text-emerald-400' : 'text-slate-600')}>
            {hasAnswer ? '✓ Answer recorded' : 'Please answer to continue'}
          </span>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnswer || isSubmitting || isScoringAnswer}
              className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {isSubmitting || isScoringAnswer ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing your performance...</>
              ) : (
                <>Complete Evaluation <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnswer || isScoringAnswer}
              className="px-8 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {isScoringAnswer ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Analyzing…</>
              ) : (
                <>Next Question <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
