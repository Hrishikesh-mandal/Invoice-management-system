export default function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-navy-light p-6 text-white">
      <p className="text-sm text-slate-300">{label}</p>
      <p className={`mt-2 font-heading text-3xl font-bold ${accent || 'text-white'}`}>{value}</p>
    </div>
  );
}