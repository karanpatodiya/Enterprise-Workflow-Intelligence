import { Pool } from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/workforce_intelligence',
});

async function seed() {
  console.log('Starting execution of database seeding...');

  try {
    // 1. Create Tenant
    const tenantId = uuidv4();
    await pool.query(
      'INSERT INTO tenants (id, name, slug, industry, size) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, 'Acme Corp', 'acme-corp', 'Technology', '1000-5000']
    );

    // 2. Create User (Admin)
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('password123', 10);
    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, tenantId, 'admin@acmecorp.com', passwordHash, 'admin']
    );

    // 3. Create Departments
    const depts = [
      { id: uuidv4(), name: 'Engineering', description: 'Software Engineering' },
      { id: uuidv4(), name: 'Cybersecurity', description: 'InfoSec' },
      { id: uuidv4(), name: 'Data Science', description: 'AI and Data' },
    ];

    for (const d of depts) {
      await pool.query(
        'INSERT INTO departments (id, tenant_id, name, description) VALUES ($1, $2, $3, $4)',
        [d.id, tenantId, d.name, d.description]
      );
    }

    // 4. Create Employees and Analytics records
    let totalEmployees = 0;

    for (const d of depts) {
      let count = d.name === 'Engineering' ? 120 : d.name === 'Cybersecurity' ? 40 : 60;
      let readinessRatio = d.name === 'Engineering' ? 0.96 : d.name === 'Cybersecurity' ? 0.81 : 0.89;

      for (let i = 0; i < count; i++) {
        const empId = uuidv4();
        totalEmployees++;
        const email = 'emp' + totalEmployees + '@acmecorp.com';
        
        await pool.query(
          'INSERT INTO employees (id, tenant_id, department_id, email, first_name, last_name, "current_role", role_level, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [empId, tenantId, d.id, email, 'First'+totalEmployees, 'Last'+totalEmployees, 'Engineer', 'L3', 'active']
        );

        // Promotion readiness
        const isReady = Math.random() < readinessRatio;
        const readinessCategory = isReady ? 'ready' : (Math.random() < 0.5 ? 'developing' : 'not-ready');
        
        await pool.query(
          'INSERT INTO promotion_readiness_analysis (employee_id, tenant_id, target_role_level, readiness_score, readiness_category, timeline_to_readiness, analysis_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            empId, tenantId, 'L4', 
            isReady ? 85 + Math.random()*15 : 40 + Math.random()*40, 
            readinessCategory, 
            isReady ? 0 : Math.floor(Math.random() * 180),
            new Date()
          ]
        );

        // Skill risks
        const riskCategory = isReady ? 'low' : (Math.random() < 0.2 ? 'high' : 'medium');
        await pool.query(
          'INSERT INTO skill_risks (employee_id, tenant_id, risk_score, risk_category) VALUES ($1, $2, $3, $4)',
          [empId, tenantId, isReady ? 10 : 60 + Math.random()*30, riskCategory]
        );
      }
    }

    // Generate an initial analytics snapshot so the API has something to serve immediately
    const startObj = new Date();
    await pool.query(
      'INSERT INTO analytics_snapshots (tenant_id, snapshot_date, team_readiness_scores, department_risk_clusters, promotion_pipeline_metrics, aggregate_readiness_score, aggregate_risk_level, executive_recommendations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        tenantId, 
        startObj,
        JSON.stringify([]), // Will be recalculated by the query
        JSON.stringify([]),
        JSON.stringify({}),
        85.5,
        'low',
        ['Organization performing well on readiness metrics.']
      ]
    );

    console.log('Database seeded successfully! Tenant ID:', tenantId);
    console.log('Admin login: admin@acmecorp.com / password123');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
