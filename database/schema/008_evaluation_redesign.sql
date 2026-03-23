-- Evaluation Methodology Redesign Migration
-- Adds multi-type question support, role nature classification, and deep skill analysis

-- 1. Classify categories as 'technical' or 'business'
ALTER TABLE platform_categories
ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) DEFAULT 'technical';

-- Set business categories
UPDATE platform_categories SET role_type = 'business'
WHERE slug IN ('business-analysis', 'sales', 'hr');

-- 2. Extend question_bank for multi-type questions
ALTER TABLE question_bank
ADD COLUMN IF NOT EXISTS question_type VARCHAR(30) DEFAULT 'MCQ',
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS category VARCHAR(255),
ADD COLUMN IF NOT EXISTS role_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS answer_guidance TEXT;

-- Make options and correct_answer nullable for non-MCQ questions
ALTER TABLE question_bank
ALTER COLUMN options DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL;

-- Index for question type filtering
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);

-- 3. Extend assessment_results for deep skill analysis
ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS skill_maturity JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_recommendations JSONB DEFAULT '[]';
