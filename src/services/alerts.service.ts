import { query, queryOne } from '../db/query';

export async function getLowStockItems() {
  const res = await query(
    `SELECT m.id, m.name, m.strength, m.dosage_form, m.pack_size, m.reorder_level,
            COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0)::int AS usable_stock
     FROM medicines m
     LEFT JOIN batches b ON b.medicine_id = m.id
     WHERE m.is_active = TRUE
     GROUP BY m.id
     HAVING COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0) < m.reorder_level
     ORDER BY m.name`,
  );
  return res.rows;
}

export async function getExpiringBatches(days: number) {
  const clamped = Math.min(Math.max(days, 1), 365);
  const soonRes = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
     WHERE b.expiry_date >= CURRENT_DATE AND b.expiry_date <= CURRENT_DATE + ($1 || ' days')::interval
     ORDER BY b.expiry_date ASC`,
    [clamped],
  );
  const expiredRes = await query(
    `SELECT b.*, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
     WHERE b.expiry_date < CURRENT_DATE AND b.quantity_packs > 0
     ORDER BY b.expiry_date ASC`,
  );
  return { expiring_soon: soonRes.rows, expired: expiredRes.rows, window_days: clamped };
}

export async function getAlertSettings() {
  let row = await queryOne('SELECT * FROM alert_settings WHERE id = 1');
  if (!row) {
    await query('INSERT INTO alert_settings (id, expiry_warning_days) VALUES (1,60) ON CONFLICT (id) DO NOTHING');
    row = await queryOne('SELECT * FROM alert_settings WHERE id = 1');
  }
  return row;
}

export async function updateAlertSettings(days: number, userId: string) {
  await query(
    `INSERT INTO alert_settings (id, expiry_warning_days, updated_at, updated_by)
     VALUES (1, $1, now(), $2)
     ON CONFLICT (id) DO UPDATE SET expiry_warning_days = $1, updated_at = now(), updated_by = $2`,
    [days, userId],
  );
  return getAlertSettings();
}
