const pool = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Powers the 4 stat cards: Total Invoices, Paid Invoices, Pending Amount, Overdue Invoices.
 *
 * Done as a single query with FILTER clauses rather than 4 separate queries —
 * one round trip instead of four, and the DB only has to scan the table once.
 */
async function getDashboardStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total_invoices,
        COUNT(*) FILTER (WHERE s.name = 'paid')::int AS paid_invoices,
        COUNT(*) FILTER (WHERE s.name = 'overdue')::int AS overdue_invoices,
        COALESCE(SUM(i.total_amount) FILTER (WHERE s.name = 'pending'), 0) AS pending_amount
      FROM invoices i
      JOIN invoice_statuses s ON s.id = i.status_id
    `);

    const row = result.rows[0];

    res.json({
      totalInvoices: row.total_invoices,
      paidInvoices: row.paid_invoices,
      pendingAmount: parseFloat(row.pending_amount),
      overdueInvoices: row.overdue_invoices,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { getDashboardStats };