import { Request, Response, NextFunction } from 'express';
import * as directory from '../services/directory.service';

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.listCustomers(req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json({ data: await directory.createCustomer(req.body, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.updateCustomer(req.params.id, req.body, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.deleteCustomer(req.params.id, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function listSuppliers(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.listSuppliers(req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function createSupplier(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json({ data: await directory.createSupplier(req.body, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function updateSupplier(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.updateSupplier(req.params.id, req.body, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
export async function deleteSupplier(req: Request, res: Response, next: NextFunction) {
  try { res.json({ data: await directory.deleteSupplier(req.params.id, req.user!.pharmacy_id!), error: null }); } catch (error) { next(error); }
}
