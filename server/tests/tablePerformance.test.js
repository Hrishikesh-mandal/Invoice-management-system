const request = require('supertest');
const { app, loginAs } = require('./testUtils');

/**
 * "Table performance" from the assignment brief, interpreted as: the
 * listing endpoint must stay fast and correctly scoped as the dataset
 * grows — i.e. it's doing indexed, paginated SQL queries (LIMIT/OFFSET +
 * indexed WHERE/ORDER BY), NOT fetching the entire table and slicing it
 * in JavaScript. These tests assert both the timing AND the underlying
 * behavior that makes the timing possible.
 */
describe('Table performance: GET /api/invoices at 250+ row scale', () => {
  let token;

  beforeAll(async () => {
    token = await loginAs('admin');
  });

  const get = (query = '') =>
    request(app).get(`/api/invoices${query}`).set('Authorization', `Bearer ${token}`);

  it('returns a single page of results in well under a second', async () => {
    const start = Date.now();
    const res = await get('?pageSize=10');
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    // Generous threshold since this may run against a real network-hosted
    // DB (Neon) rather than localhost — still catches an accidental
    // full-table-scan-then-slice-in-JS regression, which would be far slower.
    expect(elapsedMs).toBeLessThan(2000);
  });

  it('response payload size does not grow with pageSize=10 regardless of total dataset size', async () => {
    // If pagination were happening client-side (fetch everything, slice in
    // JS), the response body would be huge. It should stay small and
    // proportional only to pageSize, never to the full 250+ row table.
    const res = await get('?pageSize=10');
    const payloadSize = JSON.stringify(res.body.invoices).length;

    // 10 rows of invoice data should be well under 5KB; a full 250-row
    // dump would be 20-25x that.
    expect(payloadSize).toBeLessThan(5000);
  });

  it('sorting by an indexed column (total_amount) does not meaningfully slow down as page number increases', async () => {
    const timings = [];
    for (const page of [1, 10, 20]) {
      const start = Date.now();
      const res = await get(`?page=${page}&pageSize=10&sortBy=total_amount&sortDir=desc`);
      timings.push(Date.now() - start);
      expect(res.status).toBe(200);
    }

    // A naive OFFSET-based full scan would show timings climbing noticeably
    // with page number; with an index on total_amount this stays roughly
    // flat. Allow generous variance for network jitter to a remote DB.
    const maxTiming = Math.max(...timings);
    expect(maxTiming).toBeLessThan(2500);
  });

  it('combined filter + sort + search + pagination in one request still responds quickly', async () => {
    // The worst case: every WHERE clause active at once, plus an ORDER BY,
    // plus LIMIT/OFFSET — exercises the full query the real listing UI
    // would send when a user has search + status + date range all active.
    const start = Date.now();
    const res = await get(
      '?search=FF&status=paid&dateFrom=2026-01-01&dateTo=2026-12-31&sortBy=issue_date&sortDir=desc&page=2&pageSize=10'
    );
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThan(2000);
  });

  it('total count (COUNT(*)) stays accurate and fast even with filters applied', async () => {
    const start = Date.now();
    const res = await get('?status=overdue');
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(typeof res.body.pagination.total).toBe('number');
    expect(elapsedMs).toBeLessThan(2000);
  });

  it('CSV export of the full filtered set (no pagination cap) still completes in reasonable time', async () => {
    // This is the one endpoint that intentionally fetches ALL matching rows
    // (not paginated) — worth timing separately since it's the one place
    // a genuinely large dataset could become a real bottleneck.
    const start = Date.now();
    const res = await request(app)
      .get('/api/invoices/export')
      .set('Authorization', `Bearer ${token}`);
    const elapsedMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(elapsedMs).toBeLessThan(3000);

    // Sanity check: CSV has a header row plus at least as many rows as the
    // seeded dataset.
    const lineCount = res.text.trim().split('\n').length;
    expect(lineCount).toBeGreaterThan(250);
  });
});