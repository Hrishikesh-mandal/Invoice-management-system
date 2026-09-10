import { useState } from 'react';
import * as api from '../../services/api';

const STATUS_OPTIONS = ['paid', 'pending', 'overdue'];

/**
 * Lets admin/accountant change an invoice's status inline. The dropdown
 * itself is only rendered by the parent when `can('markPaid')` is true
 * (UI convenience), but the real enforcement is server-side — a viewer
 * hitting PATCH /api/invoices/:id/status directly still gets a 403.
 */
export default function StatusUpdateControl({ invoiceId, currentStatus, onUpdated }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    const previousStatus = status;
    setStatus(newStatus); // optimistic update
    setSaving(true);
    setError(null);
    try {
      await api.updateInvoiceStatus(invoiceId, newStatus);
      onUpdated?.(newStatus);
    } catch (err) {
      setStatus(previousStatus); // roll back on failure
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="status-select" className="text-sm text-slate-500">
        Status:
      </label>
      <select
        id="status-select"
        value={status}
        onChange={handleChange}
        disabled={saving}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm capitalize focus:border-teal focus:outline-none disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-slate-400">Saving…</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}