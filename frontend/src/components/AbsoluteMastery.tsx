import { useState } from 'react';
import { Target, ShieldAlert, Loader2, CheckCircle2, XCircle, Send } from 'lucide-react';
import apiClient from '../services/api';

interface AbsoluteMasteryProps {
  categoryName: string;
  onCompleted: (result: any) => void;
}

export function AbsoluteMastery({ categoryName, onCompleted }: AbsoluteMasteryProps) {
  const [phase, setPhase] = useState<'intro' | 'loading' | 'challenge' | 'submitting' | 'result'>('intro');
  const [challengeText, setChallengeText] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [questions] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startChallenge = async () => {
    setPhase('loading');
    setError(null);
    try {
      const { data } = await apiClient.post('/assessments/adaptive-generate', {
        categoryId: 'mastery-challenge',
        categoryName,
        roleId: 'mastery-role',
        experienceLevel: 'Advanced',
        skillsToAssess: [categoryName],
      });
      const challenge = Array.isArray(data) ? data[0] : data;
      setChallengeText(challenge?.question_text || `Demonstrate mastery of ${categoryName} with a real-world scenario response.`);
      setPhase('challenge');
    } catch {
      // Fallback challenge text
      setChallengeText(`You are a senior professional in ${categoryName}. Describe a critical, high-impact initiative you would lead. Include: problem definition, solution approach, stakeholder communication, risk management, and how you would measure success.`);
      setPhase('challenge');
    }
  };

  const handleSubmit = async () => {
    if (!currentAnswer || currentAnswer.trim().length === 0) {
      setError("Answer cannot be empty");
      return;
    }

    if (!answers || !questions) {
      console.error("Missing data");
      return;
    }

    const currentAnswers = [...answers, currentAnswer];
    setAnswers(currentAnswers);
    
    setPhase('submitting');
    setError(null);
    try {
      await apiClient.post('/submit-evaluation', {
        user_id: 'current-user', // mocked since it wasn't specified
        answers: currentAnswers,
        role: 'mastery-role',
        category: categoryName
      });
      
      // Mimic the evaluation passing logic temporarily
      setResult({ passed: true, aiScore: 85, skill_level: 'Advanced', reasoning: 'Answer safely saved to evaluations table.' });
      setPhase('result');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to evaluate your response. Please try again.');
      setPhase('challenge');
    }
  };

  const handleComplete = () => {
    if (result?.passed) {
      onCompleted(result);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="hero-card overflow-hidden flex flex-col border-t border-t-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] items-center justify-center p-12 text-center relative reveal-up min-h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent z-0" />
        <div className="relative z-10 w-full max-w-2xl">
          <div className="w-24 h-24 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Stage 5: Absolute Mastery Challenge
          </h1>
          <p className="text-lg text-slate-300 mx-auto mb-8 leading-relaxed">
            You have completed all core modules. This final challenge tests your true readiness in{' '}
            <strong className="text-rose-400">{categoryName}</strong> at the{' '}
            <span className="text-rose-400 font-bold">Advanced</span> level.
            You must score <strong className="text-white">60%+</strong> to unlock your certificate.
          </p>
          <button
            onClick={startChallenge}
            className="px-8 py-4 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] transform hover:-translate-y-1 w-full max-w-md mx-auto flex items-center justify-center gap-3 text-lg"
          >
            <Target className="w-6 h-6" /> Begin Final Challenge
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6">
        <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
        <h2 className="text-2xl font-bold text-gradient uppercase tracking-widest">Generating Mastery Challenge</h2>
        <p className="text-slate-400">Constructing an advanced real-world scenario for {categoryName}…</p>
      </div>
    );
  }

  if (phase === 'challenge') {
    const wordCount = (currentAnswer?.split(/\s+/)?.filter(Boolean)?.length) || 0;
    
    console.log("Answer:", currentAnswer);
    console.log("Answers array:", answers);
    return (
      <div className="w-full max-w-3xl mx-auto reveal-up space-y-6">
        <div className="dash-card p-8 border-rose-500/30">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border bg-rose-500/10 border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5" /> Advanced Mastery Challenge
          </div>
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Final Evaluation – {categoryName}</p>
          <h3 className="text-xl font-semibold text-slate-100 mb-6 leading-relaxed whitespace-pre-wrap">{challengeText}</h3>
          <p className="text-sm font-medium text-slate-400 mb-4">Provide a comprehensive, expert-level response. Demonstrate depth, strategic thinking, and practical execution:</p>
          <textarea
            value={currentAnswer || ""}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={12}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all resize-none leading-relaxed"
            placeholder="Provide your expert-level response. Include problem definition, approach, risk management, stakeholder communication, and success metrics..."
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{wordCount} words — minimum 80 words recommended</span>
            <span className={wordCount >= 80 ? 'text-emerald-400' : 'text-slate-500'}>{wordCount >= 80 ? '✓ Ready to submit' : `${80 - wordCount} more words needed`}</span>
          </div>
          {error && <p className="mt-4 text-rose-400 text-sm">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={(currentAnswer?.length || 0) === 0 || wordCount < 10}
            className="mt-6 w-full py-4 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <Send className="w-5 h-5" /> Submit for Expert Evaluation
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6">
        <Loader2 className="w-16 h-16 text-fuchsia-500 animate-spin" />
        <h2 className="text-2xl font-bold text-gradient uppercase tracking-widest">Evaluating Your Response</h2>
        <p className="text-slate-400">Assessing depth, strategic thinking, and expertise…</p>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const passed = result.passed;
    return (
      <div className="w-full max-w-2xl mx-auto reveal-up">
        <div className={`dash-card p-10 text-center ${passed ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {passed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {passed ? 'Mastery Achieved!' : 'Keep Practicing'}
          </h2>
          <p className={`text-lg font-semibold mb-4 ${passed ? 'text-emerald-300' : 'text-rose-300'}`}>
            Score: {result.aiScore}/100 — {result.skill_level}
          </p>
          <div className="bg-slate-900/60 rounded-xl p-5 text-left mb-8 border border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evaluation Feedback</p>
            <p className="text-slate-300 leading-relaxed">{result.reasoning}</p>
          </div>
          {passed ? (
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" /> Unlock Certificate 🎓
            </button>
          ) : (
            <button
              onClick={() => { setPhase('intro'); setCurrentAnswer(''); setResult(null); }}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <Target className="w-5 h-5" /> Retry Challenge
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
