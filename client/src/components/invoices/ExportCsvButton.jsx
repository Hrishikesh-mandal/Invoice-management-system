import { useState } from 'react';
import Button from '../common/Button';
import * as api from '../../services/api';
import { downloadCsvBlob } from '../../utils/exportToCsv';

export default function ExportCsvButton({ filterParams }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.exportInvoicesCsv(filterParams);
      downloadCsvBlob(response.data, 'invoices.csv');
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={exporting}>
      {exporting ? 'Exporting…' : 'Export CSV'}
    </Button>
  );
}