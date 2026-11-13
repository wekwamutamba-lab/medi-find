import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';

export async function onboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { full_name, pharmacy_name, license_number } = req.body;
    const existing = await queryOne<{ pharmacy_id: string | null }>('SELECT pharmacy_id FROM profiles WHERE id = $1', [req.user!.id]);
    if (existing?.pharmacy_id) {
      return res.status(409).json({ data: null, error: { code: 'ALREADY_ONBOARDED', message: 'This account already belongs to a pharmacy.' } });
    }

    const result = await withTransaction(async (client) => {
      // Single-pharmacy system: reuse the existing/central pharmacy record when present; never create a second one.
      const central = await client.query<{ id: string; name: string; license_number: string | null }>(
        'SELECT id, name, license_number FROM pharmacies ORDER BY created_at ASC LIMIT 1 FOR UPDATE',
      );
      let pharmacy = central.rows[0];
      if (!pharmacy) {
        const created = await client.query(
          'INSERT INTO pharmacies (name, license_number, owner_id) VALUES ($1,$2,$3) RETURNING id, name, license_number',
          [pharmacy_name, license_number, req.user!.id],
        );
        pharmacy = created.rows[0];
      }
      const pharmacyId = pharmacy.id as string;
      // First/initial administrator for the central pharmacy is associated here as admin (owner_id set on creation).
      await client.query(
        `INSERT INTO profiles (id, full_name, role, pharmacy_id)
         VALUES ($1,$2,'admin',$3)
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'admin', pharmacy_id = EXCLUDED.pharmacy_id, updated_at = now()`,
        [req.user!.id, full_name, pharmacyId],
      );
      return pharmacy;
    });
    res.status(201).json({ data: result, error: null });
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ data: null, error: { code: 'PHARMACY_EXISTS', message: 'A pharmacy record already exists for this system.' } });
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await queryOne('SELECT p.*, ph.name AS pharmacy_name FROM profiles p LEFT JOIN pharmacies ph ON ph.id = p.pharmacy_id WHERE p.id = $1', [req.user!.id]);
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await query('SELECT * FROM profiles WHERE pharmacy_id = $1 ORDER BY created_at DESC', [req.user!.pharmacy_id]);
    res.json({ data: rows.rows, error: null });
  } catch (e) { next(e); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const row = await queryOne(
      'UPDATE profiles SET role = $1, updated_at = now() WHERE id = $2 AND pharmacy_id = $3 RETURNING *',
      [role, req.params.id, req.user!.pharmacy_id],
    );
    if (!row) return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}
