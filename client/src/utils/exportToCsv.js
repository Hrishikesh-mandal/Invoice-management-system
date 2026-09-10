// Takes the blob response from the export API call and triggers a
// browser file download — kept separate from the API layer so the
// service functions stay pure data-fetchers.
export function downloadCsvBlob(blob, filename = 'invoices.csv') {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}