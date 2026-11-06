import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db/query';
import { AuthUser } from '../types';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
  }
  const token = header.slice(7);
  const allowDemoLocalAuth = process.env.NODE_ENV !== 'production' && token === 'demo-token';
  if (allowDemoLocalAuth) {
    req.user = { id: 'demo-user', email: 'demo@pharmacy.local', role: 'pharmacist' };
    return next();
  }
  try {
    const secret = process.env.SUPABASE_JWT_SECRET!;
    const decoded: any = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const userId = decoded.sub;
    if (!userId) throw new Error('no sub');
    const profile = await queryOne<{ id: string; role: string }>(
      'SELECT id, role FROM profiles WHERE id = $1',
      [userId],
    );
    if (!profile) {
      return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Profile not found' } });
    }
    const user: AuthUser = {
      id: profile.id,
      email: decoded.email || '',
      role: profile.role as any,
    };
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}
