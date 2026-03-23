-- Migration 010: AI workflow persistence enhancements
-- Adds richer storage for Gemini-driven assessments and learning paths

ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS gap_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS final_report TEXT;

ALTER TABLE learning_paths
ADD COLUMN IF NOT EXISTS source_assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS profile_snapshot JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weaknesses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS final_report TEXT;
