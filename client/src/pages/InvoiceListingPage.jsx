import InvoiceListingSection from '../components/invoices/InvoiceListingSection';

export default function InvoiceListingPage() {
  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-navy">Invoices</h1>
      <InvoiceListingSection title="All Invoices" />
    </div>
  );
}