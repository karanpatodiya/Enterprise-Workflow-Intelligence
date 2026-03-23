import { useState } from 'react';
import { User, Briefcase, GraduationCap, Target, Send, BrainCircuit } from 'lucide-react';

interface ProfileFormProps {
  onComplete: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  experience: number;
  currentRole: string;
  knownSkills: string[];
  goalRole: string;
}

export function ProfileForm({ onComplete }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    experience: 2,
    currentRole: '',
    knownSkills: [],
    goalRole: ''
  });
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.knownSkills.includes(skillInput.trim())) {
      setProfile({ ...profile, knownSkills: [...profile.knownSkills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 reveal-up">
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 neon-shadow">
          <BrainCircuit className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-3 text-gradient">
          Professional Profile Setup
        </h2>
        <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
          Enter your professional background. Our evaluation engine will tailor your assessment path.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="dash-tile p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <User className="w-3 h-3" /> Full Name
            </label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="e.g. Alex Rivera"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> Yrs Experience
            </label>
            <input
              type="number"
              required
              min="0"
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) })}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Briefcase className="w-3 h-3" /> Current Role
          </label>
          <input
            type="text"
            required
            value={profile.currentRole}
            onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="e.g. Junior Web Developer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Target className="w-3 h-3" /> Goal Role
          </label>
          <input
            type="text"
            required
            value={profile.goalRole}
            onChange={(e) => setProfile({ ...profile, goalRole: e.target.value })}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="e.g. Senior Software Architect"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Known Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="e.g. React, Node.js, SQL"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.knownSkills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-sm flex items-center gap-2">
                {skill}
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, knownSkills: profile.knownSkills.filter((_, idx) => idx !== i) })}
                  className="hover:text-rose-400 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-3 group mt-8"
        >
          Begin Evaluation
          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
