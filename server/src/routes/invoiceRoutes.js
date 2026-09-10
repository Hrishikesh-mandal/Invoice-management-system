const express = require('express');
const router = express.Router();

const {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  bulkDeleteInvoices,
  exportInvoicesCsv,
} = require('../controllers/invoiceController');

const { authenticate } = require('../middleware/auth');
const { requireRole, PERMISSIONS } = require('../middleware/roleCheck');

// All invoice routes require a logged-in user
router.use(authenticate);

// Read access: any authenticated role
router.get('/', requireRole(...PERMISSIONS.viewInvoices), listInvoices);
router.get('/export', requireRole(...PERMISSIONS.exportCsv), exportInvoicesCsv);
router.get('/:id', requireRole(...PERMISSIONS.viewInvoices), getInvoiceById);

// Mutating actions: role-gated per PERMISSIONS map
router.post('/', requireRole(...PERMISSIONS.createInvoice), createInvoice);
router.patch('/:id/status', requireRole(...PERMISSIONS.markPaid), updateInvoiceStatus);
router.post('/bulk-delete', requireRole(...PERMISSIONS.deleteInvoice), bulkDeleteInvoices);

module.exports = router;