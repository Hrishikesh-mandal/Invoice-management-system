// Seeds the database with enough data to actually exercise pagination,
// sorting, and the "table performance" requirement (250 invoices, matching
// the number shown in the original design mock).
//
// Run with: node src/db/seed.js

const pool = require('../config/db');
const bcrypt = require('bcrypt');

const CUSTOMER_NAMES = [
  'ACME Corp', 'AMA Company', 'Globex Inc', 'Initech',
  'Umbrella Logistics', 'Stark Freight', 'Wayne Shipping', 'Wonka Industries',
];

const STATUS_WEIGHTS = [
  { name: 'paid', weight: 0.78 },
  { name: 'pending', weight: 0.17 },
  { name: 'overdue', weight: 0.05 },  
];

function pickStatus() {
  const r = Math.random();
  let cumulative = 0;
  for (const s of STATUS_WEIGHTS) {
    cumulative += s.weight;
    if (r <= cumulative) return s.name;
  }
  return 'paid';
}

function randomDateWithinDays(days) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
  return past.toISOString().slice(0, 10);
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Users (one per role, for testing role-based actions) ---
    const passwordHash = await bcrypt.hash('password123', 10);
    const roleRows = await client.query('SELECT id, name FROM roles');
    const roleIdByName = Object.fromEntries(roleRows.rows.map(r => [r.name, r.id]));

    const userSeed = [
      { name: 'Alice Admin', email: 'admin@freightfox.test', role: 'admin' },
      { name: 'Carl Accountant', email: 'accountant@freightfox.test', role: 'accountant' },
      { name: 'Vera Viewer', email: 'viewer@freightfox.test', role: 'viewer' },
    ];

    const userIds = [];
    for (const u of userSeed) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.name, u.email, passwordHash, roleIdByName[u.role]]
      );
      userIds.push(res.rows[0].id);
    }

    // --- Customers ---
    const customerIds = [];
    for (const name of CUSTOMER_NAMES) {
      const res = await client.query(
        `INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id`,
        [name, `${name.toLowerCase().replace(/\s+/g, '')}@example.com`]
      );
      customerIds.push(res.rows[0].id);
    }

    const statusRows = await client.query('SELECT id, name FROM invoice_statuses');
    const statusIdByName = Object.fromEntries(statusRows.rows.map(r => [r.name, r.id]));

    // --- Invoices + line items (250 total, matching the dashboard mock) ---
    const TOTAL_INVOICES = 250;
    for (let i = 0; i < TOTAL_INVOICES; i++) {
      const invoiceNumber = `FF-${1024 + i}`;
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const statusName = pickStatus();
      const issueDate = randomDateWithinDays(120);
      const dueDateObj = new Date(issueDate);
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      const dueDate = dueDateObj.toISOString().slice(0, 10);
      const createdBy = userIds[Math.floor(Math.random() * userIds.length)];

      const invoiceRes = await client.query(
        `INSERT INTO invoices
           (invoice_number, customer_id, status_id, issue_date, due_date, total_amount, created_by)
         VALUES ($1, $2, $3, $4, $5, 0, $6)
         RETURNING id`,
        [invoiceNumber, customerId, statusIdByName[statusName], issueDate, dueDate, createdBy]
      );
      const invoiceId = invoiceRes.rows[0].id;

      // 1-4 line items per invoice
      const lineItemCount = 1 + Math.floor(Math.random() * 4);
      let total = 0;
      for (let li = 0; li < lineItemCount; li++) {
        const quantity = 1 + Math.floor(Math.random() * 5);
        const unitPrice = (50 + Math.random() * 450).toFixed(2);
        total += quantity * parseFloat(unitPrice);
        await client.query(
          `INSERT INTO line_items (invoice_id, description, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [invoiceId, `Freight service item ${li + 1}`, quantity, unitPrice]
        );
      }

      await client.query(
        `UPDATE invoices SET total_amount = $1 WHERE id = $2`,
        [total.toFixed(2), invoiceId]
      );
    }

    await client.query('COMMIT');
    console.log(`Seed complete: ${userSeed.length} users, ${CUSTOMER_NAMES.length} customers, ${TOTAL_INVOICES} invoices.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();