import { Request, Response, NextFunction } from 'express';

export type AppRole = 'admin' | 'pharmacist' | 'staff';
// Single-pharmacy role model: admin = Owner/Admin, pharmacist = Pharmacist, staff = Sales Assistant.
export const OWNER_ADMIN: AppRole[] = ['admin'];
export const PHARMACY_STAFF: AppRole[] = ['admin', 'pharmacist', 'staff'];
export const INVENTORY_MANAGERS: AppRole[] = ['admin', 'pharmacist'];
export const SALES_ROLES: AppRole[] = ['admin', 'pharmacist', 'staff'];

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (!roles.includes(req.user.role as AppRole)) {
      return res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}
