const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { findByEmail, findById };