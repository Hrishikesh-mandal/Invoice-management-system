import { useState, useEffect } from 'react';
import * as api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import InvoiceListingSection from '../components/invoices/InvoiceListingSection';
import { formatCurrency } from '../utils/formatCurrency';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold text-navy">Dashboard</h1>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Invoices" value={stats.totalInvoices} />
            <StatCard label="Paid Invoices" value={stats.paidInvoices} accent="text-status-paid" />
            <StatCard label="Pending Amount" value={formatCurrency(stats.pendingAmount)} />
            <StatCard
              label="Overdue Invoices"
              value={stats.overdueInvoices}
              accent="text-status-overdue"
            />
          </div>
        )}
      </div>

      <InvoiceListingSection title="Invoice Listing" />
    </div>
  );
}