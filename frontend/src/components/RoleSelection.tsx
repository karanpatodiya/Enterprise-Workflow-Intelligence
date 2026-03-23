import { useState, useEffect } from 'react';
import { Network, ArrowRight } from 'lucide-react';
import apiClient from '../services/api';

interface Role {
  id: string;
  slug: string;
  name: string;
  level: string;
  description: string;
}

interface RoleSelectionProps {
  categoryId: string;
  categoryName: string;
  onSelect: (roleId: string, roleName: string, experienceLevel: string) => void;
  onBack: () => void;
}

export function RoleSelection({ categoryId, categoryName, onSelect, onBack }: RoleSelectionProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate');

  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data } = await apiClient.get(`/assessments/categories/${categoryId}/roles`);
        setRoles(data);
      } catch (err) {
        console.error('Failed to load roles', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoles();
  }, [categoryId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-400 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Loading Professional Matrix...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 reveal-up">
      <div className="text-center mb-10">
        <button 
          onClick={onBack}
          className="text-sm font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-widest mb-6 block mx-auto py-2 px-4 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-800"
        >
          &larr; Back to Domains
        </button>
        <div className="mx-auto w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4 neon-shadow">
          <Network className="w-8 h-8 text-fuchsia-400" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-2 text-gradient">
          Target Role Profile
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Select your target level for <span className="text-slate-200 font-semibold">{categoryName}</span>. The AI assessment engine will dynamically adapt its difficulty and skill matrix mapping.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          {['Beginner', 'Intermediate', 'Advanced'].map(level => (
            <button
              key={level}
              onClick={() => setExperienceLevel(level)}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                experienceLevel === level 
                  ? 'bg-fuchsia-500 text-white border-2 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
                  : 'bg-slate-800/50 text-slate-400 border-2 border-slate-700 hover:border-fuchsia-500/50 hover:text-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id, role.name, experienceLevel)}
            className="w-full text-left group dash-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-fuchsia-500/50 hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden"
          >
            {/* Hover highlight effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 pointer-events-none" />
            
            <div className="flex-1 pr-6 z-10">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-300 bg-fuchsia-500/20 rounded-full border border-fuchsia-500/30">
                  {role.level}
                </span>
                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-white transition-colors">{role.name}</h3>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                {role.description}
              </p>
            </div>
            
            <div className="mt-6 md:mt-0 shrink-0 z-10">
              <div className="flex items-center text-sm font-semibold text-fuchsia-400 group-hover:text-fuchsia-300">
                Launch Assessment <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
