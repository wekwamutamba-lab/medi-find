import { query, queryOne } from '../db/query';
import { withTransaction } from '../db/client';
import { AppError } from '../middleware/errorHandler';

export async function listPurchaseOrders(pharmacyId: string) {
  const res = await query(
    `SELECT po.*, s.name AS supplier_name
     FROM purchase_orders po
     LEFT JOIN suppliers s ON s.id = po.supplier_id AND s.pharmacy_id = po.pharmacy_id
     WHERE po.pharmacy_id = $1
     ORDER BY po.created_at DESC`,
    [pharmacyId],
  );
  return res.rows;
}

export async function getPurchaseOrder(id: string, pharmacyId: string) {
  const res = await query(
    `SELECT po.*, s.name AS supplier_name
     FROM purchase_orders po
     LEFT JOIN suppliers s ON s.id = po.supplier_id AND s.pharmacy_id = po.pharmacy_id
     WHERE po.id = $1 AND po.pharmacy_id = $2`,
    [id, pharmacyId],
  );
  if (!res.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Purchase order not found');
  return res.rows[0];
}

export async function getPurchaseOrderItems(poId: string, pharmacyId: string) {
  const po = await queryOne('SELECT id FROM purchase_orders WHERE id = $1 AND pharmacy_id = $2', [poId, pharmacyId]);
  if (!po) throw new AppError(404, 'NOT_FOUND', 'Purchase order not found');

  const res = await query(
    `SELECT poi.*, m.name AS medicine_name, m.strength, m.dosage_form
     FROM purchase_order_items poi
     JOIN medicines m ON m.id = poi.medicine_id AND m.pharmacy_id = $2
     WHERE poi.purchase_order_id = $1
     ORDER BY poi.created_at ASC`,
    [poId, pharmacyId],
  );
  return res.rows;
}
export async function createPurchaseOrder(data: any, pharmacyId: string, performedBy: string) {
  return withTransaction(async (client) => {
    if (data.supplier_id) {
      const supplier = await client.query('SELECT id FROM suppliers WHERE id = $1 AND pharmacy_id = $2', [data.supplier_id, pharmacyId]);
      if (!supplier.rowCount) throw new AppError(404, 'NOT_FOUND', 'Supplier not found in this pharmacy');
    }

    for (const item of data.items) {
      const med = await client.query('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [item.medicine_id, pharmacyId]);
      if (!med.rowCount) throw new AppError(404, 'NOT_FOUND', `Medicine ${item.medicine_id} not found`);
    }

    let totalCost = 0;
    const poRes = await client.query(
      `INSERT INTO purchase_orders (pharmacy_id, supplier_id, po_number, status, total_cost, notes)
       VALUES ($1,$2,$3,'pending',$4,$5) RETURNING *`,
      [pharmacyId, data.supplier_id ?? null, data.po_number, 0, data.notes ?? null],
    );
    const po = poRes.rows[0];

    for (const item of data.items) {
      const lineCost = Number(item.quantity_packs) * Number(item.unit_cost);
      totalCost += lineCost;

      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, medicine_id, batch_number, expiry_date, quantity_packs, unit_cost, line_cost)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [po.id, item.medicine_id, item.batch_number, item.expiry_date, item.quantity_packs, item.unit_cost, lineCost],
      );
    }

    await client.query('UPDATE purchase_orders SET total_cost = $1, updated_at = now() WHERE id = $2', [totalCost, po.id]);

    return { ...po, total_cost: totalCost };
  });
}

