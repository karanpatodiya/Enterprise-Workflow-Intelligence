import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import apiClient from '../services/api';

interface AnalyticsResponse {
  aggregateReadinessScore: number;
  aggregateRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  promotionPipelineMetrics: {
    totalEmployees: number;
    readyForPromotion: number;
    developingForPromotion: number;
  };
  teamReadinessScores: Array<{
    departmentId: string;
    departmentName: string;
    readinessPercentage: number;
  }>;
  executiveRecommendations: string[];
}

export function AdminInsightsPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminInsights'],
    queryFn: async () => {
      const { data } = await apiClient.get<AnalyticsResponse>('/analytics/snapshot');
      return data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <div className="hero-card p-6 text-slate-400">Loading admin insights...</div>;
  }

  if (error || !data) {
    return <div className="hero-card p-6 text-amber-300">Unable to load insights right now.</div>;
  }

  return (
    <div className="hero-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> Admin Insights
        </h3>
        <span className="text-xs uppercase tracking-wider text-slate-400">{data.aggregateRiskLevel} risk</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
          label="Readiness Score"
          value={`${Math.round(data.aggregateReadinessScore)} / 100`}
          percent={Math.max(0, Math.min(100, Math.round(data.aggregateReadinessScore)))}
        />
        <MetricCard
          icon={<Users className="w-4 h-4 text-indigo-300" />}
          label="Employees"
          value={`${data.promotionPipelineMetrics.totalEmployees}`}
          percent={100}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4 text-cyan-300" />}
          label="Promotion Ready"
          value={`${data.promotionPipelineMetrics.readyForPromotion}`}
          percent={
            data.promotionPipelineMetrics.totalEmployees > 0
              ? Math.round(
                  (data.promotionPipelineMetrics.readyForPromotion /
                    data.promotionPipelineMetrics.totalEmployees) *
                    100
                )
              : 0
          }
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm uppercase tracking-wide text-slate-400">Department Readiness</h4>
        {data.teamReadinessScores.map((dept) => (
          <div key={dept.departmentId} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">{dept.departmentName}</span>
              <span className="text-slate-400">{Math.round(dept.readinessPercentage)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, Math.round(dept.readinessPercentage)))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm uppercase tracking-wide text-slate-400">Recommendations</h4>
        {data.executiveRecommendations.slice(0, 3).map((rec, idx) => (
          <div key={idx} className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
            {rec}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, percent }: { icon: ReactNode; label: string; value: string; percent: number }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
      <div className="flex items-center gap-2 text-slate-300 text-sm mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold text-white mb-2">{value}</div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
