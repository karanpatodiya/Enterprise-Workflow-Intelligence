import { useQuery } from '@tanstack/react-query';
import apiClient from './services/api';
import { SkillAssessmentFlow } from './components/SkillAssessmentFlow';
import { LearningDashboard } from './components/LearningDashboard';
import { SetupWizard } from './components/SetupWizard';
import { useAuthStore } from './store/auth';
import { AlertTriangle, Zap, CheckCircle2, RefreshCw, Server, Power } from 'lucide-react';


interface SystemStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: 'up' | 'down';
    frontendBuild: 'present' | 'missing';
  };
  urls: {
    api: string;
    health: string;
  };
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const tenantId = useAuthStore((s) => s.tenantId);
  const hasSession = !!token && !!tenantId;

  const {
    data: systemStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      const response = await fetch('/system/status');
      if (!response.ok) {
        throw new Error('Failed to load system status');
      }
      return (await response.json()) as SystemStatus;
    },
    retry: 1,
    refetchInterval: 15000,
  });

  const { data: currentPath, isLoading, error, refetch } = useQuery({
    queryKey: ['learningPath'],
    queryFn: async () => {
      const { data } = await apiClient.get('/learning/current');
      return data;
    },
    enabled: hasSession,
    retry: false, // Don't retry on 404 (means no active path)
  });

  if (hasSession && isLoading) {
    return (
      <div className="min-h-screen bg-[--bg-base] text-[--text-primary] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20">
          <div className="w-[800px] h-[800px] rounded-full border border-indigo-500/20 absolute animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="w-[600px] h-[600px] rounded-full border border-purple-500/20 absolute animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
          <div className="w-[400px] h-[400px] rounded-full border border-emerald-500/20 absolute animate-[pulse_2s_ease-in-out_infinite_1s]" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-8 neon-shadow" />
          <h2 className="text-2xl font-semibold tracking-wider text-gradient">INITIALIZING NEURAL PATHWAY</h2>
          <p className="text-slate-500 mt-2 font-mono tracking-widest text-sm uppercase">Synchronizing cognitive telemetry...</p>
        </div>
      </div>
    );
  }

  // Handle errors not relating to a healthy 404 (no active path)
  if (hasSession && error && (error as any).response?.status !== 404) {
    return (
      <div className="min-h-screen bg-[--bg-base] text-[--text-primary] flex items-center justify-center p-6">
        <div className="hero-card p-12 max-w-2xl text-center border-rose-500/30">
          <h2 className="text-3xl font-bold text-rose-400 mb-4">Connection Terminated</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">Backend request failed. Check token/tenant setup and verify backend is reachable on the same origin.</p>
          <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm text-rose-300 text-left border border-slate-800 overflow-auto">
            {(error as any).response?.data?.error || (error as any).message || 'Server returned an unknown error state.'}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('tenantId');
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-lg border border-rose-500/30 transition-all duration-300"
            >
              Reset Session
            </button>
            <button
              onClick={() => {
                refetchStatus();
                refetch();
              }}
              className="px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold rounded-lg border border-indigo-500/30 transition-all duration-300"
            >
              Retry Backend Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--bg-base] text-[--text-primary] selection:bg-indigo-500/30 relative">
      <div className="ambient-glow" />

      {/* Modern Header */}
      <header className="relative z-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
          <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Zap className="w-8 h-8 text-cyan-400 relative z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white/90">
              SkillForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Pro</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-2 group cursor-pointer hover:text-cyan-400 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Intelligence Core Online
            </span>
            <span className="w-px h-4 bg-slate-800" />
            {hasSession && (
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex items-center gap-2 hover:text-rose-400 transition-colors"
                title="Reset Session"
              >
                <Power className="w-4 h-4" />
                Reset Session
              </button>
            )}
            <span className="uppercase tracking-widest text-xs font-semibold px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">v3.0</span>
          </div>
        </div>
      </header>

      <section className="relative z-20 border-b border-white/5 bg-slate-950/30 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Server className="w-4 h-4 text-slate-400" />
            {statusLoading ? (
              <span className="text-slate-400">Checking backend status...</span>
            ) : systemStatus?.status === 'ok' ? (
              <span className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Backend connected
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Backend degraded
              </span>
            )}
            <span className="text-slate-500">DB: {systemStatus?.checks.database ?? 'unknown'}</span>
            <span className="text-slate-500">Frontend Build: {systemStatus?.checks.frontendBuild ?? 'unknown'}</span>
          </div>
          <button
            onClick={() => {
              refetchStatus();
              refetch();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto px-6 py-12 min-h-[calc(100vh-5rem)] flex items-center justify-center">
        {!hasSession ? (
          <SetupWizard
            systemStatus={systemStatus}
            onCompleted={() => {
              refetchStatus();
              refetch();
            }}
          />
        ) : !currentPath ? (
          <SkillAssessmentFlow onPlanGenerated={() => refetch()} />
        ) : (
          <LearningDashboard pathData={currentPath} onRefresh={() => refetch()} />
        )}
      </main>
    </div>
  );
}
