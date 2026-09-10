export default function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }) {
  const isActive = currentSort === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${isActive ? 'text-teal' : 'text-slate-300'}`}>
          {isActive && currentDir === 'asc' ? '▲' : '▼'}
        </span>
      </span>
    </th>
  );
}