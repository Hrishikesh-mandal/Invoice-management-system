// Jest keeps the process alive if the pg Pool's connections are still open.
// This runs once after the entire test suite finishes, regardless of which
// test files ran, and closes the shared pool cleanly.
module.exports = async () => {
  const pool = require('../src/config/db');
  await pool.end();
};