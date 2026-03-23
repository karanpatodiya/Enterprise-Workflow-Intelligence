-- Multi-tenancy core
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

-- Organization structure
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_tenant_name ON departments(tenant_id, name);

-- Users and Access Control
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

CREATE TABLE IF NOT EXISTS user_department_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_scopes_user ON user_department_scopes(user_id);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  "current_role" VARCHAR(200),
  role_level VARCHAR(50) NOT NULL,
  manager_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email ON employees(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role_level ON employees(role_level);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_tenant ON skills(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_tenant_name ON skills(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Role Competencies (requirements for each role level)
CREATE TABLE IF NOT EXISTS role_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_level VARCHAR(50) NOT NULL,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_proficiency_level INTEGER NOT NULL CHECK(required_proficiency_level >= 1 AND required_proficiency_level <= 5),
  weight NUMERIC(3,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_role_competencies_tenant ON role_competencies(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_competencies_unique ON role_competencies(tenant_id, role_level, skill_id);

-- Employee Skills
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER NOT NULL CHECK(proficiency_level >= 1 AND proficiency_level <= 5),
  years_of_experience NUMERIC(5,2),
  last_assessment_date TIMESTAMP,
  raw_score NUMERIC(5,2),
  assessment_scores NUMERIC(5,2)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_skills_unique ON employee_skills(employee_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_assessment_date ON employee_skills(last_assessment_date);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  scoring_method VARCHAR(50) NOT NULL,
  total_points INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_tenant ON assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assessments_skill ON assessments(skill_id);

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  rubric_id UUID,
  correct_answer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);

-- Scoring Rubrics
CREATE TABLE IF NOT EXISTS scoring_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scoring_rubrics_assessment ON scoring_rubrics(assessment_id);

-- Employee Assessment Results
CREATE TABLE IF NOT EXISTS employee_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  score INTEGER,
  max_score INTEGER,
  percentage_score NUMERIC(5,2),
  passed BOOLEAN,
  completion_time_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,
  answers JSONB,
  feedback_ai_generated TEXT,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_employee ON employee_assessment_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON employee_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed ON employee_assessment_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_assessment_results_status ON employee_assessment_results(status);

-- Incident Simulations
CREATE TABLE IF NOT EXISTS incident_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scenario TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  estimated_duration_minutes INTEGER,
  success_criteria TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_simulations_tenant ON incident_simulations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incident_simulations_skill ON incident_simulations(skill_id);

-- Employee Simulation Results
CREATE TABLE IF NOT EXISTS employee_simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES incident_simulations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  success_score NUMERIC(5,2),
  decisions_log JSONB,
  overall_feedback TEXT,
  ai_assessment JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulation_results_employee ON employee_simulation_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_completed ON employee_simulation_results(completed_at);

-- Knowledge Documents (for RAG)
CREATE TABLE IF NOT EXISTS company_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  original_file_path VARCHAR(500),
  file_type VARCHAR(20),
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  is_indexed BOOLEAN DEFAULT FALSE,
  vector_store_id VARCHAR(500),
  version INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON company_knowledge_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_indexed ON company_knowledge_documents(is_indexed);
CREATE INDEX IF NOT EXISTS idx_documents_type ON company_knowledge_documents(type);

-- Document Chunks (for RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES company_knowledge_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding JSONB,
  vector_store_chunk_id VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant ON document_chunks(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_vector ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Skill Risk Tracking
CREATE TABLE IF NOT EXISTS skill_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2),
  risk_category VARCHAR(50),
  at_risk_skills JSONB,
  concentration_risk NUMERIC(3,2),
  last_approved_update TIMESTAMP,
  update_due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_risks_employee ON skill_risks(employee_id);
CREATE INDEX IF NOT EXISTS idx_skill_risks_tenant ON skill_risks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skill_risks_category ON skill_risks(risk_category);

-- Promotion Readiness Analysis
CREATE TABLE IF NOT EXISTS promotion_readiness_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  target_role_level VARCHAR(50) NOT NULL,
  readiness_score NUMERIC(5,2),
  readiness_category VARCHAR(50),
  skill_gaps JSONB,
  strengths JSONB,
  development_areas JSONB,
  timeline_to_readiness INTEGER,
  risk_factors TEXT[],
  recommendations TEXT[],
  analysis_date TIMESTAMP NOT NULL,
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_readiness_employee ON promotion_readiness_analysis(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotion_readiness_tenant ON promotion_readiness_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_readiness_role_level ON promotion_readiness_analysis(target_role_level);

-- Analytics Snapshots (cached)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMP NOT NULL,
  team_readiness_scores JSONB,
  department_risk_clusters JSONB,
  promotion_pipeline_metrics JSONB,
  aggregate_readiness_score NUMERIC(5,2),
  aggregate_risk_level VARCHAR(50),
  executive_recommendations TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_tenant ON analytics_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date DESC);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(500),
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Skill Scoring Models (versioning)
CREATE TABLE IF NOT EXISTS skill_scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  algorithm_description TEXT,
  weights JSONB NOT NULL,
  calibration_factors JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_models_version ON skill_scoring_models(version);
CREATE INDEX IF NOT EXISTS idx_scoring_models_active ON skill_scoring_models(is_active);
