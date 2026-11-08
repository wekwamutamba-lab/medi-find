import { query, queryOne } from '../db/query';

export async function getLowStockItems(pharmacyId: string) {
  const res = await query(
    `SELECT m.id, m.name, m.strength, m.dosage_form, m.pack_size, m.reorder_level,
            COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0)::int AS usable_stock
     FROM medicines m
    LEFT JOIN batches b ON b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id
    WHERE m.is_active = TRUE AND m.pharmacy_id = $1
     GROUP BY m.id
     HAVING COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0) < m.reorder_level
    ORDER BY m.name`,
      [pharmacyId],
  );
  return res.rows;
}

export async function getExpiringBatches(days: number, pharmacyId: string) {
  const clamped = Math.min(Math.max(days, 1), 365);
  const soonRes = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
    WHERE b.pharmacy_id = $2 AND m.pharmacy_id = $2 AND b.expiry_date >= CURRENT_DATE AND b.expiry_date <= CURRENT_DATE + ($1 || ' days')::interval
     ORDER BY b.expiry_date ASC`,
    [clamped, pharmacyId],
  );
  const expiredRes = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
    WHERE b.pharmacy_id = $1 AND m.pharmacy_id = $1 AND b.expiry_date < CURRENT_DATE AND b.quantity_packs > 0
     ORDER BY b.expiry_date ASC`,
      [pharmacyId],
  );
  return { expiring_soon: soonRes.rows, expired: expiredRes.rows, window_days: clamped };
}

export async function getAlertSettings(pharmacyId: string) {
  let row = await queryOne('SELECT * FROM alert_settings WHERE id = 1 AND pharmacy_id = $1', [pharmacyId]);
  if (!row) {
    await query('INSERT INTO alert_settings (id, pharmacy_id, expiry_warning_days) VALUES (1,$1,60) ON CONFLICT (pharmacy_id,id) DO NOTHING', [pharmacyId]);
    row = await queryOne('SELECT * FROM alert_settings WHERE id = 1 AND pharmacy_id = $1', [pharmacyId]);
  }
  return row;
}

export async function updateAlertSettings(days: number, userId: string, pharmacyId: string) {
  await query(
    `INSERT INTO alert_settings (id, pharmacy_id, expiry_warning_days, updated_at, updated_by)
     VALUES (1, $1, $2, now(), $3)
     ON CONFLICT (pharmacy_id, id) DO UPDATE SET expiry_warning_days = $2, updated_at = now(), updated_by = $3`,
    [pharmacyId, days, userId],
  );
  return getAlertSettings(pharmacyId);
}
