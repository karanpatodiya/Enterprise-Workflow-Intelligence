-- Create persistent question bank
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    experience_level VARCHAR(50) NOT NULL,
    skill_tag VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast randomization filtering
CREATE INDEX IF NOT EXISTS idx_question_bank_selection ON question_bank(role_id, experience_level);
