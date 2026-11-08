import { query, queryOne } from '../db/query';
import { AppError } from '../middleware/errorHandler';
import { Medicine } from '../types';

export async function listMedicines(params: {
  pharmacy_id: string;
  search?: string;
  low_stock?: boolean;
  include_inactive?: boolean;
  page: number;
  limit: number;
}) {
  const conditions: string[] = [];
  const values: any[] = [params.pharmacy_id];
  let idx = 2;

  conditions.push('m.pharmacy_id = $1');

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
    lowStockClause = `AND COALESCE((SELECT SUM(b.quantity_packs) FROM batches b WHERE b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id AND b.expiry_date >= CURRENT_DATE),0) < m.reorder_level`;
  }

  const offset = (params.page - 1) * params.limit;
  const sql = `
    SELECT m.*,
      COALESCE((SELECT SUM(b.quantity_packs) FROM batches b WHERE b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id AND b.expiry_date >= CURRENT_DATE),0)::int AS usable_stock
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

export async function getMedicine(id: string, pharmacyId: string) {
  const med = await queryOne<Medicine>('SELECT * FROM medicines WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const batches = await query(
    'SELECT * FROM batches WHERE medicine_id = $1 AND pharmacy_id = $2 ORDER BY expiry_date ASC',
    [id, pharmacyId],
  );
  const movements = await query(
    `SELECT sm.* FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id
    WHERE b.medicine_id = $1 AND sm.pharmacy_id = $2 ORDER BY sm.created_at DESC LIMIT 20`,
      [id, pharmacyId],
  );
  const stockRes = await queryOne<{ s: number }>(
    "SELECT COALESCE(SUM(quantity_packs),0)::int AS s FROM batches WHERE medicine_id = $1 AND pharmacy_id = $2 AND expiry_date >= CURRENT_DATE",
    [id, pharmacyId],
  );

  return {
    ...med,
    batches: batches.rows,
    recent_movements: movements.rows,
    usable_stock: stockRes?.s ?? 0,
  };
}

export async function createMedicine(data: any, pharmacyId: string) {
  try {
    const row = await queryOne<Medicine>(
      `INSERT INTO medicines (pharmacy_id, name, strength, dosage_form, pack_size, category, reorder_level, unit_price, notes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        pharmacyId,
        data.name,
        data.strength,
        data.dosage_form,
        data.pack_size,
        data.category ?? 'Other',
        data.reorder_level ?? 0,
        Number(data.unit_price ?? 0),
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

export async function updateMedicine(id: string, data: any, pharmacyId: string) {
  const existing = await queryOne('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const map: Record<string, string> = {
    name: 'name',
    strength: 'strength',
    dosage_form: 'dosage_form',
    pack_size: 'pack_size',
    category: 'category',
    reorder_level: 'reorder_level',
    unit_price: 'unit_price',
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
    return queryOne('SELECT * FROM medicines WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  }
  fields.push('updated_at = now()');
  values.push(id, pharmacyId);
  try {
    const row = await queryOne<Medicine>(
      `UPDATE medicines SET ${fields.join(', ')} WHERE id = $${idx} AND pharmacy_id = $${idx + 1} RETURNING *`,
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

export async function deleteMedicine(id: string, pharmacyId: string) {
  const med = await queryOne<Medicine>('SELECT * FROM medicines WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  if (!med) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

  const movCount = await queryOne<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM stock_movements sm JOIN batches b ON b.id = sm.batch_id WHERE b.medicine_id = $1 AND sm.pharmacy_id = $2`,
    [id, pharmacyId],
  );
  if ((movCount?.c ?? 0) > 0) {
    // soft deactivate
    await query('UPDATE medicines SET is_active = FALSE, updated_at = now() WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
    return { deactivated: true };
  }
  await query('DELETE FROM medicines WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  return { deleted: true };
}
