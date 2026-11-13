import { withTransaction } from '../db/client';
import { query, queryOne } from '../db/query';
import { AppError } from '../middleware/errorHandler';

interface SaleInput {
  customer_id?: string | null;
  payment_method: 'cash' | 'card' | 'transfer';
  tax_rate: number;
  items: Array<{ medicine_id: string; quantity_packs: number }>;
}

export async function createSale(data: SaleInput, pharmacyId: string, performedBy: string) {
  return withTransaction(async (client) => {
    if (data.customer_id) {
      const customer = await client.query('SELECT id FROM customers WHERE id = $1 AND pharmacy_id = $2', [data.customer_id, pharmacyId]);
      if (!customer.rowCount) throw new AppError(404, 'NOT_FOUND', 'Customer not found in this pharmacy.');
    }

    const quantities = new Map<string, number>();
    for (const item of data.items) quantities.set(item.medicine_id, (quantities.get(item.medicine_id) ?? 0) + item.quantity_packs);

    const prepared: Array<{ medicine_id: string; quantity_packs: number; unit_price: number; name: string }> = [];
    for (const [medicineId, quantity] of quantities) {
      const medicineResult = await client.query<{ id: string; name: string; unit_price: string | number }>(
        'SELECT id, name, unit_price FROM medicines WHERE id = $1 AND pharmacy_id = $2 AND is_active = TRUE FOR SHARE',
        [medicineId, pharmacyId],
      );
      const medicine = medicineResult.rows[0];
      if (!medicine) throw new AppError(404, 'NOT_FOUND', 'Medicine not found in this pharmacy.');
      prepared.push({ medicine_id: medicine.id, quantity_packs: quantity, unit_price: Number(medicine.unit_price), name: medicine.name });
    }

    const subtotal = prepared.reduce((sum, item) => sum + item.unit_price * item.quantity_packs, 0);
    const taxAmount = Math.round(subtotal * data.tax_rate) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const saleResult = await client.query(
      `INSERT INTO sales (pharmacy_id, customer_id, total_amount, tax_amount, payment_method, performed_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pharmacyId, data.customer_id ?? null, total, taxAmount, data.payment_method, performedBy],
    );
    const sale = saleResult.rows[0];
    const saleLines = [];

    for (const item of prepared) {
      let remaining = item.quantity_packs;
      const batchesResult = await client.query<{ id: string; quantity_packs: number; unit_cost: string | number }>(
        `SELECT id, quantity_packs, unit_cost FROM batches
         WHERE pharmacy_id = $1 AND medicine_id = $2 AND expiry_date >= CURRENT_DATE AND quantity_packs > 0
         ORDER BY expiry_date ASC, created_at ASC FOR UPDATE`,
        [pharmacyId, item.medicine_id],
      );
      for (const batch of batchesResult.rows) {
        if (remaining <= 0) break;
        const issued = Math.min(remaining, batch.quantity_packs);
        await client.query('UPDATE batches SET quantity_packs = quantity_packs - $1, updated_at = now() WHERE id = $2 AND pharmacy_id = $3', [issued, batch.id, pharmacyId]);
        await client.query(
          `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by)
           VALUES ($1,$2,'issue',$3,$4,$5)`,
          [pharmacyId, batch.id, -issued, `Sale ${sale.id}`, performedBy],
        );
        const batch_cost = batch.unit_cost ?? 0;
        const batch_cost_num = typeof batch_cost === 'string' ? Number(batch_cost) : batch_cost;
        const line_total = Math.round(item.unit_price * issued * 100) / 100;
        const line_cost = Math.round(batch_cost_num * issued * 100) / 100;
        await client.query(
          `INSERT INTO sale_items (pharmacy_id, sale_id, medicine_id, batch_id, quantity_packs, unit_price, line_total, cost_price, line_cost)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [pharmacyId, sale.id, item.medicine_id, batch.id, issued, item.unit_price, line_total, batch_cost_num, line_cost],
        );
        saleLines.push({ medicine_id: item.medicine_id, medicine_name: item.name, batch_id: batch.id, quantity_packs: issued, unit_price: item.unit_price, cost_price: batch_cost_num });
        remaining -= issued;
      }
      if (remaining > 0) throw new AppError(422, 'INSUFFICIENT_STOCK', `Insufficient unexpired stock for ${item.name}. No sale was recorded.`);
    }

    return { ...sale, items: saleLines };
  });
}

export async function listSales(pharmacyId: string, limit = 100) {
  const result = await query(
    `SELECT s.*, c.name AS customer_name, p.full_name AS performed_by_name,
            COALESCE((SELECT json_agg(json_build_object(
              'medicine_id', si.medicine_id, 'medicine_name', m.name, 'batch_id', si.batch_id,
              'quantity_packs', si.quantity_packs, 'unit_price', si.unit_price, 'line_total', si.line_total
            ) ORDER BY si.created_at)
            FROM sale_items si JOIN medicines m ON m.id = si.medicine_id AND m.pharmacy_id = si.pharmacy_id
            WHERE si.sale_id = s.id AND si.pharmacy_id = s.pharmacy_id), '[]'::json) AS items
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id AND c.pharmacy_id = s.pharmacy_id
     LEFT JOIN profiles p ON p.id = s.performed_by AND p.pharmacy_id = s.pharmacy_id
     WHERE s.pharmacy_id = $1 ORDER BY s.created_at DESC LIMIT $2`,
    [pharmacyId, limit],
  );
  return result.rows;
}

