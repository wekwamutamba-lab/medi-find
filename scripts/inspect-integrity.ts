import { pool } from '../src/db/pool';

async function inspectIntegrity() {
  try {
    const constraints = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.constraint_schema = kcu.constraint_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.constraint_schema = ccu.constraint_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
    `);

    console.log('\n=== EXISTING DATABASE CONSTRAINTS ===');
    console.table(constraints.rows);

    const profiles = await pool.query(`
      SELECT role, COUNT(*)::int AS total
      FROM public.profiles
      GROUP BY role
      ORDER BY role
    `);

    console.log('\n=== PROFILE ROLE COUNTS ===');
    console.table(profiles.rows);

    const batchCheck = await pool.query(`
      SELECT
        COUNT(*)::int AS total_batches,
        COUNT(*) FILTER (
          WHERE medicine_id IS NULL
        )::int AS missing_medicine_ids,
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM public.medicines m
            WHERE m.id = batches.medicine_id
          )
        )::int AS orphaned_batches
      FROM public.batches
    `);

    console.log('\n=== BATCH DATA INTEGRITY ===');
    console.table(batchCheck.rows);

    const duplicateMedicines = await pool.query(`
      SELECT name, strength, dosage_form, pack_size,
             COUNT(*)::int AS total
      FROM public.medicines
      GROUP BY name, strength, dosage_form, pack_size
      HAVING COUNT(*) > 1
    `);

    console.log('\n=== POSSIBLE DUPLICATE MEDICINES ===');
    console.table(duplicateMedicines.rows);

  } catch (error) {
    console.error('INSPECTION ERROR:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspectIntegrity();
