import { useNavigate } from 'react-router-dom';
import SortableHeader from './SortableHeader';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const COLUMNS = [
  { key: 'invoice_number', label: 'Invoice ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'status', label: 'Status' },
  { key: 'issue_date', label: 'Date' },
  { key: 'total_amount', label: 'Total Amount' },
];

export default function InvoiceTable({
  invoices,
  loading,
  error,
  sortBy,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) {
  const navigate = useNavigate();
  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Couldn't load invoices — {error}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="font-medium text-slate-700">No invoices match your filters</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting the search, status, or date range.</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead className="border-b border-slate-200 bg-slate-50">
        <tr>
          <th className="w-10 px-4 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll(e.target.checked)}
              aria-label="Select all invoices on this page"
            />
          </th>
          {COLUMNS.map((col) => (
            <SortableHeader
              key={col.key}
              label={col.label}
              sortKey={col.key}
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={onSort}
            />
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {invoices.map((inv) => (
          <tr
            key={inv.id}
            className="cursor-pointer hover:bg-slate-50"
            onClick={() => navigate(`/invoices/${inv.id}`)}
          >
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.includes(inv.id)}
                onChange={() => onToggleSelect(inv.id)}
                aria-label={`Select invoice ${inv.invoice_number}`}
              />
            </td>
            <td className="px-4 py-3 text-sm font-medium text-navy">{inv.invoice_number}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{inv.customer_name}</td>
            <td className="px-4 py-3">
              <StatusBadge status={inv.status} />
            </td>
            <td className="px-4 py-3 text-sm text-slate-500">{formatDate(inv.issue_date)}</td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {formatCurrency(inv.total_amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}