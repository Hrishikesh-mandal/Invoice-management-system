const Customer = require('../models/Customer');

async function listCustomers(req, res) {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    console.error('listCustomers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

module.exports = { listCustomers };