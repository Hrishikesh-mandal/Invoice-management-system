import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { useDebounce } from '../../hooks/useDebounce';
import { useRole } from '../../hooks/useRole';
import InvoiceFilters from './InvoiceFilters';
import InvoiceTable from './InvoiceTable';
import BulkActionsBar from './BulkActionsBar';
import ExportCsvButton from './ExportCsvButton';
import Pagination from '../common/Pagination';
import Button from '../common/Button';
import * as api from '../../services/api';
import { downloadCsvBlob } from '../../utils/exportToCsv';

/**
 * The full "Invoice Listing" feature — search, filter, sort, bulk select,
 * export, paginate. Pulled out as its own component so it can be embedded
 * directly on the Dashboard (matching the original design mock) AND reused
 * on a dedicated /invoices page without duplicating the wiring logic.
 */
export default function InvoiceListingSection({ title = 'Invoice Listing' }) {
  const navigate = useNavigate();
  const { invoices, pagination, loading, error, params, updateFilter, setSort, setPage, refetch } =
    useInvoices();
  const { can } = useRole();
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  if (debouncedSearch !== params.search) {
    updateFilter('search', debouncedSearch);
  }

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = (checked) =>
    setSelectedIds(checked ? invoices.map((inv) => inv.id) : []);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} invoice(s)? This can't be undone.`)) return;
    await api.bulkDeleteInvoices(selectedIds);
    setSelectedIds([]);
    refetch();
  };

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <div className="flex items-center justify-between bg-teal-gradient px-6 py-4">
        <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {can('exportCsv') && <ExportCsvButton filterParams={params} />}
          {can('createInvoice') && (
            <Button variant="primary" onClick={() => navigate('/invoices/new')}>
              + Create New Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white p-4">
        <div className="mb-4">
          <InvoiceFilters
            params={{ ...params, search: searchInput }}
            onSearchChange={setSearchInput}
            onStatusChange={(v) => updateFilter('status', v)}
            onDateChange={(key, v) => updateFilter(key, v)}
          />
        </div>

        <BulkActionsBar
          selectedCount={selectedIds.length}
          canDelete={can('deleteInvoice')}
          onDelete={handleBulkDelete}
          onExportSelected={async () => {
            const response = await api.exportInvoicesCsv({ ids: selectedIds.join(',') });
            downloadCsvBlob(response.data, 'invoices-selected.csv');
          }}
        />

        <div className="overflow-hidden rounded-lg border border-slate-100">
          <InvoiceTable
            invoices={invoices}
            loading={loading}
            error={error}
            sortBy={params.sortBy}
            sortDir={params.sortDir}
            onSort={setSort}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
          {!loading && !error && invoices.length > 0 && (
            <div className="border-t border-slate-100 px-4">
              <Pagination
                page={pagination.page || params.page}
                totalPages={pagination.totalPages || 1}
                total={pagination.total || 0}
                pageSize={params.pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}