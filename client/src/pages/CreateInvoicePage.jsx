import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatCurrency';

function emptyLineItem() {
  return { description: '', quantity: 1, unitPrice: '' };
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);

  const removeLineItem = (index) =>
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const total = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId) return setError('Please select a customer.');
    if (!dueDate) return setError('Please set a due date.');
    if (new Date(dueDate) < new Date(issueDate)) return setError('Due date cannot be before issue date.');
    if (lineItems.some((li) => !li.description.trim())) return setError('Every line item needs a description.');
    if (lineItems.some((li) => !(parseFloat(li.quantity) > 0))) return setError('Quantities must be greater than 0.');
    if (lineItems.some((li) => !(parseFloat(li.unitPrice) >= 0))) return setError('Unit prices must be 0 or greater.');

    setSubmitting(true);
    try {
      const invoice = await api.createInvoice({
        customerId: parseInt(customerId, 10),
        issueDate,
        dueDate,
        lineItems: lineItems.map((li) => ({
          description: li.description.trim(),
          quantity: parseFloat(li.quantity),
          unitPrice: parseFloat(li.unitPrice),
        })),
      });
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-heading text-2xl font-bold text-navy">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-slate-700">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="text-sm font-medium text-teal hover:underline"
            >
              + Add line item
            </button>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
                />
                <span className="w-24 text-right text-sm text-slate-500">
                  {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove line item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-500">Total: </span>
            <span className="ml-2 font-heading text-lg font-bold text-navy">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}