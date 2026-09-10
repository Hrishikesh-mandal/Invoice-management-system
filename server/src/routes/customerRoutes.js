const express = require('express');
const router = express.Router();

const { listCustomers } = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listCustomers);

module.exports = router;