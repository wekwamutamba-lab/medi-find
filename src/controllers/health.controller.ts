import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { isAiConfigured } from '../config/env';

export async function health(req: Request, res: Response) {
  let db = 'down';
  try {
    await pool.query('SELECT 1');
    db = 'up';
  } catch {
    db = 'down';
  }
  res.json({
    data: { status: 'ok', db, ai: isAiConfigured() ? 'configured' : 'not_configured' },
    error: null,
  });
}
