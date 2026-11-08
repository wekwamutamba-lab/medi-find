import { Request, Response, NextFunction } from 'express';
import * as alertsService from '../services/alerts.service';
import * as summaryService from '../services/summary.service';

export async function lowStock(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await alertsService.getLowStockItems(req.user!.pharmacy_id!);
    res.json({ data: rows, error: null });
  } catch (e) { next(e); }
}

export async function expiring(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days) || (await alertsService.getAlertSettings(req.user!.pharmacy_id!))?.expiry_warning_days || 60;
    const result = await alertsService.getExpiringBatches(days, req.user!.pharmacy_id!);
    res.json({ data: result, error: null });
  } catch (e) { next(e); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await summaryService.getAttentionSummary(req.user!.pharmacy_id!);
    res.json({ data: result, error: null });
  } catch (e) { next(e); }
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await alertsService.getAlertSettings(req.user!.pharmacy_id!);
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { expiry_warning_days } = req.body;
    const row = await alertsService.updateAlertSettings(Number(expiry_warning_days), req.user!.id, req.user!.pharmacy_id!);
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}
