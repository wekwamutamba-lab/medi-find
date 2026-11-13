import request from 'supertest';
import app from '../src/app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('Purchase Orders', () => {
  let user: any;
  let pharmacyId: string;
  let supplierId: string;
  let medicineId1: string;
  let medicineId2: string;
  let poId: string;
  let poItemId1: string;
  let poItemId2: string;

  beforeAll(async () => {
    user = await createTestUser('admin');
    pharmacyId = user.pharmacyId;

    // Create a supplier
    const supRes = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Test Supplier', contact_name: 'Test', email: 'test@example.com', phone: '555-0100', address: '123 Test St' });
    supplierId = supRes.body.data.id;

    // Create two medicines
    const med1Res = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Test Medicine One', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 5, unit_price: 5 });
    medicineId1 = med1Res.body.data.id;

    const med2Res = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Test Medicine Two', strength: '200mg', dosage_form: 'capsule', pack_size: 20, reorder_level: 5, unit_price: 8 });
    medicineId2 = med2Res.body.data.id;

    // Create a purchase order with two items
    const poRes = await request(app)
      .post('/api/purchase-orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        po_number: 'PO-TEST-001',
        supplier_id: supplierId,
        items: [
          { medicine_id: medicineId1, batch_number: 'PO-BATCH-1', expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), quantity_packs: 10, unit_cost: 2.50 },
          { medicine_id: medicineId2, batch_number: 'PO-BATCH-2', expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), quantity_packs: 10, unit_cost: 4.00 },
        ],
      });
    poId = poRes.body.data.id;
    poItemId1 = poRes.body.data.items[0].id;
    poItemId2 = poRes.body.data.items[1].id;
  });

  afterAll(async () => {
    await cleanupTestUser(user.id);
  });

  it('creates a purchase order', async () => {
    const res = await request(app)
      .get('/api/purchase-orders')
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('receives the purchase order once', async () => {
    const res = await request(app)
      .post('/api/purchase-orders/receive')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ id: poId });
    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
    expect(res.body.data.already_received).toBe(false);
  });

  it('prevents duplicate receipt of the same purchase order', async () => {
    const res = await request(app)
      .post('/api/purchase-orders/receive')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ id: poId });
    expect(res.status).toBe(200);
    expect(res.body.data.received).toBe(true);
    expect(res.body.data.already_received).toBe(true);
  });

  it('prevents receipt with invalid PO ID', async () => {
    const res = await request(app)
      .post('/api/purchase-orders/receive')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ id: '00000000-0000-0000-0000-000000000000' });
    expect([404, 409]).toContain(res.status);
  });

  it('prevents receipt of a cancelled purchase order', async () => {
    // Cancel the PO first
    await request(app)
      .patch(`/api/purchase-orders/${poId}/cancel`)
      .set('Authorization', `Bearer ${user.token}`);

    const res = await request(app)
      .post('/api/purchase-orders/receive')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ id: poId });
    expect(res.status).toBe(409);
  });

  it('fetches individual PO items', async () => {
    const res = await request(app)
      .get(`/api/purchase-orders/${poId}/items`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});