export async function getSalesAnalytics(pharmacyId: string, range: 'today' | 'week' | 'month' | 'custom', customDate?: string) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  const start = new Date(now);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === 'week') { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
  else if (range === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else {
    const parsed = customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate) ? new Date(`${customDate}T00:00:00.000Z`) : new Date(now.toISOString().slice(0, 10));
    start.setTime(parsed.getTime()); start.setHours(0, 0, 0, 0); end.setTime(start.getTime()); end.setDate(end.getDate() + 1);
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [allTime, period, month, transactions, inventory, expiring, topSelling, trend, cogs, inventoryValue] = await Promise.all([
    queryOne<{ total: string }>('SELECT COALESCE(SUM(total_amount),0)::text AS total FROM sales WHERE pharmacy_id=$1 AND status=\'completed\'', [pharmacyId]),
    queryOne<{ total: string }>('SELECT COALESCE(SUM(total_amount),0)::text AS total FROM sales WHERE pharmacy_id=$1 AND status=\'completed\' AND created_at >= $2 AND created_at < $3', [pharmacyId, start, end]),
    queryOne<{ total: string }>('SELECT COALESCE(SUM(total_amount),0)::text AS total FROM sales WHERE pharmacy_id=$1 AND status=\'completed\' AND created_at >= $2', [pharmacyId, monthStart]),
    queryOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM sales WHERE pharmacy_id=$1 AND status=\'completed\' AND created_at >= $2 AND created_at < $3', [pharmacyId, start, end]),
    queryOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM medicines WHERE pharmacy_id=$1 AND is_active=TRUE', [pharmacyId]),
    queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM batches b WHERE b.pharmacy_id=$1 AND b.expiry_date >= CURRENT_DATE AND b.expiry_date <= CURRENT_DATE + (COALESCE((SELECT expiry_warning_days FROM alert_settings WHERE pharmacy_id=$1 AND id=1),60) || ' days')::interval`, [pharmacyId]),
    query<{ medicine_id: string; medicine_name: string; revenue: string; quantity: number }>(
      `SELECT m.id AS medicine_id, m.name AS medicine_name, SUM(si.line_total)::text AS revenue, SUM(si.quantity_packs)::int AS quantity
       FROM sale_items si JOIN sales s ON s.id=si.sale_id AND s.pharmacy_id=si.pharmacy_id
       JOIN medicines m ON m.id=si.medicine_id AND m.pharmacy_id=si.pharmacy_id
       WHERE si.pharmacy_id=$1 AND s.status='completed' AND s.created_at >= $2 AND s.created_at < $3
       GROUP BY m.id, m.name ORDER BY SUM(si.line_total) DESC LIMIT 5`, [pharmacyId, start, end],
    ),
    query(
      `SELECT created_at::date AS day, COALESCE(SUM(total_amount),0)::text AS revenue
       FROM sales WHERE pharmacy_id=$1 AND status='completed' AND created_at >= now() - interval '6 days'
       GROUP BY created_at::date ORDER BY day`, [pharmacyId],
    ),
    queryOne<{ cogs: string }>(
      "SELECT COALESCE(SUM(si.line_cost),0)::text AS cogs FROM sale_items si JOIN sales s ON s.id=si.sale_id AND s.pharmacy_id=si.pharmacy_id WHERE si.pharmacy_id=$1 AND s.status='completed'",
      [pharmacyId],
    ),
    queryOne<{ value: string }>('SELECT COALESCE(SUM(quantity_packs * unit_cost),0)::text AS value FROM batches WHERE pharmacy_id=$1 AND expiry_date >= CURRENT_DATE AND quantity_packs > 0', [pharmacyId]),
  ]);
  // Financial summary derived from recorded sales and sale-item costs (gross, not net of operating expenses).
  const totalRevenue = Number(allTime?.total ?? 0);
  const totalCogs = Number(cogs?.cogs ?? 0);
  const grossProfit = totalRevenue - totalCogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  return {
    total_revenue: totalRevenue,
    total_cogs: totalCogs,
    gross_profit: grossProfit,
    gross_profit_margin: Math.round(grossProfitMargin * 100) / 100,
    period_sales: Number(period?.total ?? 0),
    monthly_sales: Number(month?.total ?? 0),
    transactions: transactions?.count ?? 0,
    active_inventory_count: inventory?.count ?? 0,
    expiring_batches_count: expiring?.count ?? 0,
    inventory_value: Number(inventoryValue?.value ?? 0),
    top_selling: topSelling.rows.map((item) => ({ ...item, revenue: Number(item.revenue) })),
    sales_trend: trend.rows.map((item) => ({ day: item.day, revenue: Number(item.revenue) })),
  };
}
