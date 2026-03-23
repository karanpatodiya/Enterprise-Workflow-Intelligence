import { useState } from 'react';
import { Bot, CheckCircle, Send, XCircle } from 'lucide-react';
import { cn } from '../react-utils';
import apiClient from '../services/api';

interface AssessmentViewProps {
  exerciseId: string;
  exerciseType?: string;
  mcqOptions?: Record<string, string>;
  scenarioText: string;
  onGraded: (grade: 'pass' | 'fail') => void;
}

export function AssessmentView({ exerciseId, exerciseType = 'scenario', mcqOptions, scenarioText, onGraded }: AssessmentViewProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ grade: 'pass' | 'fail'; feedback: string; ai_detected?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await apiClient.post(`/learning/scenarios/${exerciseId}/submit`, { answer });
      setResult(data);
      onGraded(data.grade);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit your answer. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    const passed = result.grade === 'pass';
    const aiCheated = result.ai_detected;

    return (
      <div className={cn('p-6 rounded-2xl border bg-slate-900/50 backdrop-blur-sm reveal-up', passed ? 'border-emerald-500/30' : aiCheated ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-rose-500/30')}>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-full shrink-0", passed ? 'bg-emerald-500/20 text-emerald-400' : aiCheated ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-400')}>
            {passed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={cn("text-xl font-bold mb-2", passed ? "text-emerald-400" : aiCheated ? "text-amber-500" : "text-rose-400")}>
              {passed ? "Assessment Passed!" : aiCheated ? "AI Generated Content Detected" : "Assessment Failed"}
            </h3>
            <div className="text-slate-300 leading-relaxed mb-6">
              <span className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                <Bot className={cn("w-4 h-4", aiCheated ? "text-amber-400" : "text-purple-400")} /> AI Feedback:
              </span>
              {result.feedback}
            </div>
            {!passed && (
              <button
                onClick={() => {
                  setResult(null);
                  setAnswer('');
                }}
                className="px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 border border-slate-700 hover:border-slate-500 bg-slate-800 text-slate-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isMCQ = exerciseType === 'mcq' && mcqOptions;

  return (
    <div className="p-6 rounded-2xl border border-indigo-500/20 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Bot className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">
          {isMCQ ? 'Knowledge Check' : 'Interactive Scenario Assessment'}
        </h3>
      </div>

      <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/50 mb-6 text-slate-300 leading-relaxed italic">
        "{scenarioText}"
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-400">
          {isMCQ ? 'Select the best response:' : 'How would you handle this situation based on the module?'}
        </p>

        {error && (
          <div className="text-sm rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 px-3 py-2">
            {error}
          </div>
        )}

        {isMCQ ? (
          <div className="space-y-3 mt-4">
            {Object.entries(mcqOptions!).map(([key, text]) => (
              <label
                key={key}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                  answer === key
                    ? "bg-cyan-500/10 border-cyan-500/50"
                    : "bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
                )}
              >
                <input
                  type="radio"
                  name="mcq_answer"
                  value={key}
                  checked={answer === key}
                  onChange={() => setAnswer(key)}
                  className="mt-1 shrink-0 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-200 leading-relaxed font-medium">{key}. {text}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
            placeholder="Type your strategic decision and rationale here..."
          />
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !answer.trim()}
            className="btn-primary flex items-center gap-2 px-6 py-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Submit Answer
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
