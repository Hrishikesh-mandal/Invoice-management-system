const request = require('supertest');
const { app, loginAs } = require('./testUtils');

describe('API architecture: role-based access control', () => {
  let adminToken, accountantToken, viewerToken, sampleInvoiceId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    accountantToken = await loginAs('accountant');
    viewerToken = await loginAs('viewer');

    // Grab a real invoice ID to use in the mutation tests below.
    const listRes = await request(app)
      .get('/api/invoices?pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);
    sampleInvoiceId = listRes.body.invoices[0].id;
  });

  describe('Read access — all authenticated roles allowed', () => {
    it.each(['admin', 'accountant', 'viewer'])(
      'GET /api/invoices succeeds as %s',
      async (role) => {
        const token = { admin: adminToken, accountant: accountantToken, viewer: viewerToken }[role];
        const res = await request(app).get('/api/invoices').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
      }
    );
  });

  describe('PATCH /api/invoices/:id/status — admin & accountant only', () => {
    it('allows admin', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${sampleInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'pending' });
      expect(res.status).toBe(200);
    });

    it('allows accountant', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${sampleInvoiceId}/status`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ status: 'pending' });
      expect(res.status).toBe(200);
    });

    it('blocks viewer with 403, not a silent failure', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${sampleInvoiceId}/status`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'paid' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/viewer/i);
    });
  });

  describe('POST /api/invoices/bulk-delete — admin only', () => {
    it('blocks accountant with 403', async () => {
      const res = await request(app)
        .post('/api/invoices/bulk-delete')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ ids: [sampleInvoiceId] });
      expect(res.status).toBe(403);
    });

    it('blocks viewer with 403', async () => {
      const res = await request(app)
        .post('/api/invoices/bulk-delete')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ ids: [sampleInvoiceId] });
      expect(res.status).toBe(403);
    });

    // Note: we deliberately do NOT test the admin-allowed case here with a
    // real invoice — that would destroy seed data every test run. Deletion
    // as admin is covered in invoiceCreate.test.js, scoped to an invoice
    // this test suite creates and cleans up itself.
  });

  describe('Unauthenticated requests', () => {
    it('rejects all invoice routes with no token at all', async () => {
      const res = await request(app).get('/api/invoices');
      expect(res.status).toBe(401);
    });
  });
});