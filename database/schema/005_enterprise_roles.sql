-- Multi-Domain Enterprise Workforce Structure

-- Create explicitly defined platform categories (Domains)
CREATE TABLE IF NOT EXISTS platform_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_categories_slug ON platform_categories(slug);

-- Create specific roles within those categories
CREATE TABLE IF NOT EXISTS platform_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES platform_categories(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL, -- Junior, Mid, Senior, Lead, Architect
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_roles_category ON platform_roles(category_id);
CREATE INDEX IF NOT EXISTS idx_platform_roles_slug ON platform_roles(slug);

-- Define the skills expected of each role
CREATE TABLE IF NOT EXISTS platform_role_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    expected_proficiency_level INTEGER DEFAULT 3 CHECK(expected_proficiency_level >= 1 AND expected_proficiency_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_role_skills_role ON platform_role_skills(role_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_role_skills_unique ON platform_role_skills(role_id, skill_name);

-- Update assessment_results to stamp the exact role and store the AI intelligence report
ALTER TABLE assessment_results 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES platform_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS ai_insight_report TEXT,
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS skill_scores JSONB;

-- Create an index to quickly lookup results by role
CREATE INDEX IF NOT EXISTS idx_assessment_results_role ON assessment_results(role_id);
