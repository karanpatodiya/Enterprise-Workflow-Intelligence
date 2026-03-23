-- Migration 012: Final Reports Storage
-- Stores generated final intelligence reports per assessment

CREATE TABLE IF NOT EXISTS final_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID,                                           -- links to employees or user session
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
    profile_snapshot JSONB NOT NULL DEFAULT '{}',               -- user profile at time of assessment
    skill_breakdown JSONB NOT NULL DEFAULT '[]',                -- per-skill scores array
    strengths JSONB NOT NULL DEFAULT '[]',                      -- strength tags
    weaknesses JSONB NOT NULL DEFAULT '[]',                     -- weakness tags
    roadmap_summary JSONB NOT NULL DEFAULT '[]',                -- condensed learning path modules
    ai_risk_score NUMERIC(5,2) DEFAULT 0,                       -- 0-100 AI usage risk
    ai_risk_label VARCHAR(20) DEFAULT 'Low',                    -- Low / Medium / High
    report_markdown TEXT,                                        -- full markdown report from Gemini
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_final_reports_employee ON final_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_final_reports_tenant ON final_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_final_reports_assessment ON final_reports(assessment_result_id);
