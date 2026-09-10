import { useAuth } from '../context/AuthContext';

// Mirrors server/src/middleware/roleCheck.js PERMISSIONS — kept in sync
// manually since frontend and backend are separate apps. This only controls
// what's SHOWN; the backend is the actual enforcement layer.
const PERMISSIONS = {
  createInvoice: ['admin', 'accountant'],
  editInvoice: ['admin', 'accountant'],
  deleteInvoice: ['admin'],
  markPaid: ['admin', 'accountant'],
  exportCsv: ['admin', 'accountant'],
};

export function useRole() {
  const { user } = useAuth();
  const role = user?.role;

  const can = (action) => {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
  };

  return { role, can };
}