import { useState, useEffect } from 'react';
import { Server, LineChart, BrainCircuit, Monitor, Bug, TrendingUp, Users, Book } from 'lucide-react';
import apiClient from '../services/api';

interface Category {
  id: string;
  name: string;
  description: string;
}

const ICONS: Record<string, React.ReactNode> = {
  'frontend-engineering': <Monitor className="w-8 h-8 text-pink-400" />,
  'backend-engineering': <Server className="w-8 h-8 text-rose-400" />,
  'qa': <Bug className="w-8 h-8 text-emerald-400" />,
  'business-analysis': <LineChart className="w-8 h-8 text-cyan-400" />,
  'sales': <TrendingUp className="w-8 h-8 text-amber-400" />,
  'hr': <Users className="w-8 h-8 text-fuchsia-400" />
};



interface SkillSelectionProps {
  onSelect: (categoryId: string, categoryName: string) => void;
}

export function SkillSelection({ onSelect }: SkillSelectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await apiClient.get('/assessments/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Loading Knowledge Matrix...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 reveal-up">
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 neon-shadow">
          <BrainCircuit className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-3 text-gradient">
          Identify Your Path
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Select a core competency below. We will evaluate your precise proficiency level and generate a hyper-personalized roadmap to achieve absolute mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id, cat.name)}
            className="group dash-tile text-left flex flex-col h-full"
          >
            <div className="mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {ICONS[cat.id] || <Book className="w-8 h-8 text-slate-400" />}
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">{cat.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed text-balance">
                {cat.description}
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Begin Evaluation</span>
              <span className="text-violet-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
