import { Request, Response, NextFunction } from 'express';
import * as salesService from '../services/sales.service';
import { saleCreateSchema } from '../validators/sales.validator';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = saleCreateSchema.parse(req.body);
    const sale = await salesService.createSale(data, req.user!.pharmacy_id!, req.user!.id);
    res.status(201).json({ data: sale, error: null });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 100));
    const sales = await salesService.listSales(req.user!.pharmacy_id!, limit);
    res.json({ data: sales, error: null });
  } catch (error) {
    next(error);
  }
}

export async function analytics(req: Request, res: Response, next: NextFunction) {
  try {
    const range = ['today', 'week', 'month', 'custom'].includes(String(req.query.range)) ? String(req.query.range) as 'today' | 'week' | 'month' | 'custom' : 'month';
    const customDate = typeof req.query.date === 'string' ? req.query.date : undefined;
    const result = await salesService.getSalesAnalytics(req.user!.pharmacy_id!, range, customDate);
    res.json({ data: result, error: null });
  } catch (error) { next(error); }
}
