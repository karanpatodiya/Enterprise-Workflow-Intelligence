import { Target, Search, FileText, Zap, BookOpen } from 'lucide-react';

interface RoadmapOverviewProps {
  categoryName: string;
  onContinue: () => void;
  onBack: () => void;
}

export function RoadmapOverview({ categoryName, onContinue, onBack }: RoadmapOverviewProps) {
  const steps = [
    {
      icon: <Target className="w-6 h-6 text-fuchsia-400" />,
      title: "1. Skill Baseline",
      description: `We establish your current proficiency in ${categoryName}.`
    },
    {
      icon: <Search className="w-6 h-6 text-violet-400" />,
      title: "2. Deep Evaluation",
      description: "You'll answer a series of scenario-based and conceptual questions to test your real-world readiness."
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      title: "3. Gap Analysis",
      description: "Our intelligence engine instantly analyzes your answers, identifying exact strengths and specific weakness vectors."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "4. Personalized Roadmap",
      description: "We generate a customized 5-stage curriculum loaded with verified resources precisely targeting your gaps."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-cyan-400" />,
      title: "5. Absolute Mastery",
      description: "You execute the path, passing rigorous scenario assessments until you reach Senior-level impact."
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto reveal-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-3 text-white">
            Enterprise Intelligence Workflow
          </h2>
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            You have selected <strong className="text-violet-400">{categoryName}</strong>. 
            Here is how we will evaluate and rapidly accelerate your expertise.
          </p>
        </div>
        
      </div>

      <div className="relative border-l-2 border-slate-800 ml-6 md:ml-0 md:border-l-0 md:grid md:grid-cols-5 md:gap-4 md:pt-16">
        {/* Horizontal Line for Desktop */}
        <div className="hidden md:block absolute top-[94px] left-10 right-10 h-0.5 bg-slate-800 z-0"></div>
        
        {steps.map((step, index) => (
          <div key={index} className="relative pl-8 md:pl-0 mb-10 md:mb-0 z-10 md:flex md:flex-col md:items-center text-left md:text-center group">
            {/* Circle Indicator */}
            <div className="absolute left-[-9px] md:relative md:left-0 md:mx-auto w-4 h-4 rounded-full bg-slate-800 border-2 border-violet-500 md:mb-6 group-hover:bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-colors"></div>
            
            <div className="dash-tile md:w-full md:px-4 md:py-6 group-hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 md:mx-auto">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed text-balance">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-between border-t border-slate-800/50 pt-8">
        <button 
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-slate-300 hover:text-white transition-colors"
        >
          &larr; Back to Skills
        </button>
        <button 
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-1"
        >
          Begin Evaluation &rarr;
        </button>
      </div>
    </div>
  );
}
