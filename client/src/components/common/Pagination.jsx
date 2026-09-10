// Note: the original mock had a duplicated "Previous" button (one before
// page 1, one after "Next") — this implementation intentionally has exactly
// one Previous and one Next, flanking the page number list.
export default function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Show a condensed window of page numbers around the current page,
  // with an ellipsis, rather than every page number for large datasets.
  const pageNumbers = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - windowSize && p <= page + windowSize)) {
      pageNumbers.push(p);
    } else if (pageNumbers[pageNumbers.length - 1] !== '...') {
      pageNumbers.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between px-1 py-4 text-sm text-slate-600">
      <span>
        Showing {start}-{end} of {total} invoices
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
        >
          Previous
        </button>
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-md px-3 py-1.5 ${
                p === page ? 'bg-teal text-white' : 'border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}