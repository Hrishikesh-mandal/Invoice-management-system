// The actual runtime entry point. Split from app.js so tests can import
// the Express app directly (via Supertest) without binding a real port —
// app.js just builds and exports `app`; only this file starts listening.

const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});