import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';
import { AppError } from '../middleware/errorHandler';

export async function createBatch(medicineId: string, data: any, performedBy: string) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1', [medicineId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  try {
    const batch = await withTransaction(async (client) => {
      const batchRes = await client.query(
        `INSERT INTO batches (medicine_id, batch_number, expiry_date, quantity_packs)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [medicineId, data.batch_number, data.expiry_date, data.quantity_packs],
      );
      const batch = batchRes.rows[0];
      // opening receipt movement
      if (data.quantity_packs > 0) {
        await client.query(
          `INSERT INTO stock_movements (batch_id, movement_type, quantity_packs, reason, performed_by)
           VALUES ($1,'receipt',$2,$3,$4)`,
          [batch.id, data.quantity_packs, 'Opening stock', performedBy],
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

export async function listBatches(medicineId: string) {
  const med = await queryOne('SELECT id FROM medicines WHERE id = $1', [medicineId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');
  const res = await query('SELECT * FROM batches WHERE medicine_id = $1 ORDER BY expiry_date ASC', [medicineId]);
  return res.rows;
}

export async function listAllBatches() {
  const res = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b
     JOIN medicines m ON m.id = b.medicine_id
     ORDER BY b.expiry_date ASC, m.name ASC`,
  );
  return res.rows;
}

export async function updateBatch(id: string, data: any) {
  const existing = await queryOne('SELECT id FROM batches WHERE id = $1', [id]);
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
    return queryOne('SELECT * FROM batches WHERE id = $1', [id]);
  }
  fields.push('updated_at = now()');
  values.push(id);
  try {
    const row = await queryOne(
      `UPDATE batches SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
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
