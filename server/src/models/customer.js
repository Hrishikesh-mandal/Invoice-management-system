const pool = require('../config/db');

async function findAll() {
  const result = await pool.query(`SELECT id, name, email, phone FROM customers ORDER BY name ASC`);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(`SELECT * FROM customers WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

module.exports = { findAll, findById };