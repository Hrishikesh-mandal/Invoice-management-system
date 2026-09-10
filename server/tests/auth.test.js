const request = require('supertest');
const { app } = require('./testUtils');

describe('API architecture: Auth', () => {
  describe('POST /api/auth/login', () => {
    it('rejects a request missing email/password with 400, not a 500', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects an unknown email with 401 (not 404 — avoids leaking which emails exist)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@freightfox.test', password: 'whatever123' });
      expect(res.status).toBe(401);
    });

    it('rejects a known email with the wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@freightfox.test', password: 'wrong-password' });
      expect(res.status).toBe(401);
    });

    it('issues a JWT + user object on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@freightfox.test', password: 'password123' });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toMatchObject({
        email: 'admin@freightfox.test',
        role: 'admin',
      });
      // Never leak the password hash to the client
      expect(res.body.user.password_hash).toBeUndefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests with no Authorization header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects a malformed/garbage token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@freightfox.test', password: 'password123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@freightfox.test');
    });
  });
});