export async function receivePurchaseOrder(poId: string, pharmacyId: string, performedBy: string) {
  return withTransaction(async (client) => {
    const poRes = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
      [poId, pharmacyId],
    );
    const po = poRes.rows[0];
    if (!po) throw new AppError(404, 'NOT_FOUND', 'Purchase order not found');
    if (po.status === 'received') {
      return { received: true, po_id: poId, already_received: true };
    }
    if (po.status !== 'pending') {
      throw new AppError(409, 'CONFLICT', 'Purchase order cannot be received in its current state');
    }

    const itemsRes = await client.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY created_at ASC, id ASC FOR UPDATE',
      [poId],
    );
    const items = itemsRes.rows;

    for (const item of items) {
      const orderedQty = Number(item.quantity_packs);
      const previouslyReceived = Number(item.received_quantity_packs || 0);
      const requested = item.received_quantity_packs == null || previouslyReceived === 0 ? orderedQty : previouslyReceived;
      const receiveQty = Math.max(0, Math.min(orderedQty, requested));
      if (receiveQty <= 0) continue;

      const batchRes = await client.query(
        'SELECT id, quantity_packs FROM batches WHERE medicine_id = $1 AND pharmacy_id = $2 AND batch_number = $3 FOR UPDATE',
        [item.medicine_id, pharmacyId, item.batch_number],
      );
      let batch = batchRes.rows[0];

      if (batch) {
        const newQty = Number(batch.quantity_packs) + receiveQty;
        await client.query(
          'UPDATE batches SET quantity_packs = $1, expiry_date = $2, unit_cost = $3, updated_at = now() WHERE id = $4 AND pharmacy_id = $5',
          [newQty, item.expiry_date, item.unit_cost, batch.id, pharmacyId],
        );
      } else {
        const med = await client.query('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [item.medicine_id, pharmacyId]);
        if (!med.rowCount) throw new AppError(404, 'NOT_FOUND', 'Medicine not found');

        const inserted = await client.query(
          `INSERT INTO batches (pharmacy_id, medicine_id, batch_number, expiry_date, quantity_packs, unit_cost)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [pharmacyId, item.medicine_id, item.batch_number, item.expiry_date, receiveQty, item.unit_cost],
        );
        batch = { id: inserted.rows[0].id, quantity_packs: receiveQty };
      }

      await client.query(
        `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by)
         VALUES ($1,$2,'receipt',$3,$4,$5)`,
        [pharmacyId, batch.id, receiveQty, `PO ${po.po_number} receipt`, performedBy],
      );

      // purchase_order_items has no updated_at column in schema 011; update only received quantity.
      await client.query(
        'UPDATE purchase_order_items SET received_quantity_packs = $1 WHERE id = $2 AND purchase_order_id = $3',
        [receiveQty, item.id, poId],
      );
    }

    await client.query(
      'UPDATE purchase_orders SET status = $1, received_at = now(), updated_at = now() WHERE id = $2',
      ['received', poId],
    );

    return { received: true, po_id: poId, already_received: false };
  });
}

export async function cancelPurchaseOrder(id: string, pharmacyId: string) {
  const po = await queryOne('SELECT id FROM purchase_orders WHERE id = $1 AND pharmacy_id = $2 AND status = $3', [id, pharmacyId, 'pending']);
  if (!po) throw new AppError(404, 'NOT_FOUND', 'Purchase order not found or cannot be cancelled');

  await query('UPDATE purchase_orders SET status = $1, updated_at = now() WHERE id = $2', ['cancelled', id]);
  return { cancelled: true };
}

export async function updatePurchaseOrderItemReceived(poId: string, itemId: string, receivedQty: number, pharmacyId: string) {
  const po = await queryOne('SELECT id, status FROM purchase_orders WHERE id = $1 AND pharmacy_id = $2', [poId, pharmacyId]);
  if (!po) throw new AppError(404, 'NOT_FOUND', 'Purchase order not found');
  if (po.status !== 'pending') throw new AppError(409, 'CONFLICT', 'Only pending purchase orders can be updated');

  const item = await queryOne<{ id: string; quantity_packs: number }>('SELECT id, quantity_packs FROM purchase_order_items WHERE id = $1 AND purchase_order_id = $2', [itemId, poId]);
  if (!item) throw new AppError(404, 'NOT_FOUND', 'PO item not found');
  if (receivedQty < 0 || receivedQty > Number(item.quantity_packs)) {
    throw new AppError(422, 'UNPROCESSABLE', 'Received quantity must be between 0 and ordered quantity');
  }

  // purchase_order_items has no updated_at column in schema 011; update only received quantity.
  await query(
    'UPDATE purchase_order_items SET received_quantity_packs = $1 WHERE id = $2 AND purchase_order_id = $3',
    [receivedQty, itemId, poId],
  );

  return { updated: true };
}