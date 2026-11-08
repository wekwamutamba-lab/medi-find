import { query, queryOne } from '../db/query';
import { AppError } from '../middleware/errorHandler';

export async function listCustomers(pharmacyId: string) {
  const rows = await query('SELECT * FROM customers WHERE pharmacy_id = $1 ORDER BY name', [pharmacyId]);
  return rows.rows;
}

export async function createCustomer(data: any, pharmacyId: string) {
  return queryOne('INSERT INTO customers (pharmacy_id, name, email, phone, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *', [pharmacyId, data.name, data.email || null, data.phone || null, data.notes || null]);
}

export async function updateCustomer(id: string, data: any, pharmacyId: string) {
  const row = await queryOne('UPDATE customers SET name = COALESCE($1,name), email = COALESCE($2,email), phone = COALESCE($3,phone), notes = COALESCE($4,notes), updated_at = now() WHERE id = $5 AND pharmacy_id = $6 RETURNING *', [data.name, data.email, data.phone, data.notes, id, pharmacyId]);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Customer not found.');
  return row;
}

export async function deleteCustomer(id: string, pharmacyId: string) {
  const linked = await queryOne<{ exists: boolean }>('SELECT EXISTS(SELECT 1 FROM sales WHERE customer_id = $1 AND pharmacy_id = $2) AS exists', [id, pharmacyId]);
  if (linked?.exists) throw new AppError(409, 'CUSTOMER_HAS_SALES', 'Customers with sales history cannot be deleted.');
  const result = await query('DELETE FROM customers WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
  if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Customer not found.');
  return { deleted: true };
}

export async function listSuppliers(pharmacyId: string) {
  const rows = await query('SELECT * FROM suppliers WHERE pharmacy_id = $1 ORDER BY name', [pharmacyId]);
  return rows.rows;
}

export async function createSupplier(data: any, pharmacyId: string) {
  return queryOne('INSERT INTO suppliers (pharmacy_id, name, contact_name, email, phone, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [pharmacyId, data.name, data.contact_name || null, data.email || null, data.phone || null, data.address || null]);
}

export async function updateSupplier(id: string, data: any, pharmacyId: string) {
  const row = await queryOne('UPDATE suppliers SET name = COALESCE($1,name), contact_name = COALESCE($2,contact_name), email = COALESCE($3,email), phone = COALESCE($4,phone), address = COALESCE($5,address), is_active = COALESCE($6,is_active), updated_at = now() WHERE id = $7 AND pharmacy_id = $8 RETURNING *', [data.name, data.contact_name, data.email, data.phone, data.address, data.is_active, id, pharmacyId]);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Supplier not found.');
  return row;
}

export async function deleteSupplier(id: string, pharmacyId: string) {
  const result = await query('UPDATE suppliers SET is_active = FALSE, updated_at = now() WHERE id = $1 AND pharmacy_id = $2 RETURNING id', [id, pharmacyId]);
  if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Supplier not found.');
  return { archived: true };
}
