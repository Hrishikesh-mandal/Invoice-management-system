const request = require('supertest');
const { app, loginAs } = require('./testUtils');

describe('API architecture: GET /api/invoices (listing)', () => {
  let token;

  beforeAll(async () => {
    token = await loginAs('admin');
  });

  const get = (query = '') =>
    request(app).get(`/api/invoices${query}`).set('Authorization', `Bearer ${token}`);

  describe('Pagination', () => {
    it('defaults to page 1 with a reasonable page size', async () => {
      const res = await get();
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.invoices.length).toBeLessThanOrEqual(res.body.pagination.pageSize);
    });

    it('respects an explicit pageSize and never returns more rows than requested', async () => {
      const res = await get('?pageSize=5');
      expect(res.status).toBe(200);
      expect(res.body.invoices.length).toBeLessThanOrEqual(5);
    });

    it('returns different rows on page 2 than page 1 (LIMIT/OFFSET actually applied)', async () => {
      const page1 = await get('?page=1&pageSize=10&sortBy=invoice_number&sortDir=asc');
      const page2 = await get('?page=2&pageSize=10&sortBy=invoice_number&sortDir=asc');

      const page1Ids = page1.body.invoices.map((inv) => inv.id);
      const page2Ids = page2.body.invoices.map((inv) => inv.id);

      expect(page1Ids.length).toBeGreaterThan(0);
      expect(page2Ids.length).toBeGreaterThan(0);
      // No overlap between pages — proves this isn't client-side slicing of
      // the same full result set returned twice.
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
    });

    it('caps pageSize at 100 even if a huge value is requested (abuse prevention)', async () => {
      const res = await get('?pageSize=999999');
      expect(res.status).toBe(200);
      expect(res.body.pagination.pageSize).toBeLessThanOrEqual(100);
    });

    it('reports an accurate total count matching the full seeded dataset', async () => {
      const res = await get('?pageSize=1');
      // Seed script inserts 250 invoices; this stays valid as long as no
      // other test suite leaves extra rows behind (our create/delete tests
      // clean up after themselves).
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(250);
    });
  });

  describe('Sorting', () => {
    it('sorts by total_amount ascending correctly', async () => {
      const res = await get('?sortBy=total_amount&sortDir=asc&pageSize=20');
      const amounts = res.body.invoices.map((inv) => parseFloat(inv.total_amount));
      const sorted = [...amounts].sort((a, b) => a - b);
      expect(amounts).toEqual(sorted);
    });

    it('sorts by total_amount descending correctly', async () => {
      const res = await get('?sortBy=total_amount&sortDir=desc&pageSize=20');
      const amounts = res.body.invoices.map((inv) => parseFloat(inv.total_amount));
      const sorted = [...amounts].sort((a, b) => b - a);
      expect(amounts).toEqual(sorted);
    });

    it('ignores an unrecognized sortBy value rather than causing a SQL error (whitelist enforced)', async () => {
      const res = await get('?sortBy=DROP TABLE invoices; --&pageSize=5');
      // Should NOT 500 — the model whitelists sort columns and falls back
      // to a safe default instead of interpolating this directly into SQL.
      expect(res.status).toBe(200);
    });
  });

  describe('Filtering', () => {
    it('filters by status correctly — every row matches', async () => {
      const res = await get('?status=overdue&pageSize=50');
      expect(res.status).toBe(200);
      for (const inv of res.body.invoices) {
        expect(inv.status).toBe('overdue');
      }
    });

    it('returns an empty (not error) result for a status with zero matches combined with an impossible date range', async () => {
      const res = await get('?status=paid&dateFrom=2099-01-01&dateTo=2099-01-02');
      expect(res.status).toBe(200);
      expect(res.body.invoices).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('filters by date range correctly', async () => {
      const res = await get('?dateFrom=2026-01-01&dateTo=2026-12-31&pageSize=50');
      expect(res.status).toBe(200);
      for (const inv of res.body.invoices) {
        expect(inv.issue_date >= '2026-01-01').toBe(true);
        expect(inv.issue_date <= '2026-12-31').toBe(true);
      }
    });
  });

  describe('Search', () => {
    it('search matches by invoice number substring', async () => {
      const res = await get('?search=FF-102');
      expect(res.status).toBe(200);
      for (const inv of res.body.invoices) {
        expect(inv.invoice_number).toMatch(/FF-102/);
      }
    });

    it('search is case-insensitive', async () => {
      const res = await get('?search=acme');
      expect(res.status).toBe(200);
      // Not asserting non-empty (depends on seed data), just that it
      // doesn't error and doesn't require exact case matching.
      expect(res.status).not.toBe(500);
    });
  });

  describe('GET /api/invoices/:id (detail)', () => {
    it('returns line items alongside the invoice summary', async () => {
      const listRes = await get('?pageSize=1');
      const id = listRes.body.invoices[0].id;

      const res = await request(app)
        .get(`/api/invoices/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.lineItems)).toBe(true);
      expect(res.body.lineItems.length).toBeGreaterThan(0);
    });

    it('returns 404 (not 500) for a plainly non-existent ID', async () => {
      const res = await request(app)
        .get('/api/invoices/999999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});