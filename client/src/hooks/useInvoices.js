import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const DEFAULT_PARAMS = {
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  sortBy: 'issue_date',
  sortDir: 'desc',
  page: 1,
  pageSize: 10,
};

/**
 * Owns all state for the Invoice Listing page: current filters/sort/page,
 * the fetched rows, loading/error state, and pagination metadata. Keeping
 * this in one hook means InvoiceListingPage stays declarative — it just
 * renders whatever this hook gives it.
 */
export function useInvoices(initialParams = {}) {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, ...initialParams });
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getInvoices(params);
      setInvoices(result.invoices);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Changing a filter resets to page 1 — otherwise a user could land on
  // "page 5" of a filtered set that only has 2 pages.
  const updateFilter = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const setSort = (sortBy) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      sortDir: prev.sortBy === sortBy && prev.sortDir === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const setPage = (page) => setParams((prev) => ({ ...prev, page }));

  return {
    invoices,
    pagination,
    loading,
    error,
    params,
    updateFilter,
    setSort,
    setPage,
    refetch: fetchInvoices,
  };
}