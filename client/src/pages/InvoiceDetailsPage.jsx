import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useRole } from '../hooks/useRole';
import InvoiceSummary from '../components/invoiceDetails/InvoiceSummary';
import LineItemsTable from '../components/invoiceDetails/LineItemsTable';
import DownloadInvoiceButton from '../components/invoiceDetails/DownloadInvoiceButton';
import StatusUpdateControl from '../components/invoiceDetails/StatusUpdateControl';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const { can } = useRole();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .getInvoiceById(id)
      .then(setInvoice)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <Link to="/invoices" className="mb-4 inline-block text-sm text-teal hover:underline">
        ← Back to Invoices
      </Link>

      {loading && (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && invoice && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {can('markPaid') && (
              <StatusUpdateControl
                invoiceId={invoice.id}
                currentStatus={invoice.status}
                onUpdated={(newStatus) => setInvoice((prev) => ({ ...prev, status: newStatus }))}
              />
            )}
            <DownloadInvoiceButton />
          </div>
          <InvoiceSummary invoice={invoice} />
          <LineItemsTable lineItems={invoice.lineItems} totalAmount={invoice.total_amount} />
        </div>
      )}
    </div>
  );
}