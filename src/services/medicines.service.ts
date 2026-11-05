import { query, queryOne } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { Medicine } from '../types';

export async function listMedicines(params: {
  search?: string;
  low_stock?: boolean;
  include_inactive?: boolean;
  page: number;
  limit: number;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (!params.include_inactive) {
    conditions.push('m.is_active = TRUE');
  }
  if (params.search) {
    conditions.push(`m.name ILIKE $${idx++}`);
    values.push(`%${params.search}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  // low_stock filter: compute usable stock via subquery
  let lowStockClause = '';
  if (params.low_stock) {
    lowStockClause = `AND COALESCE((SELECT SUM(b.quantity_packs) FROM batches b WHERE b.medicine_id = m.id AND b.expiry_date >= CURRENT_DATE),0) < m.reorder_level`;
  }

  const offset = (params.page - 1) * params.limit;
  const sql = `
    SELECT m.*,
      COALESCE((SELECT SUM(b.quantity_packs) FROM batches b WHERE b.medicine_id = m.id AND b.expiry_date >= CURRENT_DATE),0)::int AS usable_stock
    FROM medicines m
    ${where} ${lowStockClause}
    ORDER BY m.name ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(params.limit, offset);

  const countSql = `SELECT COUNT(*)::int AS c FROM medicines m ${where} ${lowStockClause}`;
  const countValues = values.slice(0, values.length - 2);

  const [rows, countRes] = await Promise.all([
    query<Medicine & { usable_stock: number }>(sql, values),
    queryOne<{ c: number }>(countSql, countValues),
  ]);

  return { items: rows.rows, total: countRes?.c ?? 0, page: params.page, limit: params.limit };
}

export async function getMedicine(id: string) {
  const med = await queryOne<Medicine>('SELECT * FROM medicines WHERE id = $1', [id]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const batches = await query(
    'SELECT * FROM batches WHERE medicine_id = $1 ORDER BY expiry_date ASC',
    [id],
  );
  const movements = await query(
    `SELECT sm.* FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id
     WHERE b.medicine_id = $1 ORDER BY sm.created_at DESC LIMIT 20`,
    [id],
  );
  const stockRes = await queryOne<{ s: number }>(
    "SELECT COALESCE(SUM(quantity_packs),0)::int AS s FROM batches WHERE medicine_id = $1 AND expiry_date >= CURRENT_DATE",
    [id],
  );

  return {
    ...med,
    batches: batches.rows,
    recent_movements: movements.rows,
    usable_stock: stockRes?.s ?? 0,
  };
}

export async function createMedicine(data: any) {
  try {
    const row = await queryOne<Medicine>(
      `INSERT INTO medicines (name, strength, dosage_form, pack_size, reorder_level, notes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.name,
        data.strength,
        data.dosage_form,
        data.pack_size,
        data.reorder_level ?? 0,
        data.notes ?? null,
        data.is_active ?? true,
      ],
    );
    return row;
  } catch (e: any) {
    if (e.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'Medicine with same name/strength/form/pack size already exists');
    }
    throw e;
  }
}

export async function updateMedicine(id: string, data: any) {
  const existing = await queryOne('SELECT id FROM medicines WHERE id = $1', [id]);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const map: Record<string, string> = {
    name: 'name',
    strength: 'strength',
    reorder_level: 'reorder_level',
    notes: 'notes',
    is_active: 'is_active',
  };
  for (const [k, col] of Object.entries(map)) {
    if (data[k] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[k]);
    }
  }
  if (fields.length === 0) {
    return queryOne('SELECT * FROM medicines WHERE id = $1', [id]);
  }
  fields.push('updated_at = now()');
  values.push(id);
  try {
    const row = await queryOne<Medicine>(
      `UPDATE medicines SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return row;
  } catch (e: any) {
    if (e.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'Duplicate medicine');
    }
    throw e;
  }
}

export async function deleteMedicine(id: string) {
  const med = await queryOne<Medicine>('SELECT * FROM medicines WHERE id = $1', [id]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const movCount = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id WHERE b.medicine_id = $1`,
    [id],
  );
  if ((movCount?.c ?? 0) > 0) {
    // soft deactivate
    await query('UPDATE medicines SET is_active = FALSE, updated_at = now() WHERE id = $1', [id]);
    return { deactivated: true };
  }
  await query('DELETE FROM medicines WHERE id = $1', [id]);
  return { deleted: true };
}
