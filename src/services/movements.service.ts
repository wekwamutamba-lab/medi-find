import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';
import { AppError } from '../middleware/errorHandler';

export async function createMovement(batchId: string, data: any, performedBy: string, pharmacyId: string) {
  return withTransaction(async (client) => {
    const batchResult = await client.query<{ id: string; quantity_packs: number }>(
      'SELECT id, quantity_packs FROM batches WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
      [batchId, pharmacyId],
    );
    const batch = batchResult.rows[0];
    if (!batch) throw new AppError(404, 'NOT_FOUND', 'Batch not found');

    const qty = data.quantity_packs;
    const newQty = batch.quantity_packs + qty;
    if (newQty < 0) throw new AppError(422, 'UNPROCESSABLE', 'Issue would push batch stock below zero');
    const movRes = await client.query(
      `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pharmacyId, batchId, data.movement_type, qty, data.reason ?? null, performedBy],
    );
    await client.query('UPDATE batches SET quantity_packs = $1, updated_at = now() WHERE id = $2', [
      newQty,
      batchId,
    ]);
    return movRes.rows[0];
  });
}

export async function listMovementsForMedicine(medicineId: string, page: number, limit: number, pharmacyId: string) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [medicineId, pharmacyId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const offset = (page - 1) * limit;
  const res = await query(
    `SELECT sm.* FROM stock_movements sm
     JOIN batches b ON b.id = sm.batch_id
    WHERE b.medicine_id = $1 AND sm.pharmacy_id = $4 AND b.pharmacy_id = $4
     ORDER BY sm.created_at DESC
    LIMIT $2 OFFSET $3`,
      [medicineId, limit, offset, pharmacyId],
  );
  const countRes = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id WHERE b.medicine_id = $1 AND sm.pharmacy_id = $2 AND b.pharmacy_id = $2`,
    [medicineId, pharmacyId],
  );
  return { items: res.rows, total: countRes?.c ?? 0, page, limit };
}

export async function listTenantMovements(pharmacyId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [rows, count] = await Promise.all([
    query(
      `SELECT sm.*, m.id AS medicine_id, m.name AS medicine_name, m.strength, b.batch_number, p.full_name AS performed_by_name
       FROM stock_movements sm
       JOIN batches b ON b.id = sm.batch_id AND b.pharmacy_id = sm.pharmacy_id
       JOIN medicines m ON m.id = b.medicine_id AND m.pharmacy_id = sm.pharmacy_id
       LEFT JOIN profiles p ON p.id = sm.performed_by AND p.pharmacy_id = sm.pharmacy_id
       WHERE sm.pharmacy_id = $1
       ORDER BY sm.created_at DESC LIMIT $2 OFFSET $3`,
      [pharmacyId, limit, offset],
    ),
    queryOne<{ c: number }>('SELECT COUNT(*)::int AS c FROM stock_movements WHERE pharmacy_id = $1', [pharmacyId]),
  ]);
  return { items: rows.rows, total: count?.c ?? 0, page, limit };
}
