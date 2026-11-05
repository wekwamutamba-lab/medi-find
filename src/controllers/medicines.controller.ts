import { Request, Response, NextFunction } from 'express';
import * as medicinesService from '../services/medicines.service';
import { validate } from '../middleware/validate';
import { medicineCreateSchema, medicineUpdateSchema, medicineListQuerySchema } from '../validators/medicines.validator';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = medicineListQuerySchema.parse(req.query);
    const result = await medicinesService.listMedicines({
      search: q.search,
      low_stock: q.low_stock === 'true',
      include_inactive: q.include_inactive === 'true',
      page: q.page,
      limit: q.limit,
    });
    res.json({ data: result, error: null });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = medicineCreateSchema.parse(req.body);
    const row = await medicinesService.createMedicine(data);
    res.status(201).json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await medicinesService.getMedicine(req.params.id);
    res.json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = medicineUpdateSchema.parse(req.body);
    const row = await medicinesService.updateMedicine(req.params.id, data);
    res.json({ data: row, error: null });
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await medicinesService.deleteMedicine(req.params.id);
    res.json({ data: result, error: null });
  } catch (e) {
    next(e);
  }
}
