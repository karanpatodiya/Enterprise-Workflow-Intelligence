export interface AuthState {
  token: string | null;
  tenantId: string | null;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  } | null;
  isLoading: boolean;
  error: string | null;
}

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currentRole: string;
  department: string;
  skills: Skill[];
  assessmentHistory: AssessmentResult[];
  promotionReadiness: number;
  status: 'active' | 'inactive';
  hireDate: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  proficiencyLevel: number;
  yearsOfExperience: number;
  lastAssessmentDate: string;
}

export interface Assessment {
  id: string;
  name: string;
  description: string;
  type: 'skills' | 'scenario' | 'technical';
  totalPoints: number;
  passingScore: number;
  estimatedDurationMinutes: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  points: number;
  options?: string[];
  correctAnswer?: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  employeeId: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  completionTimeSeconds: number;
  startedAt: string;
  completedAt: string;
  feedback: string;
  answers: {
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }[];
}

export interface AnalyticsSnapshot {
  teamReadinessScore: number;
  totalEmployees: number;
  atRiskEmployees: number;
  averageSkillLevel: number;
  promotionPipeline: {
    ready: number;
    nearReady: number;
    developing: number;
  };
  topSkills: string[];
  riskFactors: string[];
  recommendations: string[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  averageReadinessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}
