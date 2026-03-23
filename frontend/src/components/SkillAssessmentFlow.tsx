import { useState } from 'react';
import { SkillSelection } from './SkillSelection';
import { RoleSelection } from './RoleSelection';
import { RoadmapOverview } from './RoadmapOverview';
import { PreAssessmentView } from './PreAssessmentView';
import { GapAnalysis } from './GapAnalysis';
import { LearningPath } from './LearningPath';
import { ProfileForm, UserProfile } from './ProfileForm';
import apiClient from '../services/api';
import { Loader2 } from 'lucide-react';

type FlowState = 'profile' | 'selection' | 'role' | 'roadmap' | 'assessment' | 'gap-analysis' | 'learning-path' | 'analyzing';

interface SkillAssessmentFlowProps {
  onPlanGenerated: () => void;
}

export function SkillAssessmentFlow({ onPlanGenerated }: SkillAssessmentFlowProps) {
  const [currentState, setCurrentState] = useState<FlowState>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiDetectedSkills, setAiDetectedSkills] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate');
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const [learningPathData, setLearningPathData] = useState<any[]>([]);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  const handleProfileComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentState('analyzing');
    
    try {
      const { data } = await apiClient.post('/assessments/analyze-profile', profile);
      setAiDetectedSkills(data.skills);
      setCurrentState('selection');
    } catch (err) {
      console.error('AI Analysis failed', err);
      setCurrentState('selection');
    }
  };

  const handleSelectSkill = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setCurrentState('role');
  };

  const handleSelectRole = (roleId: string, roleName: string, level: string) => {
    setSelectedRole({ id: roleId, name: roleName });
    setExperienceLevel(level);
    setCurrentState('roadmap');
  };

  const handleStartAssessment = () => {
    setCurrentState('assessment');
  };

  const handleEvaluationComplete = (result: any) => {
    setAssessmentResult(result);
    setCurrentState('gap-analysis');
  };

  const handleGenerateLearningPath = async () => {
    setIsGeneratingPath(true);
    try {
      const weaknesses = assessmentResult.weaknesses?.length > 0 
        ? assessmentResult.weaknesses 
        : (assessmentResult.skill_scores || [])
            .filter((s: any) => s.score < 60)
            .map((s: any) => s.subskill);
            
      const fallbackWeaknesses = weaknesses.length > 0 ? weaknesses : ['general mastery'];

      const { data } = await apiClient.post('/learning/generate', {
        currentRole: selectedRole?.name || selectedCategory?.name,
        categoryId: selectedCategory?.id,
        yearsOfExperience: 3,
        knownSkills: assessmentResult.strengths,
        weaknesses: fallbackWeaknesses,
      });
      
      setLearningPathData(data.modules || assessmentResult.learning_recommendations || []);
      setCurrentState('learning-path');
    } catch (err: any) {
      console.warn('AI failed to generate learning path, using fallback modules', err);
      // Fallback
      setLearningPathData(assessmentResult.learning_recommendations || [
        { stage: 1, topic: 'Core Leveling', description: 'Review the fundamentals based on your recent evaluation.', resource: 'Internal Wiki', task: 'Follow up on documentation' }
      ]);
      setCurrentState('learning-path');
    } finally {
      setIsGeneratingPath(false);
    }
  };

  return (
    <div className="w-full">
      {currentState === 'profile' && (
        <ProfileForm onComplete={handleProfileComplete} />
      )}

      {currentState === 'analyzing' && (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
          <h2 className="text-2xl font-bold text-gradient uppercase tracking-widest">
            Profile Analysis in Progress
          </h2>
          <p className="text-slate-400 max-w-sm">
            Analyzing your professional background to identify the optimal skill domains for evaluation.
          </p>
        </div>
      )}

      {currentState === 'selection' && (
        <SkillSelection onSelect={handleSelectSkill} />
      )}
      
      {currentState === 'role' && selectedCategory && (
        <RoleSelection
          categoryId={selectedCategory.id!}
          categoryName={selectedCategory.name}
          onSelect={handleSelectRole}
          onBack={() => setCurrentState('selection')}
        />
      )}
      
      {currentState === 'roadmap' && selectedCategory && selectedRole && (
        <RoadmapOverview 
          categoryName={`${selectedCategory.name} - ${selectedRole.name}`} 
          onContinue={handleStartAssessment} 
          onBack={() => setCurrentState('role')} 
        />
      )}
      
      {currentState === 'assessment' && selectedCategory && selectedRole && (
        <PreAssessmentView 
          categoryId={selectedCategory.id} 
          categoryName={selectedCategory.name} 
          roleId={selectedRole.id}
          experienceLevel={experienceLevel}
          skillsToAssess={aiDetectedSkills}
          userProfile={userProfile}
          onCompleted={handleEvaluationComplete} 
        />
      )}
      
      {currentState === 'gap-analysis' && selectedCategory && assessmentResult && (
        <GapAnalysis 
          categoryName={selectedCategory.name}
          roleName={selectedRole?.name}
          result={assessmentResult}
          skillScores={assessmentResult.skill_scores || []}
          onGeneratePath={handleGenerateLearningPath}
          isGenerating={isGeneratingPath}
        />
      )}

      {currentState === 'learning-path' && (
        <LearningPath 
          learningPath={learningPathData}
          onFinish={onPlanGenerated}
        />
      )}
    </div>
  );
}
