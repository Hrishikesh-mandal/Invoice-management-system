import Button from '../common/Button';

// No PDF-generation endpoint exists on the backend yet, so this triggers
// the browser's print dialog (which can "Save as PDF") as a functional
// placeholder. Swap this for a real `/api/invoices/:id/pdf` endpoint later
// if a proper generated PDF is needed.
export default function DownloadInvoiceButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      Download Invoice
    </Button>
  );
}