/**
 * Server-side CSV generation. Done here rather than in the browser so
 * exporting "all matching filters" doesn't require shipping every row to
 * the client first just to re-serialize it — matters once invoice count
 * grows well past what's shown on one page.
 */

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Quote any field containing a comma, quote, or newline; double up inner quotes.
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function invoicesToCsv(invoices) {
  const headers = ['Invoice ID', 'Customer Name', 'Status', 'Issue Date', 'Due Date', 'Total Amount'];
  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.customer_name,
    inv.status,
    inv.issue_date,
    inv.due_date,
    inv.total_amount,
  ]);

  const lines = [headers, ...rows].map((row) => row.map(escapeCsvField).join(','));
  return lines.join('\n');
}

module.exports = { invoicesToCsv };