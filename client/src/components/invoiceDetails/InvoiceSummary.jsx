import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/formatDate';

export default function InvoiceSummary({ invoice }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-navy">{invoice.invoice_number}</h2>
          <p className="text-sm text-slate-500">{invoice.customer_name}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-400">Issue Date</dt>
          <dd className="font-medium text-slate-700">{formatDate(invoice.issue_date)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Due Date</dt>
          <dd className="font-medium text-slate-700">{formatDate(invoice.due_date)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Customer Email</dt>
          <dd className="font-medium text-slate-700">{invoice.customer_email || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Address</dt>
          <dd className="font-medium text-slate-700">{invoice.customer_address || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}