import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Briefcase, GraduationCap, ChevronRight, Compass } from 'lucide-react';
import { cn } from '../react-utils';
import apiClient from '../services/api';

const onboardingSchema = z.object({
  currentRole: z.string().min(2, 'Current role is required'),
  yearsOfExperience: z.number().min(0).max(50),
  knownSkills: z.string().min(2, 'Enter at least one skill'),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  onComplete: () => void;
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState<'suggestions' | 'form'>('suggestions');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      yearsOfExperience: 0,
    },
  });

  const onSubmit = async (data: OnboardingData) => {
    setIsGenerating(true);
    setError(null);
    try {
      // Convert comma-separated string to array
      const skillsArray = data.knownSkills.split(',').map((s) => s.trim()).filter(Boolean);

      await apiClient.post('/learning/generate', {
        ...data,
        knownSkills: skillsArray,
      });
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate learning path. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto hero-card reveal-up p-8">
      {step === 'suggestions' ? (
        <div className="space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 neon-shadow">
              <Compass className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-gradient">
              Select Your Path
            </h2>
            <p className="text-slate-400">
              Choose a template below or create a fully custom curriculum tailored to your specific role and experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setValue('currentRole', 'Cloud Architect');
                setValue('yearsOfExperience', 6);
                setValue('knownSkills', 'AWS, Terraform, System Design, Networking');
                setStep('form');
              }}
              className="p-6 text-left rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <h4 className="text-lg font-bold text-violet-300 mb-1">Cloud Architecture</h4>
                <p className="text-sm text-slate-400 text-balance mb-4">Focusing on designing resilient, secure, and highly scalable cloud infrastructure and multi-region deployments.</p>
              </div>
              <div className="flex justify-end">
                <ChevronRight className="w-5 h-5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </div>
            </button>
            <button
              onClick={() => {
                setValue('currentRole', 'Site Reliability Engineer (SRE)');
                setValue('yearsOfExperience', 4);
                setValue('knownSkills', 'Kubernetes, Docker, Linux, CI/CD');
                setStep('form');
              }}
              className="p-6 text-left rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <h4 className="text-lg font-bold text-pink-300 mb-1">Reliability & Operations</h4>
                <p className="text-sm text-slate-400 text-balance mb-4">Deep dive into orchestrating systems, monitoring observability metrics, and mitigating high-stakes incidents.</p>
              </div>
              <div className="flex justify-end">
                <ChevronRight className="w-5 h-5 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </div>
            </button>
            <button
              onClick={() => {
                setValue('currentRole', 'Data Engineer');
                setValue('yearsOfExperience', 5);
                setValue('knownSkills', 'Python, SQL, Spark, Airflow, Data Warehousing');
                setStep('form');
              }}
              className="p-6 text-left rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/40 transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <h4 className="text-lg font-bold text-fuchsia-300 mb-1">Data Engineering</h4>
                <p className="text-sm text-slate-400 text-balance mb-4">Advanced ETL pipelines, data lake architecture, and performance tuning for petabyte-scale data processing.</p>
              </div>
              <div className="flex justify-end">
                <ChevronRight className="w-5 h-5 text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </div>
            </button>
            <button
              onClick={() => {
                setValue('currentRole', 'Cybersecurity Analyst');
                setValue('yearsOfExperience', 3);
                setValue('knownSkills', 'Network Security, Threat Hunting, SIEM, Incident Response');
                setStep('form');
              }}
              className="p-6 text-left rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <h4 className="text-lg font-bold text-rose-300 mb-1">Cybersecurity & Defense</h4>
                <p className="text-sm text-slate-400 text-balance mb-4">Intended for securing enterprise systems, advanced threat modeling, and performing robust security audits.</p>
              </div>
              <div className="flex justify-end">
                <ChevronRight className="w-5 h-5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full py-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500 transition-all text-slate-200 font-medium"
          >
            I want to create a Custom Curriculum
          </button>
        </div>
      ) : (
        <>
          <div className="text-center mb-8 relative">
            <button onClick={() => setStep('suggestions')} className="absolute left-0 top-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              &larr; Back
            </button>
            <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 neon-shadow">
              <BrainCircuit className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-gradient">
              AI Career Intelligence
            </h2>
            <p className="text-slate-400">
              Tell us where you are and where you want to go. Our AI will analyze enterprise knowledge to map your personalized learning path.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-400" /> Current Role Mastery
              </label>
              <input
                {...register('currentRole')}
                className={cn(
                  'w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all',
                  errors.currentRole ? 'border-red-500/50' : 'border-slate-800'
                )}
                placeholder="e.g. Senior Software Engineer"
              />
              {errors.currentRole && <p className="text-rose-400 text-xs">{errors.currentRole.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-fuchsia-400" /> Years of Experience
              </label>
              <input
                {...register('yearsOfExperience', { valueAsNumber: true })}
                type="number"
                className={cn(
                  'w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all',
                  errors.yearsOfExperience ? 'border-red-500/50' : 'border-slate-800'
                )}
              />
              {errors.yearsOfExperience && <p className="text-rose-400 text-xs">{errors.yearsOfExperience.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-pink-400" /> Currently Known Skills (Comma Separated)
              </label>
              <p className="text-xs text-slate-500 mb-2">We will skip basic lessons for these skills.</p>
              <textarea
                {...register('knownSkills')}
                rows={3}
                className={cn(
                  'w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none',
                  errors.knownSkills ? 'border-red-500/50' : 'border-slate-800'
                )}
                placeholder="e.g. JavaScript, React, System Architecture, Basic SQL"
              />
              {errors.knownSkills && <p className="text-rose-400 text-xs">{errors.knownSkills.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Curriculum...
                </>
              ) : (
                'Generate My Learning Path'
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
