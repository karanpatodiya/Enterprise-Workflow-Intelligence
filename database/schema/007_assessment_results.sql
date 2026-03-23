-- Create the assessment_results table for the enhanced MCQ-based assessment system
-- This table stores results from the /assessments/submit-mcq endpoint

CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    category VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES platform_roles(id) ON DELETE SET NULL,
    role_name VARCHAR(255),
    experience_level VARCHAR(50) DEFAULT 'Intermediate',
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    skill_level VARCHAR(50) NOT NULL DEFAULT 'Beginner',
    strengths JSONB NOT NULL DEFAULT '[]',
    weaknesses JSONB NOT NULL DEFAULT '[]',
    ai_insight_report TEXT,
    skill_scores JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_employee ON assessment_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_tenant ON assessment_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_role ON assessment_results(role_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_created ON assessment_results(created_at DESC);
