import { Award, Download, RefreshCw, Star, CheckCircle, BrainCircuit } from 'lucide-react';

interface CertificateViewProps {
  categoryName: string;
  skillLevel?: string;
  strengths?: string[];
  onStartOver: () => void;
}

export function CertificateView({ categoryName, skillLevel = 'Advanced', strengths = [], onStartOver }: CertificateViewProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-4xl mx-auto reveal-up">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl delay-300" />
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mb-8 print:hidden relative z-10">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-slate-500 transition-all font-medium"
        >
          <Download className="w-4 h-4" /> Export Certificate
        </button>
        <button
          onClick={onStartOver}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 rounded-xl border border-violet-500/30 hover:border-violet-500/50 transition-all font-medium"
        >
          <RefreshCw className="w-4 h-4" /> New Assessment
        </button>
      </div>

      {/* Certificate */}
      <div className="relative z-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.2)] print:border-emerald-600 print:shadow-none print:rounded-none">
        {/* Top border accent */}
        <div className="h-2 w-full bg-gradient-to-r from-violet-500 via-emerald-500 to-fuchsia-500" />

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-emerald-500/30 rounded-tl-xl" />
        <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-emerald-500/30 rounded-tr-xl" />
        <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-emerald-500/30 rounded-bl-xl" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-emerald-500/30 rounded-br-xl" />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16,185,129,0.3) 0%, transparent 50%)',
        }} />

        <div className="relative z-10 p-12 md:p-16 text-center">
          {/* Logo / badge */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-violet-500/30 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <Award className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Header */}
          <p className="text-xs font-bold tracking-[0.4em] text-emerald-400 uppercase mb-2 print:text-emerald-700">
            Enterprise Intelligence Workflow
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 print:text-slate-900" style={{
            textShadow: '0 0 40px rgba(16,185,129,0.4)'
          }}>
            Certificate of Mastery
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mb-8" />

          {/* Presented to */}
          <p className="text-slate-400 text-lg mb-4 print:text-slate-600">This certifies the successful completion of</p>

          {/* Role / Category */}
          <div className="inline-block px-8 py-4 bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-fuchsia-500/10 border border-emerald-500/30 rounded-2xl mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-violet-400 to-fuchsia-400 print:text-emerald-700">
              {categoryName}
            </h2>
          </div>

          {/* Skill Level Badge */}
          <div className="flex justify-center gap-3 mb-8">
            <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border shadow-lg ${skillLevel === 'Advanced'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20 print:text-emerald-700 print:border-emerald-500'
              : skillLevel === 'Intermediate'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20 print:text-amber-700 print:border-amber-500'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/20 print:text-blue-700 print:border-blue-500'
              }`}>
              <Star className="w-4 h-4 fill-current" />
              {skillLevel} Level Achieved
            </span>
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mb-4 print:text-slate-600">Verified Competencies</p>
              <div className="flex flex-wrap justify-center gap-2">
                {strengths.slice(0, 6).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 text-slate-300 text-sm rounded-full border border-slate-700 print:border-slate-400 print:text-slate-700 print:bg-transparent">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700 print:to-slate-400" />
            <BrainCircuit className="w-5 h-5 text-slate-600 print:text-slate-400" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700 print:to-slate-400" />
          </div>

          {/* Date & signature area */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 print:text-slate-600">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-300 print:text-slate-700 mb-1">Absolute Mastery</p>
              <p className="uppercase tracking-widest text-xs">Stage Completed</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] mb-2">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-400 print:text-slate-600 uppercase tracking-wider">AI Verified</p>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold text-slate-300 print:text-slate-700 mb-1">{today}</p>
              <p className="uppercase tracking-widest text-xs">Date of Completion</p>
            </div>
          </div>
        </div>

        {/* Bottom border accent */}
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-emerald-500 to-violet-500" />
      </div>

      {/* Congratulatory footer message */}
      <div className="mt-8 text-center text-slate-400 print:hidden">
        <p className="text-lg font-semibold text-slate-300 mb-2">🎉 Congratulations on achieving Absolute Mastery!</p>
        <p className="text-sm">Your personalized certificate has been generated. Export it as PDF or start a new assessment.</p>
      </div>
    </div>
  );
}
