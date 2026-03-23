-- Migration 013: Mastery Challenge Results
-- Stores results from the Absolute Mastery stage (gating the certificate)

CREATE TABLE IF NOT EXISTS mastery_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    skill VARCHAR(255) NOT NULL,
    challenge_text TEXT NOT NULL,
    user_response TEXT,
    ai_score INTEGER CHECK(ai_score >= 0 AND ai_score <= 100),  -- 0-100
    ai_reasoning TEXT,
    passed BOOLEAN DEFAULT FALSE,                                 -- true if score >= 60
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mastery_results_employee ON mastery_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_mastery_results_tenant ON mastery_results(tenant_id);
