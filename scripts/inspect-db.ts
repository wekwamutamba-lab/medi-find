import { pool } from '../src/db/pool';

async function inspectDatabase() {
  try {
    const migrations = await pool.query(
      'SELECT * FROM schema_migrations ORDER BY 1'
    );

    console.log('\n=== MIGRATION HISTORY ===');
    console.table(migrations.rows);

    const columns = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = current_schema()
      ORDER BY table_name, ordinal_position
    `);

    console.log('\n=== DATABASE TABLE COLUMNS ===');
    console.table(columns.rows);
  } catch (error) {
    console.error('INSPECTION ERROR:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspectDatabase();
