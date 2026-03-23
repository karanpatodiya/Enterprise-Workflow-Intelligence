import { Rocket, BookOpen, ArrowRight, Save } from 'lucide-react';

interface LearningPathProps {
  learningPath: any[];
  onFinish: () => void;
}

export function LearningPath({ learningPath, onFinish }: LearningPathProps) {
  if (!learningPath || learningPath.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <Rocket className="w-12 h-12 text-fuchsia-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-200">No Custom Learning Path Found</h3>
        <p className="max-w-md mt-2">A default curriculum will be assigned based on your assessed skill level.</p>
        <button
          onClick={onFinish}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition"
        >
          Proceed to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 reveal-up">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-100 flex items-center">
          <Rocket className="w-6 h-6 mr-3 text-fuchsia-400" /> Adaptive Learning Path
        </h3>
        <button
          onClick={onFinish}
          className="btn-primary px-6 py-2 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Curriculum
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {learningPath.map((rec, i) => (
          <div key={i} className="dash-card p-6 bg-slate-900/40 border-slate-700/50 hover:border-fuchsia-500/30 transition-colors group flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 shrink-0 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
              <span className="font-bold text-xl">{rec.stage || (i + 1)}</span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-slate-100 mb-1">{rec.topic}</h4>
                <p className="text-slate-400 leading-relaxed">{rec.description}</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Practice Task
                </p>
                <p className="text-sm text-slate-300 italic">"{rec.practice_task || rec.task}"</p>
              </div>
            </div>

            <div className="md:w-48 shrink-0 flex flex-col justify-center">
              {rec.resource && (
                <a
                  href={rec.resource.includes('http') ? rec.resource : `https://www.google.com/search?q=${encodeURIComponent(rec.resource)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-fuchsia-500/30 rounded-lg text-sm text-center font-semibold text-fuchsia-400 hover:bg-fuchsia-500/10 transition flex justify-center items-center gap-2 group-hover:border-fuchsia-500/50"
                >
                  Explore Resource <ArrowRight className="w-3 h-3 group-hover:translate-x-1 duration-300" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
