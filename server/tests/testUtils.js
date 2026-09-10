const request = require('supertest');
const app = require('../src/app');

// Relies on the seeded test users from src/db/seed.js. If you've re-seeded
// with different credentials, update these to match.
const SEED_USERS = {
  admin: { email: 'admin@freightfox.test', password: 'password123' },
  accountant: { email: 'accountant@freightfox.test', password: 'password123' },
  viewer: { email: 'viewer@freightfox.test', password: 'password123' },
};

async function loginAs(role) {
  const creds = SEED_USERS[role];
  if (!creds) throw new Error(`Unknown seed role: ${role}`);

  const res = await request(app).post('/api/auth/login').send(creds);
  if (res.status !== 200) {
    throw new Error(
      `Failed to log in as ${role} — is the DB seeded? Response: ${JSON.stringify(res.body)}`
    );
  }
  return res.body.token;
}

module.exports = { app, loginAs, SEED_USERS };