import { pool } from '../src/db/pool';

async function inspectCounts() {
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n=== EXISTING TABLE RECORD COUNTS ===');

    for (const row of tables.rows) {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM public."${row.table_name}"`
      );

      console.log(`${row.table_name}: ${result.rows[0].total}`);
    }

    const pharmacy = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'pharmacies'
      ) AS exists
    `);

    console.log('\nPHARMACIES TABLE EXISTS:', pharmacy.rows[0].exists);

  } catch (error) {
    console.error('INSPECTION ERROR:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspectCounts();
