import { Request, Response, NextFunction } from 'express';
import * as batchesService from '../services/batches.service';
import { batchCreateSchema, batchUpdateSchema } from '../validators/batches.validator';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = batchCreateSchema.parse(req.body);
    const row = await batchesService.createBatch(req.params.id, data, req.user!.id, req.user!.pharmacy_id!);
    res.status(201).json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await batchesService.listBatches(req.params.id, req.user!.pharmacy_id!);
    res.json({ data: rows, error: null });
  } catch (e) {
    next(e);
  }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await batchesService.listAllBatches(req.user!.pharmacy_id!);
    res.json({ data: rows, error: null });
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = batchUpdateSchema.parse(req.body);
    const row = await batchesService.updateBatch(req.params.id, data, req.user!.pharmacy_id!);
    res.json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}
