const pool = require('../config/db');

async function findByInvoiceId(invoiceId) {
  const result = await pool.query(
    `SELECT id, description, quantity, unit_price, line_total
     FROM line_items
     WHERE invoice_id = $1
     ORDER BY id ASC`,
    [invoiceId]
  );
  return result.rows;
}

async function create(invoiceId, { description, quantity, unitPrice }) {
  const result = await pool.query(
    `INSERT INTO line_items (invoice_id, description, quantity, unit_price)
     VALUES ($1, $2, $3, $4)
     RETURNING id, description, quantity, unit_price, line_total`,
    [invoiceId, description, quantity, unitPrice]
  );
  return result.rows[0];
}

module.exports = { findByInvoiceId, create };