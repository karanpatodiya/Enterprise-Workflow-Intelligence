-- Add MCQ support to scenario_exercises
ALTER TABLE scenario_exercises ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(50) DEFAULT 'scenario';
ALTER TABLE scenario_exercises ADD COLUMN IF NOT EXISTS mcq_options JSONB;
ALTER TABLE scenario_exercises ADD COLUMN IF NOT EXISTS mcq_correct_option VARCHAR(255);

