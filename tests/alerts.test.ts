import request from 'supertest';
import app from '../src/app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('Alerts', () => {
  let user: any;
  let medicineId: string;

  beforeAll(async () => {
    user = await createTestUser('pharmacist');
    const mres = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'AlertMed', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 5 });
    medicineId = mres.body.data.id;
    // expired batch with stock -> should be excluded from usable stock -> low stock
    await request(app)
      .post(`/api/medicines/${medicineId}/batches`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ batch_number: 'EXP', expiry_date: '2020-01-01', quantity_packs: 100 });
  });

  afterAll(async () => {
    await cleanupTestUser(user.id);
  });

  it('low-stock excludes expired batches', async () => {
    const res = await request(app).get('/api/alerts/low-stock').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    const found = res.body.data.find((m: any) => m.id === medicineId);
    expect(found).toBeDefined();
    expect(found.usable_stock).toBe(0);
  });

  it('expiring endpoint returns expired section', async () => {
    const res = await request(app).get('/api/alerts/expiring').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.expired)).toBe(true);
  });

  it('summary endpoint works', async () => {
    const res = await request(app).get('/api/alerts/summary').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.low_stock).toBeDefined();
  });
});
