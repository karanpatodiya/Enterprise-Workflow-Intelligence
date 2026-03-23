import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://workforce:securepassword@localhost:5432/workforce_intelligence',
});

async function run() {
  try {
    const tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantRes.rows.length === 0) {
      console.log('No tenants found.');
      return;
    }
    const tenantId = tenantRes.rows[0].id;

    const employeeRes = await pool.query(
      'SELECT id FROM employees WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );
    if (employeeRes.rows.length === 0) {
      console.log('No employees found for tenant.');
      return;
    }
    const employeeId = employeeRes.rows[0].id;
    
    const token = jwt.sign({
      userId: employeeId,
      roles: ['admin'],
      permissions: [
        'read:analytics',
        'read:skills',
        'read:assessments',
        'execute:assessments',
        'execute:rag-queries',
        'write:analytics',
      ]
    }, process.env.JWT_SECRET || 'default-secret-change-me', { expiresIn: '1y' });
    
    const envContent = `VITE_API_URL=http://localhost:3000/api\nVITE_TENANT_ID=${tenantId}\nVITE_AUTH_TOKEN=${token}\n`;
    fs.writeFileSync('./frontend/.env.local', envContent);
    console.log('Token generated and saved to frontend/.env.local');
    console.log(`tenantId=${tenantId}`);
    console.log(`employeeId=${employeeId}`);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
