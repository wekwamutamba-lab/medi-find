import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../db/query';

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await queryOne('SELECT * FROM profiles WHERE id = $1', [req.user!.id]);
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await query('SELECT * FROM profiles ORDER BY created_at DESC');
    res.json({ data: rows.rows, error: null });
  } catch (e) { next(e); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const row = await queryOne(
      'UPDATE profiles SET role = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [role, req.params.id],
    );
    if (!row) return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'User not found' } });
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}
