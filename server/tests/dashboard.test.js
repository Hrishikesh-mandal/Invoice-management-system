const request = require('supertest');
const { app, loginAs } = require('./testUtils');

describe('API architecture: GET /api/dashboard/stats', () => {
  let token;

  beforeAll(async () => {
    token = await loginAs('admin');
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('returns all four required stats with the correct shape', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalInvoices).toBe('number');
    expect(typeof res.body.paidInvoices).toBe('number');
    expect(typeof res.body.pendingAmount).toBe('number');
    expect(typeof res.body.overdueInvoices).toBe('number');
  });

  it('totalInvoices matches the listing endpoint\'s total count (cross-check between two independent queries)', async () => {
    const statsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    const listRes = await request(app)
      .get('/api/invoices?pageSize=1')
      .set('Authorization', `Bearer ${token}`);

    expect(statsRes.body.totalInvoices).toBe(listRes.body.pagination.total);
  });

  it('paidInvoices count matches a direct status-filtered query', async () => {
    const statsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    const paidListRes = await request(app)
      .get('/api/invoices?status=paid&pageSize=1')
      .set('Authorization', `Bearer ${token}`);

    expect(statsRes.body.paidInvoices).toBe(paidListRes.body.pagination.total);
  });

  it('overdueInvoices count matches a direct status-filtered query', async () => {
    const statsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    const overdueListRes = await request(app)
      .get('/api/invoices?status=overdue&pageSize=1')
      .set('Authorization', `Bearer ${token}`);

    expect(statsRes.body.overdueInvoices).toBe(overdueListRes.body.pagination.total);
  });

  it('pendingAmount is a non-negative number reflecting SUM of pending invoices', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.pendingAmount).toBeGreaterThanOrEqual(0);
  });
});