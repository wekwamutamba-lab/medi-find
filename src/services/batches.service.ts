import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';
import { AppError } from '../middleware/errorHandler';

export async function createBatch(medicineId: string, data: any, performedBy: string, pharmacyId: string) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [medicineId, pharmacyId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  try {
    const batch = await withTransaction(async (client) => {
      const batchRes = await client.query(
        `INSERT INTO batches (pharmacy_id, medicine_id, batch_number, expiry_date, quantity_packs, unit_cost)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [pharmacyId, medicineId, data.batch_number, data.expiry_date, data.quantity_packs, data.unit_cost ?? 0],
      );
      const batch = batchRes.rows[0];
      // opening receipt movement
      if (data.quantity_packs > 0) {
        await client.query(
          `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by)
           VALUES ($1,$2,'receipt',$3,$4,$5)`,
          [pharmacyId, batch.id, data.quantity_packs, 'Opening stock', performedBy],
        );
      }
      return batch;
    });
    return batch;
  } catch (e: any) {
    if (e.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'Batch number already exists for this medicine');
    }
    throw e;
  }
}

export async function listBatches(medicineId: string, pharmacyId: string) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [medicineId, pharmacyId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');
  const res = await query('SELECT * FROM batches WHERE medicine_id = $1 AND pharmacy_id = $2 ORDER BY expiry_date ASC', [medicineId, pharmacyId]);
  return res.rows;
}

export async function listAllBatches(pharmacyId: string) {
  const res = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b
     JOIN medicines m ON m.id = b.medicine_id AND m.pharmacy_id = b.pharmacy_id
     WHERE b.pharmacy_id = $1
     ORDER BY b.expiry_date ASC, m.name ASC`,
    [pharmacyId],
  );
  return res.rows;
}

export async function updateBatch(id: string, data: any, pharmacyId: string) {
  const existing = await queryOne('SELECT id FROM batches WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Batch not found');

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.batch_number !== undefined) {
    fields.push(`batch_number = $${idx++}`);
    values.push(data.batch_number);
  }
  if (data.expiry_date !== undefined) {
    fields.push(`expiry_date = $${idx++}`);
    values.push(data.expiry_date);
  }
  if (fields.length === 0) {
    return queryOne('SELECT * FROM batches WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  }
  fields.push('updated_at = now()');
  values.push(id, pharmacyId);
  try {
    const row = await queryOne(
      `UPDATE batches SET ${fields.join(', ')} WHERE id = $${idx} AND pharmacy_id = $${idx + 1} RETURNING *`,
      values,
    );
    return row;
  } catch (e: any) {
    if (e.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'Batch number already exists for this medicine');
    }
    throw e;
  }
}
