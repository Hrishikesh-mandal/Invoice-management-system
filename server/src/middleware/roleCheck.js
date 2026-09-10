/**
 * Server-side enforcement of role-based actions.
 *
 * This is deliberately separate from any frontend hiding of buttons —
 * hiding a "Delete" button in the UI is a UX nicety, not security. A viewer
 * could still hit the DELETE endpoint directly with a tool like curl/Postman,
 * so every mutating route must also pass through this check.
 *
 * Usage: router.delete('/:id', authenticate, requireRole('admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log("error occured in forbidden");
      return res.status(403).json({
        error: `Forbidden: requires one of [${allowedRoles.join(', ')}], but user has role '${req.user.role}'`,
      });
    }

    next();
  };
}

const PERMISSIONS = {
  viewInvoices: ['admin', 'accountant', 'viewer'],
  createInvoice: ['admin', 'accountant'],
  editInvoice: ['admin', 'accountant'],
  deleteInvoice: ['admin'],
  markPaid: ['admin', 'accountant'],
  exportCsv: ['admin', 'accountant'],
};

module.exports = { requireRole, PERMISSIONS };