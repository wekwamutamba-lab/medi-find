import jwt from 'jsonwebtoken';
import { pool } from '../src/db/pool';

export const TEST_SECRET = process.env.SUPABASE_JWT_SECRET || 'test-secret';

export async function createTestUser(role: 'admin' | 'pharmacist' = 'pharmacist') {
  const id = (await import('crypto')).randomUUID();
  const email = `test-${id}@example.com`;
  await pool.query(
    `INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET role=$3`,
    [id, 'Test User', role],
  );
  const token = jwt.sign({ sub: id, email, role: 'authenticated' }, TEST_SECRET, { algorithm: 'HS256' });
  return { id, email, token, role };
}

export async function cleanupTestUser(id: string) {
  await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
}
