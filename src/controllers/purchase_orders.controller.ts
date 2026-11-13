import { Request, Response, NextFunction } from 'express';
import * as poService from '../services/purchase_orders.service';
import { purchaseOrderCreateSchema, purchaseOrderReceiveSchema, purchaseOrderCancelSchema, updatePurchaseOrderItemReceivedSchema } from '../validators/purchase_orders.validator';
import { validate } from '../middleware/validate';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await poService.listPurchaseOrders(req.user!.pharmacy_id!);
    res.json({ data: rows, error: null });
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await poService.getPurchaseOrder(req.params.id, req.user!.pharmacy_id!);
    res.json({ data: row, error: null });
  } catch (e) { next(e); }
}

export async function getItems(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await poService.getPurchaseOrderItems(req.params.id, req.user!.pharmacy_id!);
    res.json({ data: rows, error: null });
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = purchaseOrderCreateSchema.parse(req.body);
    const row = await poService.createPurchaseOrder(data, req.user!.pharmacy_id!, req.user!.id);
    res.status(201).json({ data: row, error: null });
  } catch (e) { next(e); }
}

export async function receive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = purchaseOrderReceiveSchema.parse(req.body);
    const result = await poService.receivePurchaseOrder(data.id, req.user!.pharmacy_id!, req.user!.id);
    res.json({ data: result, error: null });
  } catch (e) { next(e); }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await poService.cancelPurchaseOrder(req.params.id, req.user!.pharmacy_id!);
    res.json({ data: result, error: null });
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updatePurchaseOrderItemReceivedSchema.parse(req.body);
    if (data.status === 'received') {
      const result = await poService.receivePurchaseOrder(data.id, req.user!.pharmacy_id!, req.user!.id);
      res.json({ data: result, error: null });
    } else if (data.status === 'cancelled') {
      const result = await poService.cancelPurchaseOrder(data.id, req.user!.pharmacy_id!);
      res.json({ data: result, error: null });
    } else {
      const result = await poService.updatePurchaseOrderItemReceived(data.id, data.status, data.received_quantity_packs, req.user!.pharmacy_id!);
      res.json({ data: result, error: null });
    }
  } catch (e) { next(e); }
}