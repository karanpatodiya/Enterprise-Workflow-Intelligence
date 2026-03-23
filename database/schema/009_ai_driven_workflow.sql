-- Migration 009: AI-Driven Workflow
-- Supports dynamic question generation and AI-powered evaluation using Google Gemini

-- Table for dynamically generated questions
CREATE TABLE IF NOT EXISTS generated_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Optional, can be null for guest evaluations
    role_name VARCHAR(255) NOT NULL,
    experience_level VARCHAR(100),
    skills_assessed JSONB NOT NULL DEFAULT '[]',
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- scenario, debugging, short_explanation, MCQ
    skill_tag VARCHAR(100),
    options JSONB, -- For MCQ: { "A": "...", "B": "..." }
    correct_answer TEXT,
    answer_guidance TEXT, -- AI's internal key for evaluation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user answers and AI evaluations
CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
    question_id UUID REFERENCES generated_questions(id) ON DELETE SET NULL,
    user_answer TEXT NOT NULL,
    ai_score INTEGER, -- 0-10 based on Gemini evaluation
    ai_reasoning TEXT,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add AI workflow columns to assessment_results if not present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_results' AND column_name='user_profile') THEN
        ALTER TABLE assessment_results ADD COLUMN user_profile JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_results' AND column_name='learning_recommendations') THEN
        ALTER TABLE assessment_results ADD COLUMN learning_recommendations JSONB;
    END IF;
END $$;
