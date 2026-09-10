export default function InvoiceFilters({ params, onSearchChange, onStatusChange, onDateChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Search invoice or customer…"
        defaultValue={params.search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
      />
      <select
        value={params.status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
      >
        <option value="all">All statuses</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="overdue">Overdue</option>
      </select>
      <input
        type="date"
        value={params.dateFrom}
        onChange={(e) => onDateChange('dateFrom', e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
      />
      <span className="text-sm text-slate-400">to</span>
      <input
        type="date"
        value={params.dateTo}
        onChange={(e) => onDateChange('dateTo', e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
      />
    </div>
  );
}