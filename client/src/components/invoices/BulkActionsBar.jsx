import Button from '../common/Button';

export default function BulkActionsBar({ selectedCount, onDelete, onExportSelected, canDelete }) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-3 flex items-center justify-between rounded-lg bg-navy px-4 py-3 text-white">
      <span className="text-sm">{selectedCount} selected</span>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onExportSelected}>
          Export selected
        </Button>
        {canDelete && (
          <Button variant="danger" onClick={onDelete}>
            Delete selected
          </Button>
        )}
      </div>
    </div>
  );
}