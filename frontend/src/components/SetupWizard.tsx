import { useState } from 'react';
import { Database, Loader2, Sparkles, UserCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface SetupWizardProps {
  systemStatus: {
    status: 'ok' | 'degraded';
    checks: {
      database: 'up' | 'down';
      frontendBuild: 'present' | 'missing';
    };
  } | undefined;
  onCompleted: () => void;
}

export function SetupWizard({ systemStatus, onCompleted }: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);

  const bootstrapSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/system/setup/bootstrap', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to bootstrap setup session');
      }

      login(data.token, data.tenantId, data.user);
      onCompleted();
    } catch (err: any) {
      setError(err.message || 'Bootstrap failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto hero-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gradient">System Verification</h2>
        <div className="text-xs uppercase tracking-widest text-slate-400">Step {step}/2</div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <p className="text-slate-300">Check system dependencies before initializing the AI Curriculum workspace.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-200 font-medium mb-2">
                <Database className="w-4 h-4" /> Database
              </div>
              <div className={systemStatus?.checks.database === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                {systemStatus?.checks.database ?? 'unknown'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-200 font-medium mb-2">
                <Sparkles className="w-4 h-4" /> Frontend Build
              </div>
              <div className={systemStatus?.checks.frontendBuild === 'present' ? 'text-emerald-400' : 'text-amber-400'}>
                {systemStatus?.checks.frontendBuild ?? 'unknown'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={systemStatus?.checks.database !== 'up'}
            className="btn-primary px-6 py-3"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="text-slate-300">Create a secure demo session. This provisions your tenant and user account.</p>
          <button onClick={bootstrapSession} disabled={loading} className="btn-primary px-6 py-3 inline-flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle2 className="w-4 h-4" />}
            Initialize Workspace
          </button>
        </div>
      )}
    </div>
  );
}
