import { Request, Response, NextFunction } from 'express';
import * as movementsService from '../services/movements.service';
import { movementCreateSchema } from '../validators/movements.validator';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = movementCreateSchema.parse(req.body);
    const row = await movementsService.createMovement(req.params.id, data, req.user!.id);
    res.status(201).json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await movementsService.listMovementsForMedicine(req.params.id, page, limit);
    res.json({ data: result, error: null });
  } catch (e) {
    next(e);
  }
}
