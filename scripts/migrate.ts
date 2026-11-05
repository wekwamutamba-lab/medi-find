import fs from 'fs';
import path from 'path';
import { pool } from '../src/db/pool';

async function main() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const file of files) {
      const name = file;
      const check = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (check.rowCount && check.rowCount > 0) {
        console.log(`Skipping already applied: ${name}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying: ${name}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        console.log(`Applied: ${name}`);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
