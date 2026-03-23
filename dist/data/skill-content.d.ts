export interface MCQ {
    id: string;
    question_text: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correct_answer: string;
    explanation: string;
    subskill: string;
}
export interface LearningResource {
    title: string;
    url: string;
    type: 'documentation' | 'course' | 'tutorial';
    time: string;
}
export interface SkillCategory {
    id: string;
    name: string;
    description: string;
    questions: MCQ[];
    resources: {
        [subskill: string]: LearningResource[];
    };
}
export declare const skillCategories: Record<string, SkillCategory>;
export declare const getAllCategories: () => SkillCategory[];
export declare const getCategoryById: (id: string) => SkillCategory;
export declare const getRandomMCQs: (categoryId: string, count?: number) => MCQ[];
//# sourceMappingURL=skill-content.d.ts.map