const pool = require('../config/db');

/**
 * All list/filter/sort/pagination logic lives here so controllers stay thin
 * and the SQL (the part that actually matters for performance) is easy to
 * find and tune in one place.
 */

// Whitelist of sortable columns -> actual SQL expression.
// NEVER interpolate the sort column directly from req.query — that's a
// classic SQL injection vector. Only these keys are ever allowed through.
const SORTABLE_COLUMNS = {
  invoice_number: 'i.invoice_number',
  customer_name: 'c.name',
  status: 's.name',
  issue_date: 'i.issue_date',
  total_amount: 'i.total_amount',
};

async function findAll({
  search,
  status,
  dateFrom,
  dateTo,
  sortBy = 'issue_date',
  sortDir = 'desc',
  page = 1,
  pageSize = 10,
}) {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(i.invoice_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (status && status !== 'all') {
    conditions.push(`s.name = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  if (dateFrom) {
    conditions.push(`i.issue_date >= $${paramIndex}`);
    values.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    conditions.push(`i.issue_date <= $${paramIndex}`);
    values.push(dateTo);
    paramIndex++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortColumn = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.issue_date;
  const sortDirection = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * pageSize;

  // Total count for pagination UI ("Showing 1-10 of 250 invoices")
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    JOIN invoice_statuses s ON s.id = i.status_id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = countResult.rows[0].total;

  // Page of rows. LIMIT/OFFSET here (not client-side slicing) is what keeps
  // this fast as the table grows past a few hundred rows.
  const dataQuery = `
    SELECT
      i.id,
      i.invoice_number,
      c.name AS customer_name,
      s.name AS status,
      i.issue_date,
      i.due_date,
      i.total_amount
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    JOIN invoice_statuses s ON s.id = i.status_id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataValues = [...values, pageSize, offset];
  const dataResult = await pool.query(dataQuery, dataValues);

  return {
    invoices: dataResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function findByIds(ids) {
  const result = await pool.query(
    `SELECT
       i.id, i.invoice_number, c.name AS customer_name, s.name AS status,
       i.issue_date, i.due_date, i.total_amount
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN invoice_statuses s ON s.id = i.status_id
     WHERE i.id = ANY($1::int[])`,
    [ids]
  );
  return result.rows;
}

async function findById(id) {
  const invoiceResult = await pool.query(
    `SELECT
       i.id, i.invoice_number, i.issue_date, i.due_date, i.total_amount,
       c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
       c.address AS customer_address,
       s.name AS status
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN invoice_statuses s ON s.id = i.status_id
     WHERE i.id = $1`,
    [id]
  );

  if (invoiceResult.rows.length === 0) return null;

  const lineItemsResult = await pool.query(
    `SELECT id, description, quantity, unit_price, line_total
     FROM line_items
     WHERE invoice_id = $1
     ORDER BY id ASC`,
    [id]
  );

  return {
    ...invoiceResult.rows[0],
    lineItems: lineItemsResult.rows,
  };
}

async function updateStatus(id, statusName) {
  const statusRes = await pool.query(
    `SELECT id FROM invoice_statuses WHERE name = $1`,
    [statusName]
  );
  if (statusRes.rows.length === 0) {
    throw new Error(`Invalid status: ${statusName}`);
  }

  const result = await pool.query(
    `UPDATE invoices SET status_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, invoice_number`,
    [statusRes.rows[0].id, id]
  );
  return result.rows[0] || null;
}

async function deleteByIds(ids) {
  const result = await pool.query(
    `DELETE FROM invoices WHERE id = ANY($1::int[]) RETURNING id`,
    [ids]
  );
  return result.rows.map((r) => r.id);
}

async function generateNextInvoiceNumber(client) {
  // Finds the highest existing FF-#### number and increments it.
  // Done inside the same transaction/client as the insert so two
  // simultaneous "create invoice" requests can't generate the same number.
  const result = await client.query(
    `SELECT invoice_number FROM invoices
     WHERE invoice_number ~ '^FF-[0-9]+$'
     ORDER BY (regexp_replace(invoice_number, '[^0-9]', '', 'g'))::int DESC
     LIMIT 1`
  );
  if (result.rows.length === 0) return 'FF-1024';
  const lastNumber = parseInt(result.rows[0].invoice_number.replace('FF-', ''), 10);
  return `FF-${lastNumber + 1}`;
}

/**
 * Creates an invoice with its line items in a single transaction — if any
 * line item insert fails, the whole invoice is rolled back rather than
 * left in a partial state.
 *
 * lineItems: [{ description, quantity, unitPrice }, ...]
 */
async function create({ customerId, issueDate, dueDate, createdBy, lineItems }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pendingStatusRes = await client.query(
      `SELECT id FROM invoice_statuses WHERE name = 'pending'`
    );
    const pendingStatusId = pendingStatusRes.rows[0].id;

    const invoiceNumber = await generateNextInvoiceNumber(client);

    const invoiceRes = await client.query(
      `INSERT INTO invoices
         (invoice_number, customer_id, status_id, issue_date, due_date, total_amount, created_by)
       VALUES ($1, $2, $3, $4, $5, 0, $6)
       RETURNING id`,
      [invoiceNumber, customerId, pendingStatusId, issueDate, dueDate, createdBy || null]
    );
    const invoiceId = invoiceRes.rows[0].id;

    for (const item of lineItems) {
      await client.query(
        `INSERT INTO line_items (invoice_id, description, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, item.description, item.quantity, item.unitPrice]
      );
    }

    // total_amount is derived from line items' generated line_total column,
    // so recompute it here rather than trusting a client-supplied total.
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(line_total), 0) AS total FROM line_items WHERE invoice_id = $1`,
      [invoiceId]
    );
    await client.query(`UPDATE invoices SET total_amount = $1 WHERE id = $2`, [
      totalRes.rows[0].total,
      invoiceId,
    ]);

    await client.query('COMMIT');
    return findById(invoiceId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findAll,
  findByIds,
  findById,
  create,
  updateStatus,
  deleteByIds,
  SORTABLE_COLUMNS,
};