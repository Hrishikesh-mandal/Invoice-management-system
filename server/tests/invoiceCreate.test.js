const request = require('supertest');
const { app, loginAs } = require('./testUtils');

describe('Form handling: POST /api/invoices (Create Invoice)', () => {
  let adminToken, viewerToken, customerId;
  const createdInvoiceIds = [];

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    viewerToken = await loginAs('viewer');

    const customersRes = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    customerId = customersRes.body[0].id;
  });

  // Clean up every invoice this test file created, so re-running the suite
  // doesn't leave junk data behind in the seeded database.
  afterAll(async () => {
    if (createdInvoiceIds.length === 0) return;
    await request(app)
      .post('/api/invoices/bulk-delete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: createdInvoiceIds });
  });

  const validPayload = () => ({
    customerId,
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    lineItems: [{ description: 'TEST ITEM — safe to delete', quantity: 2, unitPrice: 50 }],
  });

  describe('Rejections (400) — each one specific, not a generic failure', () => {
    it('rejects a missing customerId', async () => {
      const { customerId: _omit, ...payload } = validPayload();
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/customerId/i);
    });

    it('rejects a missing issueDate/dueDate', async () => {
      const { issueDate, ...payload } = validPayload();
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });

    it('rejects a dueDate before issueDate', async () => {
      const payload = { ...validPayload(), issueDate: '2026-02-01', dueDate: '2026-01-01' };
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/dueDate/i);
    });

    it('rejects an empty lineItems array', async () => {
      const payload = { ...validPayload(), lineItems: [] };
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });

    it('rejects a line item with a blank description', async () => {
      const payload = { ...validPayload(), lineItems: [{ description: '  ', quantity: 1, unitPrice: 10 }] };
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });

    it('rejects a line item with zero or negative quantity', async () => {
      const payload = {
        ...validPayload(),
        lineItems: [{ description: 'Bad qty', quantity: 0, unitPrice: 10 }],
      };
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });

    it('rejects a line item with a negative unit price', async () => {
      const payload = {
        ...validPayload(),
        lineItems: [{ description: 'Bad price', quantity: 1, unitPrice: -5 }],
      };
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    });
  });

  describe('Role enforcement on creation', () => {
    it('blocks viewer with 403', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validPayload());
      expect(res.status).toBe(403);
    });
  });

  describe('Happy path', () => {
    it('creates an invoice with correct server-computed total, and persists line items', async () => {
      const payload = {
        ...validPayload(),
        lineItems: [
          { description: 'TEST — Line A', quantity: 2, unitPrice: 50 }, // 100
          { description: 'TEST — Line B', quantity: 1, unitPrice: 25.5 }, // 25.50
        ],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.invoice_number).toMatch(/^FF-\d+$/);
      expect(parseFloat(res.body.total_amount)).toBeCloseTo(125.5, 2);
      expect(res.body.lineItems).toHaveLength(2);
      expect(res.body.status).toBe('pending'); // new invoices default to pending

      createdInvoiceIds.push(res.body.id);
    });

    it('rejects a client-supplied total by ignoring it and computing from line items server-side', async () => {
      // Even if a malicious/buggy client sent a totalAmount field, the
      // server should never trust it — it always derives the total from
      // the actual line items in the same transaction.
      const payload = {
        ...validPayload(),
        totalAmount: 999999, // should be ignored entirely
        lineItems: [{ description: 'TEST — single item', quantity: 1, unitPrice: 10 }],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(parseFloat(res.body.total_amount)).toBeCloseTo(10, 2);

      createdInvoiceIds.push(res.body.id);
    });
  });
});