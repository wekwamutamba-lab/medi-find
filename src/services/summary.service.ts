import { query } from '../db/query';

export async function getAttentionSummary(pharmacyId: string) {
  const settings = await (async () => {
    const r = await query('SELECT expiry_warning_days FROM alert_settings WHERE id = 1 AND pharmacy_id = $1', [pharmacyId]);
    return r.rows[0]?.expiry_warning_days ?? 60;
  })();

  const lowStock = await query(
    `SELECT m.id, m.name, m.strength, m.reorder_level,
            COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0)::int AS usable_stock
    FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id
    WHERE m.is_active = TRUE AND m.pharmacy_id = $1
     GROUP BY m.id
     HAVING COALESCE(SUM(b.quantity_packs) FILTER (WHERE b.expiry_date >= CURRENT_DATE),0) < m.reorder_level
    ORDER BY m.name`,
      [pharmacyId],
  );

  const expiring = await query(
    `SELECT b.id, b.medicine_id, b.batch_number, b.expiry_date, b.quantity_packs, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
    WHERE b.pharmacy_id = $2 AND m.pharmacy_id = $2 AND b.expiry_date >= CURRENT_DATE AND b.expiry_date <= CURRENT_DATE + ($1 || ' days')::interval
     ORDER BY b.expiry_date`,
    [settings, pharmacyId],
  );

  const expired = await query(
    `SELECT b.id, b.medicine_id, b.batch_number, b.expiry_date, b.quantity_packs, m.name AS medicine_name, m.strength
     FROM batches b JOIN medicines m ON m.id = b.medicine_id
    WHERE b.pharmacy_id = $1 AND m.pharmacy_id = $1 AND b.expiry_date < CURRENT_DATE AND b.quantity_packs > 0
     ORDER BY b.expiry_date`,
      [pharmacyId],
  );

  const missingData = await query(
    `SELECT m.id, m.name, m.strength,
            (SELECT COUNT(*) FROM batches b WHERE b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id) AS batch_count,
            m.reorder_level
     FROM medicines m
     WHERE m.pharmacy_id = $1 AND m.is_active = TRUE AND (
       (SELECT COUNT(*) FROM batches b WHERE b.medicine_id = m.id AND b.pharmacy_id = m.pharmacy_id) = 0
       OR m.reorder_level = 0
     )
    ORDER BY m.name`,
      [pharmacyId],
  );

  return {
    low_stock: { count: lowStock.rows.length, items: lowStock.rows },
    expiring: { count: expiring.rows.length, items: expiring.rows, window_days: settings },
    expired: { count: expired.rows.length, items: expired.rows },
    missing_data: { count: missingData.rows.length, items: missingData.rows },
  };
}
