import { useEffect, useState } from 'react';
import { ArrowRight, BarChart, Rocket, ShieldAlert, Zap } from 'lucide-react';
import { SkillGraph } from './SkillGraph';
import { cn } from '../react-utils';
import apiClient from '../services/api';

interface GapAnalysisProps {
  categoryName: string;
  roleName?: string;
  skillScores: any[];
  result: any;
  onGeneratePath: () => void;
  isGenerating?: boolean;
}

export function GapAnalysis({
  categoryName,
  roleName,
  skillScores,
  result,
  onGeneratePath,
  isGenerating = false,
}: GapAnalysisProps) {
  const [riskScore, setRiskScore] = useState<{ riskScore: number; riskLabel: string } | null>(null);

  useEffect(() => {
    if (!result?.id) return;
    apiClient.get(`/assessments/ai-risk/${result.id}`)
      .then(({ data }) => setRiskScore(data))
      .catch(() => setRiskScore({ riskScore: 0, riskLabel: 'Low' }));
  }, [result?.id]);

  const radarData = (skillScores ?? []).map((s: any) => ({
    label: s.subskill,
    value: s.score,
  }));

  const percentage = result?.total_questions ? Math.round((result.score / result.total_questions) * 100) : result?.score ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 reveal-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 text-gradient">
            Gap Analysis Complete
          </h2>
          <p className="text-slate-400">
            Performance metrics for <strong className="text-violet-400">{roleName || categoryName}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dash-card col-span-1 flex flex-col items-center justify-center py-10">
          <div className="relative mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="60" strokeWidth="8" fill="transparent" className="text-slate-800 stroke-current" />
              <circle
                cx="64" cy="64" r="60" strokeWidth="8" fill="transparent"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * percentage) / 100}
                className="text-fuchsia-500 stroke-current transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{percentage}%</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-1">Final Score</h3>
        </div>

        {riskScore !== undefined && (
          <div className={cn(
            'dash-card flex flex-col justify-center py-8 px-6',
            !riskScore ? 'opacity-50' :
            riskScore.riskLabel === 'High' ? 'border-rose-500/30 bg-rose-950/10' :
            riskScore.riskLabel === 'Medium' ? 'border-amber-500/30 bg-amber-950/10' :
            'border-emerald-500/30'
          )}>
            <ShieldAlert className={cn('w-8 h-8 mb-4', !riskScore ? 'text-slate-500' : riskScore.riskLabel === 'High' ? 'text-rose-400' : riskScore.riskLabel === 'Medium' ? 'text-amber-400' : 'text-emerald-400')} />
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Integrity Score</h3>
            {riskScore ? (
              <>
                <p className={cn('text-3xl font-bold mb-1', riskScore.riskLabel === 'High' ? 'text-rose-400' : riskScore.riskLabel === 'Medium' ? 'text-amber-400' : 'text-emerald-400')}>
                  {riskScore.riskLabel}
                </p>
                <p className="text-sm text-slate-500">Risk score: {riskScore.riskScore}/100</p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">Computing...</p>
            )}
          </div>
        )}

        <div className="dash-card flex flex-col justify-center py-8 px-6 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/20 border-violet-500/30">
          <Zap className="w-8 h-8 text-violet-400 mb-4" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Next Step</h3>
          
          <button
            onClick={onGeneratePath}
            disabled={isGenerating}
            className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isGenerating ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Designing Path...</>
            ) : (
              <><Rocket className="w-5 h-5" /> Proceed to Learning Path <ArrowRight className="w-4 h-4 group-hover:translate-x-1 duration-300" /></>
            )}
          </button>
        </div>
      </div>

      {radarData.length > 0 && (
        <div className="dash-card p-8 border-violet-500/20">
          <h3 className="text-2xl font-bold text-slate-100 flex items-center mb-8">
            <BarChart className="w-6 h-6 mr-3 text-violet-400" /> Executive Gap Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
              <SkillGraph skills={radarData} size={320} />
            </div>
            <div className="space-y-5">
              {radarData.map((skill: any) => {
                const weak = skill.value < 60;
                const color = weak ? 'text-rose-400' : skill.value >= 80 ? 'text-emerald-400' : 'text-amber-400';
                const bar = weak ? 'bg-rose-500' : skill.value >= 80 ? 'bg-emerald-500' : 'bg-amber-500';

                return (
                  <div key={skill.label} className={weak ? 'p-3 -mx-3 rounded-lg bg-rose-500/5 border border-rose-500/20' : 'p-3 -mx-3'}>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-300 font-semibold">{skill.label}</span>
                      <span className={`font-bold ${color}`}>{skill.value}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${bar}`} style={{ width: `${skill.value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
