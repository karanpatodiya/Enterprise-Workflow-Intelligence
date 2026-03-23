import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const adminConnectionString =
  process.env.DB_ADMIN_URL ||
  'postgresql://postgres:postgres@localhost:5432/workforce_intelligence';
const appRole = process.env.DB_APP_ROLE || 'workforce';

async function main() {
  const client = new Client({ connectionString: adminConnectionString });
  await client.connect();

  try {
    await client.query(`GRANT USAGE ON SCHEMA public TO ${appRole}`);
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appRole}`
    );
    await client.query(
      `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${appRole}`
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appRole}`
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${appRole}`
    );
    console.log(`Permissions granted to role: ${appRole}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Failed to grant DB permissions', error);
  process.exit(1);
});
