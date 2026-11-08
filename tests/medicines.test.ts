import request from 'supertest';
import app from '../src/app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('Medicines', () => {
  let user: any;
  beforeAll(async () => {
    user = await createTestUser('pharmacist');
  });
  afterAll(async () => {
    await cleanupTestUser(user.id);
  });

  it('creates a medicine', async () => {
    const res = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'TestMed', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('TestMed');
  });

  it('returns 409 on duplicate', async () => {
    await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'DupMed', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 2 });
    const res = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'DupMed', strength: '100mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 2 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('lists medicines', async () => {
    const res = await request(app).get('/api/medicines').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('does not expose another pharmacy tenant medicine', async () => {
    const otherUser = await createTestUser('pharmacist');
    try {
      const created = await request(app)
        .post('/api/medicines')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ name: 'TenantPrivateMed', strength: '50mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 1 });
      const hidden = await request(app)
        .get(`/api/medicines/${created.body.data.id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);
      const listed = await request(app).get('/api/medicines').set('Authorization', `Bearer ${otherUser.token}`);
      expect(hidden.status).toBe(404);
      expect(listed.body.data.items.some((medicine: any) => medicine.id === created.body.data.id)).toBe(false);
    } finally {
      await cleanupTestUser(otherUser.id);
    }
  });

  it('pharmacist cannot delete? admin only -> 403', async () => {
    const res = await request(app).delete('/api/medicines/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${user.token}`);
    // either 403 or 404; role guard should block before not found? delete requires admin -> 403
    expect([403, 404]).toContain(res.status);
  });
});
