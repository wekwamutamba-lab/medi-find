import request from 'supertest';
import app from '../src/app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('Movements', () => {
  let user: any;
  let medicineId: string;
  let batchId: string;

  beforeAll(async () => {
    user = await createTestUser('pharmacist');
    const mres = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'MovMed', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 2 });
    medicineId = mres.body.data.id;
    const bres = await request(app)
      .post(`/api/medicines/${medicineId}/batches`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ batch_number: 'B1', expiry_date: '2030-01-01', quantity_packs: 10 });
    batchId = bres.body.data.id;
  });

  afterAll(async () => {
    await cleanupTestUser(user.id);
  });

  it('batch creation created opening receipt movement', async () => {
    const res = await request(app)
      .get(`/api/medicines/${medicineId}/movements`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items.some((m: any) => m.movement_type === 'receipt')).toBe(true);
  });

  it('issue that would go negative returns 422', async () => {
    const res = await request(app)
      .post(`/api/batches/${batchId}/movements`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ movement_type: 'issue', quantity_packs: -100 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UNPROCESSABLE');
  });

  it('adjustment without reason returns 400', async () => {
    const res = await request(app)
      .post(`/api/batches/${batchId}/movements`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ movement_type: 'adjustment', quantity_packs: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('valid issue succeeds', async () => {
    const res = await request(app)
      .post(`/api/batches/${batchId}/movements`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ movement_type: 'issue', quantity_packs: -2 });
    expect(res.status).toBe(201);
  });
});
