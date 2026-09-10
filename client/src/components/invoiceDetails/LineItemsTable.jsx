import { formatCurrency } from '../../utils/formatCurrency';

export default function LineItemsTable({ lineItems, totalAmount }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-heading text-lg font-semibold text-navy">Line Items</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td className="py-3 text-slate-700">{item.description}</td>
              <td className="py-3 text-right text-slate-500">{item.quantity}</td>
              <td className="py-3 text-right text-slate-500">{formatCurrency(item.unit_price)}</td>
              <td className="py-3 text-right font-medium text-slate-800">
                {formatCurrency(item.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-500">Total: </span>
        <span className="ml-2 font-heading text-lg font-bold text-navy">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}