import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { ENTERPRISE_MATRIX } from '../src/data/enterprise-matrix';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://workforce:securepassword@localhost:5432/workforce_intelligence';

async function runMigrations() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const schemaDir = path.resolve(__dirname, '../database/schema');
    const files = fs
      .readdirSync(schemaDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const fullPath = path.join(schemaDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`Applying ${file}...`);
      await client.query(sql);
    }

    console.log('Migrations applied successfully.');

    // Seed Enterprise Structure Matrix
    console.log('Seeding Enterprise Category Matrix...');
    for (const category of ENTERPRISE_MATRIX) {
      const catRes = await client.query(
        `INSERT INTO platform_categories (slug, name, description, role_type) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, role_type = EXCLUDED.role_type
         RETURNING id`,
        [category.slug, category.name, category.description, category.role_type]
      );
      const catId = catRes.rows[0].id;

      for (const role of category.roles) {
        const roleRes = await client.query(
          `INSERT INTO platform_roles (category_id, slug, name, level, description) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, level = EXCLUDED.level
           RETURNING id`,
          [catId, role.slug, role.name, role.level, role.description]
        );
        const roleId = roleRes.rows[0].id;

        for (const skill of role.skills) {
          await client.query(
            `INSERT INTO platform_role_skills (role_id, skill_name, expected_proficiency_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (role_id, skill_name) DO UPDATE SET expected_proficiency_level = EXCLUDED.expected_proficiency_level`,
            [roleId, skill.name, skill.expected_proficiency]
          );
        }
      }
    }
    console.log('Enterprise Matrix successfully seeded into PostgreSQL.');
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exit(1);
});
