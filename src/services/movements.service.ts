import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';
import { AppError } from '../middleware/errorHandler';

export async function createMovement(batchId: string, data: any, performedBy: string) {
  const batch = await queryOne<{ id: string; quantity_packs: number }>(
    'SELECT id, quantity_packs FROM batches WHERE id = $1',
    [batchId],
  );
  if (!batch) throw new AppError(404, 'NOT_FOUND', 'Batch not found');

  const qty = data.quantity_packs;
  const newQty = batch.quantity_packs + qty;
  if (newQty < 0) {
    throw new AppError(422, 'UNPROCESSABLE', 'Issue would push batch stock below zero');
  }

  return withTransaction(async (client) => {
    const movRes = await client.query(
      `INSERT INTO stock_movements (batch_id, movement_type, quantity_packs, reason, performed_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [batchId, data.movement_type, qty, data.reason ?? null, performedBy],
    );
    await client.query('UPDATE batches SET quantity_packs = $1, updated_at = now() WHERE id = $2', [
      newQty,
      batchId,
    ]);
    return movRes.rows[0];
  });
}

export async function listMovementsForMedicine(medicineId: string, page: number, limit: number) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1', [medicineId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const offset = (page - 1) * limit;
  const res = await query(
    `SELECT sm.* FROM stock_movements sm
     JOIN batches b ON b.id = sm.batch_id
     WHERE b.medicine_id = $1
     ORDER BY sm.created_at DESC
     LIMIT $2 OFFSET $3`,
    [medicineId, limit, offset],
  );
  const countRes = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id WHERE b.medicine_id = $1`,
    [medicineId],
  );
  return { items: res.rows, total: countRes?.c ?? 0, page, limit };
}
