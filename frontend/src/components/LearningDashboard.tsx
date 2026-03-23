import { useState } from 'react';
import { BookOpen, CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { cn } from '../react-utils';
import { AssessmentView } from './AssessmentView';
import { SkillGraph } from './SkillGraph';
import { AbsoluteMastery } from './AbsoluteMastery';
import { CertificateView } from './CertificateView';
import apiClient from '../services/api';
import Markdown from 'markdown-it';

const md = new Markdown();

interface LearningDashboardProps {
  pathData: any;
  onRefresh: () => void;
}

export function LearningDashboard({ pathData, onRefresh }: LearningDashboardProps) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(() => {
    const allDone = pathData.modules.every((m: any) => m.status === 'completed');
    if (allDone) return pathData.modules.length;
    const idx = pathData.modules.findIndex((m: any) => m.status !== 'completed');
    return Math.max(0, idx);
  });

  // Track whether mastery has been passed and certificate should show
  const [showCertificate, setShowCertificate] = useState(false);
  const [masteryResult, setMasteryResult] = useState<any>(null);

  const isMasteryAchieved = activeModuleIndex === pathData.modules.length;
  const activeModule = isMasteryAchieved ? null : pathData.modules[activeModuleIndex];

  const progressPercentage = Math.round(
    (pathData.modules.filter((m: any) => m.status === 'completed').length /
      pathData.modules.length) *
    100
  );

  const skillData = pathData.modules.map((m: any, i: number) => {
    const words = m.title.split(' ');
    const label = words.length > 2 ? `${words[0]} ${words[1]}...` : m.title;
    return {
      label: label,
      value: m.status === 'completed' ? 100 : (i === activeModuleIndex ? 40 : 10)
    };
  });

  // Show the certificate after mastery
  if (showCertificate) {
    return (
      <div className="max-w-4xl mx-auto">
        <CertificateView
          categoryName={pathData.target_role || 'Your Domain'}
          skillLevel={masteryResult?.skill_level || 'Advanced'}
          strengths={masteryResult?.strengths || []}
          onStartOver={async () => {
            try {
              await apiClient.post('/learning/abandon');
              onRefresh();
            } catch (e) {
              console.error('Failed to abandon path', e);
              onRefresh();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 reveal-up">
      {/* Sidebar Path Timeline */}
      <div className="lg:col-span-4 space-y-6">
        <div className="dash-card p-6 border-b-4 border-b-violet-500/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
              Role Context Panel
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    if (confirm('Are you sure you want to go back and start over? Your current progress will be lost.')) {
                      await apiClient.post('/learning/abandon');
                      onRefresh();
                    }
                  } catch (e) {
                    console.error('Failed to abandon path', e);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
              >
                ← Start Over
              </button>
            </div>
          </div>

          <div className="mb-6 relative h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(217,70,239,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-right text-sm font-semibold text-slate-400 uppercase tracking-widest">{progressPercentage}% Complete</div>
          
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2 text-center">Competency Radar</h3>
            <SkillGraph skills={skillData} size={280} />
          </div>
        </div>

        <div className="dash-tile p-4 space-y-2">
          {pathData.modules.map((mod: any, index: number) => {
            const isCompleted = mod.status === 'completed';
            const isCurrent = index === activeModuleIndex;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleIndex(index)}
                className={cn(
                  'w-full text-left p-4 rounded-xl transition-all duration-300 flex gap-4 relative group',
                  isCurrent ? 'bg-violet-500/10 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'hover:bg-slate-800/50 border border-transparent'
                )}
              >
                <div className="shrink-0 mt-0.5 relative z-10">
                  {isCompleted ? (
                    <span className="text-fuchsia-400"><CheckCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" /></span>
                  ) : isCurrent ? (
                    <span className="text-violet-400"><PlayCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" /></span>
                  ) : (
                    <span className="text-slate-600"><Circle className="w-5 h-5" /></span>
                  )}
                </div>
                <div>
                  <h4 className={cn("font-medium transition-colors", isCurrent ? 'text-violet-300 font-semibold' : isCompleted ? 'text-slate-300' : 'text-slate-500')}>
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    {isCompleted ? 'Finished' : 'Module ' + (index + 1)}
                  </p>
                </div>
              </button>
            );
          })}

          {progressPercentage === 100 && (
            <button
              onClick={() => setActiveModuleIndex(pathData.modules.length)}
              className={cn(
                'w-full text-left p-4 rounded-xl transition-all duration-300 flex gap-4 relative group mt-4',
                isMasteryAchieved ? 'bg-rose-500/10 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'hover:bg-slate-800/50 border border-slate-800'
              )}
            >
              <div className={cn("shrink-0 mt-0.5 relative z-10", isMasteryAchieved ? "text-rose-400" : "text-rose-500/50")}>
                <CheckCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              </div>
              <div>
                <h4 className={cn("font-medium transition-colors", isMasteryAchieved ? 'text-rose-300 font-bold' : 'text-rose-500/70 font-semibold')}>
                  Absolute Mastery
                </h4>
                <p className="text-xs text-rose-500/70 mt-1 uppercase tracking-wider font-semibold">
                  Final Challenge
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8">
        {isMasteryAchieved ? (
          <AbsoluteMastery 
            categoryName={pathData.target_role || 'Your Domain'}
            onCompleted={async (result: any) => {
              // Store mastery result and show certificate
              setMasteryResult(result);
              setShowCertificate(true);
            }}
          />
        ) : (
          <div className="dash-card overflow-hidden flex flex-col h-[calc(100vh-12rem)] border-t border-t-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)] reveal-up">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 z-0" />
              <div className="p-3 bg-violet-500/20 rounded-xl relative z-10">
                <BookOpen className="w-6 h-6 text-violet-400" />
              </div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold text-slate-100">{activeModule?.title}</h1>
                <p className="text-slate-400 mt-1 uppercase tracking-widest text-sm font-semibold">AI Generated Curriculum</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/40 relative">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
              <div
                className="prose prose-invert max-w-none prose-headings:text-violet-300 prose-a:text-fuchsia-400 hover:prose-a:text-fuchsia-300 prose-strong:text-violet-300 mb-12 relative z-10"
                dangerouslySetInnerHTML={{ __html: md.render(activeModule?.content_markdown || '') }}
              />

              {/* Scenario Assessment Block */}
              {activeModule?.scenario && activeModule.status !== 'completed' && (
                <div className="mt-8 pt-8 border-t border-slate-800">
                  <AssessmentView
                    exerciseId={activeModule.scenario.id}
                    exerciseType={activeModule.scenario.exercise_type || 'scenario'}
                    mcqOptions={activeModule.scenario.mcq_options}
                    scenarioText={activeModule.scenario.scenario_text}
                    onGraded={(grade) => {
                      if (grade === 'pass') {
                        onRefresh();
                      }
                    }}
                  />
                </div>
              )}

              {activeModule?.scenario && activeModule.status === 'completed' && (
                <div className="mt-8 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Scenario Complete</span>
                  </div>
                </div>
              )}

              {/* Module Navigation */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setActiveModuleIndex(activeModuleIndex - 1)}
                  disabled={activeModuleIndex === 0}
                  className="px-4 py-2 text-slate-400 hover:text-violet-400 disabled:opacity-0 disabled:pointer-events-none transition-colors font-medium text-sm flex items-center gap-2"
                >
                  ← Previous Module
                </button>

                {activeModule?.scenario && activeModule.status === 'completed' && (
                  <button
                    onClick={() => {
                      const nextIndex = activeModuleIndex + 1;
                      if (nextIndex <= pathData.modules.length) {
                        setActiveModuleIndex(nextIndex);
                      }
                    }}
                    className="px-6 py-3 btn-primary flex items-center gap-2 ml-auto text-sm"
                  >
                    {activeModuleIndex + 1 === pathData.modules.length ? 'Complete Path' : 'Next Module'} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
