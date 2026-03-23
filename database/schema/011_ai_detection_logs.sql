-- Migration 011: AI Detection Logs
-- Tracks behavioral signals during assessments to compute AI usage risk scores

CREATE TABLE IF NOT EXISTS ai_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID,                        -- nullable for guest/anon sessions
    assessment_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
    question_id UUID REFERENCES generated_questions(id) ON DELETE SET NULL,
    paste_detected BOOLEAN DEFAULT FALSE,
    paste_count INTEGER DEFAULT 0,
    typing_speed_wpm NUMERIC(6,2),           -- average words per minute while typing
    response_time_ms INTEGER,                -- total time from question display to submit
    character_burst_count INTEGER DEFAULT 0, -- number of large sudden input bursts (>20 chars at once)
    ai_probability NUMERIC(5,2) DEFAULT 0,   -- 0-100 risk score
    writing_style_score NUMERIC(5,2),        -- how consistent with prior answers (0-100)
    raw_events JSONB,                        -- raw event array for audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_detection_employee ON ai_detection_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_detection_assessment ON ai_detection_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_detection_question ON ai_detection_logs(question_id);
