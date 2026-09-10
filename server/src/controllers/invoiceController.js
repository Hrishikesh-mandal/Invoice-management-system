const Invoice = require('../models/Invoice');
const { invoicesToCsv } = require('../services/csvExportService');

/**
 * GET /api/invoices
 * Query params: search, status, dateFrom, dateTo, sortBy, sortDir, page, pageSize
 */
async function listInvoices(req, res) {
  try {
    const {
      search,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      page,
      pageSize,
    } = req.query;

    const result = await Invoice.findAll({
      search,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      page: parseInt(page, 10) || 1,
      pageSize: Math.min(parseInt(pageSize, 10) || 10, 100), // cap page size to avoid abuse
    });

    res.json(result);
  } catch (err) {
    console.error('listInvoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

/**
 * GET /api/invoices/:id
 * Returns invoice summary + line items for the Invoice Details page.
 */
async function getInvoiceById(req, res) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    console.error('getInvoiceById error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

/**
 * PATCH /api/invoices/:id/status
 * Body: { status: 'paid' | 'pending' | 'overdue' }
 */
async function updateInvoiceStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    const updated = await Invoice.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('updateInvoiceStatus error:', err);
    res.status(400).json({ error: err.message || 'Failed to update status' });
  }
}

/**
 * POST /api/invoices/bulk-delete
 * Body: { ids: number[] }
 * Backs the "Bulk selection" bonus feature.
 */
async function bulkDeleteInvoices(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    const deletedIds = await Invoice.deleteByIds(ids);
    res.json({ deletedIds });
  } catch (err) {
    console.error('bulkDeleteInvoices error:', err);
    res.status(500).json({ error: 'Failed to delete invoices' });
  }
}

/**
 * GET /api/invoices/export
 * Same filter params as listInvoices, but returns the FULL matching set
 * (no pagination) as a CSV file download.
 */
async function exportInvoicesCsv(req, res) {
  try {
    const { search, status, dateFrom, dateTo, sortBy, sortDir, ids } = req.query;

    let invoices;
    if (ids) {
      // Exporting a specific bulk-selected set of rows
      const idList = ids.split(',').map((id) => parseInt(id, 10));
      invoices = await Invoice.findByIds(idList);
    } else {
      // Exporting everything matching the current filters (no pagination cap)
      const result = await Invoice.findAll({
        search,
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortDir,
        page: 1,
        pageSize: 100000,
      });
      invoices = result.invoices;
    }

    const csv = invoicesToCsv(invoices);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (err) {
    console.error('exportInvoicesCsv error:', err);
    res.status(500).json({ error: 'Failed to export invoices' });
  }
}

/**
 * POST /api/invoices
 * Body: { customerId, issueDate, dueDate, lineItems: [{ description, quantity, unitPrice }] }
 */
async function createInvoice(req, res) {
  try {
    const { customerId, issueDate, dueDate, lineItems } = req.body;

    // Validate before touching the DB — cheap checks first.
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    if (!issueDate || !dueDate) {
      return res.status(400).json({ error: 'issueDate and dueDate are required' });
    }
    if (new Date(dueDate) < new Date(issueDate)) {
      return res.status(400).json({ error: 'dueDate cannot be before issueDate' });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }
    for (const item of lineItems) {
      if (!item.description || !item.description.trim()) {
        return res.status(400).json({ error: 'Every line item needs a description' });
      }
      if (!(item.quantity > 0)) {
        return res.status(400).json({ error: 'Line item quantity must be greater than 0' });
      }
      if (!(item.unitPrice >= 0)) {
        return res.status(400).json({ error: 'Line item unit price must be 0 or greater' });
      }
    }

    const invoice = await Invoice.create({
      customerId,
      issueDate,
      dueDate,
      createdBy: req.user?.id,
      lineItems,
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('createInvoice error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
}

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  bulkDeleteInvoices,
  exportInvoicesCsv,
};