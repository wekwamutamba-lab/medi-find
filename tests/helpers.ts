import jwt from 'jsonwebtoken';
import { pool } from '../src/db/pool';

export const TEST_SECRET = process.env.SUPABASE_JWT_SECRET || 'test-secret';

export async function createTestUser(role: 'admin' | 'pharmacist' | 'staff' = 'pharmacist') {
  const id = (await import('crypto')).randomUUID();
  const pharmacyId = (await import('crypto')).randomUUID();
  const email = `test-${id}@example.com`;

  await pool.query('INSERT INTO pharmacies (id, name, license_number, owner_id) VALUES ($1, $2, $3, $4)', [pharmacyId, `Test Pharmacy ${id}`, `TEST-${id}`, id]);
  await pool.query(
    `INSERT INTO profiles (id, full_name, role, pharmacy_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET role=$3, pharmacy_id=$4`,
    [id, 'Test User', role, pharmacyId],
  );

  const token = jwt.sign({ sub: id, email, role: 'authenticated' }, TEST_SECRET, { algorithm: 'HS256' });
  return { id, email, token, role, pharmacyId };
}

export async function cleanupTestUser(id: string) {
  await pool.query('DELETE FROM pharmacies WHERE owner_id = $1', [id]);
  await pool.query('DELETE FROM stock_movements WHERE performed_by = $1', [id]);
  await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
}
